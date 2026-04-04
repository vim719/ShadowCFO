-- =====================================================
-- SHADOW CFO - CREATE TABLES
-- Run this FIRST if tables don't exist
-- =====================================================

-- HARDENED BACKEND TABLES
CREATE TABLE IF NOT EXISTS shadow_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id TEXT UNIQUE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT', 'PENDING_DEBIT', 'PENDING_CREDIT', 'REVERSAL')),
  account_ref TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'failed', 'expired', 'retrying', 'aborted')),
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

CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge TEXT NOT NULL,
  action TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- USER-FACING TABLES
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  solv_balance INT DEFAULT 0,
  solvency_score INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cash_drag', 'fee_drag', 'employer_match', 'obbba', 'auto_loan')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_amount_cents BIGINT,
  impact_amount_display TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'fixed')),
  badge TEXT,
  badge_color TEXT,
  disclaimer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fix_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  impact_amount_cents BIGINT,
  impact_amount_display TEXT,
  meta TEXT,
  solv_reward INT DEFAULT 0,
  action_type TEXT DEFAULT 'one_tap' CHECK (action_type IN ('one_tap', 'manual', 'needs_cpa')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed', 'dismissed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solv_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  action TEXT NOT NULL,
  source TEXT DEFAULT 'fix_completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL,
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  category_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_request_id ON shadow_ledger(request_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_status ON shadow_ledger(user_id, status);
CREATE INDEX IF NOT EXISTS idx_consent_challenges_user_id ON consent_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_findings_user ON findings(user_id);
CREATE INDEX IF NOT EXISTS idx_findings_user_status ON findings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fix_actions_user ON fix_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_fix_actions_user_status ON fix_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_solv_history_user ON solv_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);

-- HELPER FUNCTION
CREATE OR REPLACE FUNCTION increment_solv_balance(user_id_param UUID, amount_param INT)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET solv_balance = solv_balance + amount_param,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
