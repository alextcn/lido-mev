import { ethers } from 'ethers'

async function main() {
  const contract = new ethers.Contract('0x35378D76b05c21E2Bd4d0fc5831C581E7ba80Eea', [
    'function mint() external'
  ])
  const txRequest = await contract.populateTransaction.mint()
  console.log(txRequest)
}

main()
