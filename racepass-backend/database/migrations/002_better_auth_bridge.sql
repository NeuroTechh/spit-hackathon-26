-- ═══════════════════════════════════════════════════════════
-- RacePass Database Schema — Better-Auth Bridge
-- ═══════════════════════════════════════════════════════════
-- Adds a column to link Racepass users to Better-Auth users.
-- Better-Auth tables are managed by Prisma (see prisma/schema.prisma).
-- ═══════════════════════════════════════════════════════════

-- Add Better-Auth user ID column to existing users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS better_auth_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_better_auth_user_id
    ON users(better_auth_user_id);

-- Allow empty wallet_address for email-authenticated users
ALTER TABLE users
    ALTER COLUMN wallet_address DROP NOT NULL;

-- Allow empty did for email-authenticated users
ALTER TABLE users
    ALTER COLUMN did DROP NOT NULL;

-- Allow empty nonce for email-authenticated users
ALTER TABLE users
    ALTER COLUMN nonce DROP NOT NULL;
