require('hardhat-deploy')

require('@nomiclabs/hardhat-solhint')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('solidity-coverage')

const fs = require('fs')
const path = require('path')
const externalNetworkAccounts = require('./hardhat/network-accounts')

for (const f of fs.readdirSync(path.join(__dirname, 'hardhat'))) {
  require(path.join(__dirname, 'hardhat', f))
}

const enableGasReport = process.env.ENABLE_GAS_REPORT === '1'
const enableProduction = process.env.COMPILE_MODE === 'production'

// The reporter can request remote currency prices. Ordinary tests stay local;
// loading it requires the explicit gas-report opt-in.
if (enableGasReport) require('hardhat-gas-reporter')

const { INFURA_KEY, TENDERLY_USERNAME, TENDERLY_PROJECT } = process.env
const sharedNetworkConfig = {
  accounts: externalNetworkAccounts(process.env)
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  paths: {
    sources: 'contracts',
    artifacts: 'artifacts'
  },
  solidity: {
    compilers: [
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: false,
            runs: 200
          }
        }
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: enableGasReport || enableProduction,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    ganache: {
      url: 'http://localhost:8545'
    },
    hardhat: {
      blockGasLimit: 10000000
    },
    mumbai: {
      ...sharedNetworkConfig,
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`
    },
    polygon: {
      chainId: 137,
      ...sharedNetworkConfig,
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`
    }
  },
  namedAccounts: {
    deployer: 0,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4
  },
  gasReporter: {
    enabled: enableGasReport,
    currency: 'USD',
    outputFile: process.env.CI ? 'gas-report.txt' : undefined
  },
  tenderly: {
    username: TENDERLY_USERNAME,
    project: TENDERLY_PROJECT
  }
}
