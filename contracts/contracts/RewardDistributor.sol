// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface ICheckInRegistry { function lastCheckIn(address, uint256) external view returns (uint256); }
contract RewardDistributor {
  ICheckInRegistry public registry; constructor(address r) { registry = ICheckInRegistry(r); }
}
