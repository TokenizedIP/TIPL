/**
 * Safe multisig utilities for proposing transactions via Safe Transaction Service
 */

import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { MetaTransactionData, OperationType } from '@safe-global/types-kit';
import { ethers } from 'ethers';
import { BASE_CHAIN_ID } from '../constants/addresses';
import { BaseSigner } from '../signer/types';

/**
 * Initialize a Safe protocol-kit instance.
 * privateKey is optional — only needed if using Safe SDK's built-in signing.
 */
export async function initSafe(
  safeAddress: string,
  rpcUrl: string,
  privateKey?: string,
): Promise<Safe> {
  const initConfig: any = {
    provider: rpcUrl,
    safeAddress,
  };

  if (privateKey) {
    initConfig.signer = privateKey;
  }

  return await Safe.init(initConfig);
}

/**
 * Initialize the Safe API Kit for Base chain
 */
export function initApiKit(): SafeApiKit {
  return new SafeApiKit({
    chainId: BigInt(BASE_CHAIN_ID),
    txServiceUrl: 'https://safe-transaction-base.safe.global/api',
  });
}

/**
 * Create, sign, and propose a Safe transaction to the Safe Transaction Service.
 * Uses the provided BaseSigner to sign the Safe transaction hash.
 */
export async function proposeSafeTransaction(
  safeSdk: Safe,
  apiKit: SafeApiKit,
  txData: MetaTransactionData,
  signer: BaseSigner,
): Promise<string> {
  const senderAddress = await signer.getAddress();
  const safeAddress = await safeSdk.getAddress();

  const safeTransaction = await safeSdk.createTransaction({
    transactions: [txData],
  });

  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);

  // Sign the Safe tx hash using our signer (works for both local and Ledger)
  // signMessage produces an EIP-191 personal_sign signature (v = 27 or 28)
  // Safe requires v += 4 (v = 31 or 32) to indicate eth_sign type
  const messageBytes = ethers.getBytes(safeTxHash);
  const rawSignature = await signer.signMessage(messageBytes);
  const sigBytes = ethers.getBytes(rawSignature);
  sigBytes[sigBytes.length - 1] += 4; // Convert v from 27/28 to 31/32
  const signature = ethers.hexlify(sigBytes);

  // Post directly to Safe Transaction Service (the SDK's proposeTransaction
  // doesn't expose full error details)
  const txFields = safeTransaction.data;
  const body = {
    to: ethers.getAddress(txFields.to),
    value: txFields.value,
    data: txFields.data,
    operation: txFields.operation,
    safeTxGas: txFields.safeTxGas,
    baseGas: txFields.baseGas,
    gasPrice: txFields.gasPrice,
    gasToken: txFields.gasToken,
    refundReceiver: txFields.refundReceiver,
    nonce: txFields.nonce,
    contractTransactionHash: safeTxHash,
    sender: senderAddress,
    signature,
  };

  const resp = await fetch(
    `https://safe-transaction-base.safe.global/api/v2/safes/${safeAddress}/multisig-transactions/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Safe Transaction Service error (${resp.status}): ${errBody}`);
  }

  return safeTxHash;
}

export { MetaTransactionData, OperationType };
