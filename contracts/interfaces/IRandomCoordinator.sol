// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IRandomCoordinator {
  function randomnessRequest(address _sender, address _requester) external returns (bytes32 requestId);
}