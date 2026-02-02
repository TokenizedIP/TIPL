/**
 * Mint LP position on Uniswap V4 pool for token/USDC pair
 *
 * Arguments: --token 0x... --treasury 0x...
 *
 * This script:
 * 1. Approves PositionManager for 200K tokens via Permit2
 * 2. Creates LP position with price range 0.01 to 10 USDC per token
 * 3. Mints LP position using V4's modifyLiquidities
 * 4. LP NFT is sent to treasury
 *
 * Prerequisites:
 * - Pool must already exist (run create-uniswap-pool first)
 * - Deployer must have 200K tokens
 *
 * Run: npm run mint-pool-position -- --token 0x... --treasury 0x...
 * Output: { positionId: "...", poolId: "0x...", ... }
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { ERC20_ABI } from '../src/contracts/ERC20Token';
import { POSITION_MANAGER, USDC, BASE_CHAIN_ID, STATE_VIEW, PERMIT2 } from '../src/constants/addresses';

// Pool configuration
const FEE = 10000; // 1.00%
const TICK_SPACING = 200; // Standard tick spacing for 1% fee tier
const HOOKS = '0x0000000000000000000000000000000000000000'; // No hooks

// Amount to provide as liquidity
const LIQUIDITY_AMOUNT = ethers.parseUnits('200000', 18); // 200K tokens

// LP position price range (USDC per token)
const PRICE_LOWER = 0.01;   // Lower bound: 0.01 USDC per token
const PRICE_UPPER = 10.0;   // Upper bound: 10 USDC per token

// Uniswap V4 Actions (from v4-periphery/src/libraries/Actions.sol)
const Actions = {
  MINT_POSITION: 2,
  SETTLE_PAIR: 13,  // Settles both currencies (currency0, currency1)
};

// PositionManager ABI for V4
const POSITION_MANAGER_ABI = [
  'function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable',
  'function nextTokenId() external view returns (uint256)',
];

// Permit2 ABI for allowance-based approvals
const PERMIT2_ABI = [
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
  'function allowance(address owner, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)',
];

// StateView ABI for checking pool state
const STATE_VIEW_ABI = [
  'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
];

// Parse command line arguments
function parseArgs(): { token: string; treasury: string } {
  const args = process.argv.slice(2);
  let token = '';
  let treasury = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (args[i] === '--treasury' && args[i + 1]) {
      treasury = args[++i];
    }
  }

  if (!token || !treasury) {
    console.error('Usage: npm run mint-pool-position -- --token 0x... --treasury 0x...');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token) || !/^0x[a-fA-F0-9]{40}$/.test(treasury)) {
    console.error('Error: Invalid address format');
    process.exit(1);
  }

  return { token, treasury };
}

// Calculate sqrtPriceX96 from a price
function priceToSqrtPriceX96(price: number): bigint {
  const sqrtPrice = Math.sqrt(price);
  const Q96 = BigInt(2) ** BigInt(96);
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

// Calculate tick from price
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// Round tick to nearest usable tick
function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  return rounded;
}

// Calculate liquidity from amounts
function getLiquidityForAmount0(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, amount0: bigint): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  const Q96 = BigInt(2) ** BigInt(96);
  const intermediate = (sqrtPriceAX96 * sqrtPriceBX96) / Q96;
  return (amount0 * intermediate) / (sqrtPriceBX96 - sqrtPriceAX96);
}

function getLiquidityForAmount1(sqrtPriceAX96: bigint, sqrtPriceBX96: bigint, amount1: bigint): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  const Q96 = BigInt(2) ** BigInt(96);
  return (amount1 * Q96) / (sqrtPriceBX96 - sqrtPriceAX96);
}

// Get sqrtPriceX96 from tick
function tickToSqrtPriceX96(tick: number): bigint {
  const price = Math.pow(1.0001, tick);
  return priceToSqrtPriceX96(price);
}

// Encode actions as packed bytes
function encodeActions(actions: number[]): string {
  let packed = '0x';
  for (const action of actions) {
    packed += action.toString(16).padStart(2, '0');
  }
  return packed;
}

async function main() {
  const { token, treasury } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
    process.exit(1);
  }

  const config: SignerConfig = {
    type: signerType,
    rpcUrl,
    privateKey: process.env.PRIVATE_KEY,
    derivationPath: process.env.DERIVATION_PATH,
  };

  console.log(`Using ${signerType} signer...`);
  console.log(`Token: ${token}`);
  console.log(`Treasury (LP NFT recipient): ${treasury}`);

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const deployerAddress = await signer.getAddress();
    const provider = signer.getProvider();
    console.log(`Deployer: ${deployerAddress}`);

    // Sort tokens to determine currency0/currency1 (V4 requires sorting)
    const [currency0, currency1] = token.toLowerCase() < USDC.toLowerCase()
      ? [token, USDC]
      : [USDC, token];

    const isTokenCurrency0 = currency0.toLowerCase() === token.toLowerCase();
    console.log(`\nCurrency0: ${currency0} ${isTokenCurrency0 ? '(token)' : '(USDC)'}`);
    console.log(`Currency1: ${currency1} ${isTokenCurrency0 ? '(USDC)' : '(token)'}`);

    // Create token contract instance
    const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);

    // Check token balance
    const tokenBalance = await tokenContract.balanceOf(deployerAddress);
    console.log(`Token balance: ${ethers.formatUnits(tokenBalance, 18)}`);

    if (tokenBalance < LIQUIDITY_AMOUNT) {
      throw new Error(`Insufficient token balance. Need ${ethers.formatUnits(LIQUIDITY_AMOUNT, 18)} tokens, have ${ethers.formatUnits(tokenBalance, 18)}`);
    }

    // Calculate pool ID
    const poolKeyTuple = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint24', 'int24', 'address'],
      [currency0, currency1, FEE, TICK_SPACING, HOOKS]
    );
    const poolId = ethers.keccak256(poolKeyTuple);
    console.log(`\nPool ID: ${poolId}`);

    // Check if pool exists and get current tick
    const stateView = new ethers.Contract(STATE_VIEW, STATE_VIEW_ABI, provider);
    let currentTick: number = 0;

    try {
      const slot0 = await stateView.getSlot0(poolId);
      const currentSqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
      currentTick = Number(slot0.tick);
      if (currentSqrtPriceX96 === 0n) {
        throw new Error('Pool not initialized. Run create-uniswap-pool first.');
      }
      console.log(`Pool exists at tick ${currentTick}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Pool not initialized')) {
        throw e;
      }
      throw new Error('Pool does not exist. Run create-uniswap-pool first.');
    }

    // Step 1a: Approve Permit2 for tokens (ERC20 approval)
    console.log('\nStep 1a: Approving Permit2 for tokens...');
    console.log('Please confirm the transaction on your Ledger device...');
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const approvePermit2Data = tokenContract.interface.encodeFunctionData('approve', [PERMIT2, maxUint256]);
    const approvePermit2Tx = await signer.sendTransaction({
      to: token,
      data: approvePermit2Data,
      chainId: BASE_CHAIN_ID,
    });
    await approvePermit2Tx.wait();
    console.log(`Permit2 approval for token confirmed: ${approvePermit2Tx.hash}`);

    // Step 1b: Approve Permit2 for USDC (ERC20 approval) - needed for SETTLE_PAIR
    console.log('\nStep 1b: Approving Permit2 for USDC...');
    console.log('Please confirm the transaction on your Ledger device...');
    const usdcContract = new ethers.Contract(USDC, ERC20_ABI, provider);
    const approvePermit2UsdcData = usdcContract.interface.encodeFunctionData('approve', [PERMIT2, maxUint256]);
    const approvePermit2UsdcTx = await signer.sendTransaction({
      to: USDC,
      data: approvePermit2UsdcData,
      chainId: BASE_CHAIN_ID,
    });
    await approvePermit2UsdcTx.wait();
    console.log(`Permit2 approval for USDC confirmed: ${approvePermit2UsdcTx.hash}`);

    // Step 1c: Approve PositionManager on Permit2 for token
    console.log('\nStep 1c: Approving PositionManager on Permit2 for token...');
    console.log('Please confirm the transaction on your Ledger device...');
    const permit2Contract = new ethers.Contract(PERMIT2, PERMIT2_ABI, provider);
    // Set expiration to 30 days from now
    const expiration = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    // Max uint160 for amount
    const maxUint160 = BigInt('0xffffffffffffffffffffffffffffffffffffffff');
    const permit2ApproveData = permit2Contract.interface.encodeFunctionData('approve', [
      token,
      POSITION_MANAGER,
      maxUint160,
      expiration,
    ]);
    const permit2ApproveTx = await signer.sendTransaction({
      to: PERMIT2,
      data: permit2ApproveData,
      chainId: BASE_CHAIN_ID,
    });
    await permit2ApproveTx.wait();
    console.log(`PositionManager approval on Permit2 for token confirmed: ${permit2ApproveTx.hash}`);

    // Step 1d: Approve PositionManager on Permit2 for USDC
    console.log('\nStep 1d: Approving PositionManager on Permit2 for USDC...');
    console.log('Please confirm the transaction on your Ledger device...');
    const permit2ApproveUsdcData = permit2Contract.interface.encodeFunctionData('approve', [
      USDC,
      POSITION_MANAGER,
      maxUint160,
      expiration,
    ]);
    const permit2ApproveUsdcTx = await signer.sendTransaction({
      to: PERMIT2,
      data: permit2ApproveUsdcData,
      chainId: BASE_CHAIN_ID,
    });
    await permit2ApproveUsdcTx.wait();
    console.log(`PositionManager approval on Permit2 for USDC confirmed: ${permit2ApproveUsdcTx.hash}`);

    // Step 2: Calculate tick range from fixed price bounds
    // Price range: 0.001 to 0.2 USDC per token
    // Adjust for decimals: USDC has 6 decimals, token has 18 decimals
    let tickLower: number;
    let tickUpper: number;

    if (isTokenCurrency0) {
      // Token is currency0, USDC is currency1
      // V4 price = currency1/currency0 = USDC/token (with decimal adjustment)
      const priceLowAdjusted = PRICE_LOWER * Math.pow(10, 6 - 18);
      const priceHighAdjusted = PRICE_UPPER * Math.pow(10, 6 - 18);
      tickLower = nearestUsableTick(priceToTick(priceLowAdjusted), TICK_SPACING);
      tickUpper = nearestUsableTick(priceToTick(priceHighAdjusted), TICK_SPACING);
    } else {
      // USDC is currency0, token is currency1
      // V4 price = currency1/currency0 = token/USDC (inverse, with decimal adjustment)
      const priceLowAdjusted = (1 / PRICE_UPPER) * Math.pow(10, 18 - 6);
      const priceHighAdjusted = (1 / PRICE_LOWER) * Math.pow(10, 18 - 6);
      tickLower = nearestUsableTick(priceToTick(priceLowAdjusted), TICK_SPACING);
      tickUpper = nearestUsableTick(priceToTick(priceHighAdjusted), TICK_SPACING);
    }

    // Ensure proper ordering
    if (tickLower > tickUpper) {
      [tickLower, tickUpper] = [tickUpper, tickLower];
    }

    // Ensure single-sided liquidity: tickLower must be >= currentTick for token0-only,
    // or tickUpper must be <= currentTick for token1-only, to avoid needing both tokens.
    if (isTokenCurrency0 && tickLower <= currentTick) {
      tickLower = nearestUsableTick(currentTick + TICK_SPACING, TICK_SPACING);
      console.log(`Adjusted tickLower to ${tickLower} to ensure single-sided token deposit`);
    } else if (!isTokenCurrency0 && tickUpper >= currentTick) {
      tickUpper = nearestUsableTick(currentTick - TICK_SPACING, TICK_SPACING);
      console.log(`Adjusted tickUpper to ${tickUpper} to ensure single-sided token deposit`);
    }

    console.log(`\nPrice range: ${PRICE_LOWER} to ${PRICE_UPPER} USDC per token`);

    console.log(`\nTick range: ${tickLower} to ${tickUpper}`);
    console.log(`Current tick: ${currentTick}`);

    // Calculate liquidity for single-sided position
    const sqrtPriceLowerX96 = tickToSqrtPriceX96(tickLower);
    const sqrtPriceUpperX96 = tickToSqrtPriceX96(tickUpper);

    let liquidity: bigint;
    let amount0Max: bigint;
    let amount1Max: bigint;

    if (isTokenCurrency0) {
      // Token is currency0, providing amount0
      // Reduce liquidity by 0.1% to account for rounding errors
      const rawLiquidity = getLiquidityForAmount0(sqrtPriceLowerX96, sqrtPriceUpperX96, LIQUIDITY_AMOUNT);
      liquidity = rawLiquidity * 999n / 1000n;
      amount0Max = LIQUIDITY_AMOUNT;
      amount1Max = 0n;
    } else {
      // Token is currency1, providing amount1
      // Reduce liquidity by 0.1% to account for rounding errors
      const rawLiquidity = getLiquidityForAmount1(sqrtPriceLowerX96, sqrtPriceUpperX96, LIQUIDITY_AMOUNT);
      liquidity = rawLiquidity * 999n / 1000n;
      amount0Max = 0n;
      amount1Max = LIQUIDITY_AMOUNT;
    }

    console.log(`Calculated liquidity: ${liquidity.toString()}`);

    // Step 3: Mint position using V4's modifyLiquidities
    console.log('\nMinting position...');
    console.log(`LP NFT will be sent to treasury: ${treasury}`);

    const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, provider);
    const nextTokenId = await positionManager.nextTokenId();
    console.log(`Next token ID: ${nextTokenId.toString()}`);

    // Encode actions: MINT_POSITION + SETTLE_PAIR
    const actions = encodeActions([Actions.MINT_POSITION, Actions.SETTLE_PAIR]);
    console.log(`Actions: ${actions}`);

    // Encode parameters for each action
    // MINT_POSITION params: (poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData)
    const mintParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address,address,uint24,int24,address)', 'int24', 'int24', 'uint256', 'uint128', 'uint128', 'address', 'bytes'],
      [
        [currency0, currency1, FEE, TICK_SPACING, HOOKS], // poolKey
        tickLower,
        tickUpper,
        liquidity,
        amount0Max,
        amount1Max,
        treasury, // recipient of LP NFT
        '0x', // hookData
      ]
    );

    // SETTLE_PAIR params: (currency0, currency1)
    const settleParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address'],
      [currency0, currency1]
    );

    // Encode the full unlockData: abi.encode(actions, params[])
    const paramsArray = [mintParams, settleParams];
    const unlockData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'bytes[]'],
      [actions, paramsArray]
    );

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 600;

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = positionManager.interface.encodeFunctionData('modifyLiquidities', [
      unlockData,
      deadline,
    ]);

    console.log('Please confirm the transaction on your Ledger device...');
    const mintTx = await signer.sendTransaction({
      to: POSITION_MANAGER,
      data: modifyLiquiditiesData,
      chainId: BASE_CHAIN_ID,
    });
    await mintTx.wait();
    console.log(`Position minted: ${mintTx.hash}`);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    // Output JSON result
    const result = {
      positionId: nextTokenId.toString(),
      poolId,
      treasury,
      priceRange: {
        lower: PRICE_LOWER,
        upper: PRICE_UPPER,
        unit: 'USDC per token',
      },
      tickLower,
      tickUpper,
      liquidity: liquidity.toString(),
      isTokenCurrency0,
      transactions: {
        approvePermit2Token: approvePermit2Tx.hash,
        approvePermit2Usdc: approvePermit2UsdcTx.hash,
        approvePositionManagerToken: permit2ApproveTx.hash,
        approvePositionManagerUsdc: permit2ApproveUsdcTx.hash,
        mint: mintTx.hash,
      },
    };

    console.log('\n' + JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
