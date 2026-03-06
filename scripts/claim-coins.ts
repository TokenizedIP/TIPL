/**
 * Propose a transaction to claim tokens from a project treasury
 *
 * Looks up the project treasury from the TIPL API by token address.
 * By default withdraws the project token, but --withdraw can specify
 * a different token (e.g. USDC collected from LP fees).
 *
 * Usage:
 *   npm run claim-coins -- --token 0x... --amount 50000
 *   npm run claim-coins -- --token 0x... --withdraw 0x<USDC> --amount 100
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { ERC20_ABI } from '../src/contracts/ERC20Token';
import { initSafe, initApiKit, proposeSafeTransaction, OperationType } from '../src/safe';

const MAX_CLAIM_AMOUNT = 50_000;
const MIN_TREASURY_RESERVE = 700_000;

function parseArgs(): { token: string; withdraw: string | null; amount: string } {
  const args = process.argv.slice(2);
  let token = '';
  let withdraw: string | null = null;
  let amount = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (args[i] === '--withdraw' && args[i + 1]) {
      withdraw = args[++i];
    } else if (args[i] === '--amount' && args[i + 1]) {
      amount = args[++i];
    }
  }

  if (!token || !amount) {
    console.error('Usage: npm run claim-coins -- --token 0x... [--withdraw 0x...] --amount 50000');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
    console.error('Error: Invalid token address format');
    process.exit(1);
  }

  if (withdraw && !/^0x[a-fA-F0-9]{40}$/.test(withdraw)) {
    console.error('Error: Invalid withdraw token address format');
    process.exit(1);
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    console.error('Error: Amount must be a positive number');
    process.exit(1);
  }

  return { token, withdraw, amount };
}

async function fetchTreasuryAddress(tokenAddress: string): Promise<string> {
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

  return project.treasury_address;
}

async function main() {
  const { token, withdraw, amount } = parseArgs();
  const withdrawToken = withdraw || token;
  const isProjectToken = withdrawToken.toLowerCase() === token.toLowerCase();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
    process.exit(1);
  }

  // Fetch treasury address from TIPL API
  console.log(`Looking up project for token ${token}...`);
  const treasury = await fetchTreasuryAddress(token);
  console.log(`Treasury: ${treasury}`);

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

    // Read token info
    const tokenContract = new ethers.Contract(withdrawToken, ERC20_ABI, provider);
    const [symbol, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    const amountWei = ethers.parseUnits(amount, decimals);

    // Check treasury balance
    const balance = await tokenContract.balanceOf(treasury);
    const balanceFormatted = Number(ethers.formatUnits(balance, decimals));
    console.log(`Treasury ${symbol} balance: ${balanceFormatted}`);

    const amountNum = Number(amount);

    if (amountNum > balanceFormatted) {
      console.error(`Error: Treasury only has ${balanceFormatted} ${symbol}`);
      process.exit(1);
    }

    // Apply limits only to project token withdrawals
    if (isProjectToken) {
      if (amountNum > MAX_CLAIM_AMOUNT) {
        console.error(`Error: Amount exceeds maximum claim of ${MAX_CLAIM_AMOUNT} project tokens`);
        process.exit(1);
      }

      const remainingBalance = balanceFormatted - amountNum;
      if (remainingBalance < MIN_TREASURY_RESERVE) {
        console.error(
          `Error: Claiming ${amount} would leave treasury with ${remainingBalance} ${symbol}. ` +
          `Minimum reserve is ${MIN_TREASURY_RESERVE}.`
        );
        process.exit(1);
      }
    }

    // Encode ERC20 transfer calldata
    const iface = new ethers.Interface(ERC20_ABI);
    const transferData = iface.encodeFunctionData('transfer', [ownerAddress, amountWei]);

    console.log(`\nProposing claim of ${amount} ${symbol} to ${ownerAddress}...`);

    const safeSdk = await initSafe(treasury, rpcUrl, process.env.PRIVATE_KEY);
    const apiKit = initApiKit();

    const safeTxHash = await proposeSafeTransaction(
      safeSdk,
      apiKit,
      {
        to: withdrawToken,
        data: transferData,
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
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
