import { constants } from '../src/utils/Constants'
import { RecordList } from '../src/utils/RecordList'
import { ethers } from 'hardhat'

export default async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  const { deployer, first, second, third } = await getNamedAccounts()
  const dividends = first
  const safeVault = second
  const executiveTeamBudget = third

  const aBDKMathContract = await deployments.get('ABDKMathQuad')
  const aBDKMath = await ethers.getContractAt('ABDKMathQuad', aBDKMathContract.address)

  const timestampContract = await deployments.get('Timestamp')
  const timestamp = await ethers.getContractAt('Timestamp', timestampContract.address)

  // const uChildERC20ProxyContract = await deployments.get('UChildERC20_Proxy')
  const SafeERC20 = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol:SafeERC20')
  // const safeERC20 = SafeERC20.attach(uChildERC20ProxyContract.address)
  const safeERC20 = SafeERC20.attach('0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6')

  const rewardCalculatorContract = await deployments.get('RewardCalculator')
  const rewardCalculator = await ethers.getContractAt('RewardCalculator', rewardCalculatorContract.address)

  const interestRate = await aBDKMath.div(
    await aBDKMath.fromInt(constants.INTEREST.NUMERATOR),
    await aBDKMath.fromInt(constants.INTEREST.DENOMINATOR)
  )
  const multiplier = await aBDKMath.fromInt(constants.MULTIPLIER)
  const recordList = new RecordList([dividends, executiveTeamBudget, safeVault], [225, 25, 9750])

  await deploy('FucDao', {
    from: deployer,
    args: [
      timestamp.address,
      safeERC20.address,
      rewardCalculator.address,
      constants.TOKEN.NAME,
      constants.TOKEN.SYMBOL,
      interestRate,
      multiplier,
      constants.LOCK_TIME,
      recordList.addresses(),
      recordList.sharesList()
    ],
    log: true
  })
}
export const tags = ['FucDao']
module.exports.dependencies = ['ABDKMathQuad', 'Timestamp', 'RewardCalculator'] // this ensures the ABDKMathQuad script above is executed shield, so `deployments.get('ABDKMathQuad')` succeeds
