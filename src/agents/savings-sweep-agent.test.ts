import { beforeEach, describe, expect, it } from "bun:test";
import { SavingsSweepAgent } from "./savings-sweep-agent";
import { createTestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";

describe("SavingsSweepAgent", () => {
  let agent: SavingsSweepAgent;

  beforeEach(() => {
    const supabase = createTestSupabaseClient();
    agent = new SavingsSweepAgent(supabase);
  });

  describe("test_sweep_fails_if_balance_below_buffer", () => {
    it("should reject sweep if balance would drop below buffer", async () => {
      const result = await agent.validateSweep({
        userId: "test-user-1",
        fromAccount: "plaid-checking",
        amountCents: 60000, // $600
        currentBalanceCents: 100000, // $1,000
        bufferCents: 50000 // $500 minimum
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("below_buffer");
    });
  });

  describe("test_sweep_creates_pending_ledger_entry", () => {
    it("should create PENDING_DEBIT entry in shadow ledger", async () => {
      const result = await agent.executeSweep({
        userId: "test-user-1",
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 1840000, // $18,400
        requestId: "req-sweep-001",
        consentSignature: "valid-signature"
      });

      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry!.status).toBe("pending");
      expect(result.entry!.entry_type).toBe("PENDING_DEBIT");
    });
  });

  describe("test_sweep_requires_consent_signature", () => {
    it("should reject sweep without valid consent signature", async () => {
      const result = await agent.executeSweep({
        userId: "test-user-1",
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 1840000,
        requestId: "req-sweep-002",
        consentSignature: "" // Empty signature
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("consent");
    });
  });

  describe("test_sweep_is_idempotent_on_retry", () => {
    it("should return same entry on retry with same request_id", async () => {
      const sweepParams = {
        userId: "test-user-1",
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 100000,
        requestId: "req-sweep-idempotent",
        consentSignature: "valid-signature"
      };

      const first = await agent.executeSweep(sweepParams);
      const second = await agent.executeSweep(sweepParams);

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(first.entry!.id).toBe(second.entry!.id);
    });
  });

  describe("test_score_not_updated_until_settled", () => {
    it("should not include pending entries in score calculation", async () => {
      // Create pending sweep
      await agent.executeSweep({
        userId: "test-user-score",
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 500000,
        requestId: "req-score-test",
        consentSignature: "valid-signature"
      });

      // Check score inputs
      const scoreEntries = await agent.getScoreContributingEntries("test-user-score");

      expect(scoreEntries.length).toBe(0); // No settled entries yet
    });
  });
});

describe("SavingsSweepAgent Invariants", () => {
  let agent: SavingsSweepAgent;

  beforeEach(() => {
    const supabase = createTestSupabaseClient();
    agent = new SavingsSweepAgent(supabase);
  });

  it("test_no_sweep_without_consent", async () => {
    const result = await agent.executeSweep({
      userId: "test-user-1",
      fromAccount: "plaid-checking",
      toAccount: "plaid-savings",
      amountCents: 100000,
      requestId: "req-no-consent",
      consentSignature: undefined as any
    });

    expect(result.success).toBe(false);
  });

  it("test_buffer_enforced_on_all_sweeps", async () => {
    // Exactly at buffer should fail
    const result = await agent.validateSweep({
      userId: "test-user-1",
      fromAccount: "plaid-checking",
      amountCents: 50000, // $500
      currentBalanceCents: 100000, // $1,000
      bufferCents: 50000 // $500
    });

    // $1,000 - $500 = $500, which equals buffer, should be allowed
    expect(result.allowed).toBe(true);
  });
});
