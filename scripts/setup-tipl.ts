/**
 * Single-transaction TIPL project setup
 *
 * Calls the TIPLSetup contract to deploy token, create multisig treasury,
 * distribute tokens, and optionally create a Uniswap pool — all in one transaction.
 *
 * Arguments: --name "Token Name" --symbol TKN [--pool]
 *
 * Environment:
 *   SIGNER_TYPE, RPC_URL, PRIVATE_KEY or DERIVATION_PATH (signing)
 *   TIPL_COSIGNER - address for 2-of-2 multisig second signer
 *
 * Run: npm run setup-tipl -- --name "My Token" --symbol MTK [--pool]
 * Output: JSON with tokenAddress, multisigAddress, poolId, txHash
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { TIPL_SETUP_ABI, TIPL_SETUP_ADDRESS } from '../src/contracts/TIPLSetup';
import { BASE_CHAIN_ID } from '../src/constants/addresses';

function parseArgs(): { name: string; symbol: string; pool: boolean } {
  const args = process.argv.slice(2);
  let name = '';
  let symbol = '';
  let pool = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    } else if (args[i] === '--symbol' && args[i + 1]) {
      symbol = args[++i];
    } else if (args[i] === '--pool') {
      pool = true;
    }
  }

  if (!name || !symbol) {
    console.error('Usage: npm run setup-tipl -- --name "Token Name" --symbol TKN [--pool]');
    process.exit(1);
  }

  return { name, symbol, pool };
}

async function main() {
  const { name, symbol, pool } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';
  const cosigner = process.env.TIPL_COSIGNER || ethers.ZeroAddress;

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
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
  console.log(`Cosigner: ${cosigner === ethers.ZeroAddress ? 'none (1-of-1 multisig)' : cosigner}`);
  console.log(`Uniswap pool: ${pool ? 'Yes' : 'No'}`);

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const address = await signer.getAddress();
    console.log(`Sender: ${address}`);

    // Encode the setupTIPL call
    const iface = new ethers.Interface(TIPL_SETUP_ABI);
    const data = iface.encodeFunctionData('setupTIPL', [
      symbol,
      name,
      ethers.ZeroAddress, // firstSigner = address(0) → contract defaults to msg.sender
      cosigner,
      pool,
    ]);

    console.log('\nSending setup transaction...');

    const txResponse = await signer.sendTransaction({
      to: TIPL_SETUP_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
    });

    console.log(`Transaction hash: ${txResponse.hash}`);
    console.log('Waiting for confirmation...');

    const receipt = await txResponse.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('Setup transaction reverted');
    }

    console.log(`Confirmed in block ${receipt.blockNumber}`);

    // Parse TIPLSetupComplete event from logs
    let tokenAddress = '';
    let multisigAddress = '';
    let poolId = ethers.ZeroHash;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed && parsed.name === 'TIPLSetupComplete') {
          tokenAddress = parsed.args.token;
          multisigAddress = parsed.args.multisig;
          poolId = parsed.args.poolId;
          break;
        }
      } catch {
        // Not our event, skip
      }
    }

    if (!tokenAddress || !multisigAddress) {
      throw new Error('TIPLSetupComplete event not found in transaction logs');
    }

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    const result = {
      tokenAddress,
      multisigAddress,
      poolId: poolId === ethers.ZeroHash ? null : poolId,
      txHash: txResponse.hash,
    };

    console.log('\n' + JSON.stringify(result, null, 2));
  } catch (error) {
    // Disconnect Ledger on error too
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
