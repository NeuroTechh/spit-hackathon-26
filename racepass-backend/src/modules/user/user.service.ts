import { query } from '../../config/database';
import { createDIDDocument } from '../../utils/did';

// ─── Get User Profile ────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
    const result = await query(
        `SELECT id, wallet_address, did, display_name, role, is_active, created_at
     FROM users WHERE id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = result.rows[0];
    return {
        id: user.id,
        walletAddress: user.wallet_address,
        did: user.did,
        displayName: user.display_name,
        role: user.role,
        isActive: user.is_active,
        didDocument: createDIDDocument(user.wallet_address, user.did),
        createdAt: user.created_at,
    };
};

// ─── Update Profile ──────────────────────────────────────────

export const updateUserProfile = async (
    userId: string,
    updates: { displayName?: string }
) => {
    const result = await query(
        `UPDATE users SET display_name = COALESCE($1, display_name), updated_at = NOW()
     WHERE id = $2
     RETURNING id, wallet_address, did, display_name, role`,
        [updates.displayName || null, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('User not found');
    }

    return result.rows[0];
};

// ─── Update Role (admin only) ────────────────────────────────

export const updateUserRole = async (
    userId: string,
    role: 'user' | 'organizer' | 'verifier'
) => {
    const result = await query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, wallet_address, did, role',
        [role, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('User not found');
    }

    return result.rows[0];
};
