// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IWithdrawalQueueERC721.sol";
import "./interfaces/ILidoVoting.sol";
import "./interfaces/IStETH.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

// Lido NFT contract: 0xE42C659Dc09109566720EA8b2De186c2Be7D94D9
// NFT receiver address: 0x0a24f077377F2d555D6Dcc7cAEF68b3568fbac1D
// active timestamp: 1684163759 = 1683904559 (vote 156 start date) + 259200 (voteTime)

contract Lido2Life {
    // using constants for simplicity
    uint256 public constant VOTE_ID = 156;
    uint256 public constant VOTE_TIME = 1684163759;
    uint256 public constant STETH_VALUE = 0.024 ether;
    address public constant NFT_OWNER = 0x0a24f077377F2d555D6Dcc7cAEF68b3568fbac1D;

    address public constant STETH_ADDRESS = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public constant LIDO_VOTING_ADDRESS = 0x2e59A20f205bB85a89C53f1936454680651E618e; // proxy contract
    // TODO: which contract to use? https://github.com/lidofinance/lido-dao/blob/2a3a53efc14a336dfdff445fbc89018e5b3f2f65/deployed-mainnet.json#L416
    address public constant LIDO_WITHDRAWAL_ADDRESS = 0xE42C659Dc09109566720EA8b2De186c2Be7D94D9; // implementation contract

    IStETH public immutable STETH;
    ILidoVoting public lidoVoting;
    IWithdrawalQueueERC721 public lidoWithdrawal;

    constructor() {
        lidoVoting = ILidoVoting(LIDO_VOTING_ADDRESS);
        lidoWithdrawal = IWithdrawalQueueERC721(LIDO_WITHDRAWAL_ADDRESS);
        STETH = IStETH(STETH_ADDRESS);
        STETH.approve(LIDO_WITHDRAWAL_ADDRESS, 124 ether);
    }

    // TODO: remove test methods

    function testExecuteVote() external {
        lidoVoting.executeVote(VOTE_ID);
    }

    function testCanExecuteVote() external view returns (bool) {
        return lidoVoting.canExecute(VOTE_ID);
    }

    // Can be called by anyone as stETH is only sent from this contract
    // and NFT is only sent to NFT_OWNER.
    // stETH must be sent to this contract before calling this method.
    function go() external {
        
        // TODO: i need this method to run successfuly when:
        // 1. vote time is due and vote is not yet executed (executeVote and requestWithdrawals)
        // 2. vote time is due and vote is executed (only requestWithdrawals)
        
        // TODO: what it must do if vote is still open? for some reason sent early

        (bool open, bool executed,,,,,,,) = lidoVoting.getVote(VOTE_ID);

        if (open) revert("Vote is still open");

        if (!executed && lidoVoting.canExecute(VOTE_ID)) {
            lidoVoting.executeVote(VOTE_ID);
        }

        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = STETH_VALUE;
        lidoWithdrawal.requestWithdrawals(_amounts, NFT_OWNER);
    }
}
