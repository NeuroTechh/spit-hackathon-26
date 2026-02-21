import { query } from '../../config/database';
import { DOC_TIER_SCORES, DOC_TIER_ORDER, TrustScore } from './trust.types';

export const computeIndividualTrustScore = (
    docType: string,
    confidenceScore: number
): number => {
    const baseTier = DOC_TIER_SCORES[docType] || 20;

    let confidenceBonus = 0;
    if (confidenceScore >= 90) confidenceBonus = 30;
    else if (confidenceScore >= 75) confidenceBonus = 20;
    else if (confidenceScore >= 60) confidenceBonus = 10;

    return Math.min(baseTier + confidenceBonus, 100);
};

export const recomputeAggregateTrustScore = async (
    userId: string,
    walletAddress: string
): Promise<TrustScore> => {
    // Get all verified attestations for this user
    const result = await query(
        `SELECT doc_type, trust_score FROM attestations
         WHERE user_id = $1 AND status = 'verified'
         ORDER BY trust_score DESC`,
        [userId]
    );

    const attestations = result.rows;
    if (attestations.length === 0) {
        // Upsert a zero score
        await query(
            `INSERT INTO trust_scores (user_id, wallet_address, aggregate_score, attestation_count, highest_doc_tier, last_computed_at)
             VALUES ($1, $2, 0, 0, NULL, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                aggregate_score = 0, attestation_count = 0, highest_doc_tier = NULL, last_computed_at = NOW()`,
            [userId, walletAddress]
        );

        return {
            userId,
            walletAddress,
            aggregateScore: 0,
            attestationCount: 0,
            highestDocTier: null,
            lastComputedAt: new Date(),
        };
    }

    // Best individual score
    const bestScore = attestations[0].trust_score;

    // Unique document types
    const uniqueDocTypes = new Set(attestations.map((a: any) => a.doc_type));

    // Multi-attestation bonus
    let multiBonus = 0;
    if (uniqueDocTypes.size >= 3) multiBonus = 20;
    else if (uniqueDocTypes.size >= 2) multiBonus = 10;

    const aggregateScore = Math.min(bestScore + multiBonus, 100);

    // Find highest tier document
    let highestDocTier: string | null = null;
    let highestOrder = 0;
    for (const docType of uniqueDocTypes) {
        const order = DOC_TIER_ORDER[docType as string] || 0;
        if (order > highestOrder) {
            highestOrder = order;
            highestDocTier = docType as string;
        }
    }

    // Upsert trust score
    await query(
        `INSERT INTO trust_scores (user_id, wallet_address, aggregate_score, attestation_count, highest_doc_tier, last_computed_at)
         VALUES ($1, $2, $3, $4, $5::doc_type, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
            wallet_address = $2, aggregate_score = $3, attestation_count = $4,
            highest_doc_tier = $5::doc_type, last_computed_at = NOW()`,
        [userId, walletAddress, aggregateScore, attestations.length, highestDocTier]
    );

    return {
        userId,
        walletAddress,
        aggregateScore,
        attestationCount: attestations.length,
        highestDocTier,
        lastComputedAt: new Date(),
    };
};

export const getTrustScore = async (userId: string): Promise<TrustScore | null> => {
    const result = await query(
        `SELECT user_id, wallet_address, aggregate_score, attestation_count, highest_doc_tier, last_computed_at
         FROM trust_scores WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        userId: row.user_id,
        walletAddress: row.wallet_address,
        aggregateScore: row.aggregate_score,
        attestationCount: row.attestation_count,
        highestDocTier: row.highest_doc_tier,
        lastComputedAt: row.last_computed_at,
    };
};
