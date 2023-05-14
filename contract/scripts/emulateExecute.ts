import { ethers } from 'hardhat'
import { impersonateAccount } from '@nomicfoundation/hardhat-network-helpers'

async function main() {
  const Lido2Life = await ethers.getContractFactory('Lido2Life')
  const lido2life = await Lido2Life.deploy()

  await lido2life.deployed()
  console.log(`Lido2Life has been deployed to: ${lido2life.address}`)

  const steth = await ethers.getContractAt('IStETH', '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84')
  const allowance = await steth.allowance(
    lido2life.address,
    '0xE42C659Dc09109566720EA8b2De186c2Be7D94D9'
  )
  console.log(`Lido allowance: ${allowance.toString()}`)

  // deposit some stETH
  console.log('Depositing stETH to Lido2Life...')
  await impersonateAccount('0x3e40d73eb977dc6a537af587d48316fee66e9c8c') // lido tresury
  const impersonatedSigner = await ethers.getSigner('0x3e40d73eb977dc6a537af587d48316fee66e9c8c')
  await (
    await steth
      .connect(impersonatedSigner)
      .transfer(lido2life.address, ethers.utils.parseEther('0.1'))
  ).wait()
  const balance = await steth.balanceOf(lido2life.address)
  console.log('stETH balace of Lido2Life:', ethers.utils.formatUnits(balance, 18), 'stETH')

  console.log('⏭️  Advancing time and block number...')
  await ethers.provider.send('evm_increaseTime', [60 * 60 * 24])
  await ethers.provider.send('evm_mine', []) // this one will have the timestamp you set
  const blockAfter = await ethers.provider.getBlock('latest')
  console.log('New timestamp: ', blockAfter.timestamp)

  console.log(`Executing vote...`)
  await (
    await lido2life.go({
      gasLimit: 10000000
    })
  ).wait()
  console.log('VOTED!')

  const balanceAfter = await steth.balanceOf(lido2life.address)
  console.log('stETH balance of Lido2Life after vote:', ethers.utils.formatUnits(balanceAfter, 18), 'stETH')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
