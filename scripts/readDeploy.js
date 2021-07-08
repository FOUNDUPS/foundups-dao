import { parse } from 'flatted'
const fs = require('fs')

const main = async () => {
  const readDeployString = fs.readFileSync('deploy.json')
  const readDeploy = parse(readDeployString)
  console.log(readDeploy)
  // expect(deploy.acceptedToken.address)
  //   .to.be.equal(readDeploy.acceptedToken.address)
  // expect(deploy.first.address)
  //   .to.be.equal(readDeploy.first.address)
  // expect(deploy.second.address)
  //   .to.be.equal(readDeploy.second.address)
  // expect(deploy.third.address)
  //   .to.be.equal(readDeploy.third.address)
  // expect(deploy.fucDao.address)
  //   .to.be.equal(readDeploy.fucDao.address)
  // expect(deploy.fucToken.address)
  //   .to.be.equal(readDeploy.fucToken.address)
  // expect(deploy.timestamp.address)
  //   .to.be.equal(readDeploy.timestamp.address)
  // expect(deploy.payees)
  //   .to.be.deep.equal(readDeploy.payees)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
