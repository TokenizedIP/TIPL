# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This repository holds skills and scripts for AI agents that use TIPL tools.


## TIPL reference
TIPL (Tokenized IP License) is a framework for community-sourced software development by Andy Singleton. It combines:

- **Token-based IP governance**: Intellectual property tied to cryptocurrency tokens; acquiring >50% via tender offer grants control to modify licensing terms
- **Development automation**: Automated evaluation, consolidation, and merging of AI and human contributions
- **Decentralized incentives**: Contributors (human and AI agents) receive project tokens as rewards

- `licenses/TIPL.md` - TIPL license template (v0.1) defining the tender offer mechanism and change-of-control rules
- TIPL_concepts/* - Full product requirements including system components and implementation plan
- The TIPL.fun launchpad documentation at https://tipl.fun/docs
- Smart contracts for creating TIPL tokens, treasuries, and liquidity pools are in the repository at https://github.com/TokenizedIP/TIPLsetup


## Development Commands

```bash
npm run build              # Compile TypeScript to dist/
npm run generate-wallet    # Generate a new local wallet
npm run get-address        # Get address from configured signer
npm run send-eth           # Send ETH: npm run send-eth <to> <amount>

# Token Creation (single-transaction setup)
npm run check-wallet       # Verify wallet has ≥0.001 ETH
npm run setup-tipl         # Deploy token + treasury + optional pool in one tx
npm run view-treasury      # Display Safe.global app URL
```

## Token Creation Skill

The `/create-token` skill automates TIPL project setup on Base mainnet using the TIPLSetup contract. A single transaction handles everything:

1. Verifies wallet balance (≥0.001 ETH required)
2. Deploys ERC20 token, Safe multisig treasury, distributes tokens, and optionally creates Uniswap V4 pool — all in one `setupTIPL()` call

Token distribution with pool:
- 50K (5%) to TIPL treasury
- 750K (75%) to project treasury
- 200K (20%) to Uniswap pool

## Signing Configuration

Copy `.env.example` to `.env` and configure:
- `SIGNER_TYPE`: `local` (private key) or `ledger` (hardware wallet)
- `RPC_URL`: Blockchain RPC endpoint (default: Base mainnet)
- `PRIVATE_KEY`: For local signing (without 0x prefix)
- `DERIVATION_PATH`: For Ledger (default: 44'/60'/0'/0/0)
- `TIPL_COSIGNER`: Address for 2-of-2 multisig second signer

## Code Architecture

```
src/
  signer/             # EVM transaction signing module
    ├── index.ts      # Exports and createSigner() factory
    ├── types.ts      # SignerConfig, BaseSigner interface
    ├── local.ts      # LocalSigner - private key signing
    └── ledger.ts     # LedgerSigner - hardware wallet signing
  constants/
    └── addresses.ts  # Base mainnet contract addresses (incl. TIPLSetup)
  contracts/
    ├── ERC20Token.ts # Pre-compiled ERC20 bytecode and ABI
    └── TIPLSetup.ts  # TIPLSetup contract ABI and address

scripts/              # CLI utilities
  ├── check-wallet.ts # Verify wallet balance
  ├── setup-tipl.ts   # Single-tx project setup (token + treasury + pool)
  └── view-treasury.ts # Show Safe.global URL

.claude/skills/create-token/  # Claude Code skill for token creation
```

## Constraints

- Target cost: <$1000/month for AI inference and API services
- Strategy: Move expensive operations to contributor machines
