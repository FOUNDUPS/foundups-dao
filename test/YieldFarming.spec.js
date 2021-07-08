import { waffleChai } from '@ethereum-waffle/chai'
import { use, expect } from 'chai'
import { waffle, ethers } from 'hardhat'
// eslint-disable-next-line no-unused-vars
import { BN } from '@openzeppelin/test-helpers'
import { mockedDeploy, MULTIPLIER } from '../scripts/mainDeploy'
import ABDKMathQuad from '../artifacts/contracts/abdk-libraries-solidity/ABDKMathQuad.sol/ABDKMathQuad.json'
import FucDao from '../artifacts/contracts/FucDao.sol/FucDao.json'
import Timestamp from '../artifacts/contracts/Timestamp.sol/Timestamp.json'
import ERC20Mock from '../artifacts/contracts/ERC20Mock.sol/ERC20Mock.json'
import { RecordList } from '../src/utils/RecordList'
use(waffleChai)

describe('FucDao contract', () => {
  describe('Payment splitter', async () => {
    let first, second, third, acceptedToken, rewardCalculator, payees, interestRate, multiplier, constants, timestamp
    beforeEach(async () => {
      const LOCK_TIME = 1
      const MULTIPLIER = 1E12
      const INITIAL_BALANCE = 1000
      const INTEREST_NUMERATOR = 25
      const INTEREST_DENOMINATOR = 10000
      const INTEREST = { NUMERATOR: INTEREST_NUMERATOR, DENOMINATOR: INTEREST_DENOMINATOR }
      const TOKEN_NAME = 'A Token name'
      const TOKEN_SYMBOL = 'A Token symbol'
      const TOKEN = { NAME: TOKEN_NAME, SYMBOL: TOKEN_SYMBOL }
      constants = { TOKEN, INTEREST, LOCK_TIME, MULTIPLIER, INITIAL_BALANCE }
      const [a, b, c] = await ethers.getSigners()
      first = a
      second = b
      third = c
      const aBDKMath = await waffle.deployContract(first, ABDKMathQuad)
      const RewardCalculator = await ethers.getContractFactory(
        'RewardCalculator',
        {
          libraries: {
            ABDKMathQuad: aBDKMath.address
          }
        }
      )
      rewardCalculator = await RewardCalculator.deploy()
      interestRate = await aBDKMath.div(
        await aBDKMath.fromInt(constants.INTEREST.NUMERATOR),
        await aBDKMath.fromInt(constants.INTEREST.DENOMINATOR)
      )
      multiplier = await aBDKMath.fromInt(constants.MULTIPLIER)
      payees = new RecordList([first.address, second.address, third.address], [100, 100, 100])
      timestamp = await waffle.deployContract(first, Timestamp)
      acceptedToken = await waffle.deployContract(first, ERC20Mock, [
        'ERC20Mock name',
        'ERC20Mock symbol',
        first.address,
        constants.INITIAL_BALANCE])
    })
    it('Shares 0', async () => {
      payees.records[1].shares = 0
      await expect(waffle.deployContract(first, FucDao, [
        timestamp.address,
        acceptedToken.address,
        rewardCalculator.address,
        constants.TOKEN.NAME,
        constants.TOKEN.SYMBOL,
        interestRate,
        multiplier,
        constants.LOCK_TIME,
        payees.addresses(),
        payees.sharesList()
      ]))
        .to.be.revertedWith('PaymentSplitter: shares are 0')
    })
    it('Account is the zero address', async () => {
      payees.records[1].address = ethers.constants.AddressZero
      await expect(waffle.deployContract(first, FucDao, [
        timestamp.address,
        acceptedToken.address,
        rewardCalculator.address,
        constants.TOKEN.NAME,
        constants.TOKEN.SYMBOL,
        interestRate,
        multiplier,
        constants.LOCK_TIME,
        payees.addresses(),
        payees.sharesList()
      ]))
        .to.be.revertedWith('PaymentSplitter: account is the zero address')
    })
    it('Account is already payee', async () => {
      payees.records[1].address = payees.records[0].address
      await expect(waffle.deployContract(first, FucDao, [
        timestamp.address,
        acceptedToken.address,
        rewardCalculator.address,
        constants.TOKEN.NAME,
        constants.TOKEN.SYMBOL,
        interestRate,
        multiplier,
        constants.LOCK_TIME,
        payees.addresses(),
        payees.sharesList()
      ]))
        .to.be.revertedWith('PaymentSplitter: account is already payee')
    })
    it('Different payee address\' length to payee shares\' length', async () => {
      const payeeAddresses = payees.addresses()
      payeeAddresses.pop() // remove last element
      await expect(waffle.deployContract(first, FucDao, [
        timestamp.address,
        acceptedToken.address,
        rewardCalculator.address,
        constants.TOKEN.NAME,
        constants.TOKEN.SYMBOL,
        interestRate,
        multiplier,
        constants.LOCK_TIME,
        payeeAddresses,
        payees.sharesList()
      ]))
        .to.be.revertedWith('PaymentSplitter: payees and shares length mismatch')
    })
    it('No payees', async () => {
      const payeeAddresses = payees.addresses()
      payeeAddresses.pop() // remove last element
      await expect(waffle.deployContract(first, FucDao, [
        timestamp.address,
        acceptedToken.address,
        rewardCalculator.address,
        constants.TOKEN.NAME,
        constants.TOKEN.SYMBOL,
        interestRate,
        multiplier,
        constants.LOCK_TIME,
        [],
        []
      ]))
        .to.be.revertedWith('PaymentSplitter: no payees')
    })
  })
  describe('With multiplier 1E12', async () => {
    let deploy
    beforeEach(async () => {
      deploy = await mockedDeploy(MULTIPLIER)
    })
    describe('Shares transfer', async () => {
      let transferrer, destinatary, amountToTransfer, transferrerInititalShares, destinataryInititalShares
      beforeEach(async () => {
        transferrer = deploy.second
        destinatary = deploy.third
        amountToTransfer = 1
        transferrerInititalShares = deploy.constants.SHARES.SECOND
        destinataryInititalShares = deploy.constants.SHARES.THIRD
      })
      it('Emit SharesTransferred', async () => {
        await expect(deploy.fucDao.connect(transferrer).transferShares(destinatary.address, amountToTransfer))
          .to.emit(deploy.fucDao, 'SharesTransferred')
          .withArgs(transferrer.address, destinatary.address, amountToTransfer)
      })
      it('Revert when transferrer is not a payee', async () => {
        await expect(deploy.fucDao.connect(deploy.fourth).transferShares(destinatary.address, amountToTransfer))
          .to.be.revertedWith('PaymentSplitter: transferrer not a payee')
      })
      it('Revert when trying to transfer more than balance', async () => {
        await expect(deploy.fucDao.connect(transferrer).transferShares(destinatary.address, deploy.constants.SHARES.SECOND + 1))
          .to.be.revertedWith('PaymentSplitter: not enough shares balance')
      })
      it('Revert when trying to transfer more than balance', async () => {
        await expect(deploy.fucDao.connect(transferrer).transferShares(destinatary.address, deploy.constants.SHARES.SECOND + 1))
          .to.be.revertedWith('PaymentSplitter: not enough shares balance')
      })
      describe('If destinatary is non payee', async () => {
        beforeEach(async () => {
          destinatary = deploy.fourth
        })
        it('Emit SharesTransferred', async () => {
          await expect(deploy.fucDao.connect(transferrer).transferShares(destinatary.address, amountToTransfer))
            .to.emit(deploy.fucDao, 'SharesTransferred')
            .withArgs(transferrer.address, destinatary.address, amountToTransfer)
        })
        it('Emit PayeeAdded', async () => {
          await expect(deploy.fucDao.connect(transferrer).transferShares(destinatary.address, amountToTransfer))
            .to.emit(deploy.fucDao, 'PayeeAdded')
            .withArgs(destinatary.address, amountToTransfer)
        })
      })
      describe('After transfer', async () => {
        beforeEach(async () => {
          await deploy.fucDao.connect(transferrer).transferShares(destinatary.address, amountToTransfer)
        })
        it('Deduct from transferrer', async () => {
          expect(await deploy.fucDao.shares(transferrer.address))
            .to.be.equal(transferrerInititalShares - amountToTransfer)
        })
        it('Credit to destinatary address', async () => {
          expect(await deploy.fucDao.shares(destinatary.address))
            .to.be.equal(destinataryInititalShares + amountToTransfer)
        })
      })
    })
    it('Ownership transfer', async () => {
      const firstOwner = await deploy.fucDao.owner()
      expect(firstOwner).to.equal(deploy.first.address)
      await expect(deploy.fucDao.transferOwnership(deploy.second.address))
        .to.emit(deploy.fucDao, 'OwnershipTransferred')
        .withArgs(deploy.first.address, deploy.second.address)
      const secondOwner = await deploy.fucDao.owner()
      expect(secondOwner).to.equal(deploy.second.address)
    })
    describe('Deposit', async () => {
      let depositValue
      beforeEach(async () => {
        depositValue = deploy.constants.INITIAL_BALANCE
        await deploy.acceptedToken.increaseAllowance(deploy.fucDao.address, depositValue)
      })
      it.skip('TokenTimeLock: release time is before current time', async () => {
        await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.DEPLOY - 1)
        // FIXME
        try {
          await expect(deploy.fucDao.deposit(depositValue))
            .to.be.revertedWith('TokenTimeLock: release time is before current time')
        } catch (error) {
          // AssertionError: Expected transaction to be reverted with TokenTimeLock: release time is before current time,
          // but other exception was thrown: Error: Transaction reverted and Hardhat couldn't infer the reason.
          // Please report this to help us improve Hardhat.
          console.log(error)
        }
      })
      it('Emit AcceptedTokenDeposit', async () => {
        await expect(deploy.fucDao.deposit(depositValue))
          .to.emit(deploy.fucDao, 'AcceptedTokenDeposit')
          .withArgs(deploy.first.address, depositValue)
      })
    })
    describe('Release token', async () => {
      describe('without deposit', async () => {
        it('try release', async () => {
          await expect(deploy.fucDao.releaseTokens(0))
            .to.be.revertedWith('Index out of bounds!')
        })
        it('try get TokenTimeLock', async () => {
          await expect(deploy.fucDao.getMyTokenTimeLock(0))
            .to.be.revertedWith('Index out of bounds!')
        })
      })
      describe('with one deposit', async () => {
        beforeEach(async () => {
          const depositValue = deploy.constants.INITIAL_BALANCE
          await deploy.acceptedToken.increaseAllowance(deploy.fucDao.address, depositValue)
          await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.DEPOSIT)
          await deploy.fucDao.connect(deploy.first).deposit(depositValue)
        })
        it('before unlock', async () => {
          await expect(deploy.fucDao.releaseTokens(0))
            .to.be.revertedWith('TokenTimeLock: current time is before release time')
        })
        describe('after unlock', async () => {
          beforeEach(async () => {
            await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.UNLOCK)
          })
          it('Correctly get my token time locks', async () => {
            const tokenTimeLockAddresses = await deploy.fucDao.getMyTokenTimeLocks()
            await Promise.all(tokenTimeLockAddresses.map(async tokenTimeLockAddress => {
              const tokenTimeLock = await ethers.getContractAt('TokenTimeLock', tokenTimeLockAddress)
              expect(await tokenTimeLock.beneficiary())
                .to.be.equal(deploy.first.address)
            }))
          })
          it('revert when trying to directly release', async () => {
            const tokenTimeLockAddresses = await deploy.fucDao.getMyTokenTimeLocks()
            await Promise.all(tokenTimeLockAddresses.map(async tokenTimeLockAddress => {
              const tokenTimeLock = await ethers.getContractAt('TokenTimeLock', tokenTimeLockAddress)
              await expect(tokenTimeLock.release())
                .to.be.revertedWith('Ownable: caller is not the owner')
            }))
          })
          it('Emit FucDaoTokenRelease', async () => {
            const releaseValue = 997506234413965
            await expect(deploy.fucDao.releaseTokens(0))
              .to.emit(deploy.fucDao, 'FucDaoTokenRelease')
              .withArgs(deploy.first.address, releaseValue)
          })
          describe('After release', async () => {
            beforeEach(async () => {
              await deploy.fucDao.releaseTokens(0)
            })
            describe('Burn tokens', async () => {
              let burnValue
              beforeEach(async () => {
                burnValue = 1
                await deploy.fucToken.increaseAllowance(deploy.fucDao.address, burnValue)
              })
              it('Emit FucDaoTokenBurn', async () => {
                await expect(deploy.fucDao.burn(burnValue))
                  .to.emit(deploy.fucDao, 'FucDaoTokenBurn')
                  .withArgs(deploy.first.address, burnValue)
              })
            })
            describe('Payment splitter A', async () => {
              it('Reads payees correctly', async () => {
                expect(await deploy.fucDao.payee(0))
                  .to.be.equal(deploy.first.address)
                expect(await deploy.fucDao.payee(1))
                  .to.be.equal(deploy.second.address)
                expect(await deploy.fucDao.payee(2))
                  .to.be.equal(deploy.third.address)
              })
              it('Revert when account is not a payee', async () => {
                await expect(deploy.fucDao.release(deploy.fourth.address))
                  .to.be.revertedWith('PaymentSplitter: account is not a payee')
              })
              describe('Update payee', async () => {
                it('Revert when account is not a payee', async () => {
                  await expect(deploy.fucDao.updatePayee(deploy.fourth.address, 0))
                    .to.be.revertedWith('PaymentSplitter: not a payee')
                })
                it('Revert when account already has that many shares', async () => {
                  await expect(deploy.fucDao.updatePayee(deploy.third.address, deploy.constants.SHARES.THIRD))
                    .to.be.revertedWith('PaymentSplitter: account already has that many shares')
                })
                it('Revert when trying to update payee not being an owner', async () => {
                  const delta = 5
                  await expect(deploy.fucDao.connect(deploy.second).updatePayee(deploy.first.address, deploy.constants.SHARES.THIRD + delta))
                    .to.be.revertedWith('Ownable: caller is not the owner')
                })
                describe('Changing amount of shares', async () => {
                  it('Emit PayeeUpdated when increasing shares', async () => {
                    const delta = 10
                    const newShares = deploy.constants.SHARES.THIRD + delta
                    await expect(deploy.fucDao.updatePayee(deploy.third.address, newShares))
                      .to.emit(deploy.fucDao, 'PayeeUpdated')
                      .withArgs(deploy.third.address, delta)
                    expect(await deploy.fucDao.shares(deploy.third.address))
                      .to.be.equal(newShares)
                  })
                  it('Emit PayeeUpdated when decreasing shares', async () => {
                    const delta = -10
                    const newShares = deploy.constants.SHARES.THIRD + delta
                    await expect(deploy.fucDao.updatePayee(deploy.third.address, newShares))
                      .to.emit(deploy.fucDao, 'PayeeUpdated')
                      .withArgs(deploy.third.address, delta)
                    expect(await deploy.fucDao.shares(deploy.third.address))
                      .to.be.equal(newShares)
                  })
                })
                it('When removing shares with updatePayee', async () => {
                  const newShares = 0
                  await expect(deploy.fucDao.updatePayee(deploy.third.address, newShares))
                    .to.emit(deploy.fucDao, 'PayeeRemoved')
                    .withArgs(deploy.third.address)
                })
              })
              describe('Remove payee', async () => {
                it('When removing shares with removePayee', async () => {
                  await expect(deploy.fucDao.removePayee(deploy.third.address))
                    .to.emit(deploy.fucDao, 'PayeeRemoved')
                    .withArgs(deploy.third.address)
                })
                it('When trying to remove shares with removePayee not being an owner', async () => {
                  await expect(deploy.fucDao.connect(deploy.second).removePayee(deploy.third.address))
                    .to.be.revertedWith('Ownable: caller is not the owner')
                })
                it('When trying to remove non payee', async () => {
                  await expect(deploy.fucDao.removePayee(deploy.fourth.address))
                    .to.be.revertedWith('PaymentSplitter: account not found')
                })
                it('When trying to empty payee list', async () => {
                  await deploy.fucDao.removePayee(deploy.third.address)
                  await deploy.fucDao.removePayee(deploy.second.address)
                  await deploy.fucDao.removePayee(deploy.first.address)
                  await expect(deploy.fucDao.removePayee(ethers.constants.AddressZero))
                    .to.revertedWith('PaymentSplitter: empty payee list')
                })
              })
            })
            describe('Payment splitter', async () => {
              let expectedPayment, expectedTotalShares
              beforeEach(async () => {
                expectedTotalShares = deploy.payees.totalShares()
                expectedPayment = Math.trunc(
                  deploy.constants.INITIAL_BALANCE * deploy.payees.records[0].shares /
                  expectedTotalShares
                )
              })
              describe('Release payment', async () => {
                describe('When already released', async () => {
                  beforeEach(async () => {
                    await deploy.fucDao.release(deploy.second.address)
                  })
                  it('Reverts when account is not due payment', async () => {
                    await expect(deploy.fucDao.release(deploy.second.address))
                      .to.be.revertedWith('PaymentSplitter: account is not due payment')
                  })
                })
                it('Emit PaymentReleased', async () => {
                  await expect(deploy.fucDao.release(deploy.first.address))
                    .to.emit(deploy.fucDao, 'PaymentReleased')
                    .withArgs(deploy.first.address, expectedPayment)
                })
                describe('After payment release', async () => {
                  beforeEach(async () => {
                    await deploy.fucDao.release(deploy.first.address)
                  })
                  it('Correctly calculates total released', async () => {
                    expect(await deploy.fucDao.totalReleased())
                      .to.be.equal(expectedPayment)
                  })
                })
              })
              it('Correctly calculates total shares', async () => {
                expect(await deploy.fucDao.totalShares())
                  .to.be.equal(expectedTotalShares)
              })
            })
          })
        })
      })
      describe('with two deposits', async () => {
        beforeEach(async () => {
          const totalDeposit = deploy.constants.INITIAL_BALANCE
          const firstDeposit = Math.round(totalDeposit / 3)
          const secondDeposit = totalDeposit - firstDeposit
          await deploy.acceptedToken.increaseAllowance(deploy.fucDao.address, totalDeposit)
          await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.DEPOSIT)
          await deploy.fucDao.connect(deploy.first).deposit(firstDeposit)
          await deploy.fucDao.connect(deploy.first).deposit(secondDeposit)
        })
        // it('before unlock', async () => {
        //   await expect(deploy.fucDao.releaseTokens(0))
        //     .to.be.revertedWith('TokenTimeLock: current time is before release time')
        // })
        describe('after unlock', async () => {
          beforeEach(async () => {
            await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.UNLOCK)
          })
          it('Correctly get my token time locks', async () => {
            const tokenTimeLockAddresses = await deploy.fucDao.getMyTokenTimeLocks()
            await Promise.all(tokenTimeLockAddresses.map(async tokenTimeLockAddress => {
              const tokenTimeLock = await ethers.getContractAt('TokenTimeLock', tokenTimeLockAddress)
              expect(await tokenTimeLock.beneficiary())
                .to.be.equal(deploy.first.address)
            }))
          })
          describe('Should be able to release from each token time lock independently', async () => {
            it('Emit FucDaoTokenRelease at index 0', async () => {
              const releaseValue = 332169576059850
              await expect(deploy.fucDao.releaseTokens(0))
                .to.emit(deploy.fucDao, 'FucDaoTokenRelease')
                .withArgs(deploy.first.address, releaseValue)
            })
            it('Emit FucDaoTokenRelease at index 1', async () => {
              const releaseValue = 665336658354115
              await expect(deploy.fucDao.releaseTokens(1))
                .to.emit(deploy.fucDao, 'FucDaoTokenRelease')
                .withArgs(deploy.first.address, releaseValue)
            })
          })
        })
      })
    })
  })
  describe('With multiplier 0', async () => {
    let deploy
    beforeEach(async () => {
      deploy = await mockedDeploy(0)
    })
    describe('Release token', async () => {
      describe('with deposit', async () => {
        beforeEach(async () => {
          const depositValue = deploy.constants.INITIAL_BALANCE
          await deploy.acceptedToken.increaseAllowance(deploy.fucDao.address, depositValue)
          await deploy.fucDao.deposit(depositValue, { from: deploy.first.address })
        })
        describe('after unlock', async () => {
          beforeEach(async () => {
            await deploy.timestamp.mock.getTimestamp.returns(deploy.constants.TIMESTAMPS.DEPOSIT)
          })
          it('Revert with no tokens to release', async () => {
            await expect(deploy.fucDao.releaseTokens(0))
              .to.be.revertedWith('TokenTimeLock: no tokens to release')
          })
        })
      })
    })
  })
})
