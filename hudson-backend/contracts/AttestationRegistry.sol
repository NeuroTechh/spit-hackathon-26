// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AttestationRegistry — On-chain attestation hash registry
/// @notice Stores attestation hashes with confidence/trust scores. Never stores raw PII.
contract AttestationRegistry is Ownable {

    struct Attestation {
        bytes32 attestationHash;
        address attestor;
        address subject;
        uint8 docType;           // 1=passport, 2=aadhaar, 3=drivers_license, 4=national_id
        uint8 confidenceScore;   // 0-100
        uint8 trustScore;        // 0-100
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        bool exists;
    }

    // attestationHash => Attestation
    mapping(bytes32 => Attestation) public attestations;

    // wallet => list of attestation hashes
    mapping(address => bytes32[]) public userAttestations;

    // approved attestors
    mapping(address => bool) public approvedAttestors;

    // ─── Events ──────────────────────────────────────────────

    event AttestationRegistered(
        bytes32 indexed attestationHash,
        address indexed attestor,
        address indexed subject,
        uint8 docType,
        uint8 confidenceScore,
        uint8 trustScore
    );

    event AttestationRevoked(
        bytes32 indexed attestationHash,
        address indexed revokedBy
    );

    event AttestorApproved(address indexed attestor);
    event AttestorRemoved(address indexed attestor);

    // ─── Modifiers ───────────────────────────────────────────

    modifier onlyAttestor() {
        require(approvedAttestors[msg.sender], "Not an approved attestor");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Owner is automatically an approved attestor
        approvedAttestors[msg.sender] = true;
    }

    // ─── Attestor Management ─────────────────────────────────

    function approveAttestor(address attestor) external onlyOwner {
        approvedAttestors[attestor] = true;
        emit AttestorApproved(attestor);
    }

    function removeAttestor(address attestor) external onlyOwner {
        approvedAttestors[attestor] = false;
        emit AttestorRemoved(attestor);
    }

    // ─── Attestation Operations ──────────────────────────────

    /// @notice Register an attestation hash on-chain
    /// @param attestationHash The keccak256 hash of the attestation data
    /// @param subject The wallet address the attestation belongs to
    /// @param docType Document type enum (1-4)
    /// @param confidenceScore LLM confidence score (0-100)
    /// @param trustScore Computed trust score (0-100)
    /// @param validDays Number of days the attestation is valid
    function registerAttestation(
        bytes32 attestationHash,
        address subject,
        uint8 docType,
        uint8 confidenceScore,
        uint8 trustScore,
        uint256 validDays
    ) external onlyAttestor {
        require(attestationHash != bytes32(0), "Invalid attestation hash");
        require(subject != address(0), "Invalid subject address");
        require(docType >= 1 && docType <= 4, "Invalid document type");
        require(confidenceScore <= 100, "Confidence score must be 0-100");
        require(trustScore <= 100, "Trust score must be 0-100");
        require(validDays > 0, "Validity must be > 0");
        require(!attestations[attestationHash].exists, "Attestation already registered");

        attestations[attestationHash] = Attestation({
            attestationHash: attestationHash,
            attestor: msg.sender,
            subject: subject,
            docType: docType,
            confidenceScore: confidenceScore,
            trustScore: trustScore,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (validDays * 1 days),
            isRevoked: false,
            exists: true
        });

        userAttestations[subject].push(attestationHash);

        emit AttestationRegistered(
            attestationHash,
            msg.sender,
            subject,
            docType,
            confidenceScore,
            trustScore
        );
    }

    /// @notice Verify an attestation is valid (registered, not revoked, not expired)
    function verifyAttestation(bytes32 attestationHash) external view returns (bool) {
        Attestation memory a = attestations[attestationHash];
        return a.exists && !a.isRevoked && block.timestamp < a.expiresAt;
    }

    /// @notice Revoke an attestation (only attestor or owner)
    function revokeAttestation(bytes32 attestationHash) external {
        Attestation storage a = attestations[attestationHash];
        require(a.exists, "Attestation does not exist");
        require(
            msg.sender == a.attestor || msg.sender == owner(),
            "Not authorized to revoke"
        );
        require(!a.isRevoked, "Already revoked");

        a.isRevoked = true;
        emit AttestationRevoked(attestationHash, msg.sender);
    }

    /// @notice Get attestation details
    function getAttestation(bytes32 attestationHash) external view returns (Attestation memory) {
        return attestations[attestationHash];
    }

    /// @notice Get all attestation hashes for a user
    function getUserAttestations(address user) external view returns (bytes32[] memory) {
        return userAttestations[user];
    }

    /// @notice Check if an attestation is expired
    function isExpired(bytes32 attestationHash) external view returns (bool) {
        return block.timestamp >= attestations[attestationHash].expiresAt;
    }

    /// @notice Check if an attestation is revoked
    function isRevoked(bytes32 attestationHash) external view returns (bool) {
        return attestations[attestationHash].isRevoked;
    }
}
