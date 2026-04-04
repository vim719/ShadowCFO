import { beforeEach, describe, expect, it } from "bun:test";
import { SOLVGuard, SOLV_PROHIBITED_USES, SOLV_PERMITTED_USES } from "./solv-guard";
import { createTestSupabaseClient } from "../test-utils/supabase";

describe("SOLVGuard", () => {
  let guard: SOLVGuard;

  beforeEach(() => {
    const supabase = createTestSupabaseClient();
    guard = new SOLVGuard(supabase);
  });

  describe("test_deny_architect_features_to_new_users", () => {
    it("should deny architect features to users with 0 $SOLV", async () => {
      const result = await guard.checkTierAccess("user-new", 0, "architect");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("minimum");
    });
  });

  describe("test_unlock_architect_at_exactly_1000_solv", () => {
    it("should unlock architect features at exactly 1000 $SOLV", async () => {
      const result = await guard.checkTierAccess("user-architect", 1000, "architect");

      expect(result.allowed).toBe(true);
    });
  });

  describe("test_denied_tier_below_threshold", () => {
    it("should deny architect tier below 1000 $SOLV", async () => {
      const result = await guard.checkTierAccess("user-almost", 999, "architect");

      expect(result.allowed).toBe(false);
    });
  });
});

describe("ADR-001: $SOLV Non-Security Compliance", () => {
  let guard: SOLVGuard;

  beforeEach(() => {
    const supabase = createTestSupabaseClient();
    guard = new SOLVGuard(supabase);
  });

  it("adr001_solv_has_no_monetary_value", () => {
    // $SOLV cannot be used for subscription discounts
    const result = guard.validateSolvAction("subscription_discount", 1000);
    expect(result.permitted).toBe(false);
    expect(result.reason).toContain("ADR-001");
  });

  it("adr001_solv_is_non_transferable", () => {
    const result = guard.validateSolvAction("transferable_to_other_users", 100);
    expect(result.permitted).toBe(false);
  });

  it("adr001_price_is_constant_regardless_of_solv", async () => {
    // User with 2,500 $SOLV pays same as user with 0
    const price = guard.getSubscriptionPrice(2500);

    expect(price).toBe(4900); // $49.00 in cents
  });

  it("adr001_solv_earned_only_by_user_actions", () => {
    // $SOLV cannot be earned by referring others for payment
    const result = guard.validateSolvAction("affiliate_commission", 50);
    expect(result.permitted).toBe(false);

    // $SOLV CAN be earned for fixing your own accounts
    const permitted = guard.validateSolvAction("unlock_tier_features", 10);
    expect(permitted.permitted).toBe(true);
  });

  it("adr001_prohibited_uses_are_blocked", () => {
    for (const prohibited of SOLV_PROHIBITED_USES) {
      const result = guard.validateSolvAction(prohibited, 100);
      expect(result.permitted).toBe(false);
    }
  });

  it("adr001_permitted_uses_are_allowed", () => {
    for (const permitted of SOLV_PERMITTED_USES) {
      const result = guard.validateSolvAction(permitted, 100);
      expect(result.permitted).toBe(true);
    }
  });
});
