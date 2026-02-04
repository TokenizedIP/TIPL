/**
 * Send ERC20 tokens to an address
 *
 * Usage: npm run send-tokens -- --token 0x... --to 0x... --amount 1000000
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { ERC20_ABI } from '../src/contracts/ERC20Token';
import { BASE_CHAIN_ID } from '../src/constants/addresses';

function parseArgs(): { token: string; to: string; amount: string } {
  const args = process.argv.slice(2);
  let token = '';
  let to = '';
  let amount = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (args[i] === '--to' && args[i + 1]) {
      to = args[++i];
    } else if (args[i] === '--amount' && args[i + 1]) {
      amount = args[++i];
    }
  }

  if (!token || !to || !amount) {
    console.error('Usage: npm run send-tokens -- --token 0x... --to 0x... --amount 1000000');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
    console.error('Error: Invalid token address format');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    console.error('Error: Invalid recipient address format');
    process.exit(1);
  }

  return { token, to, amount };
}

async function main() {
  const { token, to, amount } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

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

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const senderAddress = await signer.getAddress();
    const provider = signer.getProvider();
    console.log(`Sender: ${senderAddress}`);

    const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);

    // Get token info
    const [symbol, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    const amountWei = ethers.parseUnits(amount, decimals);

    // Check balance
    const balance = await tokenContract.balanceOf(senderAddress);
    console.log(`Current balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

    if (balance < amountWei) {
      console.error(`Error: Insufficient balance. Have ${ethers.formatUnits(balance, decimals)}, need ${amount}`);
      process.exit(1);
    }

    console.log(`\nSending ${amount} ${symbol} to ${to}...`);

    // Encode transfer call
    const transferData = tokenContract.interface.encodeFunctionData('transfer', [to, amountWei]);

    console.log('Please confirm the transaction on your Ledger device...');

    const tx = await signer.sendTransaction({
      to: token,
      data: transferData,
      chainId: BASE_CHAIN_ID,
    });

    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction reverted');
    }

    console.log(`Transfer confirmed in block ${receipt.blockNumber}`);

    // Verify new balances
    const newSenderBalance = await tokenContract.balanceOf(senderAddress);
    const recipientBalance = await tokenContract.balanceOf(to);

    console.log(`\nNew sender balance: ${ethers.formatUnits(newSenderBalance, decimals)} ${symbol}`);
    console.log(`Recipient balance: ${ethers.formatUnits(recipientBalance, decimals)} ${symbol}`);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    console.log('\n' + JSON.stringify({
      token,
      to,
      amount,
      txHash: tx.hash,
      block: receipt.blockNumber,
    }, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
