import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    localhost: {
      timeout: 100000
    }
  }
}

export default config
