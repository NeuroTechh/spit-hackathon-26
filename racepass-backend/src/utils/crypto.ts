import crypto from 'crypto';
import { ethers } from 'ethers';

// ─── Credential Hashing ──────────────────────────────────────

/// Creates a keccak256 hash of credential data for on-chain storage.
/// Never stores or logs the raw data.
export const hashCredential = (
    walletAddress: string,
    credentialType: string,
    issuerDID: string,
    timestamp: number
): string => {
    return ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'string', 'string', 'uint256'],
            [walletAddress, credentialType, issuerDID, timestamp]
        )
    );
};

/// Creates a reputation score hash for on-chain storage.
export const hashReputationScore = (
    walletAddress: string,
    totalScore: number,
    timestamp: number,
    salt: string
): string => {
    return ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'uint256', 'uint256', 'bytes32'],
            [walletAddress, totalScore, timestamp, ethers.id(salt)]
        )
    );
};

// ─── Signature Verification ──────────────────────────────────

/// Verifies an EIP-191 signed message from a wallet.
export const verifySignature = (
    message: string,
    signature: string,
    expectedAddress: string
): boolean => {
    try {
        const recovered = ethers.verifyMessage(message, signature);
        return recovered.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
        return false;
    }
};

// ─── Nonce Generation ────────────────────────────────────────

/// Generates a cryptographically secure nonce for login challenges.
export const generateNonce = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/// Creates the signing message for wallet authentication.
export const createSigningMessage = (
    walletAddress: string,
    nonce: string,
    timestamp: number
): string => {
    return [
        'RacePass Authentication',
        '',
        `Wallet: ${walletAddress}`,
        `Nonce: ${nonce}`,
        `Timestamp: ${timestamp}`,
        '',
        'Sign this message to prove ownership of your wallet.',
        'This signature will not trigger a blockchain transaction.',
    ].join('\n');
};

// ─── General Hashing ─────────────────────────────────────────

/// SHA-256 hash utility.
export const sha256 = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/// Generates a random hex string of specified byte length.
export const randomHex = (bytes: number = 32): string => {
    return crypto.randomBytes(bytes).toString('hex');
};

// ─── Verifiable Credential Generation ────────────────────────

export interface VerifiableCredential {
    '@context': string[];
    type: string[];
    issuer: string;
    issuanceDate: string;
    expirationDate: string;
    credentialSubject: {
        id: string;
        credentialHash: string;
        verificationType: string;
    };
    proof: {
        type: string;
        created: string;
        proofPurpose: string;
        verificationMethod: string;
        proofValue: string;
    };
}

export const generateVerifiableCredential = (
    subjectDID: string,
    issuerDID: string,
    credentialHash: string,
    verificationType: string,
    expiresAt: Date,
    proofSignature: string
): VerifiableCredential => {
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://racepass.io/credentials/v1',
        ],
        type: ['VerifiableCredential', 'RacePassCredential'],
        issuer: issuerDID,
        issuanceDate: new Date().toISOString(),
        expirationDate: expiresAt.toISOString(),
        credentialSubject: {
            id: subjectDID,
            credentialHash,
            verificationType,
        },
        proof: {
            type: 'EcdsaSecp256k1Signature2019',
            created: new Date().toISOString(),
            proofPurpose: 'assertionMethod',
            verificationMethod: `${issuerDID}#wallet`,
            proofValue: proofSignature,
        },
    };
};
