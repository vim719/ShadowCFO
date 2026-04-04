-- Shadow CFO - Technical Design Doc v1.0
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gxxezkoiyxrnwtdrchtz/sql

-- =====================================================
-- SHADOW LEDGER (Commit 1: feat(core): init shadow-ledger)
-- =====================================================

CREATE TABLE IF NOT EXISTS shadow_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id TEXT UNIQUE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'DEBIT', 'CREDIT', 'PENDING_DEBIT', 'PENDING_CREDIT', 'REVERSAL'
  )),
  account_ref TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'settled', 'failed', 'expired', 'retrying', 'aborted'
  )),
  source_action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  ach_trace_id TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_request_id ON shadow_ledger(request_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_status ON shadow_ledger(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_pending_timeout ON shadow_ledger(initiated_at) WHERE status = 'pending';

-- Row Level Security
ALTER TABLE shadow_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ledger entries" ON shadow_ledger
  FOR ALL USING (auth.uid() = user_id);

-- View for projected balances
CREATE OR REPLACE VIEW projected_balances AS
SELECT
  user_id,
  account_ref,
  SUM(CASE
    WHEN entry_type IN ('CREDIT', 'PENDING_CREDIT') THEN amount_cents
    WHEN entry_type IN ('DEBIT', 'PENDING_DEBIT') THEN -amount_cents
    ELSE 0
  END)::BIGINT AS projected_balance_cents,
  SUM(CASE
    WHEN entry_type = 'CREDIT' THEN amount_cents
    WHEN entry_type = 'DEBIT' THEN -amount_cents
    ELSE 0
  END)::BIGINT AS settled_balance_cents,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_entries
FROM shadow_ledger
WHERE status != 'failed'
GROUP BY user_id, account_ref;

-- =====================================================
-- CONSENT (Commit 2: feat(auth): 1033-consent-gate)
-- =====================================================

CREATE TABLE IF NOT EXISTS consent_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_challenges_user_id ON consent_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_challenges_expires_at ON consent_challenges(expires_at) WHERE used = FALSE;

ALTER TABLE consent_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own challenges" ON consent_challenges
  FOR ALL USING (auth.uid() = user_id);

-- Consent audit log
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge TEXT NOT NULL,
  action TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consent log" ON consent_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert consent log" ON consent_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- WEBAUTHN CREDENTIALS (Commit 2: feat(auth): 1033-consent-gate)
-- =====================================================

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL DEFAULT 0,
  device_label TEXT,
  transports JSONB,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credentials" ON webauthn_credentials
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- AUTO-CLEANUP: Delete expired consent challenges hourly
-- =====================================================
SELECT cron.schedule(
  'delete-expired-consent-challenges',
  '0 * * * *',
  'DELETE FROM consent_challenges WHERE expires_at < NOW() AND used = FALSE'
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE shadow_ledger IS 'Double-entry shadow ledger for Shadow CFO financial state tracking';
COMMENT ON COLUMN shadow_ledger.request_id IS 'Idempotency key - prevents duplicate entries';
COMMENT ON COLUMN shadow_ledger.entry_type IS 'DEBIT/CREDIT for settled, PENDING_* for in-flight';
COMMENT ON COLUMN shadow_ledger.status IS 'pending → settled/failed/expired; expired → retrying → aborted';

COMMENT ON TABLE consent_challenges IS 'WebAuthn consent challenges for CFPB 1033 compliance';
COMMENT ON TABLE consent_log IS 'Audit trail for all consent events';
COMMENT ON TABLE webauthn_credentials IS 'User WebAuthn credentials for biometric authentication';
