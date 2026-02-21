// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationRegistry — On-chain reputation score hash storage
/// @notice Stores only the hash of the reputation score, never the score itself.
///         The actual score computation happens off-chain for privacy.
contract ReputationRegistry is Ownable {

    struct ScoreRecord {
        bytes32 scoreHash;          // keccak256(wallet, score, salt)
        uint256 updatedAt;
        address updatedBy;
        uint256 updateCount;
        bool exists;
    }

    // wallet => ScoreRecord
    mapping(address => ScoreRecord) public scores;

    // approved updaters (backend services, oracles)
    mapping(address => bool) public approvedUpdaters;

    // ─── Events ──────────────────────────────────────────────

    event ScoreUpdated(
        address indexed user,
        bytes32 indexed scoreHash,
        address indexed updatedBy,
        uint256 updateCount
    );

    event UpdaterApproved(address indexed updater);
    event UpdaterRemoved(address indexed updater);

    // ─── Modifiers ───────────────────────────────────────────

    modifier onlyUpdater() {
        require(approvedUpdaters[msg.sender], "Not an approved updater");
        _;
    }

    constructor() Ownable(msg.sender) {
        approvedUpdaters[msg.sender] = true;
    }

    // ─── Updater Management ──────────────────────────────────

    function approveUpdater(address updater) external onlyOwner {
        approvedUpdaters[updater] = true;
        emit UpdaterApproved(updater);
    }

    function removeUpdater(address updater) external onlyOwner {
        approvedUpdaters[updater] = false;
        emit UpdaterRemoved(updater);
    }

    // ─── Score Operations ────────────────────────────────────

    /// @notice Update the reputation score hash for a user
    /// @param user The wallet address to update the score for
    /// @param scoreHash keccak256(user, totalScore, timestamp, salt)
    function updateScore(address user, bytes32 scoreHash) external onlyUpdater {
        require(user != address(0), "Invalid user address");
        require(scoreHash != bytes32(0), "Invalid score hash");

        ScoreRecord storage record = scores[user];
        record.scoreHash = scoreHash;
        record.updatedAt = block.timestamp;
        record.updatedBy = msg.sender;
        record.updateCount++;
        record.exists = true;

        emit ScoreUpdated(user, scoreHash, msg.sender, record.updateCount);
    }

    /// @notice Get the current score hash for a user
    function getScoreHash(address user) external view returns (bytes32) {
        return scores[user].scoreHash;
    }

    /// @notice Get the full score record for a user
    function getScoreRecord(address user) external view returns (ScoreRecord memory) {
        return scores[user];
    }

    /// @notice Verify a score hash matches the on-chain record
    function verifyScoreHash(address user, bytes32 scoreHash) external view returns (bool) {
        ScoreRecord memory record = scores[user];
        return record.exists && record.scoreHash == scoreHash;
    }

    /// @notice Check if a user has a reputation record
    function hasReputation(address user) external view returns (bool) {
        return scores[user].exists;
    }
}
