-- ============================================================
-- SHADOW CFO — ADDITIONAL TABLES & VIEWS
-- Run in: https://supabase.com/dashboard/project/gxxezkoiyxrnwtdrchtz/sql
-- ============================================================

-- 1. Rename profiles to user_profiles (or create alias view)
ALTER TABLE profiles RENAME TO user_profiles;

-- 2. Add missing columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS solv_balance INT DEFAULT 0;

-- 3. Create solv_history view (alias for solv_events)
CREATE OR REPLACE VIEW solv_history AS
SELECT 
  id,
  user_id,
  solv_earned as amount,
  event_type as action,
  description as source,
  created_at
FROM solv_events;

ALTER TABLE solv_history OWNER TO authenticated;

-- 4. Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  score           INT NOT NULL CHECK (score >= 0 AND score <= 100),
  correct_count   INT NOT NULL,
  total_questions INT NOT NULL,
  category_scores JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own quiz results" ON quiz_results FOR ALL USING (auth.uid() = user_id);
