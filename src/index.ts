import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'

const CHAIN_ID = 5
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net'

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error('Please provide WALLET_PRIVATE_KEY env')
  process.exit(1)
}
const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    Wallet.createRandom(), // TODO: use some other new wallet
    FLASHBOTS_ENDPOINT
  )

  const block = await provider.getBlockNumber()
  const bundleBlock = block + 5
  console.log(`block: ${block}, bundleBlock: ${bundleBlock}`)

  const bundleSubmitResponse = await flashbotsProvider.sendBundle(
    [
      {
        transaction: {
          chainId: CHAIN_ID,
          type: 2,
          value: ethers.utils.parseEther('0.03'),
          to: '0x20EE855E43A7af19E407E39E5110c2C1Ee41F64D',
          data: '0x1249c58b', // calldata for mint()
          maxFeePerGas: ethers.utils.parseUnits('4', 'gwei'),
          maxPriorityFeePerGas: ethers.utils.parseUnits('3', 'gwei')
        },
        signer: wallet
      }
    ],
    bundleBlock
  )

  if ('error' in bundleSubmitResponse) {
    console.warn(bundleSubmitResponse.error.message)
    return
  }

  console.log(await bundleSubmitResponse.simulate())
  console.log(await bundleSubmitResponse.receipts())
}

main()
