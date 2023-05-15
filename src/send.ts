import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'
import { FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle'
import { predictBlockNumber } from './utils'

const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

// list of builders for sending bundle to increase a chance
const BUILDERS = [
  { url: 'https://relay.flashbots.net', simulate: true },
  { url: 'https://rpc.beaverbuild.org/', simulate: false },
  { url: 'https://builder0x69.io', simulate: false },
  { url: 'https://rsync-builder.xyz', simulate: false }
]

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error('Please provide WALLET_PRIVATE_KEY env')
  process.exit(1)
}

if (process.env.AUTH_SIGNER_KEY === undefined) {
  console.error('Please provide AUTH_SIGNER_KEY env')
  process.exit(1)
}

// simple tx to test builders
const SEND_ETH_TX = {
  chainId: CHAIN_ID,
  type: 2,
  value: ethers.utils.parseEther('0.00000024'),
  to: '0xaAaaa0cf858828c5dA523acdeAD993AB13007EA7',
  maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
  maxPriorityFeePerGas: ethers.utils.parseUnits('12', 'gwei')
}

// lido mint transaction
const LIDO_MINT_TX = {
  chainId: CHAIN_ID,
  type: 2,
  value: 0,
  to: '0x35378D76b05c21E2Bd4d0fc5831C581E7ba80Eea', // Lido2Life
  data: '0x1249c58b',
  gasLimit: 12_000_000, // TODO: increase to 10_000_000
  maxFeePerGas: ethers.utils.parseUnits('303', 'gwei'),
  maxPriorityFeePerGas: ethers.utils.parseUnits('302', 'gwei')
}

const LIDO_VOTE_TIME = 1684163759

// send bundle to builder
async function sendBundle({
  provider,
  key,
  txs,
  block,
  minTimestamp
}: {
  provider: FlashbotsBundleProvider
  key: string
  txs: FlashbotsBundleTransaction[]
  block: number
  minTimestamp?: number
}) {
  try {
    const bundleResponse = await provider.sendBundle(txs, block, { minTimestamp })

    if ('error' in bundleResponse) {
      console.warn(`❌ [${key}]`, bundleResponse.error.message)
      return
    }

    // simulate only for supported builders
    if (BUILDERS.find((b) => b.url === key)?.simulate) {
      console.log(`✅ [${key}]`, await bundleResponse.simulate())
    } else {
      console.log(`✅ [${key}]`, 'tx hash:', bundleResponse.bundleTransactions[0].hash)
    }
  } catch (e) {
    console.error(`❌ [${key}]`, e.message)
  }
}

async function main() {
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
  const authSigner = new Wallet(process.env.AUTH_SIGNER_KEY)
  console.log(`wallet: ${wallet.address}\nsigner: ${authSigner.address}`)

  // TODO: make any provider connection can fail safe
  const flashbotsProviders = await Promise.all(
    BUILDERS.map((builder) => FlashbotsBundleProvider.create(provider, authSigner, builder.url))
  )

  const txs = [
    {
      transaction: SEND_ETH_TX,
      signer: wallet
    },
    {
      transaction: SEND_ETH_TX,
      signer: wallet
    }
  ]
  const targetTime = 1684155900 // TODO: set LIDO_VOTE_TIME

  let sent = false
  provider.on('block', async (latestBlockNumber) => {
    if (sent) return // ignore

    const latestBlock = await provider.getBlock(latestBlockNumber)
    const latestTime = latestBlock.timestamp
    const targetBlock = predictBlockNumber(latestBlockNumber, latestTime, targetTime)
    const blocksBetween = targetBlock - latestBlockNumber

    // wait and log
    if (blocksBetween > 5) {
      console.log(
        `⌛ Latest block: ${latestBlockNumber}, latest time: ${latestTime}, target time: ${targetTime}`
      )
      console.log(
        `🎯 Target block: [${targetBlock}], blocks between: ${
          targetBlock - latestBlockNumber
        }, time between: ${targetTime - latestTime}`
      )
      console.log('----------------------')
      return
    }

    console.log(`🚀 Sending bundle for target block [${targetBlock}]...`)
    let builersCount = 0

    // TODO: make sure any builder can fail safe
    // run bundle for all providers async
    await Promise.all(
      flashbotsProviders.map(async (provider) => {
        await sendBundle({
          provider,
          key: provider.connection.url,
          txs: txs,
          block: targetBlock
        })
        builersCount++
      })
    )

    console.log(`✅✅✅  Bundle sent to ${builersCount}/${BUILDERS.length} builders`)
    sent = true
  })
}

main()
