#!/usr/bin/env ts-node
/**
 * Salt Mining Script
 * 
 * Finds a valid salt that produces an LBPStrategyBasic address with correct Uniswap v4 hook bits.
 * The address must end in 0x2000 (bit 13 = beforeInitialize hook enabled).
 * 
 * Usage:
 *   npx ts-node scripts/mine-salt.ts
 */

import { createPublicClient, http, encodeAbiParameters, parseAbiParameters, keccak256 } from 'viem'
import { sepolia } from 'wagmi/chains'
import {
  LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
  LIQUIDITY_LAUNCHER_ADDRESS,
  LBP_STRATEGY_BASIC_FACTORY_ABI,
} from '../lib/liquidity-launcher'

// Hook permission bits: LBPStrategyBasic needs beforeInitialize = true (bit 13 = 0x2000)
const V4_ALL_HOOK_MASK = 0x3fff
const REQUIRED_HOOK_BITS = 0x2000

function isValidLBPHookAddress(addr: `0x${string}`): boolean {
  const last4 = Number.parseInt(addr.slice(-4), 16)
  return (last4 & V4_ALL_HOOK_MASK) === REQUIRED_HOOK_BITS
}

async function mineSalt() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  })

  // Example parameters (you can adjust these)
  const exampleToken = '0x2804625BB433506a105Eb5e5c81055445cdf1d07' as `0x${string}` // Example token
  const exampleUser = '0x595ef7b98F9fb1196E577b576941Aa474c375353' as `0x${string}` // Example user
  const exampleTotalSupply = BigInt('1000000000000000000000000000') // 1B tokens with 18 decimals
  
  // Example configData (minimal valid config)
  // This is a simplified example - in practice, configData depends on your auction/migrator params
  const exampleConfigData = '0x' + '0'.repeat(200) as `0x${string}` // Placeholder - you'd encode real params here

  console.log('🔍 Mining salt for LBP hook address...')
  console.log(`Token: ${exampleToken}`)
  console.log(`User: ${exampleUser}`)
  console.log(`Factory: ${LBP_STRATEGY_BASIC_FACTORY_ADDRESS}`)
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
