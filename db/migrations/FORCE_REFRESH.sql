-- Force PostgREST cache refresh by modifying schema
-- Add a comment to a table (DDL change triggers reload)

COMMENT ON TABLE user_profiles IS 'Extended user profile for Shadow CFO';
COMMENT ON TABLE findings IS 'Financial leak findings discovered for users';
COMMENT ON TABLE fix_actions IS 'Actionable fix items in user queue';

-- Also try directly accessing the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify tables exist via information_schema
SELECT 
  'user_profiles exists' as check FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public'
UNION ALL
SELECT 
  'findings exists' FROM information_schema.tables WHERE table_name = 'findings' AND table_schema = 'public'
UNION ALL
SELECT 
  'fix_actions exists' FROM information_schema.tables WHERE table_name = 'fix_actions' AND table_schema = 'public';
