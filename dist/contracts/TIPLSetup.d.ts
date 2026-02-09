/**
 * ABI and address for the deployed TIPLSetup contract on Base mainnet.
 *
 * The setupTIPL() function performs all project setup in a single transaction:
 * - Deploys an ERC20 token (1M supply)
 * - Creates a Safe multisig treasury
 * - Distributes tokens (5% TIPL, 95% or 75% project, optionally 20% Uniswap pool)
 * - Optionally creates a Uniswap V4 trading pool
 */
export declare const TIPL_SETUP_ADDRESS = "0x1573f48e1F1a870aE3655bF1A0c10d8cD9b74dc9";
export declare const TIPL_SETUP_ABI: string[];
