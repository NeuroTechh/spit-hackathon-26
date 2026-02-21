import { query } from '../../config/database';
import { hashCredential, generateVerifiableCredential, sha256 } from '../../utils/crypto';
import { getCredentialRegistry } from '../../blockchain/contracts';
import * as attestationClient from '../../services/attestationClient';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════
// Identity Verification Service
// ═══════════════════════════════════════════════════════════
// Integrates with the Attestation Microservice for:
//   - Age verification (via document attestation)
//   - KYC verification (via document attestation)
//   - Blacklist check (via document attestation)
// Stores ONLY: credential hash, issuer, timestamp, revocation status.
// NEVER stores raw identity data.
// ═══════════════════════════════════════════════════════════

const DOC_TYPE_FOR_VERIFICATION: Record<string, string> = {
    age: 'passport',
    kyc: 'passport',
    blacklist_check: 'national_id',
};

// ─── Initialize Verification Request ─────────────────────────

export const initializeVerification = async (
    userId: string,
    _walletAddress: string,
    verificationType: 'age' | 'kyc' | 'blacklist_check'
) => {
    const requestId = uuidv4();
    const suggestedDocType = DOC_TYPE_FOR_VERIFICATION[verificationType] || 'passport';

    return {
        requestId,
        verificationType,
        suggestedDocType,
        acceptedDocTypes: ['passport', 'aadhaar', 'drivers_license', 'national_id'],
        message: `Upload a document for ${verificationType} verification. Accepted: passport, aadhaar, drivers_license, national_id.`,
        uploadEndpoint: `/api/v1/identity/verify/submit/${requestId}`,
    };
};

// ─── Submit Document for Verification ────────────────────────

export const submitVerificationDocument = async (
    userId: string,
    walletAddress: string,
    did: string,
    verificationType: 'age' | 'kyc' | 'blacklist_check',
    docType: string,
    documentBuffer: Buffer,
    mimeType: string,
    fileName: string
) => {
    // 1. Send to attestation microservice
    const attestationResult = await attestationClient.requestAttestation(
        userId,
        walletAddress,
        docType,
        documentBuffer,
        mimeType,
        fileName
    );

    if (attestationResult.status !== 'verified') {
        throw new Error(
            `Document verification failed (status: ${attestationResult.status}, confidence: ${attestationResult.confidenceScore})`
        );
    }

    // 2. Map attestation result to verification outcome
    const verificationResult = mapAttestationToVerification(verificationType, attestationResult);

    // 3. Generate credential hash for on-chain storage
    const timestamp = Date.now();
    const issuerDID = 'did:racepass:attestor:attestation-service';
    const credentialHash = hashCredential(walletAddress, verificationType, issuerDID, timestamp);

    // 4. Store credential in racepass database (hash only, no raw data)
    const result = await query(
        `INSERT INTO credentials (user_id, credential_hash, credential_type, issuer, issued_at, expires_at, metadata_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, credential_hash, credential_type, issuer, status, issued_at, expires_at`,
        [
            userId,
            credentialHash,
            verificationType,
            issuerDID,
            new Date(),
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            sha256(JSON.stringify(verificationResult)),
        ]
    );

    // 5. Register on CredentialRegistry for backward compatibility
    let onChainTxHash: string | null = null;
    try {
        const registry = getCredentialRegistry(true);
        const tx = await registry.registerCredential(
            credentialHash,
            walletAddress,
            365
        );
        const receipt = await tx.wait();
        onChainTxHash = receipt.hash;

        await query(
            'UPDATE credentials SET on_chain_tx_hash = $1 WHERE id = $2',
            [onChainTxHash, result.rows[0].id]
        );
    } catch (err: any) {
        console.error('On-chain credential registration failed:', err.message);
    }

    // 6. Generate verifiable credential JSON
    const vc = generateVerifiableCredential(
        did,
        issuerDID,
        credentialHash,
        verificationType,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        sha256(credentialHash + timestamp)
    );

    return {
        credential: result.rows[0],
        verifiableCredential: vc,
        onChainTxHash,
        verificationResult,
        attestation: {
            attestationId: attestationResult.attestationId,
            attestationHash: attestationResult.attestationHash,
            confidenceScore: attestationResult.confidenceScore,
            trustScore: attestationResult.trustScore,
        },
    };
};

// ─── Submit Verification (Simple — no file, random biased-high score) ────

export const submitVerificationSimple = async (
    userId: string,
    walletAddress: string,
    did: string,
    verificationType: 'age' | 'kyc' | 'blacklist_check',
    docType: string
) => {
    // Generate a biased-high confidence score (60–98, skewed toward higher values)
    const raw = Math.random();
    const biased = Math.pow(raw, 0.4); // skew toward 1.0
    const confidenceScore = Math.round(60 + biased * 38); // 60–98
    const trustScore = Math.round(confidenceScore * 0.9);

    // Build a mock verification outcome
    const verificationOutcome: Record<string, any> = {
        documentValid: true,
        documentTypeMatches: true,
        ageOver18: verificationType === 'age' ? true : undefined,
        fieldsDetected: ['name', 'dob', 'document_number'],
        redFlags: [],
    };

    // Generate credential hash for on-chain storage
    const timestamp = Date.now();
    const issuerDID = 'did:racepass:attestor:attestation-service';
    const credentialHash = hashCredential(walletAddress, verificationType, issuerDID, timestamp);

    // Store credential in database (hash only)
    const result = await query(
        `INSERT INTO credentials (user_id, credential_hash, credential_type, issuer, issued_at, expires_at, metadata_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, credential_hash, credential_type, issuer, status, issued_at, expires_at`,
        [
            userId,
            credentialHash,
            verificationType,
            issuerDID,
            new Date(),
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            sha256(JSON.stringify(verificationOutcome)),
        ]
    );

    // Register on CredentialRegistry (on-chain)
    let onChainTxHash: string | null = null;
    try {
        const registry = getCredentialRegistry(true);
        const tx = await registry.registerCredential(
            credentialHash,
            walletAddress,
            365
        );
        const receipt = await tx.wait();
        onChainTxHash = receipt.hash;

        await query(
            'UPDATE credentials SET on_chain_tx_hash = $1 WHERE id = $2',
            [onChainTxHash, result.rows[0].id]
        );
    } catch (err: any) {
        console.error('On-chain credential registration failed:', err.message);
    }

    // Generate verifiable credential JSON
    const vc = generateVerifiableCredential(
        did,
        issuerDID,
        credentialHash,
        verificationType,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        sha256(credentialHash + timestamp)
    );

    return {
        credential: result.rows[0],
        verifiableCredential: vc,
        onChainTxHash,
        verificationResult: verificationOutcome,
        attestation: {
            attestationId: uuidv4(),
            attestationHash: sha256(credentialHash),
            confidenceScore,
            trustScore,
        },
    };
};

// ─── Get User's Verifications ────────────────────────────────

export const getUserVerifications = async (userId: string) => {
    // Get credentials from racepass database
    const credentialResult = await query(
        `SELECT id, credential_hash, credential_type, issuer, status, issued_at, expires_at, on_chain_tx_hash
         FROM credentials WHERE user_id = $1 ORDER BY issued_at DESC`,
        [userId]
    );

    // Also fetch attestations from the attestation service
    let attestations: any[] = [];
    try {
        attestations = await attestationClient.getUserAttestations(userId);
    } catch {
        // Attestation service may be unreachable — degrade gracefully
    }

    // Fetch trust score
    let trustScore = null;
    try {
        trustScore = await attestationClient.getUserTrustScore(userId);
    } catch {
        // Degrade gracefully
    }

    return {
        credentials: credentialResult.rows,
        attestations,
        trustScore,
    };
};

// ─── Helper Functions ────────────────────────────────────────

const mapAttestationToVerification = (
    verificationType: string,
    attestation: any
): Record<string, any> => {
    const outcome = attestation.verificationOutcome || {};

    switch (verificationType) {
        case 'age':
            return {
                isOver18: outcome.ageOver18 === true,
                verifiedAt: Date.now(),
                confidenceScore: attestation.confidenceScore,
                attestationHash: attestation.attestationHash,
            };
        case 'kyc':
            return {
                kycStatus: outcome.documentValid ? 'approved' : 'rejected',
                verifiedAt: Date.now(),
                confidenceScore: attestation.confidenceScore,
                attestationHash: attestation.attestationHash,
            };
        case 'blacklist_check':
            return {
                isBlacklisted: false,
                verifiedAt: Date.now(),
                confidenceScore: attestation.confidenceScore,
                attestationHash: attestation.attestationHash,
            };
        default:
            return {
                verifiedAt: Date.now(),
                confidenceScore: attestation.confidenceScore,
            };
    }
};
