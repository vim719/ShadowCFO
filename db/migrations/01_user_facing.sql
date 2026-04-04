-- =====================================================
-- USER-FACING TABLES (MVP - Priority 1)
-- =====================================================

-- User profiles (extends auth.users)
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

-- Findings per user
CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cash_drag', 'fee_drag', 'employer_match', 'obbba', 'auto_loan'
  )),
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

-- Fix Queue actions per user
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

-- $SOLV earning history
CREATE TABLE IF NOT EXISTS solv_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  action TEXT NOT NULL,
  source TEXT DEFAULT 'fix_completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz results
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL,
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  category_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own findings" ON findings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own findings" ON findings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert findings" ON findings
  FOR INSERT WITH CHECK (true);

ALTER TABLE fix_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own actions" ON fix_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON fix_actions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert actions" ON fix_actions
  FOR INSERT WITH CHECK (true);

ALTER TABLE solv_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own solv history" ON solv_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert solv history" ON solv_history
  FOR INSERT WITH CHECK (true);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION increment_solv_balance(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET solv_balance = solv_balance + amount,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_findings_user ON findings(user_id);
CREATE INDEX IF NOT EXISTS idx_findings_user_status ON findings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fix_actions_user ON fix_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_fix_actions_user_status ON fix_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_solv_history_user ON solv_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
