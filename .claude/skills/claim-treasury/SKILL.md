---
name: claim-treasury
description: Propose a transaction to claim tokens or LP fees from a TIPL project treasury
disable-model-invocation: true
allowed-tools: Bash(npm run *), Read, AskUserQuestion
---

# Claim Treasury Skill

This skill proposes Safe multisig transactions to claim tokens or LP fees from a TIPL project treasury. The scripts look up the project treasury and Uniswap pool from the TIPL API using the token address. The proposed transaction requires cosigner approval before execution.

## Prerequisites

- A wallet configured in `.env` (local or Ledger)
- At least 0.001 ETH for gas

## Workflow

### Step 1: Get Token Address

Read the `.env` file to get `TOKEN_ADDRESS`. If missing, ask the user for the token address.

### Step 2: Ask Claim Type

Use AskUserQuestion to ask what the user wants to claim:
- **Claim Coins**: Withdraw tokens from the treasury to your wallet
- **Claim Fees**: Collect accumulated Uniswap V4 LP trading fees

### Step 3A: Claim Coins

If the user chose Claim Coins:

1. Use AskUserQuestion to ask for the amount of tokens to claim (maximum 50,000 per transaction).

2. Run the claim script:

```bash
# Withdraw project tokens
npm run claim-coins -- --token <TOKEN_ADDRESS> --amount <AMOUNT>

# Withdraw a different token (e.g. USDC from LP fees)
npm run claim-coins -- --token <TOKEN_ADDRESS> --withdraw <WITHDRAW_TOKEN> --amount <AMOUNT>
```

The `--token` identifies the project (for treasury lookup). The optional `--withdraw` specifies which token to actually withdraw. If omitted, it withdraws the project token.

USDC address on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Validation rules** (enforced by the script, project token only):
- Amount must be <= 50,000
- Treasury must retain at least 700,000 tokens after the claim

These limits do not apply when withdrawing other tokens like USDC.

**Expected output**: Safe TX Hash and Safe App URL

### Step 3B: Claim Fees

If the user chose Claim Fees:

Run the claim script:

```bash
npm run claim-fees -- --token <TOKEN_ADDRESS>
```

The script automatically:
1. Looks up the treasury address and Uniswap pool ID from the TIPL API
2. Finds all LP position NFTs owned by the treasury using the Alchemy NFT API
3. Checks each NFT's pool ID on-chain and filters to positions matching the project's Uniswap pool
4. Proposes a fee collection transaction for the matching positions

**Expected output**: Safe TX Hash and Safe App URL

## Summary

After the transaction is proposed, inform the user:
- The Safe TX Hash
- The Safe App URL where they can view the pending transaction
- That the transaction requires cosigner approval before execution
- The cosigner can approve at the TIPL dashboard cosigner page

## Error Handling

- If any script exits with a non-zero code, stop and report the error to the user
- Common issues:
  - Token not found in TIPL API
  - Project has no treasury or Uniswap pool
  - Insufficient token balance in treasury
  - Claim would leave treasury below 700K reserve
  - Amount exceeds 50,000 maximum
  - Treasury has no LP positions
  - No LP positions match the project's Uniswap pool
  - Ledger not connected (for hardware wallet users)
  - Network connectivity issues
