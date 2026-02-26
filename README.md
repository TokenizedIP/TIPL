# Overview

This repository contains skills and scripts that help an AI agent use 
* A Tokenized IP License
* The TIPL.fun launchpad
* Related tokens and treasuries
* Related repositories and code contribution tools

# Skills

- **`/create-token`** — Deploy a TIPL project on Base mainnet in a single transaction: creates an ERC20 token, a Safe multisig treasury, distributes tokens, and optionally sets up a Uniswap V4 liquidity pool.
- **`/fork-repo`** — Fork a GitHub repository, clone it locally, apply the TIPL license (preserving any existing license as INITIALTERMS), and push the changes. Also submits the project to the TIPL dashboard.
- **`/rename-fork`** — Add a new project name and goals to the top of a forked repository's README.md, giving it its own identity while preserving the original content below.


# TIPL.fun Launchpad

The [TIPL.fun](https://tipl.fun) launchpad turns a GIthub repository into a TIPL project by adding a token and a license.

# Licenses

## About the Tokenized IP License

A Tokenized IP License delivers IP value without relying on any company or foundation. Anyone can contribute IP by relating it to a crypto token. An acquirer can buy the IP by buying the tokens. A TIPL can govern any type of software or IP, not just crypto-related software.

A TIPL goes on top of existing licensing. Each bit of IP is licensed under "Initial Terms" that are appropriate — proprietary use only, open source, or source available.

A TIPL is related to a token. One token can cover IP with multiple types of licenses and rights.

An acquirer can gain control of the IP after making a successful tender offer for the tokens. A successful tender offer buys at least 50% of the tokens, and buys all tokens that are offered. The "control" is represented as a right to write new licenses for any of the covered IP.

The acquirer cannot revoke open source rights. When terms in an open source license conflict with a new license, the open source wins.

The template repository contains [a recent version of our TIPL](https://github.com/TokenizedIP/TIPLempty/blob/main/licenses/TIPL). To use it:

* Add the date and token details at the top. The license should be related to a specific token.  
* Often, you will place this in a code repository as the file LICENSE  
* The TIPL adds a change in control step to an existing license. Add an INITIALTERMS file with a license that describes the existing license. If you have an existing license, copy it to INITIALTERMS

## About the Source Availability License

A Source Availability License is a way to work with contributors. It gives them the rights to use and modify the IP, as long as they do not use it commercially in "production".

The template repository contains [a recent version of our SAL](https://github.com/TokenizedIP/TIPLempty/blob/main/licenses/SAL). To use it:

* edit the "Additional use grant" or leave it as "none".  
* Place the SAL as INITIALTERMS.
