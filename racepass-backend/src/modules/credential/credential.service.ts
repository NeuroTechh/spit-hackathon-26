import { query } from '../../config/database';
import { getCredentialRegistry } from '../../blockchain/contracts';
import { generateAgeProof, generateKYCProof, generateBlacklistProof, generateSalt, ZKProof } from '../../utils/zkProofs';

// ─── Get User Credentials ────────────────────────────────────

export const getUserCredentials = async (userId: string) => {
    const result = await query(
        `SELECT c.id, c.credential_hash, c.credential_type, c.issuer, c.status,
            c.issued_at, c.expires_at, c.on_chain_tx_hash, c.revoked_at, c.revocation_reason
     FROM credentials c WHERE c.user_id = $1 ORDER BY c.issued_at DESC`,
        [userId]
    );
    return result.rows;
};

// ─── Get Single Credential ───────────────────────────────────

export const getCredential = async (credentialId: string, userId: string) => {
    const result = await query(
        `SELECT c.*, 
            (SELECT json_agg(cp) FROM credential_proofs cp WHERE cp.credential_id = c.id) as proofs
     FROM credentials c WHERE c.id = $1 AND c.user_id = $2`,
        [credentialId, userId]
    );

    if (result.rows.length === 0) throw new Error('Credential not found');
    return result.rows[0];
};

// ─── Revoke Credential ───────────────────────────────────────

export const revokeCredential = async (
    credentialId: string,
    userId: string,
    reason: string
) => {
    const cred = await query(
        'SELECT credential_hash, status FROM credentials WHERE id = $1 AND user_id = $2',
        [credentialId, userId]
    );

    if (cred.rows.length === 0) throw new Error('Credential not found');
    if (cred.rows[0].status === 'revoked') throw new Error('Already revoked');

    // Revoke on-chain
    try {
        const registry = getCredentialRegistry(true);
        const tx = await registry.revokeCredential(cred.rows[0].credential_hash);
        await tx.wait();
    } catch (err: any) {
        console.error('On-chain revocation failed:', err.message);
    }

    // Revoke in database
    const result = await query(
        `UPDATE credentials SET status = 'revoked', revoked_at = NOW(), revocation_reason = $1
     WHERE id = $2 RETURNING *`,
        [reason, credentialId]
    );

    return result.rows[0];
};

// ─── Generate Selective Disclosure Proof ──────────────────────

export const generateSelectiveProof = async (
    userId: string,
    walletAddress: string,
    proofType: 'over_18' | 'kyc_approved' | 'not_blacklisted'
) => {
    // Check user has the required credential
    const credTypeMap: Record<string, string> = {
        over_18: 'age',
        kyc_approved: 'kyc',
        not_blacklisted: 'blacklist_check',
    };

    const cred = await query(
        `SELECT id, credential_hash FROM credentials
     WHERE user_id = $1 AND credential_type = $2 AND status = 'active' AND expires_at > NOW()
     ORDER BY issued_at DESC LIMIT 1`,
        [userId, credTypeMap[proofType]]
    );

    if (cred.rows.length === 0) {
        throw new Error(`No active ${credTypeMap[proofType]} credential found`);
    }

    // Generate ZK proof
    const salt = generateSalt();
    let proof: ZKProof;

    switch (proofType) {
        case 'over_18':
            proof = generateAgeProof(walletAddress, true, salt);
            break;
        case 'kyc_approved':
            proof = generateKYCProof(walletAddress, true, `did:racepass:issuer`, salt);
            break;
        case 'not_blacklisted':
            proof = generateBlacklistProof(walletAddress, false, salt);
            break;
        default:
            throw new Error('Invalid proof type');
    }

    // Store proof record
    await query(
        `INSERT INTO credential_proofs (credential_id, proof_type, proof_hash, verifier_data, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
        [
            cred.rows[0].id,
            proofType,
            proof.commitment,
            JSON.stringify({ publicInputs: proof.publicInputs, nullifier: proof.nullifier }),
            new Date(proof.expiresAt),
        ]
    );

    return {
        proof,
        credentialHash: cred.rows[0].credential_hash,
    };
};

// ─── Verify On-Chain Credential ──────────────────────────────

export const verifyOnChainCredential = async (credentialHash: string) => {
    try {
        const registry = getCredentialRegistry();
        const isValid = await registry.verifyCredential(credentialHash);
        const record = await registry.getCredential(credentialHash);

        return {
            isValid,
            onChain: {
                issuer: record.issuer,
                issuedAt: Number(record.issuedAt),
                expiresAt: Number(record.expiresAt),
                isRevoked: record.isRevoked,
            },
        };
    } catch (err: any) {
        throw new Error('Failed to verify on-chain: ' + err.message);
    }
};
