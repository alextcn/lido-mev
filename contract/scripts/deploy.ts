import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying contract by ${deployer.address}...`)

  const Lido2Life = await ethers.getContractFactory('Lido2Life')
  const lido2life = await Lido2Life.deploy()
  console.log(`Contract deployed to ${lido2life.address}!`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
