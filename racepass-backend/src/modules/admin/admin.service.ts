import { query } from '../../config/database';

// ─── Dashboard Stats ────────────────────────────────────────

export const getStats = async () => {
    const result = await query(`
        SELECT
            (SELECT COUNT(*) FROM users)::int AS total_users,
            (SELECT COUNT(*) FROM events)::int AS total_events,
            (SELECT COUNT(*) FROM user_reports WHERE status = 'pending')::int AS pending_reports,
            (SELECT COALESCE(AVG(total_score), 0) FROM reputation_scores)::int AS average_reputation
    `);
    const row = result.rows[0];
    return {
        totalUsers: row.total_users,
        totalEvents: row.total_events,
        pendingReports: row.pending_reports,
        averageReputation: row.average_reputation,
    };
};

// ─── List All Users (paginated) ─────────────────────────────

export const listAllUsers = async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string
) => {
    const offset = (page - 1) * limit;

    const countResult = await query(
        `SELECT COUNT(*) FROM users
         WHERE ($1::text IS NULL OR display_name ILIKE '%' || $1 || '%')
           AND ($2::text IS NULL OR role::text = $2)`,
        [search || null, role || null]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
        `SELECT u.id, u.wallet_address, u.did, u.display_name, u.role, u.is_active, u.created_at,
                COALESCE(rs.total_score, 0) AS reputation_score
         FROM users u
         LEFT JOIN reputation_scores rs ON rs.user_id = u.id
         WHERE ($1::text IS NULL OR u.display_name ILIKE '%' || $1 || '%')
           AND ($2::text IS NULL OR u.role::text = $2)
         ORDER BY u.created_at DESC
         LIMIT $3 OFFSET $4`,
        [search || null, role || null, limit, offset]
    );

    return {
        users: result.rows.map((u: any) => ({
            id: u.id,
            walletAddress: u.wallet_address,
            did: u.did,
            displayName: u.display_name,
            role: u.role,
            isActive: u.is_active,
            createdAt: u.created_at,
            reputationScore: u.reputation_score,
        })),
        total,
        page,
        limit,
    };
};

// ─── Get User Detail ────────────────────────────────────────

export const getUserDetail = async (userId: string) => {
    const userResult = await query(
        `SELECT u.id, u.wallet_address, u.did, u.display_name, u.role, u.is_active, u.created_at,
                COALESCE(rs.total_score, 0) AS reputation_score,
                COALESCE(rs.attendance_count, 0) AS attendance_count,
                COALESCE(rs.checkin_count, 0) AS checkin_count,
                COALESCE(rs.fraud_count, 0) AS fraud_count,
                COALESCE(rs.noshow_count, 0) AS noshow_count
         FROM users u
         LEFT JOIN reputation_scores rs ON rs.user_id = u.id
         WHERE u.id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) throw new Error('User not found');
    const u = userResult.rows[0];

    const historyResult = await query(
        `SELECT id, action, event_id, points, description, created_at
         FROM reputation_records WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );

    return {
        id: u.id,
        walletAddress: u.wallet_address,
        did: u.did,
        displayName: u.display_name,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        reputationScore: u.reputation_score,
        attendanceCount: u.attendance_count,
        checkinCount: u.checkin_count,
        fraudCount: u.fraud_count,
        noshowCount: u.noshow_count,
        reputationHistory: historyResult.rows.map((r: any) => ({
            id: r.id,
            action: r.action,
            eventId: r.event_id,
            points: r.points,
            description: r.description,
            createdAt: r.created_at,
        })),
    };
};

// ─── Submit Report ──────────────────────────────────────────

export const submitReport = async (
    reporterId: string,
    targetUserId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    eventId?: string
) => {
    const result = await query(
        `INSERT INTO user_reports (reporter_id, target_user_id, reason, severity, event_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [reporterId, targetUserId, reason, severity, eventId || null]
    );
    return result.rows[0];
};

// ─── Process Report (fairness algorithm) ────────────────────

const BASE_PENALTY: Record<string, number> = {
    low: -5,
    medium: -15,
    high: -30,
    critical: -50,
};

export const processReport = async (
    reportId: string,
    decision: 'apply' | 'dismiss',
    processedBy: string,
    notes?: string
) => {
    const reportResult = await query('SELECT * FROM user_reports WHERE id = $1', [reportId]);
    if (reportResult.rows.length === 0) throw new Error('Report not found');
    const report = reportResult.rows[0];

    if (report.status !== 'pending') throw new Error('Report already processed');

    if (decision === 'dismiss') {
        await query(
            `UPDATE user_reports SET status = 'dismissed', admin_notes = $1, processed_by = $2, processed_at = NOW()
             WHERE id = $3`,
            [notes || null, processedBy, reportId]
        );
        return { ...report, status: 'dismissed', admin_notes: notes, score_adjustment: 0 };
    }

    // Fairness: check prior offenses for escalation
    const priorResult = await query(
        `SELECT COUNT(*) AS count FROM user_reports
         WHERE target_user_id = $1 AND status = 'reviewed' AND score_adjustment < 0`,
        [report.target_user_id]
    );
    const priorOffenses = parseInt(priorResult.rows[0].count);

    // Escalation: first=0.5x (warning), second=1.0x, third+=1.5x
    const multiplier = priorOffenses === 0 ? 0.5 : priorOffenses === 1 ? 1.0 : 1.5;
    const penalty = Math.round((BASE_PENALTY[report.severity] || -5) * multiplier);

    // Insert reputation record
    await query(
        `INSERT INTO reputation_records (user_id, action, points, description)
         VALUES ($1, 'admin_report', $2, $3)`,
        [report.target_user_id, penalty, `Report: ${report.reason} (severity: ${report.severity})`]
    );

    // Update aggregated score
    await query(
        `INSERT INTO reputation_scores (user_id, total_score)
         VALUES ($1, GREATEST($2, 0))
         ON CONFLICT (user_id) DO UPDATE SET
            total_score = GREATEST(reputation_scores.total_score + $2, 0),
            last_updated = NOW()`,
        [report.target_user_id, penalty]
    );

    // Mark report as reviewed
    await query(
        `UPDATE user_reports SET status = 'reviewed', score_adjustment = $1, admin_notes = $2,
            processed_by = $3, processed_at = NOW()
         WHERE id = $4`,
        [penalty, notes || null, processedBy, reportId]
    );

    return { ...report, status: 'reviewed', score_adjustment: penalty, admin_notes: notes };
};

// ─── List Reports (paginated) ───────────────────────────────

export const listReports = async (
    status?: string,
    page: number = 1,
    limit: number = 20
) => {
    const offset = (page - 1) * limit;

    const countResult = await query(
        `SELECT COUNT(*) FROM user_reports WHERE ($1::text IS NULL OR status = $1)`,
        [status || null]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
        `SELECT r.*,
                tu.display_name AS target_user_name,
                ru.display_name AS reporter_name
         FROM user_reports r
         LEFT JOIN users tu ON tu.id = r.target_user_id
         LEFT JOIN users ru ON ru.id = r.reporter_id
         WHERE ($1::text IS NULL OR r.status = $1)
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [status || null, limit, offset]
    );

    return { reports: result.rows, total, page, limit };
};
