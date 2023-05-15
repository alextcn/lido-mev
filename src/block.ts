import { providers } from 'ethers'
import 'dotenv/config'

const CHAIN_ID = 1
const provider = new providers.InfuraProvider(CHAIN_ID, process.env.RPC_URL)

export function predictBlockNumber(
  currentBlock: number,
  currentTime: number,
  targetTime: number
): number {
  const timeBetween = targetTime - currentTime
  const blocksBetween = Math.floor(timeBetween / 12.21)
  const targetBlock = currentBlock + blocksBetween

  console.log(`Last block: ${currentBlock}, time: ${currentTime}`)
  console.log(`Time between: ${timeBetween}, blocks between: [${blocksBetween}]`)
  console.log(`Target time: ${targetTime}, target block: [${targetBlock}]`)

  return targetBlock
}

async function main() {
  const LIDO_VOTE_TIME = 1684163759
  const targetTime = LIDO_VOTE_TIME

  provider.on('block', async (blockNumber) => {
    // get block timestamp
    const block = await provider.getBlock(blockNumber)
    predictBlockNumber(blockNumber, block.timestamp, targetTime)
    console.log('------------------')
  })
}

main()
