import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { emailOTP, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { query } from "./config/database";
import { resend, FROM_EMAIL } from "./utils/email";
import { generateDID } from "./utils/did";
import { v4 as uuidv4 } from "uuid";
// import { provisionRelayEmail } from "./modules/relay-email/relay-email.service";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000", "http://localhost:3004", "http://localhost:3005"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            async sendVerificationOTP({ email, otp, type }) {
                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: email,
                    subject:
                        type === "sign-in"
                            ? `Your sign-in code: ${otp}`
                            : type === "forget-password"
                                ? `Your password reset code: ${otp}`
                                : `Your verification code: ${otp}`,
                    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`,
                });
            },
        }),
        jwt(),
        oauthProvider({
            loginPage: "http://localhost:3000/login",
            consentPage: "http://localhost:3000/consent",
            customUserInfoClaims: async ({ user, scopes }: { user: { id: string }; scopes: string[] }) => {
                if (!scopes.includes("email")) return {};
                const result = await query(
                    "SELECT relay_email FROM users WHERE better_auth_user_id = $1",
                    [user.id]
                );
                const relayEmail = result.rows[0]?.relay_email;
                return relayEmail ? { email: relayEmail } : {};
            },
        }),
    ],
});

// ─── User Bridging ──────────────────────────────────────────
// Links a Better-Auth user to a Racepass user record.
// Creates the Racepass user if it doesn't exist yet.

export const getOrCreateRacepassUser = async (betterAuthUser: {
    id: string;
    email: string;
    name: string;
}) => {
    // Check if a Racepass user is already linked
    const existing = await query(
        "SELECT id, wallet_address, did, display_name, role, is_active, relay_email FROM users WHERE better_auth_user_id = $1",
        [betterAuthUser.id]
    );

    let user;

    if (existing.rows.length > 0) {
        user = existing.rows[0];
    } else {
        // Check if a Racepass user exists with the same email-derived DID
        const did = generateDID(betterAuthUser.email);
        const byDid = await query(
            "SELECT id, wallet_address, did, display_name, role, is_active, relay_email FROM users WHERE did = $1",
            [did]
        );

        if (byDid.rows.length > 0) {
            // Link existing user
            await query("UPDATE users SET better_auth_user_id = $1, updated_at = NOW() WHERE id = $2", [
                betterAuthUser.id,
                byDid.rows[0].id,
            ]);
            user = byDid.rows[0];
        } else {
            // Create new Racepass user linked to Better-Auth
            // Uses ON CONFLICT to handle race conditions where concurrent requests
            // both pass the SELECT checks and try to INSERT simultaneously.
            const userId = uuidv4();
            const nonce = require("crypto").randomBytes(32).toString("hex");
            const result = await query(
                `INSERT INTO users (id, wallet_address, did, display_name, role, nonce, better_auth_user_id)
                 VALUES ($1, $2, $3, $4, 'user', $5, $6)
                 ON CONFLICT (did) DO UPDATE SET
                   better_auth_user_id = COALESCE(users.better_auth_user_id, EXCLUDED.better_auth_user_id),
                   updated_at = NOW()
                 RETURNING id, wallet_address, did, display_name, role, is_active, relay_email`,
                [userId, null, did, betterAuthUser.name, nonce, betterAuthUser.id]
            );
            user = result.rows[0];
        }
    }

    // Relay email provisioning disabled for now
    // if (!user.relay_email) {
    //     try {
    //         const relayEmail = await provisionRelayEmail(user.id, betterAuthUser.email);
    //         user.relay_email = relayEmail;
    //     } catch (err) {
    //         console.error(`Failed to provision relay email for user ${user.id}:`, err);
    //     }
    // }

    return user;
};
