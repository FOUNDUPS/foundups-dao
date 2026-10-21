# Foundups DAO smart contracts
[![CI](https://github.com/FOUNDUPS/foundups-dao/actions/workflows/CI.yaml/badge.svg)](https://github.com/FOUNDUPS/foundups-dao/actions/workflows/CI.yaml)
[![Coverage Status](https://coveralls.io/repos/github/FOUNDUPS/foundups-dao/badge.svg?branch=main)](https://coveralls.io/github/FOUNDUPS/foundups-dao?branch=main)
[![GitHub license](https://img.shields.io/github/license/FOUNDUPS/foundups-dao)](https://github.com/FOUNDUPS/foundups-dao)

## 🚧 Development

### 🐑 Repository cloning
```terminal
git clone https://github.com/FOUNDUPS/foundups-dao
git submodule init
git submodule update
```

👨‍💻 Happy coding!

### 👕 Linting

```terminal
yarn solhint
yarn lint
```

### ✅ Testing

```terminal
yarn test
```

Ordinary tests use the in-process Hardhat network. Gas reporting is disabled
unless `ENABLE_GAS_REPORT=1` is explicitly set (`yarn gas-report` sets it).
The gas reporter may request currency prices from an external service.

Public-network signing requires an explicitly supplied `MNEMONIC` or the complete
`PKD`, `PK1`, `PK2`, `PK3`, `PK4` set. With no credentials, public networks have
an empty signer list; they never use a development mnemonic or RPC-provided
accounts. Partial key sets reject configuration without printing their values.
Local Hardhat test accounts are unchanged. Do not use a development wallet for
real funds.

#### ✔️ With code coverage

```terminal
yarn coveralls
```

## 🤝🏿 Acknowledgements
This product includes software developed by ABDK Consulting
