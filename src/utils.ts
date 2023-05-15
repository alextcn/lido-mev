export function predictBlockNumber(
  currentBlock: number,
  currentTime: number,
  targetTime: number,
  log: boolean = false
): number {
  const timeBetween = targetTime - currentTime
  const blocksBetween = Math.floor(timeBetween / 12.21)
  const targetBlock = currentBlock + blocksBetween

  if (log) {
    console.log(`Last block: ${currentBlock}, time: ${currentTime}`)
    console.log(`Time between: ${timeBetween}, blocks between: [${blocksBetween}]`)
    console.log(`Target time: ${targetTime}, target block: [${targetBlock}]`)
  }

  return targetBlock
}
