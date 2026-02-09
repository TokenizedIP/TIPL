---
name: create-token
description: Create a TIPL project with ERC20 token, multisig treasury, and optional Uniswap pool in a single transaction
disable-model-invocation: true
allowed-tools: Bash(npm run *), Read, Edit, AskUserQuestion
---

# Create Token Skill

This skill automates TIPL project setup on Base mainnet using the TIPLSetup contract. A single transaction deploys the ERC20 token, creates a Safe multisig treasury, distributes tokens, and optionally creates a Uniswap V4 pool.

## Prerequisites

- A wallet configured in `.env` (local or Ledger)
- At least 0.001 ETH for gas
- `TIPL_COSIGNER` address set in `.env` (for 2-of-2 multisig)

## Workflow

Follow these steps in order:

### Step 1: Verify Wallet Balance

Run the wallet check script to verify the wallet has sufficient ETH:

```bash
npm run check-wallet
```

**Expected output**: Address and balance, confirmation that balance >= 0.001 ETH

If the balance is insufficient, inform the user and stop.

### Step 2: Get Token Details

Use AskUserQuestion to ask the user to enter:
- **Token name**: The full name of the token (user must provide their own)
- **Token symbol**: The ticker symbol (user must provide their own)

IMPORTANT: Do NOT suggest default names or symbols. The user must enter their own values.

### Step 3: Ask About Uniswap Pool

Use AskUserQuestion to ask if the user wants to create a Uniswap trading pool:
- **Yes**: Reserve 200K tokens for the pool, project treasury gets 750K tokens
- **No**: Project treasury gets 950K tokens (50K always goes to TIPL treasury)

### Step 4: Run Setup

Execute the single-transaction setup:

If creating a pool:
```bash
npm run setup-tipl -- --name "Token Name" --symbol TKN --pool
```

If NOT creating a pool:
```bash
npm run setup-tipl -- --name "Token Name" --symbol TKN
```

**Expected output**: JSON with `tokenAddress`, `multisigAddress`, `poolId`, `txHash`

Save the output values for use in later steps.

### Step 5: Save to .env

Use the Edit tool to save the results in the `.env` file:

- Save `tokenAddress` as `TOKEN_ADDRESS`:
  - If `TOKEN_ADDRESS` already exists in `.env`, replace the entire line with the new value
  - If `TOKEN_ADDRESS` does not exist, add `TOKEN_ADDRESS=0x...` as a new line at the end of the file

- Save `multisigAddress` as `PROJECT_TREASURY`:
  - If `PROJECT_TREASURY` already exists in `.env`, replace the entire line with the new value
  - If `PROJECT_TREASURY` does not exist, add `PROJECT_TREASURY=0x...` as a new line at the end of the file

- If a pool was created (`poolId` is not null), save `poolId` as `UNISWAP_POOL`:
  - If `UNISWAP_POOL` already exists in `.env`, replace the entire line with the new value
  - If `UNISWAP_POOL` does not exist, add `UNISWAP_POOL=0x...` as a new line at the end of the file

### Step 6: Display Treasury URL

Show the user the Safe.global app URL for managing their treasury:

```bash
npm run view-treasury <multisigAddress>
```

## Summary

After completing all steps, provide the user with a summary including:
- Token address (link to BaseScan: `https://basescan.org/token/0x...`)
- Token name and symbol
- Distribution breakdown
- Treasury address (link to Safe app)
- Uniswap pool info (if created)
- Transaction hash (link to BaseScan: `https://basescan.org/tx/0x...`)

## Token Distribution

| Recipient | Without Pool | With Pool |
|-----------|-------------|-----------|
| TIPL Treasury | 50,000 (5%) | 50,000 (5%) |
| Project Treasury | 950,000 (95%) | 750,000 (75%) |
| Uniswap Pool | - | 200,000 (20%) |
| **Total** | 1,000,000 | 1,000,000 |

## Error Handling

- If any script exits with a non-zero code, stop and report the error to the user
- Common issues:
  - Insufficient ETH balance
  - Network connectivity issues
  - Ledger not connected (for hardware wallet users)
  - TIPLSetup contract call reverted (check gas, parameters)
