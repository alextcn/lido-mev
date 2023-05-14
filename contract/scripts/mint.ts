import { ethers } from 'hardhat'

const LIDO2LIFE_ADDRESS = '0x35378d76b05c21e2bd4d0fc5831c581e7ba80eea'
const LIDO_WITHDRAWAL_ADDRESS = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1'

async function printBalancesBefore() {
  const steth = await ethers.getContractAt('IStETH', '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84')
  const allowance = await steth.allowance(LIDO2LIFE_ADDRESS, LIDO_WITHDRAWAL_ADDRESS)
  const balance = await steth.balanceOf(LIDO2LIFE_ADDRESS)
  console.log(`stETH balance of ${LIDO2LIFE_ADDRESS}: ${ethers.utils.formatUnits(balance, 18)}`)
  console.log(
    `stETH allowance of ${LIDO2LIFE_ADDRESS} for ${LIDO_WITHDRAWAL_ADDRESS}: ${ethers.utils.formatUnits(
      allowance,
      18
    )}`
  )
}

async function printBalancesAfter() {
  const steth = await ethers.getContractAt('IStETH', '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84')
  const balanceLido2Life = await steth.balanceOf(LIDO2LIFE_ADDRESS)
  const balanceLidoWithdrawal = await steth.balanceOf(LIDO_WITHDRAWAL_ADDRESS)
  console.log('stETH(Lido2Life):', ethers.utils.formatUnits(balanceLido2Life, 18), 'stETH')
  console.log(
    'stETH(LidoWithdrawal):',
    ethers.utils.formatUnits(balanceLidoWithdrawal, 18),
    'stETH'
  )
  const lidoWithdrawal = await ethers.getContractAt(
    'IWithdrawalQueueERC721',
    '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1'
  )
  const nftBalance = await lidoWithdrawal.balanceOf('0x0a24f077377F2d555D6Dcc7cAEF68b3568fbac1D')
  console.log('NFT(ac1d):', nftBalance.toString())
}

async function fastForward(seconds: number) {
  console.log(`⏭️  Advancing time by ${seconds}...`)
  await ethers.provider.send('evm_increaseTime', [seconds])
  await ethers.provider.send('evm_mine', [])
  const blockAfter = await ethers.provider.getBlock('latest')
  console.log('New timestamp: ', blockAfter.timestamp)
}

async function main() {
  await printBalancesBefore()

  // increase time by 24 hours
  await fastForward(60 * 60 * 24)

  // execute and mint
  console.log(`Migrating and minting...`)
  try {
    const lido2life = await ethers.getContractAt('Lido2Life', LIDO2LIFE_ADDRESS)
    await lido2life.mint({
      gasLimit: 10000000
    })
    console.log('Minted!')
  } catch (e) {
    console.log(`Error minting`, e)
  }

  await printBalancesAfter()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
