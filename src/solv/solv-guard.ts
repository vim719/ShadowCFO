import type { TestSupabaseClient } from "../test-utils/supabase";

// ADR-001 compliance rules — hardcoded, not configuration
export const SOLV_PROHIBITED_USES = [
  'subscription_discount',
  'cash_equivalent_redemption',
  'transferable_to_other_users',
  'tradeable_on_any_exchange',
  'early_access_to_paid_features',
  'affiliate_commission',
] as const;

export const SOLV_PERMITTED_USES = [
  'unlock_tier_features',
  'display_achievement_badge',
  'legacy_vault_unlock',
  'priority_scan_queue',
  'founder_slack_access',
] as const;

export const ARCHITECT_TIER_THRESHOLD = 1000;
export const SUBSCRIPTION_PRICE_CENTS = 4900; // $49.00

export interface TierAccessResult {
  allowed: boolean;
  reason?: string;
}

export interface SOLVValidationResult {
  permitted: boolean;
  reason?: string;
}

export class SOLVGuard {
  constructor(private readonly supabase: TestSupabaseClient) {}

  validateSolvAction(
    action: string,
    _amount: number
  ): SOLVValidationResult {
    if (SOLV_PROHIBITED_USES.includes(action as any)) {
      return {
        permitted: false,
        reason: `ADR-001: ${action} violates $SOLV non-security designation`
      };
    }
    return { permitted: true };
  }

  async checkTierAccess(
    userId: string,
    solvBalance: number,
    requestedTier: string
  ): Promise<TierAccessResult> {
    if (requestedTier === "architect") {
      if (solvBalance < ARCHITECT_TIER_THRESHOLD) {
        return {
          allowed: false,
          reason: `Architect tier requires minimum ${ARCHITECT_TIER_THRESHOLD} $SOLV`
        };
      }
    }

    return { allowed: true };
  }

  getSubscriptionPrice(solvBalance: number): number {
    // CRITICAL: Subscription price is constant regardless of $SOLV balance
    // This is enforced to maintain ADR-001 compliance
    return SUBSCRIPTION_PRICE_CENTS;
  }
}
