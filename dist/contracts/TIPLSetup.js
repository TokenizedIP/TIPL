"use strict";
/**
 * ABI and address for the deployed TIPLSetupFlex contract on Base mainnet.
 *
 * The setupTIPL() function performs all project setup in a single transaction:
 * - Deploys an ERC20 token (1M supply)
 * - Creates a Safe multisig treasury
 * - Distributes tokens (5% TIPL, 95% or 75% project, optionally 20% Uniswap pool)
 * - Optionally creates a Uniswap V4 trading pool with a configurable starting price
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIPL_SETUP_ABI = exports.TIPL_SETUP_ADDRESS = void 0;
exports.TIPL_SETUP_ADDRESS = "0x8B91ba8d20B92Eb65031d351511370140FAD4a0f";
exports.TIPL_SETUP_ABI = [
    "function setupTIPL(string symbol, string name, address firstSigner, address secondSigner, bool createSwap, uint256 startingPrice) external",
    "event TIPLSetupComplete(address indexed token, address indexed multisig, string name, string symbol, bytes32 poolId)",
];
