CREATE TABLE shadow_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  request_id TEXT UNIQUE NOT NULL,
  entry_type TEXT NOT NULL,
  account_ref TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  source_action TEXT NOT NULL,
  description TEXT NOT NULL,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  ach_trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ledger_request_id ON shadow_ledger(request_id);

CREATE VIEW projected_balances AS
SELECT
  user_id,
  account_ref,
  SUM(
    CASE
      WHEN entry_type IN ('CREDIT', 'PENDING_CREDIT') THEN amount_cents
      WHEN entry_type IN ('DEBIT', 'PENDING_DEBIT') THEN -amount_cents
      ELSE 0
    END
  ) AS projected_balance_cents,
  SUM(
    CASE
      WHEN entry_type = 'CREDIT' THEN amount_cents
      WHEN entry_type = 'DEBIT' THEN -amount_cents
      ELSE 0
    END
  ) AS settled_balance_cents,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_entries
FROM shadow_ledger
WHERE status != 'failed'
GROUP BY user_id, account_ref;
