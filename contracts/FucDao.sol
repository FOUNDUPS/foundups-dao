// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./TokenTimeLock.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FucToken.sol";
import "./RewardCalculator.sol";
import "./PaymentSplitter.sol";
import "./Timestamp.sol";

contract FucDao is PaymentSplitter {
    using SafeERC20 for FucToken;
    using SafeERC20 for IERC20;

    event FucDaoTokenBurn(address burner, uint amount);
    event FucDaoTokenRelease(address releaser, uint amount);

    Timestamp private timestamp;
    RewardCalculator immutable private rewardCalculator;
    FucToken immutable public fucToken;
    IERC20 immutable private acceptedToken;
    bytes16 private interestRate;
    bytes16 private multiplier;
    uint private lockTime;
    uint private tokenomicsTimestamp;

    mapping(address => TokenTimeLock[]) private tokenTimeLocks;

    constructor(
        Timestamp _timestamp,
        IERC20 _acceptedToken,
        RewardCalculator _rewardCalculator,
        string memory _tokenName,
        string memory _tokenSymbol,
        bytes16 _interestRate,
        bytes16 _multiplier,
        uint _lockTime,
        address[] memory _payees,
        uint256[] memory _shares
    ) PaymentSplitter(_acceptedToken, _payees, _shares) {
        timestamp = _timestamp;
        updateTokenomics(_interestRate, _multiplier, _lockTime);
        fucToken = new FucToken(_tokenName, _tokenSymbol);
        rewardCalculator = _rewardCalculator;
        acceptedToken = _acceptedToken;
    }

    function updateTokenomics(bytes16 _newInterestRate, bytes16 _newMultiplier, uint _newLockTime) public onlyOwner{
        interestRate = _newInterestRate;
        multiplier = _newMultiplier;
        lockTime = _newLockTime;
        tokenomicsTimestamp = timestamp.getTimestamp();
    }

    function deposit(uint amount) public {
        address depositor = _msgSender();
        super.deposit(depositor, amount);
        uint timeStamp = timestamp.getTimestamp();
        TokenTimeLock tokenTimeLock = new TokenTimeLock(timestamp, fucToken, depositor, timeStamp + lockTime);
        tokenTimeLocks[depositor].push(tokenTimeLock);
        fucToken.mint(
            address(tokenTimeLock),
            rewardCalculator.calculateQuantity(amount, multiplier, interestRate, timeStamp - tokenomicsTimestamp)
        );
    }

    function burn(uint amount) public {
        address burner = _msgSender();
        // // Original implementation:
        // fucToken.safeTransferFrom(burner, address(this), amount);
        // fucToken.safeIncreaseAllowance(address(this), amount);
        // fucToken.burn(amount);
        
        // Optimized implementation:
        fucToken.burnFrom(burner, amount);
        
        emit FucDaoTokenBurn(burner, amount);
    }

    function getMyTokenTimeLock(uint tokenTimelockIndex) public view returns (TokenTimeLock) {
        address me = _msgSender();
        require(tokenTimelockIndex < tokenTimeLocks[me].length, "Index out of bounds!");
        return tokenTimeLocks[me][tokenTimelockIndex];
    }

    function getMyTokenTimeLocks() public view returns (TokenTimeLock[] memory) {
        return tokenTimeLocks[_msgSender()];
    }

    function releaseTokens(uint tokenTimelockIndex) public {
        address releaser = _msgSender();
        require(tokenTimelockIndex < tokenTimeLocks[releaser].length, "Index out of bounds!");
        TokenTimeLock tokenTimelock = takeTokenTimeLock(releaser, tokenTimelockIndex);
        uint amount = fucToken.balanceOf(address(tokenTimelock));
        tokenTimelock.release();
        emit FucDaoTokenRelease(releaser, amount);
    }

    function takeTokenTimeLock(address sender, uint tokenTimelockIndex) internal returns (TokenTimeLock) {
        TokenTimeLock element = tokenTimeLocks[sender][tokenTimelockIndex];
        uint lengthM1 = tokenTimeLocks[sender].length - 1;
        tokenTimeLocks[sender][tokenTimelockIndex] = tokenTimeLocks[sender][lengthM1];
        delete tokenTimeLocks[sender][lengthM1];
        tokenTimeLocks[sender].pop;
        return element;
    }
}