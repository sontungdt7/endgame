import { encodeAbiParameters, parseAbiParameters, keccak256, encodePacked } from 'viem'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'wagmi/chains'

// LiquidityLauncher contract addresses for Sepolia
export const LIQUIDITY_LAUNCHER_ADDRESS = "0x00000008412db3394C91A5CbD01635c6d140637C" as const;
export const VIRTUAL_LBP_STRATEGY_FACTORY_ADDRESS = "0xC695ee292c39Be6a10119C70Ed783d067fcecfA4" as const;
export const LBP_STRATEGY_BASIC_FACTORY_ADDRESS = "0xE4E2474083638e047b0d380E6787a2dfa7dB1A74" as const; // LBPStrategyBasicFactory (works with regular ERC20)
export const CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS = "0x0000ccaDF55C911a2FbC0BB9d2942Aa77c6FAa1D" as const;

// Token Factory address for Sepolia
// UERC20Factory - creates standard ERC20 tokens with extended metadata
export const TOKEN_FACTORY_ADDRESS = "0x0cde87c11b959e5eb0924c1abf5250ee3f9bd1b5" as const;

// LiquidityLauncher ABI - based on actual contract interface
export const LIQUIDITY_LAUNCHER_ABI = [
  {
    "type": "function",
    "name": "createToken",
    "inputs": [
      {
        "name": "factory",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "symbol",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "decimals",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "initialSupply",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "distributeToken",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "distribution",
        "type": "tuple",
        "internalType": "struct Distribution",
        "components": [
          {
            "name": "strategy",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "amount",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "configData",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      },
      {
        "name": "payerIsUser",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "distributionContract",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "multicall",
    "inputs": [
      {
        "name": "data",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "outputs": [
      {
        "name": "results",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getGraffiti",
    "inputs": [
      {
        "name": "originalCreator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "graffiti",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "event",
    "name": "TokenCreated",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TokenDistributed",
    "inputs": [
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "distributionContract",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;

// Types for TypeScript
export interface CreateTokenParams {
  factory: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: bigint; // uint128
  recipient: `0x${string}`;
  tokenData: `0x${string}`; // bytes - factory-specific data (metadata, etc.)
}

export interface Distribution {
  strategy: `0x${string}`;
  amount: bigint; // uint128
  configData: `0x${string}`; // bytes - encoded (governanceAddress, MigratorParameters, auctionParams) for VirtualLBPStrategyFactory
}

export interface MigratorParameters {
  migrationBlock: bigint; // uint64
  currency: `0x${string}`; // address - currency for the pool (e.g., USDC)
  poolLPFee: number; // uint24 - LP fee in hundredths of a bip (1e6 = 100%)
  poolTickSpacing: number; // int24
  tokenSplitToAuction: number; // uint24 - percentage in mps (1e7 = 100%)
  auctionFactory: `0x${string}`; // address
  positionRecipient: `0x${string}`; // address
  sweepBlock: bigint; // uint64
  operator: `0x${string}`; // address
  createOneSidedTokenPosition: boolean;
  createOneSidedCurrencyPosition: boolean;
}

export interface AuctionParameters {
  currency: `0x${string}`; // address - currency to raise funds in (address(0) for ETH)
  tokensRecipient: `0x${string}`; // address - receives leftover tokens
  fundsRecipient: `0x${string}`; // address - receives raised funds (should be address(1) = MSG_SENDER)
  startBlock: bigint; // uint64
  endBlock: bigint; // uint64
  claimBlock: bigint; // uint64
  tickSpacing: bigint; // uint256
  validationHook: `0x${string}`; // address - optional hook
  floorPrice: bigint; // uint256
  requiredCurrencyRaised: bigint; // uint128
  auctionStepsData: `0x${string}`; // bytes - packed auction steps
}

// LBPStrategyBasicFactory ABI (minimal) for getLBPAddress
export const LBP_STRATEGY_BASIC_FACTORY_ABI = [
  {
    "type": "function",
    "name": "getLBPAddress",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "totalSupply", "type": "uint256", "internalType": "uint256" },
      { "name": "configData", "type": "bytes", "internalType": "bytes" },
      { "name": "salt", "type": "bytes32", "internalType": "bytes32" },
      { "name": "sender", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  }
] as const

// Uniswap v4 hook permission bits for HookBasic used by LBPStrategyBasic:
// LBPStrategyBasic inherits from HookBasic which only has beforeInitialize=true (bit 13 = 0x2000)
// VirtualLBPStrategyBasic overrides to add beforeSwap=true (bit 7 = 0x80), so it needs 0x2080
// We avoid bigint here to stay compatible with TS targets < ES2020.
const V4_ALL_HOOK_MASK = 0x3fff
// For LBPStrategyBasic (non-virtual): only beforeInitialize = 0x2000
const REQUIRED_HOOK_BITS_LBP_STRATEGY_BASIC = 0x2000

export function isValidLBPHookAddress(addr: `0x${string}`): boolean {
  // Lower 14 bits live in the last 4 hex chars (16 bits). Mask off the upper 2 bits.
  const last4 = Number.parseInt(addr.slice(-4), 16)
  return (last4 & V4_ALL_HOOK_MASK) === REQUIRED_HOOK_BITS_LBP_STRATEGY_BASIC
}

// Find an outer salt (salt0) such that the deployed LBPStrategyBasic address has correct hook bits.
// Important: LiquidityLauncher hashes the salt before passing to the factory, and the factory hashes again:
//  - innerSalt = keccak256(abi.encode(user, salt0))
//  - create2Salt = keccak256(abi.encode(LIQUIDITY_LAUNCHER_ADDRESS, innerSalt))  (inside factory)
// We use getLBPAddress(token, totalSupply, configData, innerSalt, LIQUIDITY_LAUNCHER_ADDRESS) to predict address.
// Optimized salt search: try salts that are more likely to produce valid addresses
// Strategy: Since we need address ending in 0x2000 (bit 13 set), we can try salts
// that when hashed are more likely to produce addresses with that pattern
export async function findValidLBPSalt0(params: {
  publicClient: ReturnType<typeof createPublicClient>
  factoryAddress: `0x${string}`
  token: `0x${string}`
  totalSupply: bigint
  configData: `0x${string}`
  user: `0x${string}`
  maxTries?: number
  onProgress?: (current: number, max: number) => void
  timeoutMs?: number
}): Promise<`0x${string}`> {
  const { publicClient, factoryAddress, token, totalSupply, configData, user, maxTries = 500, onProgress, timeoutMs = 20000 } = params

  const startTime = Date.now()
  
  // Strategy 1: Try deterministic salts based on token/user (might be cached/reused)
  // Strategy 2: Try sequential salts starting from a hash of token+user (more deterministic)
  // Strategy 3: Fall back to random if needed
  
  const baseHash = keccak256(encodeAbiParameters(parseAbiParameters(['address token, address user']), [token, user]))
  const baseNum = Number.parseInt(baseHash.slice(-8), 16) // Use last 8 hex chars as starting point
  
  for (let j = 0; j < maxTries; j++) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Salt mining timed out after ${timeoutMs}ms (tried ${j} salts)`)
    }

    // Try deterministic sequence: baseNum + j, wrapped to fit in bytes32
    const i = (baseNum + j) % 0xFFFFFFFF
    const salt0 = (`0x${i.toString(16).padStart(64, '0')}`) as `0x${string}`
    const innerSalt = keccak256(
      encodeAbiParameters(parseAbiParameters(['address user, bytes32 salt0']), [user, salt0])
    ) as `0x${string}`

    // Report progress every 50 tries (more frequent feedback)
    if (onProgress && j % 50 === 0) {
      onProgress(j, maxTries)
    }

    try {
      const predicted = (await publicClient.readContract({
        address: factoryAddress,
        abi: LBP_STRATEGY_BASIC_FACTORY_ABI,
        functionName: 'getLBPAddress',
        args: [token, totalSupply, configData, innerSalt, LIQUIDITY_LAUNCHER_ADDRESS],
      })) as `0x${string}`

      if (isValidLBPHookAddress(predicted)) {
        if (onProgress) onProgress(maxTries, maxTries) // Mark as complete
        console.log(`✅ Found valid salt at attempt ${j + 1}/${maxTries}`)
        return salt0
      }
    } catch (e) {
      // If RPC call fails, continue trying
      if (j % 100 === 0) {
        console.warn(`Salt mining attempt ${j} failed:`, e)
      }
      continue
    }
  }

  throw new Error(`Could not find valid LBP hook salt after ${maxTries} tries`)
}

// Helper function to encode MigratorParameters and AuctionParameters for VirtualLBPStrategyFactory
export function encodeVirtualLBPConfigData(
  governanceAddress: `0x${string}`,
  migratorParams: MigratorParameters,
  auctionParams: AuctionParameters
): `0x${string}` {
  const migratorParamsAbi = parseAbiParameters([
    'uint64 migrationBlock',
    'address currency',
    'uint24 poolLPFee',
    'int24 poolTickSpacing',
    'uint24 tokenSplitToAuction',
    'address auctionFactory',
    'address positionRecipient',
    'uint64 sweepBlock',
    'address operator',
    'bool createOneSidedTokenPosition',
    'bool createOneSidedCurrencyPosition'
  ])

  const auctionParamsAbi = parseAbiParameters([
    'address currency',
    'address tokensRecipient',
    'address fundsRecipient',
    'uint64 startBlock',
    'uint64 endBlock',
    'uint64 claimBlock',
    'uint256 tickSpacing',
    'address validationHook',
    'uint256 floorPrice',
    'uint128 requiredCurrencyRaised',
    'bytes auctionStepsData'
  ])

  // Encode as (address, MigratorParameters, bytes)
  // MigratorParameters is a tuple, auctionParams is bytes
  // Ensure poolTickSpacing is within int24 range: -8388608 to 8388607
  const poolTickSpacingValue = Number(migratorParams.poolTickSpacing)
  if (poolTickSpacingValue > 8388607 || poolTickSpacingValue < -8388608) {
    throw new Error(`poolTickSpacing ${poolTickSpacingValue} is out of int24 range`)
  }
  
  // Build migrator tuple as object (viem supports both array and object for tuples)
  // For int24, use number (viem handles sign extension automatically)
  // For uint24, can use number (fits in JS number range)
  // For uint64, must use BigInt
  const migratorTupleObj = {
    migrationBlock: BigInt(migratorParams.migrationBlock), // uint64 -> BigInt
    currency: migratorParams.currency, // address
    poolLPFee: migratorParams.poolLPFee, // uint24 -> number
    poolTickSpacing: poolTickSpacingValue, // int24 -> number (viem handles signed)
    tokenSplitToAuction: migratorParams.tokenSplitToAuction, // uint24 -> number
    auctionFactory: migratorParams.auctionFactory, // address
    positionRecipient: migratorParams.positionRecipient, // address
    sweepBlock: BigInt(migratorParams.sweepBlock), // uint64 -> BigInt
    operator: migratorParams.operator, // address
    createOneSidedTokenPosition: migratorParams.createOneSidedTokenPosition, // bool
    createOneSidedCurrencyPosition: migratorParams.createOneSidedCurrencyPosition // bool
  }

  // Encode auctionParams as bytes (it's already a struct that needs to be encoded)
  const encodedAuction = encodeAbiParameters(auctionParamsAbi, [
    auctionParams.currency,
    auctionParams.tokensRecipient,
    auctionParams.fundsRecipient,
    BigInt(auctionParams.startBlock),
    BigInt(auctionParams.endBlock),
    BigInt(auctionParams.claimBlock),
    BigInt(auctionParams.tickSpacing),
    auctionParams.validationHook,
    BigInt(auctionParams.floorPrice),
    BigInt(auctionParams.requiredCurrencyRaised),
    auctionParams.auctionStepsData
  ])

  // Encode the final structure: (address, tuple, bytes)
  // Use the ABI format directly as an array of parameter definitions
  // Pass tuple as object with named properties
  const finalAbi = [
    {
      type: 'address',
      name: 'governanceAddress'
    },
    {
      type: 'tuple',
      name: 'migratorParams',
      components: [
        { type: 'uint64', name: 'migrationBlock' },
        { type: 'address', name: 'currency' },
        { type: 'uint24', name: 'poolLPFee' },
        { type: 'int24', name: 'poolTickSpacing' },
        { type: 'uint24', name: 'tokenSplitToAuction' },
        { type: 'address', name: 'auctionFactory' },
        { type: 'address', name: 'positionRecipient' },
        { type: 'uint64', name: 'sweepBlock' },
        { type: 'address', name: 'operator' },
        { type: 'bool', name: 'createOneSidedTokenPosition' },
        { type: 'bool', name: 'createOneSidedCurrencyPosition' }
      ]
    },
    {
      type: 'bytes',
      name: 'auctionParams'
    }
  ] as const

  return encodeAbiParameters(
    finalAbi,
    [governanceAddress, migratorTupleObj, encodedAuction]
  ) as `0x${string}`
}

// Helper function to encode MigratorParameters and AuctionParameters for LBPStrategyBasicFactory
// Note: LBPStrategyBasicFactory does NOT require governanceAddress (unlike VirtualLBPStrategyFactory)
export function encodeLBPConfigData(
  migratorParams: MigratorParameters,
  auctionParams: AuctionParameters
): `0x${string}` {
  const migratorParamsAbi = parseAbiParameters([
    'uint64 migrationBlock',
    'address currency',
    'uint24 poolLPFee',
    'int24 poolTickSpacing',
    'uint24 tokenSplitToAuction',
    'address auctionFactory',
    'address positionRecipient',
    'uint64 sweepBlock',
    'address operator',
    'bool createOneSidedTokenPosition',
    'bool createOneSidedCurrencyPosition'
  ])

  const auctionParamsAbi = parseAbiParameters([
    'address currency',
    'address tokensRecipient',
    'address fundsRecipient',
    'uint64 startBlock',
    'uint64 endBlock',
    'uint64 claimBlock',
    'uint256 tickSpacing',
    'address validationHook',
    'uint256 floorPrice',
    'uint128 requiredCurrencyRaised',
    'bytes auctionStepsData'
  ])

  // Encode as (MigratorParameters, bytes) - NO governanceAddress
  // Ensure poolTickSpacing is within int24 range: -8388608 to 8388607
  const poolTickSpacingValue = Number(migratorParams.poolTickSpacing)
  if (poolTickSpacingValue > 8388607 || poolTickSpacingValue < -8388608) {
    throw new Error(`poolTickSpacing ${poolTickSpacingValue} is out of int24 range`)
  }
  
  const migratorTupleObj = {
    migrationBlock: BigInt(migratorParams.migrationBlock),
    currency: migratorParams.currency,
    poolLPFee: migratorParams.poolLPFee,
    poolTickSpacing: poolTickSpacingValue,
    tokenSplitToAuction: migratorParams.tokenSplitToAuction,
    auctionFactory: migratorParams.auctionFactory,
    positionRecipient: migratorParams.positionRecipient,
    sweepBlock: BigInt(migratorParams.sweepBlock),
    operator: migratorParams.operator,
    createOneSidedTokenPosition: migratorParams.createOneSidedTokenPosition,
    createOneSidedCurrencyPosition: migratorParams.createOneSidedCurrencyPosition
  }

  // Encode auctionParams as bytes
  const encodedAuction = encodeAbiParameters(auctionParamsAbi, [
    auctionParams.currency,
    auctionParams.tokensRecipient,
    auctionParams.fundsRecipient,
    BigInt(auctionParams.startBlock),
    BigInt(auctionParams.endBlock),
    BigInt(auctionParams.claimBlock),
    BigInt(auctionParams.tickSpacing),
    auctionParams.validationHook,
    BigInt(auctionParams.floorPrice),
    BigInt(auctionParams.requiredCurrencyRaised),
    auctionParams.auctionStepsData
  ])

  // Encode the final structure: (tuple, bytes) - NO governanceAddress
  const finalAbi = [
    {
      type: 'tuple',
      name: 'migratorParams',
      components: [
        { type: 'uint64', name: 'migrationBlock' },
        { type: 'address', name: 'currency' },
        { type: 'uint24', name: 'poolLPFee' },
        { type: 'int24', name: 'poolTickSpacing' },
        { type: 'uint24', name: 'tokenSplitToAuction' },
        { type: 'address', name: 'auctionFactory' },
        { type: 'address', name: 'positionRecipient' },
        { type: 'uint64', name: 'sweepBlock' },
        { type: 'address', name: 'operator' },
        { type: 'bool', name: 'createOneSidedTokenPosition' },
        { type: 'bool', name: 'createOneSidedCurrencyPosition' }
      ]
    },
    {
      type: 'bytes',
      name: 'auctionParams'
    }
  ] as const

  return encodeAbiParameters(
    finalAbi,
    [migratorTupleObj, encodedAuction]
  ) as `0x${string}`
}

// Helper to encode tokenData for UERC20Factory (metadata)
// UERC20Metadata struct: { string description, string website, string image }
// Factory expects: abi.encode(UERC20Metadata)
// In Solidity: abi.encode(metadata) where metadata is UERC20Metadata struct
// Note: abi.encode of a struct encodes it as a tuple, but for structs with only value types,
// we can encode directly as the component types
export function encodeTokenData(
  description: string,
  website: string,
  imageUri: string
): `0x${string}` {
  // Encode as tuple using viem's format
  // The struct UERC20Metadata has 3 string fields, so we encode as a tuple of 3 strings
  return encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'website', type: 'string', internalType: 'string' },
          { name: 'image', type: 'string', internalType: 'string' }
        ]
      }
    ],
    [{ description, website, image: imageUri }]
  ) as `0x${string}`
}

// Helper to compute graffiti (same as LiquidityLauncher.getGraffiti)
export function computeGraffiti(originalCreator: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(['address'], [originalCreator]))
}

// UERC20Factory ABI for getUERC20Address
const UERC20_FACTORY_ABI = [
  {
    "type": "function",
    "name": "getUERC20Address",
    "inputs": [
      { "name": "name", "type": "string", "internalType": "string" },
      { "name": "symbol", "type": "string", "internalType": "string" },
      { "name": "decimals", "type": "uint8", "internalType": "uint8" },
      { "name": "creator", "type": "address", "internalType": "address" },
      { "name": "graffiti", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  }
] as const

// Helper to precompute token address using factory
export async function precomputeTokenAddress(
  factoryAddress: `0x${string}`,
  name: string,
  symbol: string,
  decimals: number,
  creator: `0x${string}`,
  graffiti: `0x${string}`
): Promise<`0x${string}`> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

  const address = await publicClient.readContract({
    address: factoryAddress,
    abi: UERC20_FACTORY_ABI,
    functionName: 'getUERC20Address',
    args: [name, symbol, decimals, creator, graffiti]
  })

  return address
}
