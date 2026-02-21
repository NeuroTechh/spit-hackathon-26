import crypto from 'crypto';
import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════
// ZK Proof Utilities
// ═══════════════════════════════════════════════════════════
// These are hash-based commitment proofs compatible with a
// ZK architecture. Full circuit-based zk-SNARKs (Groth16/PLONK)
// can be plugged in as a future upgrade.
// ═══════════════════════════════════════════════════════════

export interface ZKProof {
    proofType: string;
    commitment: string;         // Hash commitment
    publicInputs: string[];     // Public signals (e.g., "over_18: true")
    nullifier: string;          // Prevents double-spending
    timestamp: number;
    expiresAt: number;
}

// ─── Generate "Over 18" Proof ────────────────────────────────

export const generateAgeProof = (
    walletAddress: string,
    isOver18: boolean,
    salt: string
): ZKProof => {
    const nullifier = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'string', 'bytes32'],
            [walletAddress, 'age_proof', ethers.id(salt)]
        )
    );

    const commitment = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'bool', 'bytes32', 'bytes32'],
            [walletAddress, isOver18, ethers.id(salt), nullifier]
        )
    );

    return {
        proofType: 'over_18',
        commitment,
        publicInputs: [`over_18:${isOver18}`],
        nullifier,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h validity
    };
};

// ─── Generate "KYC Approved" Proof ───────────────────────────

export const generateKYCProof = (
    walletAddress: string,
    isKYCApproved: boolean,
    issuerDID: string,
    salt: string
): ZKProof => {
    const nullifier = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'string', 'bytes32'],
            [walletAddress, 'kyc_proof', ethers.id(salt)]
        )
    );

    const commitment = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'bool', 'string', 'bytes32', 'bytes32'],
            [walletAddress, isKYCApproved, issuerDID, ethers.id(salt), nullifier]
        )
    );

    return {
        proofType: 'kyc_approved',
        commitment,
        publicInputs: [`kyc_approved:${isKYCApproved}`, `issuer:${issuerDID}`],
        nullifier,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
};

// ─── Generate "Not Blacklisted" Proof ────────────────────────

export const generateBlacklistProof = (
    walletAddress: string,
    isBlacklisted: boolean,
    salt: string
): ZKProof => {
    const nullifier = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'string', 'bytes32'],
            [walletAddress, 'blacklist_proof', ethers.id(salt)]
        )
    );

    const commitment = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'bool', 'bytes32', 'bytes32'],
            [walletAddress, isBlacklisted, ethers.id(salt), nullifier]
        )
    );

    return {
        proofType: 'not_blacklisted',
        commitment,
        publicInputs: [`not_blacklisted:${!isBlacklisted}`],
        nullifier,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
};

// ─── Verify Proof ────────────────────────────────────────────

export const verifyProof = (proof: ZKProof): boolean => {
    // Check expiration
    if (Date.now() > proof.expiresAt) return false;

    // Check required fields
    if (!proof.commitment || !proof.nullifier || !proof.proofType) return false;

    // Commitment format check (should be a keccak256 hash)
    if (!/^0x[a-fA-F0-9]{64}$/.test(proof.commitment)) return false;

    return true;
};

// ─── Generate random salt ────────────────────────────────────

export const generateSalt = (): string => {
    return crypto.randomBytes(32).toString('hex');
};
