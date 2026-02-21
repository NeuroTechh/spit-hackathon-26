import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { emailOTP, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { Resend } from "resend";
import { query } from "./config/database";
import { generateDID } from "./utils/did";
import { v4 as uuidv4 } from "uuid";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000", "http://localhost:3002"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            async sendVerificationOTP({ email, otp, type }) {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "RacePass <noreply@racepass.io>",
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
            loginPage: "/sign-in",
            consentPage: "/consent",
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
        "SELECT id, wallet_address, did, display_name, role, is_active FROM users WHERE better_auth_user_id = $1",
        [betterAuthUser.id]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0];
    }

    // Check if a Racepass user exists with the same email-derived DID
    const did = generateDID(betterAuthUser.email);
    const byDid = await query(
        "SELECT id, wallet_address, did, display_name, role, is_active FROM users WHERE did = $1",
        [did]
    );

    if (byDid.rows.length > 0) {
        // Link existing user
        await query("UPDATE users SET better_auth_user_id = $1, updated_at = NOW() WHERE id = $2", [
            betterAuthUser.id,
            byDid.rows[0].id,
        ]);
        return byDid.rows[0];
    }

    // Create new Racepass user linked to Better-Auth
    const userId = uuidv4();
    const nonce = require("crypto").randomBytes(32).toString("hex");
    const result = await query(
        `INSERT INTO users (id, wallet_address, did, display_name, role, nonce, better_auth_user_id)
         VALUES ($1, $2, $3, $4, 'user', $5, $6)
         RETURNING id, wallet_address, did, display_name, role, is_active`,
        [userId, null, did, betterAuthUser.name, nonce, betterAuthUser.id]
    );

    return result.rows[0];
};
