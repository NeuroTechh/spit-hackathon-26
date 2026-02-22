import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import pg from "pg";

const HUDSON_URL = process.env.HUDSON_ISSUER_URL || "http://localhost:3001";
// Browser-facing URLs must go through the Hudson frontend proxy (port 3000)
// so session cookies are sent. Server-to-server calls use HUDSON_URL directly.
const HUDSON_FRONTEND_URL = process.env.HUDSON_FRONTEND_URL || "http://localhost:3000";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3004",
    secret: process.env.BETTER_AUTH_SECRET,
    database: pool,
    trustedOrigins: ["http://localhost:3005"],
    advanced: {
        // Use a unique cookie prefix so Piston Cup's session cookies
        // don't collide with Hudson's on localhost (same domain, different ports).
        cookiePrefix: "piston-cup",
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "hudson",
                    authorizationUrl: `${HUDSON_FRONTEND_URL}/api/auth/oauth2/authorize`,
                    tokenUrl: `${HUDSON_URL}/api/auth/oauth2/token`,
                    clientId: process.env.HUDSON_CLIENT_ID || "piston-cup",
                    clientSecret: process.env.HUDSON_CLIENT_SECRET || "piston-cup-secret-change-me",
                    scopes: ["openid", "profile", "email"],
                    pkce: true,
                    getUserInfo: async (tokens) => {
                        const res = await fetch(`${HUDSON_URL}/api/auth/oauth2/userinfo`, {
                            headers: { Authorization: `Bearer ${tokens.accessToken}` },
                        });
                        if (!res.ok) {
                            throw new Error(`Failed to fetch user info: ${res.status}`);
                        }
                        const info = (await res.json()) as Record<string, any>;
                        return {
                            id: info.sub,
                            email: info.email,
                            name: info.name || info.email?.split("@")[0] || "User",
                            emailVerified: info.email_verified ?? false,
                            image: info.picture,
                        };
                    },
                },
            ],
        }),
    ],
});

// ─── Access Token Lookup ────────────────────────────────────
// Retrieves the Hudson OAuth access token stored by genericOAuth
// in the account table after successful authentication.

export async function getHudsonAccessToken(userId: string): Promise<string | null> {
    const result = await pool.query(
        'SELECT "accessToken" FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
        [userId, "hudson"]
    );
    return result.rows[0]?.accessToken || null;
}
