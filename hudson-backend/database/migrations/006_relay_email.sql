-- Migration 006: Add relay email columns to users table
-- Relay emails provide privacy by hiding real emails from OAuth clients

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS relay_email VARCHAR(256) UNIQUE,
    ADD COLUMN IF NOT EXISTS cf_routing_rule_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_users_relay_email ON users(relay_email);
