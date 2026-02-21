-- ═══════════════════════════════════════════════════════════
-- RacePass Database Schema — Initial Migration
-- ═══════════════════════════════════════════════════════════
-- Privacy-first design: NO raw PII is ever stored.
-- Only hashes, commitments, and metadata are persisted.
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM Types ──────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('user', 'organizer', 'verifier');
CREATE TYPE credential_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE verification_type AS ENUM ('age', 'kyc', 'blacklist_check');
CREATE TYPE reputation_action AS ENUM ('attendance', 'checkin_success', 'fraud_attempt', 'no_show');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- ═══════════════════════════════════════════════════════════
-- USERS TABLE
-- Minimal profile. No raw PII. DID linked to wallet.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address  VARCHAR(42) UNIQUE NOT NULL,
    did             VARCHAR(256) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    role            user_role DEFAULT 'user',
    nonce           VARCHAR(64) NOT NULL,       -- For signature-based login (replay protection)
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_did ON users(did);

-- ═══════════════════════════════════════════════════════════
-- CREDENTIALS TABLE
-- Stores ONLY hashes, issuer, timestamps. Never raw data.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE credentials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_hash     VARCHAR(66) NOT NULL,       -- keccak256 hash stored on-chain
    credential_type     verification_type NOT NULL,
    issuer              VARCHAR(256) NOT NULL,       -- DID of issuer
    status              credential_status DEFAULT 'active',
    on_chain_tx_hash    VARCHAR(66),                 -- Transaction hash of on-chain registration
    issued_at           TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revocation_reason   VARCHAR(256),
    metadata_hash       VARCHAR(66),                 -- IPFS hash for verifiable credential JSON
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credentials_user ON credentials(user_id);
CREATE INDEX idx_credentials_hash ON credentials(credential_hash);
CREATE INDEX idx_credentials_status ON credentials(status);

-- ═══════════════════════════════════════════════════════════
-- CREDENTIAL PROOFS TABLE
-- ZK proof records for selective disclosure
-- ═══════════════════════════════════════════════════════════

CREATE TABLE credential_proofs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_id   UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    proof_type      VARCHAR(64) NOT NULL,           -- 'over_18', 'kyc_approved', 'not_blacklisted'
    proof_hash      VARCHAR(66) NOT NULL,           -- Hash of the ZK proof
    verifier_data   JSONB,                          -- Public inputs for verification (no PII)
    is_valid        BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ
);

CREATE INDEX idx_proofs_credential ON credential_proofs(credential_id);
CREATE INDEX idx_proofs_type ON credential_proofs(proof_type);

-- ═══════════════════════════════════════════════════════════
-- EVENTS TABLE
-- Event definitions with eligibility requirements
-- ═══════════════════════════════════════════════════════════

CREATE TABLE events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id            UUID NOT NULL REFERENCES users(id),
    title                   VARCHAR(256) NOT NULL,
    description             TEXT,
    event_date              TIMESTAMPTZ NOT NULL,
    location                VARCHAR(256),
    status                  event_status DEFAULT 'draft',
    -- Eligibility requirements
    min_age                 INTEGER,                    -- NULL = no age requirement
    requires_kyc            BOOLEAN DEFAULT false,
    min_reputation_score    INTEGER,                    -- NULL = no reputation requirement
    max_attendees           INTEGER,
    -- On-chain data
    contract_address        VARCHAR(42),                -- Per-event NFT contract (if deployed)
    on_chain_event_id       INTEGER,                    -- Event ID in shared EventPassNFT contract
    metadata_hash           VARCHAR(66),                -- IPFS hash for event metadata
    on_chain_tx_hash        VARCHAR(66),                -- Creation transaction hash
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- ═══════════════════════════════════════════════════════════
-- EVENT PASSES TABLE
-- Soulbound NFT pass records
-- ═══════════════════════════════════════════════════════════

CREATE TABLE event_passes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    token_id            INTEGER,                        -- NFT token ID on-chain
    mint_tx_hash        VARCHAR(66),                    -- Minting transaction hash
    is_checked_in       BOOLEAN DEFAULT false,
    checked_in_at       TIMESTAMPTZ,
    is_burned           BOOLEAN DEFAULT false,          -- Burned on fraud
    burned_at           TIMESTAMPTZ,
    burn_reason         VARCHAR(256),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)                           -- One pass per user per event
);

CREATE INDEX idx_passes_event ON event_passes(event_id);
CREATE INDEX idx_passes_user ON event_passes(user_id);
CREATE INDEX idx_passes_token ON event_passes(token_id);

-- ═══════════════════════════════════════════════════════════
-- REPUTATION RECORDS TABLE
-- Individual reputation actions (attendance, fraud, etc.)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE reputation_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          reputation_action NOT NULL,
    event_id        UUID REFERENCES events(id),
    points          INTEGER NOT NULL,               -- Positive or negative
    description     VARCHAR(256),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reputation_records_user ON reputation_records(user_id);
CREATE INDEX idx_reputation_records_action ON reputation_records(action);

-- ═══════════════════════════════════════════════════════════
-- REPUTATION SCORES TABLE
-- Aggregated scores with on-chain hash
-- ═══════════════════════════════════════════════════════════

CREATE TABLE reputation_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score         INTEGER DEFAULT 0,
    attendance_count    INTEGER DEFAULT 0,
    checkin_count       INTEGER DEFAULT 0,
    fraud_count         INTEGER DEFAULT 0,
    noshow_count        INTEGER DEFAULT 0,
    score_hash          VARCHAR(66),                -- Hash stored on-chain
    on_chain_tx_hash    VARCHAR(66),                -- Last update transaction hash
    last_updated        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reputation_scores_user ON reputation_scores(user_id);
CREATE INDEX idx_reputation_scores_total ON reputation_scores(total_score);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOGS TABLE
-- All sensitive operations are logged (no PII in details)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(128) NOT NULL,
    resource_type   VARCHAR(64),                    -- 'credential', 'event', 'reputation', etc.
    resource_id     UUID,
    ip_address      VARCHAR(45),                    -- Supports IPv6
    user_agent      VARCHAR(512),
    details         JSONB,                          -- Non-PII metadata about the action
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════
-- NONCES TABLE
-- Replay attack protection for wallet signatures
-- ═══════════════════════════════════════════════════════════

CREATE TABLE nonces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address  VARCHAR(42) NOT NULL,
    nonce           VARCHAR(64) NOT NULL,
    used            BOOLEAN DEFAULT false,
    used_at         TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nonces_wallet ON nonces(wallet_address);
CREATE INDEX idx_nonces_nonce ON nonces(nonce);

-- ─── Update trigger for updated_at columns ───────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
