import { query } from '../../config/database';
import { getAttestationRegistry } from '../../config/blockchain';
import { hashAttestation, sha256 } from '../../utils/crypto';
import { verifyDocument } from '../llm/llm.service';
import { computeIndividualTrustScore, recomputeAggregateTrustScore } from '../trust/trust.service';
import { AttestationResult, OnChainVerification, DOC_TYPE_ENUM } from './attestation.types';
import { v4 as uuidv4 } from 'uuid';

const ATTESTOR_DID = process.env.ATTESTOR_DID || 'did:racepass:attestor:attestation-service';
const VALIDITY_DAYS = 365;

// ─── Submit & Verify Document ────────────────────────────────

export const createAttestation = async (
    userId: string,
    walletAddress: string,
    docType: string,
    documentBuffer: Buffer,
    mimeType: string
): Promise<AttestationResult> => {
    const attestationId = uuidv4();

    // 1. Hash the document (never store raw)
    const docHash = '0x' + sha256(documentBuffer);

    // 2. Insert pending attestation
    await query(
        `INSERT INTO attestations (id, user_id, wallet_address, doc_type, doc_hash, attestor_did, status)
         VALUES ($1, $2, $3, $4::doc_type, $5, $6, 'pending')`,
        [attestationId, userId, walletAddress, docType, docHash, ATTESTOR_DID]
    );

    // 3. Call LLM for verification
    const llmResult = await verifyDocument({ docType, documentBuffer, mimeType });

    // 4. Determine status
    const isVerified = llmResult.documentValid && llmResult.documentTypeMatches && llmResult.confidence >= 50;
    const status = isVerified ? 'verified' : 'rejected';

    // 5. Compute trust score
    const trustScore = isVerified ? computeIndividualTrustScore(docType, llmResult.confidence) : 0;

    // 6. Generate attestation hash for on-chain anchoring
    const timestamp = Date.now();
    const attestationHash = hashAttestation(userId, docType, docHash, timestamp);

    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    // 7. Anchor on-chain (if verified)
    let onChainTxHash: string | null = null;
    if (isVerified) {
        try {
            const registry = getAttestationRegistry(true);
            const tx = await registry.registerAttestation(
                attestationHash,
                walletAddress,
                DOC_TYPE_ENUM[docType] || 1,
                llmResult.confidence,
                trustScore,
                VALIDITY_DAYS
            );
            const receipt = await tx.wait();
            onChainTxHash = receipt.hash;
        } catch (err: any) {
            console.error('On-chain attestation registration failed:', err.message);
        }
    }

    // 8. Update database
    const verificationOutcome = {
        documentValid: llmResult.documentValid,
        documentTypeMatches: llmResult.documentTypeMatches,
        ageOver18: llmResult.ageOver18,
        fieldsDetected: llmResult.fieldsDetected,
        redFlags: llmResult.redFlags,
    };

    await query(
        `UPDATE attestations SET
            status = $1::attestation_status, attestation_hash = $2, confidence_score = $3,
            verification_outcome = $4, trust_score = $5, on_chain_tx_hash = $6,
            issued_at = $7, expires_at = $8, updated_at = NOW()
         WHERE id = $9`,
        [
            status, attestationHash, llmResult.confidence,
            JSON.stringify(verificationOutcome), trustScore, onChainTxHash,
            issuedAt, expiresAt, attestationId,
        ]
    );

    // 9. Recompute aggregate trust score
    if (isVerified) {
        await recomputeAggregateTrustScore(userId, walletAddress);
    }

    return {
        attestationId,
        attestationHash,
        status,
        docType,
        confidenceScore: llmResult.confidence,
        trustScore,
        verificationOutcome,
        onChainTxHash,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };
};

// ─── Get Attestation by ID ───────────────────────────────────

export const getAttestation = async (attestationId: string) => {
    const result = await query(
        `SELECT id, user_id, wallet_address, doc_type, doc_hash, attestation_hash, status,
                confidence_score, verification_outcome, trust_score, attestor_did,
                on_chain_tx_hash, issued_at, expires_at, created_at
         FROM attestations WHERE id = $1`,
        [attestationId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        id: row.id,
        userId: row.user_id,
        walletAddress: row.wallet_address,
        docType: row.doc_type,
        docHash: row.doc_hash,
        attestationHash: row.attestation_hash,
        status: row.status,
        confidenceScore: row.confidence_score,
        verificationOutcome: row.verification_outcome,
        trustScore: row.trust_score,
        attestorDid: row.attestor_did,
        onChainTxHash: row.on_chain_tx_hash,
        issuedAt: row.issued_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    };
};

// ─── Get User's Attestations ─────────────────────────────────

export const getUserAttestations = async (userId: string) => {
    const result = await query(
        `SELECT id, user_id, wallet_address, doc_type, attestation_hash, status,
                confidence_score, trust_score, attestor_did, on_chain_tx_hash,
                issued_at, expires_at, created_at
         FROM attestations WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        walletAddress: row.wallet_address,
        docType: row.doc_type,
        attestationHash: row.attestation_hash,
        status: row.status,
        confidenceScore: row.confidence_score,
        trustScore: row.trust_score,
        attestorDid: row.attestor_did,
        onChainTxHash: row.on_chain_tx_hash,
        issuedAt: row.issued_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    }));
};

// ─── Stateless On-Chain Verification ─────────────────────────

export const verifyOnChain = async (attestationHash: string): Promise<OnChainVerification> => {
    const registry = getAttestationRegistry(false);

    const isValid = await registry.verifyAttestation(attestationHash);
    const record = await registry.getAttestation(attestationHash);

    return {
        valid: isValid,
        attestationHash,
        onChain: {
            attestor: record.attestor,
            subject: record.subject,
            docType: Number(record.docType),
            confidenceScore: Number(record.confidenceScore),
            trustScore: Number(record.trustScore),
            issuedAt: Number(record.issuedAt),
            expiresAt: Number(record.expiresAt),
            isRevoked: record.isRevoked,
            exists: record.exists,
        },
        verifiedAt: Date.now(),
        stateless: true,
        noPII: true,
    };
};

// ─── Revoke Attestation ──────────────────────────────────────

export const revokeAttestation = async (attestationHash: string) => {
    // Revoke on-chain
    let onChainRevoked = false;
    try {
        const registry = getAttestationRegistry(true);
        const tx = await registry.revokeAttestation(attestationHash);
        await tx.wait();
        onChainRevoked = true;
    } catch (err: any) {
        console.error('On-chain revocation failed:', err.message);
    }

    // Revoke in database
    const result = await query(
        `UPDATE attestations SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
         WHERE attestation_hash = $1 AND status = 'verified'
         RETURNING id, user_id, wallet_address`,
        [attestationHash]
    );

    if (result.rows.length === 0) {
        throw new Error('Attestation not found or not in verified state');
    }

    // Recompute trust score
    const { user_id, wallet_address } = result.rows[0];
    await recomputeAggregateTrustScore(user_id, wallet_address);

    return { attestationHash, onChainRevoked, dbRevoked: true };
};
