import { query } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ─── Ownership Bridge ────────────────────────────────────────
// The oauthClient table uses Better-Auth user IDs, but our auth
// middleware provides Racepass user IDs. This bridges the gap.

async function getBetterAuthUserId(racepassUserId: string): Promise<string> {
    const result = await query(
        'SELECT better_auth_user_id FROM users WHERE id = $1',
        [racepassUserId]
    );
    if (result.rows.length === 0 || !result.rows[0].better_auth_user_id) {
        throw new Error('User not found');
    }
    return result.rows[0].better_auth_user_id;
}

function generateClientId(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
    const suffix = crypto.randomBytes(4).toString('hex');
    return `${slug}-${suffix}`;
}

function generateClientSecret(): string {
    return `hds_${crypto.randomBytes(32).toString('hex')}`;
}

// better-auth's oauthProvider hashes client secrets (SHA-256, base64url)
// before storing them. We must do the same when inserting via raw SQL.
async function hashClientSecret(secret: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(secret).digest();
    // base64url encoding without padding (matching better-auth's defaultHasher)
    return hash.toString('base64url');
}

// ─── List Clients ────────────────────────────────────────────

export const listClients = async (racepassUserId: string) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);
    const result = await query(
        `SELECT id, "clientId", name, disabled, scopes, "redirectUris",
                "grantTypes", "createdAt", "updatedAt", icon
         FROM "oauthClient"
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC`,
        [baUserId]
    );
    return result.rows;
};

// ─── Get Single Client ───────────────────────────────────────

export const getClient = async (clientDbId: string, racepassUserId: string) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);
    const result = await query(
        `SELECT id, "clientId", name, disabled, scopes, "redirectUris",
                "postLogoutRedirectUris", "grantTypes", "responseTypes",
                "tokenEndpointAuthMethod", type, public, icon,
                "skipConsent", "createdAt", "updatedAt"
         FROM "oauthClient"
         WHERE id = $1 AND "userId" = $2`,
        [clientDbId, baUserId]
    );
    if (result.rows.length === 0) {
        throw new Error('OAuth client not found');
    }
    return result.rows[0];
};

// ─── Create Client ───────────────────────────────────────────

interface CreateClientInput {
    name: string;
    redirectUris: string[];
    scopes?: string[];
    grantTypes?: string[];
    skipConsent?: boolean;
}

export const createClient = async (racepassUserId: string, data: CreateClientInput) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);
    const id = uuidv4();
    const clientId = generateClientId(data.name);
    const clientSecret = generateClientSecret();
    const hashedSecret = await hashClientSecret(clientSecret);
    const scopes = data.scopes || ['openid', 'profile', 'email'];
    const grantTypes = data.grantTypes || ['authorization_code', 'refresh_token'];

    const result = await query(
        `INSERT INTO "oauthClient" (
            id, "clientId", "clientSecret", name, disabled, "skipConsent",
            scopes, "redirectUris", "postLogoutRedirectUris",
            "tokenEndpointAuthMethod", "grantTypes", "responseTypes",
            type, public, "userId", "createdAt", "updatedAt"
        ) VALUES (
            $1, $2, $3, $4, false, $5,
            $6, $7, ARRAY[]::text[],
            'client_secret_post', $8, ARRAY['code'],
            'web', false, $9, NOW(), NOW()
        ) RETURNING id, "clientId", name, scopes, "redirectUris", "grantTypes", "createdAt"`,
        [
            id, clientId, hashedSecret, data.name, data.skipConsent || false,
            scopes, data.redirectUris, grantTypes, baUserId,
        ]
    );

    // Return with plain-text secret — only time it's exposed
    return { ...result.rows[0], clientSecret };
};

// ─── Update Client ───────────────────────────────────────────

interface UpdateClientInput {
    name?: string;
    redirectUris?: string[];
    scopes?: string[];
    icon?: string;
    disabled?: boolean;
    skipConsent?: boolean;
}

export const updateClient = async (
    clientDbId: string,
    racepassUserId: string,
    data: UpdateClientInput
) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);

    // Build dynamic SET clause
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const params: any[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) {
        setClauses.push(`name = $${paramIdx++}`);
        params.push(data.name);
    }
    if (data.redirectUris !== undefined) {
        setClauses.push(`"redirectUris" = $${paramIdx++}`);
        params.push(data.redirectUris);
    }
    if (data.scopes !== undefined) {
        setClauses.push(`scopes = $${paramIdx++}`);
        params.push(data.scopes);
    }
    if (data.icon !== undefined) {
        setClauses.push(`icon = $${paramIdx++}`);
        params.push(data.icon);
    }
    if (data.disabled !== undefined) {
        setClauses.push(`disabled = $${paramIdx++}`);
        params.push(data.disabled);
    }
    if (data.skipConsent !== undefined) {
        setClauses.push(`"skipConsent" = $${paramIdx++}`);
        params.push(data.skipConsent);
    }

    params.push(clientDbId, baUserId);

    const result = await query(
        `UPDATE "oauthClient"
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIdx++} AND "userId" = $${paramIdx}
         RETURNING id, "clientId", name, disabled, scopes, "redirectUris",
                   icon, "skipConsent", "updatedAt"`,
        params
    );

    if (result.rows.length === 0) {
        throw new Error('OAuth client not found or not owned by you');
    }
    return result.rows[0];
};

// ─── Delete Client ───────────────────────────────────────────

export const deleteClient = async (clientDbId: string, racepassUserId: string) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);
    const result = await query(
        'DELETE FROM "oauthClient" WHERE id = $1 AND "userId" = $2 RETURNING id, "clientId", name',
        [clientDbId, baUserId]
    );
    if (result.rows.length === 0) {
        throw new Error('OAuth client not found or not owned by you');
    }
    return result.rows[0];
};

// ─── Rotate Secret ───────────────────────────────────────────

export const rotateSecret = async (clientDbId: string, racepassUserId: string) => {
    const baUserId = await getBetterAuthUserId(racepassUserId);
    const newSecret = generateClientSecret();
    const hashedSecret = await hashClientSecret(newSecret);
    const result = await query(
        `UPDATE "oauthClient"
         SET "clientSecret" = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "userId" = $3
         RETURNING id, "clientId", name`,
        [hashedSecret, clientDbId, baUserId]
    );
    if (result.rows.length === 0) {
        throw new Error('OAuth client not found or not owned by you');
    }
    return { ...result.rows[0], clientSecret: newSecret };
};
