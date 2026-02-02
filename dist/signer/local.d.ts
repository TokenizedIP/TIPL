import { ethers } from 'ethers';
import { BaseSigner, TransactionRequest, SignedTransaction } from './types';
export declare class LocalSigner implements BaseSigner {
    private wallet;
    private provider;
    private nextNonce;
    constructor(privateKey: string, rpcUrl: string);
    getAddress(): Promise<string>;
    signTransaction(tx: TransactionRequest): Promise<SignedTransaction>;
    sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse>;
    getProvider(): ethers.JsonRpcProvider;
    static generateWallet(): {
        address: string;
        privateKey: string;
    };
}
