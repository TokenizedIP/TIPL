"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerSigner = void 0;
const ethers_1 = require("ethers");
const hw_transport_node_hid_1 = __importDefault(require("@ledgerhq/hw-transport-node-hid"));
const hw_app_eth_1 = __importDefault(require("@ledgerhq/hw-app-eth"));
const DEFAULT_PATH = "44'/60'/0'/0/0";
class LedgerSigner {
    provider;
    derivationPath;
    eth = null;
    transport = null;
    cachedAddress = null;
    nextNonce = null;
    constructor(rpcUrl, derivationPath = DEFAULT_PATH) {
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.derivationPath = derivationPath;
    }
    async connect() {
        if (this.eth)
            return this.eth;
        this.transport = await hw_transport_node_hid_1.default.create();
        this.eth = new hw_app_eth_1.default(this.transport);
        return this.eth;
    }
    async disconnect() {
        if (this.transport) {
            await this.transport.close();
            this.transport = null;
            this.eth = null;
        }
    }
    async getAddress() {
        if (this.cachedAddress)
            return this.cachedAddress;
        const eth = await this.connect();
        const result = await eth.getAddress(this.derivationPath);
        this.cachedAddress = result.address;
        return result.address;
    }
    async signTransaction(tx) {
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
            const estimateRequest = {
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
        const unsignedTx = {
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
        const serializedUnsigned = ethers_1.ethers.Transaction.from(unsignedTx).unsignedSerialized;
        // Remove '0x' prefix for Ledger
        const rawTxHex = serializedUnsigned.slice(2);
        // Sign with Ledger
        console.log('Please confirm the transaction on your Ledger device...');
        const signature = await eth.signTransaction(this.derivationPath, rawTxHex, null);
        // Reconstruct signed transaction
        const signedTx = ethers_1.ethers.Transaction.from({
            ...unsignedTx,
            signature: {
                r: '0x' + signature.r,
                s: '0x' + signature.s,
                v: parseInt(signature.v, 16),
            },
        });
        return {
            rawTransaction: signedTx.serialized,
            hash: signedTx.hash,
        };
    }
    async sendTransaction(tx) {
        const { rawTransaction } = await this.signTransaction(tx);
        return this.provider.broadcastTransaction(rawTransaction);
    }
    getProvider() {
        return this.provider;
    }
}
exports.LedgerSigner = LedgerSigner;
