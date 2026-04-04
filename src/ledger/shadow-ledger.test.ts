import { beforeEach, describe, expect, it } from "bun:test";
import { ShadowLedger } from "./shadow-ledger";
import { createTestSupabaseClient } from "../test-utils/supabase";

describe("ShadowLedger", () => {
  let ledger: ShadowLedger;

  beforeEach(async () => {
    const supabase = createTestSupabaseClient();
    ledger = new ShadowLedger(supabase);
    await supabase
      .from("shadow_ledger")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  });

  it("test_ledger_must_balance_to_zero", async () => {
    const userId = "test-user-1";

    await ledger.createEntry({
      userId,
      requestId: "req-001",
      entryType: "PENDING_DEBIT",
      accountRef: "plaid-checking-123",
      amountCents: 1_840_000,
      sourceAction: "fix-queue-item-abc",
      description: "HYSA sweep"
    });

    await ledger.createEntry({
      userId,
      requestId: "req-002",
      entryType: "PENDING_CREDIT",
      accountRef: "plaid-savings-456",
      amountCents: 1_840_000,
      sourceAction: "fix-queue-item-abc",
      description: "HYSA sweep - destination"
    });

    const balance = await ledger.getNetBalance(userId, "settled");
    expect(balance).toBe(0);
  });

  it("test_idempotent_insert_returns_existing", async () => {
    const payload = {
      userId: "test-user-1",
      requestId: "req-duplicate",
      entryType: "PENDING_DEBIT" as const,
      accountRef: "plaid-checking-123",
      amountCents: 100_000,
      sourceAction: "fix-abc",
      description: "Test"
    };

    const first = await ledger.createEntry(payload);
    const second = await ledger.createEntry(payload);

    expect(first.id).toBe(second.id);
  });

  it("test_pending_entry_does_not_affect_score", async () => {
    const userId = "test-user-score";

    await ledger.createEntry({
      userId,
      requestId: "req-pending-score",
      entryType: "PENDING_DEBIT",
      accountRef: "plaid-checking",
      amountCents: 500_000,
      sourceAction: "fix-abc",
      description: "Pending - should not affect score"
    });

    const scoreInputs = await ledger.getSettledEntriesForScoring(userId);
    expect(scoreInputs.length).toBe(0);
  });

  it("test_sweep_fails_if_balance_below_buffer", async () => {
    const result = await ledger.validateSweepAmount(
      "test-user-1",
      "plaid-checking",
      60_000,
      100_000,
      50_000
    );

    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("below_buffer");
  });
});
