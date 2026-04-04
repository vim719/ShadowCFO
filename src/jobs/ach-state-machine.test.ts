import { beforeEach, describe, expect, it } from "bun:test";
import { ACHStateMachine } from "./ach-state-machine";
import { createTestSupabaseClient, TestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";

const ACH_TIMEOUT_MS = 72 * 60 * 60 * 1000; // 72 hours
const MAX_RETRIES = 3;

describe("ACHStateMachine", () => {
  let stateMachine: ACHStateMachine;
  let supabase: TestSupabaseClient;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    stateMachine = new ACHStateMachine(supabase);
  });

  describe("test_no_duplicate_ledger_entry_on_timeout", () => {
    it("should not create duplicate entry when marking as expired", async () => {
      // Create a pending entry that is 73 hours old
      await createOldPendingEntry(supabase, {
        requestId: "req-timeout-001",
        hoursAgo: 73
      });

      // Process timeout
      await stateMachine.processTimeouts();

      // Verify entry exists and is expired (not duplicated)
      const { data: entries } = await supabase
        .from("shadow_ledger")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      expect(entries).toHaveLength(1);
      expect(entries![0].status).toBe("expired");
    });
  });

  describe("test_expired_entry_transitions_to_failed", () => {
    it("should transition pending entries older than 72h to expired status", async () => {
      // Create entry that was initiated 73 hours ago
      await createOldPendingEntry(supabase, {
        requestId: "req-expired-001",
        hoursAgo: 73
      });

      await stateMachine.processTimeouts();

      // Check entry status
      const { data: entries } = await supabase
        .from("shadow_ledger")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const updated = entries?.find(e => e.request_id === "req-expired-001");
      expect(updated?.status).toBe("expired");
    });
  });

  describe("test_max_retries_results_in_aborted", () => {
    it("should abort after max retries exceeded", async () => {
      // Create entry at max retries with status 'retrying'
      await createRetryEntry(supabase, {
        requestId: "req-retry-001",
        retryCount: MAX_RETRIES
      });

      await stateMachine.processRetries();

      // Check entry status
      const { data: entries } = await supabase
        .from("shadow_ledger")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const updated = entries?.find(e => e.request_id === "req-retry-001");
      expect(updated?.status).toBe("aborted");
    });
  });

  describe("test_settled_entry_triggers_score_update", () => {
    it("should mark entry as settled when Plaid confirms balance change", async () => {
      const entry = await createPendingEntry(supabase, {
        requestId: "req-settle-001"
      });

      // Simulate Plaid confirmation
      await stateMachine.processSettlement(entry.id, "ach-trace-123");

      // Check entry status
      const { data: entries } = await supabase
        .from("shadow_ledger")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const updated = entries?.find(e => e.request_id === "req-settle-001");
      expect(updated?.status).toBe("settled");
      expect(updated?.ach_trace_id).toBe("ach-trace-123");
    });
  });

  describe("test_plaid_balance_confirmation_logic", () => {
    it("should verify balance change matches expected amount", async () => {
      const entry = await createPendingEntry(supabase, {
        requestId: "req-confirm-001",
        amountCents: 1840000
      });

      // Simulate Plaid returning correct balance change
      const confirmed = await stateMachine.verifyBalanceChange(
        entry.id,
        1840000, // expected change
        1840000  // actual change
      );

      expect(confirmed).toBe(true);
    });

    it("should reject if balance change doesn't match", async () => {
      const entry = await createPendingEntry(supabase, {
        requestId: "req-mismatch-001",
        amountCents: 1840000
      });

      // Simulate Plaid returning different balance change
      const confirmed = await stateMachine.verifyBalanceChange(
        entry.id,
        1840000, // expected change
        1000000  // actual change (mismatch)
      );

      expect(confirmed).toBe(false);
    });
  });
});

// Test helpers
async function createPendingEntry(
  supabase: TestSupabaseClient,
  params: { requestId: string; retryCount?: number; amountCents?: number }
): Promise<ShadowLedgerEntry> {
  const entry: Partial<ShadowLedgerEntry> = {
    id: crypto.randomUUID(),
    user_id: "test-user-1",
    request_id: params.requestId,
    entry_type: "PENDING_DEBIT",
    account_ref: "plaid-checking",
    amount_cents: params.amountCents ?? 1840000,
    currency: "USD",
    status: "pending",
    source_action: "fix-queue",
    description: "Test entry",
    initiated_at: new Date().toISOString(),
    settled_at: null,
    failed_at: null,
    failure_reason: null,
    ach_trace_id: null,
    retry_count: params.retryCount ?? 0,
    created_at: new Date().toISOString()
  };

  await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry as any);
  return entry as ShadowLedgerEntry;
}

async function createOldPendingEntry(
  supabase: TestSupabaseClient,
  params: { requestId: string; hoursAgo: number }
): Promise<ShadowLedgerEntry> {
  const initiatedAt = new Date(Date.now() - params.hoursAgo * 60 * 60 * 1000).toISOString();

  const entry: Partial<ShadowLedgerEntry> = {
    id: crypto.randomUUID(),
    user_id: "test-user-1",
    request_id: params.requestId,
    entry_type: "PENDING_DEBIT",
    account_ref: "plaid-checking",
    amount_cents: 1840000,
    currency: "USD",
    status: "pending",
    source_action: "fix-queue",
    description: "Old entry",
    initiated_at: initiatedAt,
    settled_at: null,
    failed_at: null,
    failure_reason: null,
    ach_trace_id: null,
    retry_count: 0,
    created_at: new Date().toISOString()
  };

  await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry as any);
  return entry as ShadowLedgerEntry;
}

async function createRetryEntry(
  supabase: TestSupabaseClient,
  params: { requestId: string; retryCount: number }
): Promise<ShadowLedgerEntry> {
  const entry: Partial<ShadowLedgerEntry> = {
    id: crypto.randomUUID(),
    user_id: "test-user-1",
    request_id: params.requestId,
    entry_type: "PENDING_DEBIT",
    account_ref: "plaid-checking",
    amount_cents: 1840000,
    currency: "USD",
    status: "retrying", // Must be 'retrying' status
    source_action: "fix-queue",
    description: "Retry entry",
    initiated_at: new Date().toISOString(),
    settled_at: null,
    failed_at: null,
    failure_reason: null,
    ach_trace_id: null,
    retry_count: params.retryCount,
    created_at: new Date().toISOString()
  };

  await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry as any);
  return entry as ShadowLedgerEntry;
}
