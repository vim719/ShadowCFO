-- =====================================================
-- SHADOW CFO - CLEANUP & FINALIZE
-- Run AFTER partial migration failed
-- =====================================================

-- Drop existing policies (they may be corrupted)
DROP POLICY IF EXISTS "Users can manage own ledger entries" ON shadow_ledger;
DROP POLICY IF EXISTS "Users can manage own challenges" ON consent_challenges;
DROP POLICY IF EXISTS "Users can view own consent log" ON consent_log;
DROP POLICY IF EXISTS "System can insert consent log" ON consent_log;
DROP POLICY IF EXISTS "Users can manage own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own findings" ON findings;
DROP POLICY IF EXISTS "Users can update own findings" ON findings;
DROP POLICY IF EXISTS "System can insert findings" ON findings;
DROP POLICY IF EXISTS "Users can view own actions" ON fix_actions;
DROP POLICY IF EXISTS "Users can update own actions" ON fix_actions;
DROP POLICY IF EXISTS "System can insert actions" ON fix_actions;
DROP POLICY IF EXISTS "Users can view own solv history" ON solv_history;
DROP POLICY IF EXISTS "System can insert solv history" ON solv_history;
DROP POLICY IF EXISTS "Users can view own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can insert quiz results" ON quiz_results;

-- =====================================================
-- RECREATE POLICIES (clean)
-- =====================================================

-- Shadow Ledger
ALTER TABLE shadow_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ledger entries" ON shadow_ledger FOR ALL USING (auth.uid() = user_id);

-- Consent Challenges
ALTER TABLE consent_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own challenges" ON consent_challenges FOR ALL USING (auth.uid() = user_id);

-- Consent Log
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consent log" ON consent_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert consent log" ON consent_log FOR INSERT WITH CHECK (true);

-- WebAuthn
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credentials" ON webauthn_credentials FOR ALL USING (auth.uid() = user_id);

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Findings
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own findings" ON findings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own findings" ON findings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert findings" ON findings FOR INSERT WITH CHECK (true);

-- Fix Actions
ALTER TABLE fix_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own actions" ON fix_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON fix_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert actions" ON fix_actions FOR INSERT WITH CHECK (true);

-- SOLV History
ALTER TABLE solv_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own solv history" ON solv_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert solv history" ON solv_history FOR INSERT WITH CHECK (true);

-- Quiz Results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTION
-- =====================================================
DROP FUNCTION IF EXISTS increment_solv_balance(UUID, INT);
CREATE OR REPLACE FUNCTION increment_solv_balance(user_id_param UUID, amount_param INT)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET solv_balance = solv_balance + amount_param,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT 'Setup complete!' as status;
