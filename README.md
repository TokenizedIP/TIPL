# Overview

TIPL (Tokenized IP License) adds power to community-sourced software development. It combines:

* **IP value**: Intellectual property is tied to crypto tokens. Acquiring the tokens grants control to modify licensing terms  
* **Development automation**: Automated evaluation, consolidation, and merging of AI and human contributions  
* **Economics:** Contributors and compute providers can receive project tokens

## TIPL.fun Launchpad

The [TIPL.fun](https://tipl.fun) launchpad turns a GIthub repository into a TIPL project by adding a token and a license.

## Goals

#### **Build value with AI**

In the age of AI, most code will come from users, not vendors. The users are running AI, and the AI is generating new capabilities for them. A group of similar users will build with astonishing speed when we can gather their use cases, refine them, generate high quality changes, and add them to a shared distribution. TIPL gives us tools to run this process.

#### **Add value to crypto tokens**

A TIPL license adds value to a crypto token. It adds the potential for acquisition, which is the same thing that makes startup equity valuable. You can use it to resolve conflicts between token holders and developers by assigning branding, public and private IP from all contributors. It does not require a company or a foundation. It is backwards compatible with existing tokens, licensing, and organizational structures.

#### **Add value to the world**

TIPL can bring the good parts of crypto to a wider audience:

* It’s accessible. Anyone can be a founder or contributor. There are no national boundaries that can stop you.  
* It’s cheap. You and your collaborators start from the beginning. You don’t need bags of BTC, ETH, or USD.  
* It adds value to the real economy. It can drive the production and improvement of many types of IP and services.

A blockchain or crypto asset is, underneath, just a bunch of people who agree to run the same software. The software provides something that economists call “coordination value”. It helps them come to consensus, and work together to achieve great things. We are designing TIPL to maximize coordination value.

Crypto has been corrupted by exit scams. Now the bad guys are exiting. They leave us with a field of opportunity.

# Launch

The launcher turns a GIthub repository into a TIPL project by adding a token and a license.

#### **Connect to Github**

"Connect to Github" asks you to log in with a github account. The launcher will clone a repository into your account.

#### **Connect an EVM wallet**

You will need a wallet with .001 ETH on the Base blockchain.

#### **Github URL to fork**

Paste in the URL of a Github repository. The launcher will fork this repository into your account. It will copy the existing LICENSE into an INITIALTERMS file. It will add a TIPL license. It will edit the TIPL license to refer to your new token.

If you leave this empty, you will get our empty template repository with a TIPL license.

#### **New repository name**

Enter a name for the forked repository. If you selected a repository, you can leave this blank and get a personal repository with the same name.

#### **Token Symbol**

4 to 10 characters that will represent your token

#### **Token Name**

A short string that describes your project and token

#### **Token Distribution**

If you select "Create a trading pool", the launcher will make a trading pool on Uniswap, and deposit 20% of the new tokens for sale. It will also add a signer to the treasury that controls the distribution of tokens and prevents dumping.

If you select "Send all tokens to my project treasury" the launcher will send all of the tokens to the project treasury. You will control the treasury and figure out distribution, governance, and trading.

#### **Twitter**

Optional Twitter name. We recommend this.

#### **Telegram**

Optional URL of a telegram group invitation link. This can be useful if you want interested people to click on it and ask questions about your project.

#### **Email**

Optional email to receive notifications about the project.

#### **Description**

Up to four lines of text. It can contain markdown formatting.

## When you Launch Project

The launcher will go through these steps to launch your project.

#### **Create a multisig treasury to hold your new tokens**

We create a new SAFE multisig wallet to hold your new tokens. We call it the "project treasury". The wallet that you connected will be a signer on this multisig. This structure gives us the ability to add controls such as co-signers, voting, and futarchy.

If you selected "Create a trading pool" then the launcher will add our co-signer to the treasury. This prevents dumping and makes the token safe for your new buyers. We will approve and sign for any reasonable plan to distribute tokens to founders and contributors.

If you selected "send all tokens to my project treasury" you will be the only signer.

Our goal is to maximize your ability to deliver value. You can use a well-governed treasury to add more value over the coming years than you will get from a fixed distribution plan or a “fair launch” with meme trading revenue.

#### **Create a token**

The launcher will create a token with a supply of 1,000,000.

#### **Create a trading pool (optional)**

If you selected "Create a trading pool" the launcher will make a Uniswap trading pool. It will place (about) 200,000 tokens for sale in the pool at prices ranging from .01 USDC to 1000 USDC.

There will not be very much for sale at each price, so small purchases or sales can drive big changes in price. If people become interested in the token, we can stabilize the price by selling in a smaller range. In the beginning state, there are 200K circulating tokens, and 1M total tokens. At a starting price of .01 USDC, the market cap is $2,000 and the FDV is $10,000. The price will reach 10 USDC with about $60K of buying. At a price of 10 USDC, the market cap is $2M and the FDV is $10M.

#### **Deliver tokens**

The launcher will send 50,000 tokens (5%) to the TIPL treasury as a membership fee. Learn more about membership benefits in these docs. The launcher will send all remaining tokens to your new project treasury.

#### **Fork a github repo**

The launcher will fork a repository into your account. It will copy the existing LICENSE into an INITIALTERMS file. It will add a TIPL license. It will edit the TIPL license to refer to your new token.

# Why use TIPL?

TIPL adds features and economics to an open source contribution process. When is it useful to add these features?

**TiPL fits on top of open source licensing**. It does not change the open source licensing.

You can add a TIPL to give yourself some options for handling other IP. Consider TIPL if your project is bigger than just the contributed open source code. It can cover:

* Branding  
* Data, content, and model weights  
* Internal tools  
* Restricted source licenses that allow contribution and debugging, but reserve commercial rights

## Use cases

Consider TIPL if you want to compensate contributors.

Consider TIPL if your project is expensive. It might require a lot of compute or other resources. Adding some commercial features with TIPL can cover these costs.

Consider TIPL if your project benefits from an option to be acquired. This might be important in the following situations:

* If your project competes with a big model vendor like Anthropic. You are forcing them into a build or buy decision. Your project will be more successful if they have a buy option.  
* If your project is in a category like DeFi that is being invaded by large TradFi companies. Your project will have a bigger impact if they have an option to buy, rather than compete.  
* If your project wants to tap public markets.Some blockchains have set up DATs, which acquire a small percentage of blockchain tokens with public market funding. It is difficult for these minority holdings to earn excess returns. A TIPL makes the entire project, with related IP and operations, eligible for acquisition by a public company or SPAC.

Consider TIPL before launching an AI-themed memecoin. Memecoins have no value for anyone except meme traders. TIPL helps you build IP value for yourself and everyone else.

Consider TIPL if you run a crypto project that has a token which has limited value. You can use TIPL to add IP value to an existing token.

Consider TIPL if your project is managed by AI. TIPL does not require a human organization.

## Starting a TIPL project

Fork an internal project or an existing open source project. We give you tools for adding a token, adding the TIPL license on top of the existing licensing, and managing the flow of contributions.

Build value by attaching proprietary IP to the same token. Include branding, data, and internal apps and tools. You can apply your TIPL to IP that is not shared. You can share IP with usage restrictions.

### **If you are forking an existing open source project**

If you are forking an existing project from a different maintainer, you can do a few things to be a good collaborator.

* Change the name and the readme to avoid confusion with the source project.  
* Make contributions to the source project. Explain how to contribute to the source project.  
* **Add value.** Add aggregation, security, specialization, tooling, operation, distribution, and development workflow.

# Membership Benefits

The TIPL token launcher sends 5% of a newly minted supply to the TIPL treasury. This qualifies the project for membership benefits.

## Governance

Governance controls the distribution of tokens. We will deliver tools and services to move your project through these phases:

* **Governance 0:** The project treasury is controlled by a single benevolent dictator.  
* **Governance 1:** The treasury has a cosigner from TIPL with a 2 of 2 signing requirement. This is a minimal step to prevent dumping. It makes the token tradable. The TIPL team manages a multisig to handle this role as a second signer.  
* **Governance 2:** The treasury has a set of at least three qualified signers with at least 2 required for signing. This adds redundancy, recovery, deliberation, and reputation.  
* **Governance 3:** The token distribution is stabilized with automated lockup and vesting of tokens and LP positions. We will develop contracts which can do lockup, and also allow the recipients to participate in tender offers.  
* **Governance 4:** The treasury can sign with futarchy. We will provide a futarchy implementation.  
* **Governance 5:** Future best practices.

## Visibility

The project will appear on the TIPL dashboard and in social channels.

## Cooperative shares

We will send TIPL token rewards that will add diversification and liquidity to the new treasury. We will implement this return of value as soon as valuations stabilize.

## Tooling

#### **Contribution and code mining**

Continuously upgraded tools and practices for gathering contributions from humans and AI, summarizing them into use cases, reviewing them, and adding them to the distributions.

#### **Reward distribution**

Automated mechanisms for allocating rewards to contributors.

#### **Tender offers**

Mechanisms for making and responding to a tender offer.

#### **Monetization**

Mechanisms for adding subscription benefits and collecting compensation. Compensation can be in the form of stablecoins, or a holding of the governing token.

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
