-- ═══════════════════════════════════════════════════════════
-- Migration 003: Admin role & User Reports
-- ═══════════════════════════════════════════════════════════

-- Add 'admin' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Add 'admin_report' to reputation_action enum
ALTER TYPE reputation_action ADD VALUE IF NOT EXISTS 'admin_report';

-- ═══════════════════════════════════════════════════════════
-- USER REPORTS TABLE
-- Two-step fair reporting: submit -> review/dismiss
-- ═══════════════════════════════════════════════════════════

CREATE TABLE user_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    target_user_id  UUID NOT NULL REFERENCES users(id),
    reason          TEXT NOT NULL,
    severity        VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    event_id        UUID REFERENCES events(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    admin_notes     TEXT,
    score_adjustment INTEGER DEFAULT 0,
    processed_by    UUID REFERENCES users(id),
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_reports_target ON user_reports(target_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created ON user_reports(created_at DESC);
