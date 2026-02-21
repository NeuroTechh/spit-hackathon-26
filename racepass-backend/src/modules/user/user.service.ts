import { query } from '../../config/database';
import { generateDID, createDIDDocument } from '../../utils/did';
import { generateNonce, createSigningMessage, verifySignature } from '../../utils/crypto';
import { setSession } from '../../config/redis';
import { generateToken, generateRefreshToken, AuthPayload } from '../../middleware/auth';
import { ethers } from 'ethers';

// ─── Register or Login ───────────────────────────────────────

export const getNonceForWallet = async (walletAddress: string) => {
    if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
    }

    const nonce = generateNonce();
    const timestamp = Date.now();

    // Upsert user — creates if not exists
    const result = await query(
        `INSERT INTO users (wallet_address, did, nonce)
     VALUES ($1, $2, $3)
     ON CONFLICT (wallet_address)
     DO UPDATE SET nonce = $3, updated_at = NOW()
     RETURNING id, wallet_address, did, role, nonce, display_name`,
        [walletAddress.toLowerCase(), generateDID(walletAddress), nonce]
    );

    const user = result.rows[0];
    const message = createSigningMessage(walletAddress, nonce, timestamp);

    return {
        message,
        nonce,
        timestamp,
        isNewUser: result.rowCount === 1 && !user.display_name,
    };
};

// ─── Verify Signature & Issue JWT ────────────────────────────

export const verifyWalletSignature = async (
    walletAddress: string,
    signature: string,
    nonce: string
) => {
    if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
    }

    // Get user and verify nonce
    const result = await query(
        'SELECT id, wallet_address, did, role, nonce, display_name FROM users WHERE wallet_address = $1',
        [walletAddress.toLowerCase()]
    );

    if (result.rows.length === 0) {
        throw new Error('User not found. Call /auth/nonce first.');
    }

    const user = result.rows[0];

    if (user.nonce !== nonce) {
        throw new Error('Invalid nonce');
    }

    // Reconstruct signing message and verify
    const message = createSigningMessage(walletAddress, nonce, 0);
    // For flexibility, verify against the raw nonce message pattern
    const isValid = verifySignature(
        createSigningMessage(walletAddress, nonce, 0),
        signature,
        walletAddress
    );

    // Also try verifying with just the nonce as the message (MetaMask compatibility)
    const isValidAlt = !isValid
        ? verifySignature(nonce, signature, walletAddress)
        : false;

    if (!isValid && !isValidAlt) {
        throw new Error('Signature verification failed');
    }

    // Rotate nonce (prevents replay)
    const newNonce = generateNonce();
    await query('UPDATE users SET nonce = $1, updated_at = NOW() WHERE id = $2', [
        newNonce,
        user.id,
    ]);

    // Generate JWT
    const payload: AuthPayload = {
        userId: user.id,
        walletAddress: user.wallet_address,
        did: user.did,
        role: user.role,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store session in Redis
    await setSession(`jwt:${user.id}`, { token, walletAddress: user.wallet_address }, 86400);

    return {
        token,
        refreshToken,
        user: {
            id: user.id,
            walletAddress: user.wallet_address,
            did: user.did,
            role: user.role,
            displayName: user.display_name,
        },
    };
};

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
