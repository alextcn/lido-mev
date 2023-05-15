import { ethers, providers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import 'dotenv/config'
import { TransactionRequest } from '@ethersproject/providers'

const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)
const FLASHBOTS_BUILDER_RPC = 'https://relay.flashbots.net'

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
  maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei')
}

async function main() {
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
  const authSigner = new Wallet(process.env.AUTH_SIGNER_KEY)
  console.log(`wallet: ${wallet.address}\nsigner: ${authSigner.address}`)

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner)

  const block = await provider.getBlockNumber()
  const bundleBlock = block + 5
  console.log(`block: ${block}\nbundleBlock: ${bundleBlock},\n------------------`)

  // prepare bundle
  const bundleTransactions = [
    {
      transaction: SEND_ETH_TX,
      signer: wallet
    }
  ]
  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions)

  // simulate
  const simulatedBlock: string = undefined
  const simulatedBlockTime: number = undefined
  try {
    const res = await flashbotsProvider.simulate(
      signedBundle,
      bundleBlock,
      simulatedBlock,
      simulatedBlockTime
    )

    if ('error' in res) {
      console.error('error simulation response', res.error.message)
      return
    }

    console.log('simulation response', res)
  } catch (e) {
    console.error('simulation failed', e)
  }
}

main()
