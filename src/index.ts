import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'

// const CHAIN_ID = 5
const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

// const BUILDER_ENDPOINTS_GOERLI = ['https://relay-goerli.flashbots.net']
const FLASHBOTS_BUILDER_ENDPOINT = 'https://relay.flashbots.net'

// list of builders for sending bundle to increase a chance
const BUILDER_ENDPOINTS = [
  'https://builder0x69.io',
  // 'https://rpc.beaverbuild.org', // SERVER_ERROR response, 403 Forbidden
  'https://relay.flashbots.net',
  'https://rsync-builder.xyz'
]

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error('Please provide WALLET_PRIVATE_KEY env')
  process.exit(1)
}

if (process.env.AUTH_SIGNER_KEY === undefined) {
  console.error('Please provide AUTH_SIGNER_KEY env')
  process.exit(1)
}

async function main() {
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
  const authSigner = new Wallet(process.env.AUTH_SIGNER_KEY)
  console.log(`wallet: ${wallet.address}, signer: ${authSigner.address}`)

  // TODO: make any provider connection can fail safe
  const flashbotsProviders = await Promise.all(
    BUILDER_ENDPOINTS.map((endpoint) =>
      FlashbotsBundleProvider.create(provider, authSigner, endpoint)
    )
  )

  const block = await provider.getBlockNumber()
  const bundleBlock = block + 5
  console.log(`block: ${block}, bundleBlock: ${bundleBlock}`)

  // // read sent bundle
  // const res = await flashbotsProvider.getBundleStats(
  //   '0x349998384b43acf725e1d169ab2a555f4fc12839e0313e7afea9dee5c7bb3031',
  //   17258179
  // )
  // console.log(`bundle stats: ${JSON.stringify(res)}`)

  // prep and send bundle
  const bundleTransactions = [
    {
      transaction: {
        chainId: CHAIN_ID,
        type: 2,
        value: ethers.utils.parseEther('0.00000024'),
        to: '0xaAaaa0cf858828c5dA523acdeAD993AB13007EA7',
        maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('12', 'gwei')
      },
      signer: wallet
    }
  ]

  // run bundle for all providers async
  let submittions = 0
  await Promise.all(
    flashbotsProviders.map(async (provider) => {
      const key = provider.connection.url
      const bundleResponse = await provider.sendBundle(bundleTransactions, bundleBlock)

      if ('error' in bundleResponse) {
        console.warn(`[${key}]`, bundleResponse.error.message)
        return
      }

      // simulate only supported by Flashbots builder
      if (key === FLASHBOTS_BUILDER_ENDPOINT) {
        console.log(`[${key}]`, await bundleResponse.simulate())
      } else {
        console.log(`[${key}]`, bundleResponse)
      }

      submittions++
    })
  )
  console.log(`bundle sent to ${submittions}/${flashbotsProviders.length} providers`)

  // const bundleSubmitResponse = await flashbotsProviders[0].sendBundle(
  //   bundleTransactions,
  //   bundleBlock
  // )
  // if ('error' in bundleSubmitResponse) {
  //   console.warn(bundleSubmitResponse.error.message)
  //   return
  // }
  // console.log(await bundleSubmitResponse.simulate())
  // console.log(await bundleSubmitResponse.receipts())
}

main()
