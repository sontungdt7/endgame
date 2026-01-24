#!/usr/bin/env node
/**
 * Salt Mining Script
 * 
 * Finds a valid salt that produces an LBPStrategyBasic address with correct Uniswap v4 hook bits.
 * The address must end in 0x2000 (bit 13 = beforeInitialize hook enabled).
 * 
 * Usage:
 *   npx tsx scripts/mine-salt.ts [tokenAddress] [userAddress] [totalSupply]
 * 
 * Example:
 *   npx tsx scripts/mine-salt.ts 0x2804625BB433506a105Eb5e5c81055445cdf1d07 0x595ef7b98F9fb1196E577b576941Aa474c375353 1000000000000000000000000000
 */

import { createPublicClient, http, encodeAbiParameters, parseAbiParameters, keccak256, encodePacked } from 'viem'
import { sepolia } from 'wagmi/chains'
import {
  LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
  LIQUIDITY_LAUNCHER_ADDRESS,
  CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS,
  LBP_STRATEGY_BASIC_FACTORY_ABI,
  encodeLBPConfigData,
  type MigratorParameters,
  type AuctionParameters,
} from '../lib/liquidity-launcher'

// Hook permission bits: LBPStrategyBasic needs beforeInitialize = true (bit 13 = 0x2000)
const V4_ALL_HOOK_MASK = 0x3fff
const REQUIRED_HOOK_BITS = 0x2000

function isValidLBPHookAddress(addr: `0x${string}`): boolean {
  const last4 = Number.parseInt(addr.slice(-4), 16)
  return (last4 & V4_ALL_HOOK_MASK) === REQUIRED_HOOK_BITS
}

// Helper to encode auction steps (same as in create-bullrun-form.tsx)
function encodeAuctionSteps(steps: Array<{ mps: number; blockDelta: number }>): `0x${string}` {
  let encoded = "0x" as `0x${string}`
  for (const step of steps) {
    if (step.mps < 0 || step.mps > 0xFFFFFF) { 
      throw new Error(`auction step mps out of range (uint24): ${step.mps}`) 
    }
    if (step.blockDelta < 0 || step.blockDelta > 0xFFFFFFFFFF) { 
      throw new Error(`auction step blockDelta out of range (uint40): ${step.blockDelta}`) 
    }
    const packed = encodePacked(["uint24", "uint40"], [step.mps, step.blockDelta]) as `0x${string}`
    encoded = (encoded + packed.slice(2)) as `0x${string}`
  }
  return encoded as `0x${string}`
}

async function mineSalt() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  })

  // Get parameters from command line or use defaults
  const args = process.argv.slice(2)
  const exampleToken = (args[0] || '0x2804625BB433506a105Eb5e5c81055445cdf1d07') as `0x${string}`
  const exampleUser = (args[1] || '0x595ef7b98F9fb1196E577b576941Aa474c375353') as `0x${string}`
  const exampleTotalSupply = BigInt(args[2] || '1000000000000000000000000000') // 1B tokens
  
  // Create realistic configData using example parameters (similar to your form)
  const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}` // Sepolia USDC
  const currentBlock = await publicClient.getBlockNumber()
  const auctionDurationBlocks = BigInt(Math.floor(24 * 3600 / 12)) // 24 hours = 7200 blocks (12s per block)
  const startBlock = currentBlock + BigInt(5)
  const endBlock = startBlock + auctionDurationBlocks
  const claimBlock = endBlock + BigInt(10)
  const migrationBlock = endBlock + BigInt(100)
  const sweepBlock = migrationBlock + BigInt(1000)
  
  // Auction steps: 3 steps with different MPS (millions per second)
  const totalBlocks = Number(auctionDurationBlocks)
  const step1Blocks = Math.floor(totalBlocks * 0.4)
  const step2Blocks = Math.floor(totalBlocks * 0.4)
  const step3Blocks = totalBlocks - step1Blocks - step2Blocks
  const auctionSteps = encodeAuctionSteps([
    { mps: 5e5, blockDelta: step1Blocks },   // 0.5M tokens/sec
    { mps: 1e6, blockDelta: step2Blocks },    // 1M tokens/sec
    { mps: 15e5, blockDelta: step3Blocks }    // 1.5M tokens/sec
  ])
  
  const migratorParams: MigratorParameters = {
    migrationBlock,
    currency: usdcAddress,
    poolLPFee: 3000, // 0.3% = 3000 in hundredths of a bip
    poolTickSpacing: 60, // Standard tick spacing
    tokenSplitToAuction: 8e6, // 80% to auction
    auctionFactory: CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS,
    positionRecipient: exampleUser,
    sweepBlock,
    operator: exampleUser,
    createOneSidedTokenPosition: false,
    createOneSidedCurrencyPosition: false
  }
  
  const Q96 = BigInt("79228162514264337593543950336")
  const priceFloorValue = 0.001 // Example: $0.001 USDC per token
  const floorPriceQ96 = BigInt(Math.floor(priceFloorValue * 1e6)) * Q96 / BigInt(1e18)
  const tickSpacing = floorPriceQ96 / BigInt(10000) // 1% of floor price
  
  const MSG_SENDER = "0x0000000000000000000000000000000000000001" as `0x${string}`
  const auctionParams: AuctionParameters = {
    currency: usdcAddress,
    tokensRecipient: exampleUser,
    fundsRecipient: MSG_SENDER,
    startBlock,
    endBlock,
    claimBlock,
    tickSpacing,
    validationHook: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    floorPrice: floorPriceQ96,
    requiredCurrencyRaised: BigInt(0),
    auctionStepsData: auctionSteps
  }
  
  const exampleConfigData = encodeLBPConfigData(migratorParams, auctionParams)

  console.log('🔍 Mining salt for LBP hook address...')
  console.log(`Token: ${exampleToken}`)
  console.log(`User: ${exampleUser}`)
  console.log(`Total Supply: ${exampleTotalSupply.toString()}`)
  console.log(`Factory: ${LBP_STRATEGY_BASIC_FACTORY_ADDRESS}`)
  console.log(`ConfigData length: ${exampleConfigData.length} bytes`)
  console.log('')

  const maxTries = 10000
  const startTime = Date.now()

  // Try deterministic sequence based on token+user hash
  const baseHash = keccak256(
    encodeAbiParameters(parseAbiParameters(['address token, address user']), [exampleToken, exampleUser])
  )
  const baseNum = Number.parseInt(baseHash.slice(-8), 16)

  for (let j = 0; j < maxTries; j++) {
    const i = (baseNum + j) % 0xFFFFFFFF
    const salt0 = (`0x${i.toString(16).padStart(64, '0')}`) as `0x${string}`
    const innerSalt = keccak256(
      encodeAbiParameters(parseAbiParameters(['address user, bytes32 salt0']), [exampleUser, salt0])
    ) as `0x${string}`

    if (j % 500 === 0) {
      console.log(`⏳ Tried ${j}/${maxTries} salts...`)
    }

    try {
      const predicted = (await publicClient.readContract({
        address: LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
        abi: LBP_STRATEGY_BASIC_FACTORY_ABI,
        functionName: 'getLBPAddress',
        args: [exampleToken, exampleTotalSupply, exampleConfigData, innerSalt, LIQUIDITY_LAUNCHER_ADDRESS],
      })) as `0x${string}`

      if (isValidLBPHookAddress(predicted)) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log('')
        console.log('✅ FOUND VALID SALT!')
        console.log(`Salt: ${salt0}`)
        console.log(`Predicted Address: ${predicted}`)
        console.log(`Address ends in: 0x${predicted.slice(-4)} (required: 0x2000)`)
        console.log(`Attempts: ${j + 1}/${maxTries}`)
        console.log(`Time: ${elapsed}s`)
        console.log('')
        console.log('📝 Add this to your code:')
        console.log(`export const DEFAULT_LBP_SALT = "${salt0}" as const`)
        return salt0
      }
    } catch (e) {
      if (j % 1000 === 0) {
        console.warn(`Attempt ${j} failed:`, e)
      }
      continue
    }
  }

  throw new Error(`Could not find valid salt after ${maxTries} tries`)
}

mineSalt()
  .then((salt) => {
    console.log('✅ Salt mining complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Salt mining failed:', error)
    process.exit(1)
  })
