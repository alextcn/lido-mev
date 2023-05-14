// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IWithdrawalQueueERC721 {
    function balanceOf(address _owner) external view returns (uint256);
    function requestWithdrawals(uint256[] calldata _amounts, address _owner) external returns (uint256[] memory requestIds);
}
