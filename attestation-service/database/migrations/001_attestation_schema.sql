-- ═══════════════════════════════════════════════════════════
-- Attestation Service — Database Schema
-- ═══════════════════════════════════════════════════════════
-- Privacy-first: Never stores raw documents or PII.
-- Only hashes, scores, and verification outcomes.
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────

CREATE TYPE doc_type AS ENUM ('passport', 'aadhaar', 'drivers_license', 'national_id');
CREATE TYPE attestation_status AS ENUM ('pending', 'verified', 'rejected', 'revoked', 'expired');

-- ─── Attestations ───────────────────────────────────────────

CREATE TABLE attestations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL,
    wallet_address          VARCHAR(42) NOT NULL,
    doc_type                doc_type NOT NULL,
    doc_hash                VARCHAR(66) NOT NULL,
    attestation_hash        VARCHAR(66),
    status                  attestation_status DEFAULT 'pending',

    -- LLM verification results (no PII stored)
    confidence_score        SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),
    verification_outcome    JSONB,

    -- Trust scoring
    trust_score             SMALLINT CHECK (trust_score BETWEEN 0 AND 100),

    -- Attestor identity
    attestor_did            VARCHAR(256) NOT NULL,

    -- On-chain anchor
    on_chain_tx_hash        VARCHAR(66),

    -- Timestamps
    issued_at               TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    revoked_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attestations_user ON attestations(user_id);
CREATE INDEX idx_attestations_wallet ON attestations(wallet_address);
CREATE INDEX idx_attestations_hash ON attestations(attestation_hash);
CREATE INDEX idx_attestations_status ON attestations(status);

-- ─── Trust Scores (aggregated per user) ─────────────────────

CREATE TABLE trust_scores (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID UNIQUE NOT NULL,
    wallet_address          VARCHAR(42) NOT NULL,
    aggregate_score         SMALLINT DEFAULT 0 CHECK (aggregate_score BETWEEN 0 AND 100),
    attestation_count       INTEGER DEFAULT 0,
    highest_doc_tier        doc_type,
    last_computed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX idx_trust_scores_wallet ON trust_scores(wallet_address);
