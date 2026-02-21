import { query } from '../../config/database';
import { getReputationRegistry } from '../../blockchain/contracts';
import { hashReputationScore, randomHex } from '../../utils/crypto';

// ─── Record a Reputation Action ──────────────────────────────

const POINTS_MAP: Record<string, number> = {
    attendance: 10,
    checkin_success: 5,
    fraud_attempt: -50,
    no_show: -15,
};

export const recordAction = async (
    userId: string,
    action: 'attendance' | 'checkin_success' | 'fraud_attempt' | 'no_show',
    eventId?: string,
    description?: string
) => {
    const points = POINTS_MAP[action] || 0;

    // Insert record
    await query(
        `INSERT INTO reputation_records (user_id, action, event_id, points, description)
     VALUES ($1, $2, $3, $4, $5)`,
        [userId, action, eventId || null, points, description || null]
    );

    // Upsert aggregated score
    const countField = {
        attendance: 'attendance_count',
        checkin_success: 'checkin_count',
        fraud_attempt: 'fraud_count',
        no_show: 'noshow_count',
    }[action];

    const result = await query(
        `INSERT INTO reputation_scores (user_id, total_score, ${countField})
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id)
     DO UPDATE SET
       total_score = GREATEST(reputation_scores.total_score + $2, 0),
       ${countField} = reputation_scores.${countField} + 1,
       last_updated = NOW()
     RETURNING *`,
        [userId, points]
    );

    return result.rows[0];
};

// ─── Get Reputation Score ────────────────────────────────────

export const getReputationScore = async (userId: string) => {
    const result = await query(
        `SELECT rs.*, u.wallet_address
     FROM reputation_scores rs
     JOIN users u ON u.id = rs.user_id
     WHERE rs.user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return {
            totalScore: 0,
            attendanceCount: 0,
            checkinCount: 0,
            fraudCount: 0,
            noshowCount: 0,
            onChain: false,
        };
    }

    const score = result.rows[0];
    return {
        totalScore: score.total_score,
        attendanceCount: score.attendance_count,
        checkinCount: score.checkin_count,
        fraudCount: score.fraud_count,
        noshowCount: score.noshow_count,
        scoreHash: score.score_hash,
        onChainTxHash: score.on_chain_tx_hash,
        lastUpdated: score.last_updated,
    };
};

// ─── Publish Score Hash On-Chain ─────────────────────────────

export const publishScoreOnChain = async (userId: string) => {
    const scoreResult = await query(
        `SELECT rs.*, u.wallet_address
     FROM reputation_scores rs JOIN users u ON u.id = rs.user_id
     WHERE rs.user_id = $1`,
        [userId]
    );

    if (scoreResult.rows.length === 0) throw new Error('No reputation score found');

    const score = scoreResult.rows[0];
    const salt = randomHex(32);
    const scoreHash = hashReputationScore(
        score.wallet_address,
        score.total_score,
        Date.now(),
        salt
    );

    // Submit to blockchain
    let txHash: string | null = null;
    try {
        const registry = getReputationRegistry(true);
        const tx = await registry.updateScore(score.wallet_address, scoreHash);
        const receipt = await tx.wait();
        txHash = receipt.hash;
    } catch (err: any) {
        console.error('On-chain reputation update failed:', err.message);
        throw new Error('Failed to publish score on-chain');
    }

    // Update database
    await query(
        `UPDATE reputation_scores SET score_hash = $1, on_chain_tx_hash = $2, last_updated = NOW()
     WHERE user_id = $3`,
        [scoreHash, txHash, userId]
    );

    return { scoreHash, txHash };
};

// ─── Get Reputation History ──────────────────────────────────

export const getReputationHistory = async (userId: string, limit: number = 50) => {
    const result = await query(
        `SELECT rr.action, rr.points, rr.description, rr.created_at,
            e.title as event_title
     FROM reputation_records rr
     LEFT JOIN events e ON e.id = rr.event_id
     WHERE rr.user_id = $1
     ORDER BY rr.created_at DESC
     LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
};

// ─── Selective Disclosure (share only what's needed) ─────────

export const getSelectiveReputation = async (
    userId: string,
    fields: string[]
) => {
    const score = await getReputationScore(userId);
    const disclosed: Record<string, any> = {};

    if (fields.includes('total_score')) disclosed.totalScore = score.totalScore;
    if (fields.includes('attendance_count')) disclosed.attendanceCount = score.attendanceCount;
    if (fields.includes('fraud_count')) disclosed.fraudCount = score.fraudCount;
    if (fields.includes('score_hash')) disclosed.scoreHash = score.scoreHash;
    if (fields.includes('meets_minimum')) {
        const minScore = parseInt(fields.find(f => f.startsWith('min:'))?.split(':')[1] || '0');
        disclosed.meetsMinimum = score.totalScore >= minScore;
    }

    return disclosed;
};
