import { beforeEach, describe, expect, it } from "bun:test";
import { IdempotencyGuard } from "./idempotency-guard";
import { createTestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";

describe("IdempotencyGuard", () => {
  let guard: IdempotencyGuard;
  let supabase: ReturnType<typeof createTestSupabaseClient>;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    guard = new IdempotencyGuard(supabase);
  });

  describe("test_duplicate_request_id_returns_existing_entry", () => {
    it("should return existing entry when same request_id is used", async () => {
      // First: create an entry in shadow_ledger (simulates first request)
      const existingEntry: Partial<ShadowLedgerEntry> = {
        id: "existing-id",
        user_id: "test-user-1",
        request_id: "req-dup-001",
        entry_type: "PENDING_DEBIT",
        account_ref: "plaid-checking",
        amount_cents: 100000,
        currency: "USD",
        status: "pending",
        source_action: "fix-approve",
        description: "Test",
        initiated_at: new Date().toISOString(),
        settled_at: null,
        failed_at: null,
        failure_reason: null,
        ach_trace_id: null,
        created_at: new Date().toISOString()
      };
      await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(existingEntry as any);

      // Second: check idempotency (simulates retry with same request_id)
      const key = {
        requestId: "req-dup-001",
        userId: "test-user-1",
        action: "fix_approve",
        payloadHash: "abc123"
      };

      const result = await guard.checkOrCreate(key);

      expect(result.isNew).toBe(false);
      expect(result.existingEntry).toBeDefined();
    });
  });

  describe("test_missing_request_id_returns_400", () => {
    it("should require request_id in header", async () => {
      const result = guard.validateRequestId(undefined);

      expect(result.valid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("x-shadow-request-id");
    });
  });

  describe("test_request_id_scoped_to_user", () => {
    it("should not return entry from different user", async () => {
      // Create entry for user-1
      const entryForUser1: Partial<ShadowLedgerEntry> = {
        id: "entry-user1",
        user_id: "test-user-1",
        request_id: "req-shared-001",
        entry_type: "PENDING_DEBIT",
        account_ref: "plaid-checking",
        amount_cents: 100000,
        currency: "USD",
        status: "pending",
        source_action: "fix-approve",
        description: "Test",
        initiated_at: new Date().toISOString(),
        settled_at: null,
        failed_at: null,
        failure_reason: null,
        ach_trace_id: null,
        created_at: new Date().toISOString()
      };
      await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entryForUser1 as any);

      // Check with different user
      const keyUser2 = {
        requestId: "req-shared-001",
        userId: "test-user-2",
        action: "fix_approve",
        payloadHash: "abc123"
      };

      const result = await guard.checkOrCreate(keyUser2);

      // Should be new for user-2 because entry belongs to user-1
      expect(result.isNew).toBe(true);
    });
  });

  describe("test_client_retry_uses_same_request_id", () => {
    it("should generate deterministic request_id for same input", async () => {
      const requestId = IdempotencyGuard.generateKey(
        "test-user-1",
        "fix-abc",
        "approve"
      );

      const sameIdempotentKey = IdempotencyGuard.generateKey(
        "test-user-1",
        "fix-abc",
        "approve"
      );

      // The key should be deterministic for user + fix + action
      expect(requestId).toContain("test-user-1");
      expect(requestId).toContain("fix-abc");
      expect(requestId).toContain("approve");
      
      // Second generation should produce same base key (with random suffix)
      expect(sameIdempotentKey).toContain("test-user-1");

      const firstParts = IdempotencyGuard.parseKey(requestId);
      const secondParts = IdempotencyGuard.parseKey(sameIdempotentKey);

      expect(firstParts.userId).toBe("test-user-1");
      expect(firstParts.fixId).toBe("fix-abc");
      expect(firstParts.action).toBe("approve");
      expect(secondParts.userId).toBe("test-user-1");
      expect(secondParts.fixId).toBe("fix-abc");
      expect(secondParts.action).toBe("approve");
      expect(firstParts.attemptId).not.toBe(secondParts.attemptId);
    });
  });

  describe("request id validation", () => {
    it("should reject malformed request ids that do not follow shadow format", () => {
      const result = guard.validateRequestId("just-a-uuid-without-prefix");

      expect(result.valid).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("shadow request id");
    });
  });
});

describe("Idempotency Invariants", () => {
  let guard: IdempotencyGuard;
  let supabase: ReturnType<typeof createTestSupabaseClient>;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    guard = new IdempotencyGuard(supabase);
  });

  it("test_no_duplicate_shadow_ledger_entries", async () => {
    // Create first entry
    const firstEntry: Partial<ShadowLedgerEntry> = {
      id: "first-entry",
      user_id: "test-user-1",
      request_id: "req-no-dup-001",
      entry_type: "PENDING_DEBIT",
      account_ref: "plaid-checking",
      amount_cents: 100000,
      currency: "USD",
      status: "pending",
      source_action: "fix-approve",
      description: "Test",
      initiated_at: new Date().toISOString(),
      settled_at: null,
      failed_at: null,
      failure_reason: null,
      ach_trace_id: null,
      created_at: new Date().toISOString()
    };
    await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(firstEntry as any);

    // Check idempotency with same request_id
    const key = {
      requestId: "req-no-dup-001",
      userId: "test-user-1",
      action: "fix_approve",
      payloadHash: "abc123"
    };

    const result = await guard.checkOrCreate(key);

    expect(result.isNew).toBe(false);
  });
});
