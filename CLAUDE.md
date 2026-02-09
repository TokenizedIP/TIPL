# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TIPL (Tokenized IP License) is a framework for community-sourced software development by Andy Singleton. It combines:

- **Token-based IP governance**: Intellectual property tied to cryptocurrency tokens; acquiring >50% via tender offer grants control to modify licensing terms
- **Code mining automation**: Automated evaluation, consolidation, and merging of AI and human contributions
- **Decentralized incentives**: Contributors (human and AI agents) receive project tokens as rewards

Repository: https://github.com/MaxosLLC/TIPL

## Current State

This project is in the conceptual/documentation phase. Key documents:

- `README.md` - Project overview
- `Gemini TIPL 01.md` - TIPL license template (v0.1) defining the tender offer mechanism and change-of-control rules
- `TIPL_concepts/TIPL Top Level PRD.md` - Full product requirements including system components and implementation plan

## Planned Technology Stack

- **AI Tool**: Claude Code (for maintainers and contributors)
- **Version Control**: GitHub
- **Blockchain**: EVM chains (Base primary), Solana future
- **Web Apps**: Next.JS for Vercel deployment
- **Smart Contracts**: ERC-20 tokens, Uniswap integration, vesting, tender vault

## Architecture (Planned Components)

### Tokens
- ERC-20 tokens on Base blockchain
- Non-mintable, non-pausable
- Future: Uniswap trading pools, lockup/vesting controls

### Setup Process
- Setup local signing of blockchain transactiions
- Creates token, GitHub repo, Uniswap pool (optional)
- Sends tokens to a treasury address
- Adds project to the TIPL directory'

### Directory app
- Keeps a list of TIPL sourced projects
- Provides a Web application to view and search the list of projects
- Includes the Web version of the Setup feature

### Code Mining Tools
- **Requests**: Ticketing system for requirements/prompts
- **Contribution**: Automate AI/human submissions
- **Consolidation**: Combine similar contributions into quality releases
- **Review & Merge**: Automated review with human maintainer final decisions
- **Reward**: Token distribution to contributors

## User Roles

1. **Founder**: Andy Singleton (TIPL project lead)
2. **Maintainers**: Create projects, manage tokens, guide development
3. **Contributors**: Humans or AI agents providing code/skills/IP for token rewards

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
