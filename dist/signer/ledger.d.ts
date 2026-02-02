import { ethers } from 'ethers';
import { BaseSigner, TransactionRequest, SignedTransaction } from './types';
export declare class LedgerSigner implements BaseSigner {
    private provider;
    private derivationPath;
    private eth;
    private transport;
    private cachedAddress;
    private nextNonce;
    constructor(rpcUrl: string, derivationPath?: string);
    private connect;
    disconnect(): Promise<void>;
    getAddress(): Promise<string>;
    signTransaction(tx: TransactionRequest): Promise<SignedTransaction>;
    sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse>;
    getProvider(): ethers.JsonRpcProvider;
}
