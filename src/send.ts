import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'
import { FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle'

const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

// list of builders for sending bundle to increase a chance
const BUILDERS = [
  { url: 'https://relay.flashbots.net', simulate: true }
  // { url: 'https://rpc.beaverbuild.org/', simulate: false },
  // { url: 'https://builder0x69.io', simulate: false },
  // { url: 'https://rsync-builder.xyz', simulate: false }
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
  to: '0xd07dAfB61ebd2de385f01E39D4Bf7785E16554aB',
  maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
  maxPriorityFeePerGas: ethers.utils.parseUnits('12', 'gwei')
}

// send bundle to builder
async function sendBundle({
  provider,
  key,
  txs,
  block
}: {
  provider: FlashbotsBundleProvider
  key: string
  txs: FlashbotsBundleTransaction[]
  block: number
}) {
  try {
    const bundleResponse = await provider.sendBundle(txs, block)

    if ('error' in bundleResponse) {
      console.warn(`❌ [${key}]`, bundleResponse.error.message)
      return
    }

    // simulate only for supported builders
    if (BUILDERS.find((b) => b.url === key)?.simulate) {
      console.log(`✅ [${key}]`, await bundleResponse.simulate())
    } else {
      console.log(`✅ [${key}]`, bundleResponse.bundleTransactions)
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

  const block = await provider.getBlockNumber()
  const bundleBlock = block + 5
  console.log(`block: ${block}\nbundleBlock: ${bundleBlock},\n------------------`)

  // prep transactions
  const bundleTransactions = [
    {
      transaction: SEND_ETH_TX,
      signer: wallet
    }
  ]

  // TODO: make sure any builder can fail safe
  // run bundle for all providers async
  let submittions = 0
  await Promise.all(
    flashbotsProviders.map(async (provider) => {
      await sendBundle({
        provider,
        key: provider.connection.url,
        txs: bundleTransactions,
        block: bundleBlock
      })
      submittions++
    })
  )
  console.log(`bundle sent to ${submittions}/${BUILDERS.length} builders`)
}

main()
