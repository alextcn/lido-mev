import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'

// const CHAIN_ID = 5
const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

// const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net'
const FLASHBOTS_ENDPOINT = 'https://relay.flashbots.net'

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
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    FLASHBOTS_ENDPOINT
  )

  console.log(`wallet: ${wallet.address}, signer: ${authSigner.address}`)

  const block = await provider.getBlockNumber()
  const bundleBlock = block + 10
  console.log(`block: ${block}, bundleBlock: ${bundleBlock}`)

  const bundleSubmitResponse = await flashbotsProvider.sendBundle(
    [
      {
        // transaction: {
        //   chainId: CHAIN_ID,
        //   type: 2,
        //   value: ethers.utils.parseEther('0.03'),
        //   to: '0x20EE855E43A7af19E407E39E5110c2C1Ee41F64D',
        //   data: '0x1249c58b', // calldata for mint()
        //   maxFeePerGas: ethers.utils.parseUnits('4', 'gwei'),
        //   maxPriorityFeePerGas: ethers.utils.parseUnits('3', 'gwei')
        // },
        transaction: {
          chainId: CHAIN_ID,
          type: 2,
          value: ethers.utils.parseEther('0.000024'),
          to: '0xaAaaa0cf858828c5dA523acdeAD993AB13007EA7',
          maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
          maxPriorityFeePerGas: ethers.utils.parseUnits('24', 'gwei')
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
