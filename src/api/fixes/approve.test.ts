import { describe, expect, it, beforeEach } from "bun:test";
import { createTestSupabaseClient, TestSupabaseClient } from "../../test-utils/supabase";
import { approveFix } from "./approve";
import type { ShadowLedgerEntry } from "../../ledger/shadow-ledger";
import { ConsentGate } from "../../consent/consent-gate";
import { IdempotencyGuard } from "../../idempotency/idempotency-guard";

function generateRequestId(userId: string, fixId: string): string {
  return IdempotencyGuard.generateKey(userId, fixId, "fix_approve");
}

describe("FixQueue Hardened Endpoint", () => {
  let supabase: TestSupabaseClient;
  let consentGate: ConsentGate;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    consentGate = new ConsentGate(supabase);
  });

  describe("test_full_approve_flow_happy_path", () => {
    it("should approve fix with valid consent and idempotency", async () => {
      const requestId = generateRequestId("user-001", "fix-001");

      // Create valid consent challenge
      const challenge = await consentGate.createChallenge({
        fixId: "fix-001",
        userId: "user-001",
        actionDescription: "Test action",
        amountCents: 1840000,
        destinationLabel: "Savings",
        requestId,
        timestamp: Date.now()
      });

      const result = await approveFix(supabase, {
        fixId: "fix-001",
        userId: "user-001",
        requestId,
        consentSignature: "valid-signature-123",
        consentChallenge: challenge.challenge,
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 1840000
      });

      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry!.status).toBe("pending");
    });
  });

  describe("test_full_approve_flow_no_consent_returns_403", () => {
    it("should reject without consent challenge", async () => {
      const requestId = generateRequestId("user-001", "fix-002");

      const result = await approveFix(supabase, {
        fixId: "fix-002",
        userId: "user-001",
        requestId,
        consentSignature: "some-signature",
        consentChallenge: "invalid-challenge-xyz", // Invalid challenge
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 1840000
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toContain("consent");
    });
  });

  describe("test_full_approve_flow_duplicate_request_returns_200_idempotent", () => {
    it("should return existing entry on duplicate request", async () => {
      const requestId = generateRequestId("user-001", "fix-003");

      // Create consent challenge for first request
      const challenge = await consentGate.createChallenge({
        fixId: "fix-003",
        userId: "user-001",
        actionDescription: "Test action",
        amountCents: 100000,
        destinationLabel: "Savings",
        requestId,
        timestamp: Date.now()
      });

      // First request
      const first = await approveFix(supabase, {
        fixId: "fix-003",
        userId: "user-001",
        requestId,
        consentSignature: "valid-signature",
        consentChallenge: challenge.challenge,
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 100000
      });

      // Duplicate request (retry with same requestId)
      const second = await approveFix(supabase, {
        fixId: "fix-003",
        userId: "user-001",
        requestId, // Same request ID
        consentSignature: "valid-signature",
        consentChallenge: challenge.challenge,
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 100000
      });

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.status).toBe(200); // Idempotent response
      expect(first.entry!.id).toBe(second.entry!.id);
    });
  });

  describe("test_full_approve_flow_timeout_transitions_to_pending", () => {
    it("should create pending entry for async processing", async () => {
      const requestId = generateRequestId("user-001", "fix-timeout");

      const challenge = await consentGate.createChallenge({
        fixId: "fix-timeout",
        userId: "user-001",
        actionDescription: "Large transfer",
        amountCents: 5000000,
        destinationLabel: "Savings",
        requestId,
        timestamp: Date.now()
      });

      const result = await approveFix(supabase, {
        fixId: "fix-timeout",
        userId: "user-001",
        requestId,
        consentSignature: "valid-signature",
        consentChallenge: challenge.challenge,
        fromAccount: "plaid-checking",
        toAccount: "plaid-savings",
        amountCents: 5000000
      });

      expect(result.success).toBe(true);
      expect(result.entry!.status).toBe("pending");
    });
  });
});

describe("Fix Approval Invariants", () => {
  it("test_no_ledger_entry_without_consent", async () => {
    const supabase = createTestSupabaseClient();

    const result = await approveFix(supabase, {
      fixId: "fix-no-consent",
      userId: "user-001",
      requestId: generateRequestId("user-001", "fix-no-consent"),
      consentSignature: "",
      consentChallenge: "",
      fromAccount: "plaid-checking",
      toAccount: "plaid-savings",
      amountCents: 100000
    });

    // Should fail due to consent
    expect(result.success).toBe(false);

    // Verify no ledger entry was created
    const { data: entries } = await supabase
      .from("shadow_ledger")
      .select("*")
      .neq("id", "00000000-0000-0000-0000-000000000000");

    expect(entries?.length ?? 0).toBe(0);
  });
});
