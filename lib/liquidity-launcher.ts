import { encodeAbiParameters, parseAbiParameters } from 'viem'

// LiquidityLauncher contract addresses for Sepolia
export const LIQUIDITY_LAUNCHER_ADDRESS = "0x00000008412db3394C91A5CbD01635c6d140637C" as const;
export const VIRTUAL_LBP_STRATEGY_FACTORY_ADDRESS = "0xC695ee292c39Be6a10119C70Ed783d067fcecfA4" as const;
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
  const migratorTuple = [
    migratorParams.migrationBlock,
    migratorParams.currency,
    migratorParams.poolLPFee,
    migratorParams.poolTickSpacing,
    migratorParams.tokenSplitToAuction,
    migratorParams.auctionFactory,
    migratorParams.positionRecipient,
    migratorParams.sweepBlock,
    migratorParams.operator,
    migratorParams.createOneSidedTokenPosition,
    migratorParams.createOneSidedCurrencyPosition
  ]

  // Encode auctionParams as bytes (it's already a struct that needs to be encoded)
  const encodedAuction = encodeAbiParameters(auctionParamsAbi, [
    auctionParams.currency,
    auctionParams.tokensRecipient,
    auctionParams.fundsRecipient,
    auctionParams.startBlock,
    auctionParams.endBlock,
    auctionParams.claimBlock,
    auctionParams.tickSpacing,
    auctionParams.validationHook,
    auctionParams.floorPrice,
    auctionParams.requiredCurrencyRaised,
    auctionParams.auctionStepsData
  ])

  return encodeAbiParameters(
    parseAbiParameters(['address', 'tuple(uint64,address,uint24,int24,uint24,address,address,uint64,address,bool,bool)', 'bytes']),
    [governanceAddress, migratorTuple, encodedAuction]
  ) as `0x${string}`
}

// Helper to encode tokenData for UERC20Factory (metadata)
export function encodeTokenData(
  description: string,
  website: string,
  imageUri: string
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters(['string', 'string', 'string']),
    [description, website, imageUri]
  ) as `0x${string}`
}
