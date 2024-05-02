// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract CheckInRegistry {
  event CheckInSubmitted(address indexed user, uint256 indexed taskId, uint256 timestamp);
  mapping(address => mapping(uint256 => uint256)) public lastCheckIn;
  function submitCheckIn(uint256 taskId) external {
    uint256 day = block.timestamp / 1 days;
    require(lastCheckIn[msg.sender][taskId] < day, 'Already checked in today');
    lastCheckIn[msg.sender][taskId] = day;
    emit CheckInSubmitted(msg.sender, taskId, block.timestamp);
  }
}
