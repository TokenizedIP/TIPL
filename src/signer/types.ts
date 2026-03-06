import { ethers } from 'ethers';

export interface SignerConfig {
  type: 'local' | 'ledger';
  rpcUrl: string;
  // For local signer
  privateKey?: string;
  // For Ledger signer
  derivationPath?: string; // Default: "44'/60'/0'/0/0"
}

export interface TransactionRequest {
  to?: string; // Optional for contract creation
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId?: number;
}

export interface SignedTransaction {
  rawTransaction: string;
  hash: string;
}

export interface BaseSigner {
  getAddress(): Promise<string>;
  signTransaction(tx: TransactionRequest): Promise<SignedTransaction>;
  sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse>;
  signMessage(message: Uint8Array): Promise<string>;
  getProvider(): ethers.JsonRpcProvider;
}
