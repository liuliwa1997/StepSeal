// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract TaskManager {
  struct Task { address owner; uint64 durationDays; bool active; }
  mapping(uint256 => Task) public tasks; uint256 public nextTaskId;
  event TaskCreated(uint256 indexed taskId, address indexed owner, uint64 durationDays);
  function createTask(uint64 durationDays) external returns (uint256) {
    require(durationDays > 0, 'duration');
    uint256 id = ++nextTaskId; tasks[id] = Task(msg.sender, durationDays, true);
    emit TaskCreated(id, msg.sender, durationDays); return id;
  }
}
