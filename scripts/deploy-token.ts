/**
 * Deploy ERC20 token and distribute to treasuries
 *
 * Arguments: --name "Token Name" --symbol TKN --treasury 0x...
 *
 * Distribution:
 * - 50,000 tokens to TIPL_TREASURY (from env var)
 * - 950,000 tokens to project treasury (or 750,000 if pool will be created)
 * - 200,000 tokens reserved for Uniswap pool (if --pool flag is set)
 *
 * Run: npm run deploy-token -- --name "My Token" --symbol MTK --treasury 0x...
 * Output: { tokenAddress: "0x...", distributions: {...} }
 */

import 'dotenv/config';
import { ethers, ContractFactory } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { ERC20_ABI, ERC20_BYTECODE, TOTAL_SUPPLY } from '../src/contracts/ERC20Token';
import { BASE_CHAIN_ID } from '../src/constants/addresses';

// Parse command line arguments
function parseArgs(): { name: string; symbol: string; treasury: string; pool: boolean } {
  const args = process.argv.slice(2);
  let name = '';
  let symbol = '';
  let treasury = '';
  let pool = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    } else if (args[i] === '--symbol' && args[i + 1]) {
      symbol = args[++i];
    } else if (args[i] === '--treasury' && args[i + 1]) {
      treasury = args[++i];
    } else if (args[i] === '--pool') {
      pool = true;
    }
  }

  if (!name || !symbol || !treasury) {
    console.error('Usage: npm run deploy-token -- --name "Token Name" --symbol TKN --treasury 0x... [--pool]');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(treasury)) {
    console.error('Error: Invalid treasury address format');
    process.exit(1);
  }

  return { name, symbol, treasury, pool };
}

async function main() {
  const { name, symbol, treasury, pool } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';
  const tiplTreasury = process.env.TIPL_TREASURY;

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
    process.exit(1);
  }

  if (!tiplTreasury || !/^0x[a-fA-F0-9]{40}$/.test(tiplTreasury)) {
    console.error('Error: TIPL_TREASURY not set or invalid in .env file');
    process.exit(1);
  }

  const config: SignerConfig = {
    type: signerType,
    rpcUrl,
    privateKey: process.env.PRIVATE_KEY,
    derivationPath: process.env.DERIVATION_PATH,
  };

  console.log(`Using ${signerType} signer...`);
  console.log(`Token: ${name} (${symbol})`);
  console.log(`Project Treasury: ${treasury}`);
  console.log(`TIPL Treasury: ${tiplTreasury}`);
  console.log(`Pool: ${pool ? 'Yes (200K tokens reserved)' : 'No'}`);

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const deployerAddress = await signer.getAddress();
    const provider = signer.getProvider();
    console.log(`Deployer: ${deployerAddress}`);

    // Create contract factory
    const factory = new ContractFactory(ERC20_ABI, ERC20_BYTECODE);
    const deployTx = await factory.getDeployTransaction(name, symbol);

    console.log('\nDeploying token contract...');

    // Send deployment transaction
    const txResponse = await signer.sendTransaction({
      to: undefined, // Contract creation
      data: deployTx.data as string,
      chainId: BASE_CHAIN_ID,
    });

    console.log(`Deploy transaction hash: ${txResponse.hash}`);
    console.log('Waiting for confirmation...');

    const receipt = await txResponse.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('Deploy transaction reverted');
    }

    const tokenAddress = receipt.contractAddress;

    if (!tokenAddress) {
      throw new Error('Failed to get contract address from receipt');
    }

    console.log(`Token deployed at: ${tokenAddress}`);
    console.log(`Block: ${receipt.blockNumber}`);

    // Create token contract instance for transfers
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Verify contract is accessible before sending transfers
    const deployerBalance = await token.balanceOf(deployerAddress);
    if (deployerBalance !== TOTAL_SUPPLY) {
      throw new Error(`Contract not ready: expected ${TOTAL_SUPPLY}, got ${deployerBalance}`);
    }
    console.log('Contract verified on-chain.');

    // Distribution amounts (18 decimals)
    const tiplAmount = ethers.parseUnits('50000', 18); // 50K to TIPL
    const poolAmount = pool ? ethers.parseUnits('200000', 18) : BigInt(0); // 200K for pool
    const projectAmount = TOTAL_SUPPLY - tiplAmount - poolAmount; // Rest to project treasury

    console.log('\nDistributing tokens...');
    console.log(`TIPL Treasury: ${ethers.formatUnits(tiplAmount, 18)} tokens`);
    console.log(`Project Treasury: ${ethers.formatUnits(projectAmount, 18)} tokens`);
    if (pool) {
      console.log(`Reserved for pool: ${ethers.formatUnits(poolAmount, 18)} tokens`);
    }

    // Transfer to TIPL Treasury
    console.log('\nTransferring to TIPL Treasury...');
    const tiplTransferData = token.interface.encodeFunctionData('transfer', [tiplTreasury, tiplAmount]);
    const tiplTx = await signer.sendTransaction({
      to: tokenAddress,
      data: tiplTransferData,
      chainId: BASE_CHAIN_ID,
    });
    const tiplReceipt = await tiplTx.wait();
    if (!tiplReceipt || tiplReceipt.status !== 1) {
      throw new Error('TIPL treasury transfer reverted');
    }
    console.log(`TIPL transfer confirmed: ${tiplTx.hash}`);

    // Transfer to Project Treasury
    console.log('\nTransferring to Project Treasury...');
    const projectTransferData = token.interface.encodeFunctionData('transfer', [treasury, projectAmount]);
    const projectTx = await signer.sendTransaction({
      to: tokenAddress,
      data: projectTransferData,
      chainId: BASE_CHAIN_ID,
    });
    const projectReceipt = await projectTx.wait();
    if (!projectReceipt || projectReceipt.status !== 1) {
      throw new Error('Project treasury transfer reverted');
    }
    console.log(`Project transfer confirmed: ${projectTx.hash}`);

    // If pool flag is set, tokens remain with deployer for pool creation
    // Otherwise, we should have distributed everything

    // Verify balances
    const tiplBalance = await token.balanceOf(tiplTreasury);
    const projectBalance = await token.balanceOf(treasury);
    const deployerBalance = await token.balanceOf(deployerAddress);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    // Output JSON result
    const result = {
      tokenAddress,
      name,
      symbol,
      distributions: {
        tiplTreasury: {
          address: tiplTreasury,
          amount: ethers.formatUnits(tiplBalance, 18),
        },
        projectTreasury: {
          address: treasury,
          amount: ethers.formatUnits(projectBalance, 18),
        },
        ...(pool && {
          deployer: {
            address: deployerAddress,
            amount: ethers.formatUnits(deployerBalance, 18),
            note: 'Reserved for Uniswap pool creation',
          },
        }),
      },
    };

    console.log('\n' + JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
