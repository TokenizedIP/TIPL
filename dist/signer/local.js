"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSigner = void 0;
const ethers_1 = require("ethers");
class LocalSigner {
    wallet;
    provider;
    nextNonce = null;
    constructor(privateKey, rpcUrl) {
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
    }
    async getAddress() {
        return this.wallet.address;
    }
    async signTransaction(tx) {
        const nonce = tx.nonce ?? this.nextNonce ?? undefined;
        const populatedTx = await this.wallet.populateTransaction({
            to: tx.to,
            value: tx.value,
            data: tx.data,
            gasLimit: tx.gasLimit,
            maxFeePerGas: tx.maxFeePerGas,
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
            nonce,
            chainId: tx.chainId,
        });
        this.nextNonce = populatedTx.nonce + 1;
        const rawTransaction = await this.wallet.signTransaction(populatedTx);
        const hash = ethers_1.ethers.keccak256(rawTransaction);
        return { rawTransaction, hash };
    }
    async sendTransaction(tx) {
        const nonce = tx.nonce ?? this.nextNonce ?? undefined;
        const response = await this.wallet.sendTransaction({
            to: tx.to,
            value: tx.value,
            data: tx.data,
            gasLimit: tx.gasLimit,
            maxFeePerGas: tx.maxFeePerGas,
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
            nonce,
            chainId: tx.chainId,
        });
        this.nextNonce = (response.nonce) + 1;
        return response;
    }
    getProvider() {
        return this.provider;
    }
    // Generate a new random wallet
    static generateWallet() {
        const wallet = ethers_1.ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
        };
    }
}
exports.LocalSigner = LocalSigner;
