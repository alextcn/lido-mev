import { providers } from 'ethers'
import 'dotenv/config'
import { predictBlockNumber } from './utils'

const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

async function main() {
  const LIDO_VOTE_TIME = 1684163759
  const targetTime = LIDO_VOTE_TIME

  provider.on('block', async (blockNumber) => {
    // get block timestamp
    const block = await provider.getBlock(blockNumber)
    predictBlockNumber(blockNumber, block.timestamp, targetTime, true)
    console.log('------------------')
  })
}

main()
