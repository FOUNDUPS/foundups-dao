module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const aBDKMath = await deployments.get('ABDKMathQuad')
  await deploy(
    'RewardCalculator',
    {
      from: deployer,
      args: [],
      log: true,
      libraries: {
        ABDKMathQuad: aBDKMath.address
      }
    }
  )
}
module.exports.tags = ['RewardCalculator']
module.exports.dependencies = ['ABDKMathQuad'] // this ensure the ABDKMathQuad script above is executed first, so `deployments.get('ABDKMathQuad')` succeeds
