/**
 * Propose a transaction to claim LP fees from a Uniswap V4 position held by a project treasury
 *
 * Looks up the project treasury and pool ID from the TIPL API, finds matching LP NFTs
 * via the Alchemy NFT API, and proposes a Safe multisig transaction to collect accumulated fees.
 *
 * Usage: npm run claim-fees -- --token 0x...
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { POSITION_MANAGER, USDC } from '../src/constants/addresses';
import { initSafe, initApiKit, proposeSafeTransaction, OperationType } from '../src/safe';

// Uniswap V4 PositionManager action codes (from @uniswap/v4-sdk Actions enum)
const DECREASE_LIQUIDITY = 1;
const TAKE_PAIR = 17;

const POSITION_MANAGER_ABI = [
  'function modifyLiquidities(bytes unlockData, uint256 deadline) payable',
];

// getPoolAndPositionInfo returns (PoolKey, packed positionInfo) — we decode raw bytes
const GET_POOL_POSITION_SELECTOR = ethers.id('getPoolAndPositionInfo(uint256)').slice(0, 10);

interface ProjectInfo {
  treasury_address: string;
  uniswap_pool_address: string;
}

function parseArgs(): { token: string } {
  const args = process.argv.slice(2);
  let token = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    }
  }

  if (!token) {
    console.error('Usage: npm run claim-fees -- --token 0x...');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
    console.error('Error: Invalid token address format');
    process.exit(1);
  }

  return { token };
}

async function fetchProjectInfo(tokenAddress: string): Promise<ProjectInfo> {
  const res = await fetch(`https://tipl.fun/api/projects/search?q=${tokenAddress}`);
  if (!res.ok) {
    throw new Error(`TIPL API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  const project = Array.isArray(data) ? data.find(
    (p: any) => p.token_address.toLowerCase() === tokenAddress.toLowerCase()
  ) : data;

  if (!project) {
    throw new Error(`Project not found for token ${tokenAddress}`);
  }
  if (!project.treasury_address) {
    throw new Error('Project has no treasury_address');
  }
  if (!project.uniswap_pool_address) {
    throw new Error('Project has no uniswap_pool_address (no Uniswap pool)');
  }

  return {
    treasury_address: project.treasury_address,
    uniswap_pool_address: project.uniswap_pool_address,
  };
}

/**
 * Find NFT token IDs owned by an address using the Alchemy NFT API
 */
async function findOwnedTokenIds(owner: string): Promise<bigint[]> {
  const alchemyKey = process.env.ALCHEMY_API_KEY || 'demo';
  const url = `https://base-mainnet.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner` +
    `?owner=${owner}` +
    `&contractAddresses[]=${POSITION_MANAGER}` +
    `&withMetadata=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Alchemy API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as any;
  return (data.ownedNfts || []).map((nft: any) => BigInt(nft.tokenId));
}

/**
 * Get the pool ID for a position by calling getPoolAndPositionInfo and computing
 * keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
 */
async function getPoolIdForPosition(
  provider: ethers.JsonRpcProvider,
  tokenId: bigint,
): Promise<string> {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const calldata = GET_POOL_POSITION_SELECTOR + abiCoder.encode(['uint256'], [tokenId]).slice(2);
  const result = await provider.call({ to: POSITION_MANAGER, data: calldata });

  const decoded = abiCoder.decode(
    ['address', 'address', 'uint24', 'int24', 'address', 'bytes32'],
    result,
  );

  const [currency0, currency1, fee, tickSpacing, hooks] = decoded;
  return ethers.keccak256(
    abiCoder.encode(
      ['address', 'address', 'uint24', 'int24', 'address'],
      [currency0, currency1, fee, tickSpacing, hooks],
    ),
  );
}

function buildPoolKey(tokenAddress: string): { currency0: string; currency1: string } {
  const token = tokenAddress.toLowerCase();
  const usdc = USDC.toLowerCase();

  if (BigInt(token) < BigInt(usdc)) {
    return { currency0: token, currency1: usdc };
  } else {
    return { currency0: usdc, currency1: token };
  }
}

async function main() {
  const { token } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
    process.exit(1);
  }

  // Fetch project info from TIPL API
  console.log(`Looking up project for token ${token}...`);
  const projectInfo = await fetchProjectInfo(token);
  const treasury = projectInfo.treasury_address;
  const targetPoolId = projectInfo.uniswap_pool_address.toLowerCase();
  console.log(`Treasury: ${treasury}`);
  console.log(`Target pool: ${targetPoolId}`);

  const config: SignerConfig = {
    type: signerType,
    rpcUrl,
    privateKey: process.env.PRIVATE_KEY,
    derivationPath: process.env.DERIVATION_PATH,
  };

  console.log(`\nUsing ${signerType} signer...`);

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const ownerAddress = await signer.getAddress();
    const provider = signer.getProvider();
    console.log(`Owner: ${ownerAddress}`);

    // Find all NFT token IDs owned by the treasury
    console.log('\nFinding LP position NFTs...');
    const ownedTokenIds = await findOwnedTokenIds(treasury);
    console.log(`Found ${ownedTokenIds.length} position(s): ${ownedTokenIds.map(String).join(', ')}`);

    if (ownedTokenIds.length === 0) {
      console.error('Error: Treasury has no LP positions');
      process.exit(1);
    }

    // Filter to positions matching the target pool
    const matchingTokenIds: bigint[] = [];
    for (const tokenId of ownedTokenIds) {
      const poolId = await getPoolIdForPosition(provider, tokenId);
      if (poolId.toLowerCase() === targetPoolId) {
        matchingTokenIds.push(tokenId);
        console.log(`Position ${tokenId} matches target pool`);
      } else {
        console.log(`Position ${tokenId} belongs to different pool (skipping)`);
      }
    }

    if (matchingTokenIds.length === 0) {
      console.error('Error: No LP positions found for the target Uniswap pool');
      process.exit(1);
    }

    // Build fee collection calldata for each matching position
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const { currency0, currency1 } = buildPoolKey(token);

    const actions: number[] = [];
    const params: string[] = [];

    for (const tokenId of matchingTokenIds) {
      // DECREASE_LIQUIDITY with 0 liquidity = collect fees only
      actions.push(DECREASE_LIQUIDITY);
      params.push(abiCoder.encode(
        ['uint256', 'uint256', 'uint128', 'uint128', 'bytes'],
        [tokenId, 0, 0, 0, '0x'],
      ));

      // TAKE_PAIR to send collected tokens to treasury
      actions.push(TAKE_PAIR);
      params.push(abiCoder.encode(
        ['address', 'address', 'address'],
        [currency0, currency1, treasury],
      ));
    }

    const unlockData = abiCoder.encode(
      ['bytes', 'bytes[]'],
      [new Uint8Array(actions), params],
    );

    const iface = new ethers.Interface(POSITION_MANAGER_ABI);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days (needs cosigner approval)
    const calldata = iface.encodeFunctionData('modifyLiquidities', [unlockData, deadline]);

    console.log(`\nProposing fee collection from ${matchingTokenIds.length} position(s)...`);

    const safeSdk = await initSafe(treasury, rpcUrl, process.env.PRIVATE_KEY);
    const apiKit = initApiKit();

    const safeTxHash = await proposeSafeTransaction(
      safeSdk,
      apiKit,
      {
        to: POSITION_MANAGER,
        data: calldata,
        value: '0',
        operation: OperationType.Call,
      },
      signer,
    );

    console.log(`\nTransaction proposed successfully!`);
    console.log(`Safe TX Hash: ${safeTxHash}`);
    console.log(`Safe App: https://app.safe.global/transactions/tx?safe=base:${treasury}&id=multisig_${treasury}_${safeTxHash}`);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }
  } catch (error) {
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
