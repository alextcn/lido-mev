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

const LIDO_MINT_TX = {
  chainId: CHAIN_ID,
  type: 2,
  value: 0,
  to: '0x35378D76b05c21E2Bd4d0fc5831C581E7ba80Eea', // Lido2Life
  data: '0x1249c58b',
  gasLimit: 1_000_000, // TODO: increase
  maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
  maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei')
}

async function main() {
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
  const authSigner = new Wallet(process.env.AUTH_SIGNER_KEY)
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner)
  console.log(`wallet: ${wallet.address}\nsigner: ${authSigner.address}`)

  // prepare bundle
  const bundleTransactions = [
    {
      transaction: LIDO_MINT_TX,
      signer: wallet
    }
  ]
  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions)

  // simulate
  const stateBlock = await provider.getBlockNumber()
  const block = stateBlock + 1
  const blockTimestamp = 1684190652
  try {
    const res = await flashbotsProvider.simulate(
      signedBundle,
      block,
      stateBlock,
      blockTimestamp
    )

    if ('error' in res) {
      console.error('error simulation response', res)
      return
    }

    console.log('simulation response', res)
  } catch (e) {
    console.error('simulation failed', e)
  }
}

main()
