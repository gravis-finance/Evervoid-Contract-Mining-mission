//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IMiningV1 {
    function stakeOwner(uint256 stakeId) external view returns (address);
    function claim(uint256 stakeId) external;
}