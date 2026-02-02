import { ethers } from 'ethers';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import Eth from '@ledgerhq/hw-app-eth';
import type Transport from '@ledgerhq/hw-transport';
import { BaseSigner, TransactionRequest, SignedTransaction } from './types';

const DEFAULT_PATH = "44'/60'/0'/0/0";

export class LedgerSigner implements BaseSigner {
  private provider: ethers.JsonRpcProvider;
  private derivationPath: string;
  private eth: Eth | null = null;
  private transport: Transport | null = null;
  private cachedAddress: string | null = null;
  private nextNonce: number | null = null;

  constructor(rpcUrl: string, derivationPath: string = DEFAULT_PATH) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.derivationPath = derivationPath;
  }

  private async connect(): Promise<Eth> {
    if (this.eth) return this.eth;

    this.transport = await TransportNodeHid.create();
    this.eth = new Eth(this.transport);
    return this.eth;
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.eth = null;
    }
  }

  async getAddress(): Promise<string> {
    if (this.cachedAddress) return this.cachedAddress;

    const eth = await this.connect();
    const result = await eth.getAddress(this.derivationPath);
    this.cachedAddress = result.address;
    return result.address;
  }

  async signTransaction(tx: TransactionRequest): Promise<SignedTransaction> {
    const eth = await this.connect();
    const address = await this.getAddress();

    // Get chain ID and nonce if not provided
    const chainId = tx.chainId ?? Number((await this.provider.getNetwork()).chainId);
    const nonce = tx.nonce ?? this.nextNonce ?? await this.provider.getTransactionCount(address);
    this.nextNonce = nonce + 1;

    // Estimate gas if not provided
    let gasLimit = tx.gasLimit;
    if (!gasLimit) {
      // For contract deployment (no 'to' address), explicitly set to null
      const estimateRequest: ethers.TransactionRequest = {
        from: address,
        value: tx.value,
        data: tx.data,
      };
      // Only include 'to' if it's defined (for regular transactions, not deployments)
      if (tx.to !== undefined && tx.to !== null) {
        estimateRequest.to = tx.to;
      }
      const estimate = await this.provider.estimateGas(estimateRequest);
      gasLimit = estimate;
    }

    // Get fee data if not provided
    let maxFeePerGas = tx.maxFeePerGas;
    let maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      const feeData = await this.provider.getFeeData();
      maxFeePerGas = maxFeePerGas ?? feeData.maxFeePerGas ?? undefined;
      maxPriorityFeePerGas = maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? undefined;
    }

    // Build EIP-1559 transaction
    // For contract deployment, 'to' must be null (not undefined)
    const unsignedTx: ethers.TransactionLike = {
      type: 2, // EIP-1559
      chainId,
      nonce,
      to: tx.to ?? null,
      value: tx.value ?? 0n,
      data: tx.data ?? '0x',
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    // Serialize unsigned transaction (without signature)
    const serializedUnsigned = ethers.Transaction.from(unsignedTx).unsignedSerialized;
    // Remove '0x' prefix for Ledger
    const rawTxHex = serializedUnsigned.slice(2);

    // Sign with Ledger
    console.log('Please confirm the transaction on your Ledger device...');
    const signature = await eth.signTransaction(this.derivationPath, rawTxHex, null);

    // Reconstruct signed transaction
    const signedTx = ethers.Transaction.from({
      ...unsignedTx,
      signature: {
        r: '0x' + signature.r,
        s: '0x' + signature.s,
        v: parseInt(signature.v, 16),
      },
    });

    return {
      rawTransaction: signedTx.serialized,
      hash: signedTx.hash!,
    };
  }

  async sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse> {
    const { rawTransaction } = await this.signTransaction(tx);
    return this.provider.broadcastTransaction(rawTransaction);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}
