# Tokenized IP License (TIPL) maintainer tools

## About the Tokenized IP License
A Tokenized IP License delivers IP value without relying on any company or foundation. An acquirer can buy the IP by buying the tokens. A TIPL can govern any type of software or IP, not just crypto-related software.

Each bit of IP is licensed under "Initial Terms" that are appropriate — proprietary use only, open source, or business source. 

The TIPL is related to a token. You can relate IP with multiple types of licenses and rights to the same token.

An acquirer can write a new license for any of the IP, after making a successful tender offer for a related token. This gives the acquirer a package that clears away open source obligations and can include proprietary tools, data, and branding.

The acquirer cannot revoke open source rights. When terms in an open source license conflict with the new license, the open source wins.

## About these tools
This repository contains tools to set up a TIPL project. The tools run in Claude Code. They contain node.js scripts.

### Setup
Clone this repository inside your Claude Code sandbox directory.

npm init

cp .env.example .env

/setup-wallet (not implemented)
You will need a blockchain wallet with .001 Base ETH. Configure a new local private key, or connect a ledger signer

/create-token NAME=<yourname> SYMBOL=<yoursymbol>
Create a token. Use a symbol that is up to 8 uppercase characters. This skill will also send the tokens to a new multisig treasury, and optionally set up a Uniswap trading pool for them.

/fork-repo <repo_url> or "new"
Fork a repo, or create a new project repo. This will add a TIPL license to the existing license and connect the TIPL license to the new token