import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const config: HardhatUserConfig = {
  solidity: '0.8.18',

  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY!}`,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!]
    },
    hardhat: {},
    localhost: {
      timeout: 100000
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY!
  }
}

export default config
