# ADR-001: $SOLV Token Non-Security Designation

**Date:** April 3, 2026  
**Status:** Accepted  
**Reviewed by:** Fractional compliance counsel  

## Context

Shadow CFO uses a behavioral incentive token ($SOLV) to reward financial
health actions. We must ensure this token does not meet the SEC's definition
of a security under the Howey Test.

## Decision

$SOLV is structured as a non-transferable, non-monetary credential with the
following binding constraints:

### Constraint 1: No Monetary Value

$SOLV cannot be converted to USD, subscription credits, or any asset with 
monetary value.

```typescript
// PROHIBITED - Never do this:
const price = solvBalance > 1000 ? 39.00 : 49.00

// REQUIRED - Always this:
const price = 49.00  // Constant regardless of $SOLV balance
```

### Constraint 2: No Transferability

$SOLV cannot be sent to another user, sold on any platform, or inherited.
It is tied to the individual user account and deleted upon account deletion.

```typescript
// PROHIBITED
transferSolv(fromUser, toUser, amount)

// REQUIRED
// No transfer function exists in the codebase
```

### Constraint 3: No Subscription Discount

The $49/month subscription price is constant for all users regardless of
$SOLV balance. $SOLV unlocks features, never reduces price.

```typescript
// Enforced in SOLVGuard.getSubscriptionPrice()
export const SUBSCRIPTION_PRICE_CENTS = 4900

getSubscriptionPrice(solvBalance: number): number {
  return SUBSCRIPTION_PRICE_CENTS  // Always $49
}
```

### Constraint 4: Effort-Based, Not Investment-Based

$SOLV is earned exclusively through financial health actions the user takes
(fixing their own accounts). It is NOT earned by:
- Referring others for payment
- Holding a balance
- Any investment-type activity

### Constraint 5: GENIUS Act Credential Framing

$SOLV is structured as a "membership credential" under the GENIUS Act framework
— functionally equivalent to a LinkedIn skill badge or a loyalty tier status.

## Prohibited Uses (Hardcoded)

```typescript
const SOLV_PROHIBITED_USES = [
  'subscription_discount',       // $SOLV reduces subscription price
  'cash_equivalent_redemption',  // $SOLV converts to USD
  'transferable_to_other_users', // Cannot send to another account
  'tradeable_on_any_exchange',   // Cannot list anywhere
  'early_access_to_paid_features', // Cannot skip paywall
  'affiliate_commission',        // Referrals earn money, not $SOLV
] as const;
```

## Permitted Uses

```typescript
const SOLV_PERMITTED_USES = [
  'unlock_tier_features',      // Gated educational features
  'display_achievement_badge',  // Credential/identity function
  'legacy_vault_unlock',         // Relationship feature
  'priority_scan_queue',         // Faster processing
  'founder_slack_access',        // Community access
] as const;
```

## Verification

ADR-001 compliance is verified by the test suite:

```bash
bun test src/solv/solv-guard.test.ts
```

Tests:
- `adr001_solv_has_no_monetary_value`
- `adr001_solv_is_non_transferable`
- `adr001_price_is_constant_regardless_of_solv`
- `adr001_solv_earned_only_by_user_actions`

## Consequences

If any feature request would violate constraints 1–5, it must be rejected
at the design level, not the implementation level. Engineers must run
`validateSolvAction()` before implementing any new $SOLV earning or
spending mechanic.

## Review History

| Date | Reviewer | Notes |
|------|----------|-------|
| 2026-04-03 | Fractional counsel | Initial review - approved |

---

*This ADR is legally binding. Violations may result in SEC enforcement action.*
