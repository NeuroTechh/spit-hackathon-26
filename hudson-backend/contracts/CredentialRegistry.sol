// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CredentialRegistry — On-chain credential hash registry
/// @notice Stores credential hashes with issuer management. Never stores raw PII.
contract CredentialRegistry is Ownable {

    struct CredentialRecord {
        bytes32 credentialHash;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        bool exists;
    }

    // credentialHash => CredentialRecord
    mapping(bytes32 => CredentialRecord) public credentials;

    // wallet => list of credential hashes
    mapping(address => bytes32[]) public userCredentials;

    // approved issuers
    mapping(address => bool) public approvedIssuers;

    // ─── Events ──────────────────────────────────────────────

    event CredentialRegistered(
        bytes32 indexed credentialHash,
        address indexed issuer,
        address indexed subject,
        uint256 expiresAt
    );

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed revokedBy
    );

    event IssuerApproved(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // ─── Modifiers ───────────────────────────────────────────

    modifier onlyIssuer() {
        require(approvedIssuers[msg.sender], "Not an approved issuer");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Owner is automatically an approved issuer
        approvedIssuers[msg.sender] = true;
    }

    // ─── Issuer Management ───────────────────────────────────

    function approveIssuer(address issuer) external onlyOwner {
        approvedIssuers[issuer] = true;
        emit IssuerApproved(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        approvedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // ─── Credential Operations ───────────────────────────────

    /// @notice Register a credential hash on-chain
    /// @param credentialHash The keccak256 hash of the credential
    /// @param subject The wallet address the credential belongs to
    /// @param validDays Number of days the credential is valid
    function registerCredential(
        bytes32 credentialHash,
        address subject,
        uint256 validDays
    ) external onlyIssuer {
        require(credentialHash != bytes32(0), "Invalid credential hash");
        require(subject != address(0), "Invalid subject address");
        require(validDays > 0, "Validity must be > 0");
        require(!credentials[credentialHash].exists, "Credential already registered");

        credentials[credentialHash] = CredentialRecord({
            credentialHash: credentialHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (validDays * 1 days),
            isRevoked: false,
            exists: true
        });

        userCredentials[subject].push(credentialHash);

        emit CredentialRegistered(credentialHash, msg.sender, subject, block.timestamp + (validDays * 1 days));
    }

    /// @notice Verify a credential hash is valid (registered, not revoked, not expired)
    function verifyCredential(bytes32 credentialHash) external view returns (bool) {
        CredentialRecord memory cred = credentials[credentialHash];
        return cred.exists
            && !cred.isRevoked
            && block.timestamp < cred.expiresAt;
    }

    /// @notice Revoke a credential (only issuer or owner)
    function revokeCredential(bytes32 credentialHash) external {
        CredentialRecord storage cred = credentials[credentialHash];
        require(cred.exists, "Credential does not exist");
        require(
            msg.sender == cred.issuer || msg.sender == owner(),
            "Not authorized to revoke"
        );
        require(!cred.isRevoked, "Already revoked");

        cred.isRevoked = true;
        emit CredentialRevoked(credentialHash, msg.sender);
    }

    /// @notice Get credential details
    function getCredential(bytes32 credentialHash) external view returns (CredentialRecord memory) {
        return credentials[credentialHash];
    }

    /// @notice Get all credential hashes for a user
    function getUserCredentials(address user) external view returns (bytes32[] memory) {
        return userCredentials[user];
    }

    /// @notice Check if a credential is expired
    function isExpired(bytes32 credentialHash) external view returns (bool) {
        return block.timestamp >= credentials[credentialHash].expiresAt;
    }

    /// @notice Check if a credential is revoked
    function isRevoked(bytes32 credentialHash) external view returns (bool) {
        return credentials[credentialHash].isRevoked;
    }
}
