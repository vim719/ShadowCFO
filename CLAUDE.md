# Shadow CFO - Technical Design Doc Implementation

## Project Overview
Shadow CFO is a personal finance platform implementing the Technical Design Doc (v1.0).

**Repository:** `~/Documents/ShadowCFO`

## Architecture

### Double-Entry Accounting (Shadow Ledger)
All financial state changes flow through the shadow ledger first:
- `src/ledger/shadow-ledger.ts` — Core ledger operations
- Invariant: credits = debits at all times

### Consent & Idempotency
Every fix action requires cryptographic consent:
- `src/consent/consent-gate.ts` — WebAuthn consent verification
- `src/idempotency/idempotency-guard.ts` — x-shadow-request-id enforcement

### ACH State Machine
72-hour timeout handling for pending transfers:
- `src/jobs/ach-state-machine.ts` — pending → settled/failed/expired

### $SOLV (ADR-001 Compliant)
Non-transferable behavioral token:
- `src/solv/solv-guard.ts` — ADR-001 compliance enforcement

## Build Order (Part 7 of Technical Design Doc)
1. `feat(core): init shadow-ledger` ✅
2. `feat(auth): 1033-consent-gate` ✅
3. `feat(idempotency): request-id-guard` ✅
4. `feat(agent): hy-savings-sweep` ✅
5. `fix(edge): ach-timeout-handler` ✅
6. `feat(solv): architect-tier-gate` ✅
7. `docs(adr): regulatory-moat` ✅
8. `feat(api): fix-queue-hardened-endpoint` ✅

## Commands

```bash
bun test           # Run all tests
bun test src/xxx  # Run specific test file
```

## Standards

### TDD Required
- Write tests BEFORE implementation
- All tests must pass before commit
- 80%+ coverage target

### Invariants (Never Violate)
- No fix action completes without valid consent signature
- No duplicate shadow ledger entries for same request_id
- No score improvement until ledger entry status = 'settled'
- $SOLV cannot reduce subscription price
- Every AI recommendation logged before user sees it

### ADR Documents
- `docs/adr/ADR-001-solv-non-security.md`
- `docs/adr/ADR-002-cfpb-1033-contingency.md`
- `docs/adr/ADR-003-mst-classification-defense.md`
