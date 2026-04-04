-- Force PostgREST to reload schema cache
-- This sends a NOTIFY which triggers schema reload

-- Create a dummy table/function that triggers the reload
CREATE OR REPLACE FUNCTION public.pgrst_notify_schema_change()
RETURNS event_trigger AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Create event trigger
DROP EVENT TRIGGER IF EXISTS pgrst_schema_change_notify;
CREATE EVENT TRIGGER pgrst_schema_change_notify
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE')
  EXECUTE FUNCTION public.pgrst_notify_schema_change();

-- Also manually send the notify
NOTIFY pgrst, 'reload schema';

-- Verify by checking if we can see tables now
SELECT 'Tables exist:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
