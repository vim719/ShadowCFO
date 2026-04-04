# Shadow CFO — True Scope

Date: April 3, 2026

## Inputs Reviewed

- `Version-2-shadow_cfo_living_prd-3.md`
- `Version-2-shadow_cfo_technical_design_doc.md`
- `Version2-shadow_cfo_complete_context-3.md`
- `shadow_cfo_product_demo.html`
- Founder direction from this session:
  - show Sarah the why / how / when / where behind each action
  - do not execute actions directly for her
  - keep the product in the education / coaching lane, not financial advice

## Executive Decision

Shadow CFO should ship first as a read-only financial intelligence and guided-action product, not as an autonomous execution product.

That means the first coded MVP is:

- connect accounts or upload statements
- detect financial leakage from real user data
- explain each finding in plain English
- turn findings into step-by-step action plans
- let the user mark progress and revisit outcomes

That means the first coded MVP is not:

- direct money movement
- ACH initiation
- bank-side execution
- personalized security selection
- one-tap fund swaps
- tokenized behavioral gating

## Why This Is The Correct Scope

This resolves the biggest contradictions across the source documents:

1. The PRD and demo use "one tap executes" language, but the technical design doc and founder guidance narrow the legal lane to user-directed, user-executed actions.
2. The PRD says `$SOLV` is P2 / Month 3, while the technical design doc pulls `$SOLV` into the core implementation path. That is scope creep and regulatory creep.
3. The PRD/context recommend a no-code Bubble + Make.com MVP, while the technical design doc proposes a hardened Bun backend. Both can be valid, but not at the same moment for the same first sprint.
4. Several PRD/demo examples name specific financial products or fund swaps. That increases advice risk and pushes the product closer to RIA territory.
5. The shadow ledger, consent gate, idempotency layer, and ACH state machine are valuable only if Shadow CFO is actually initiating or coordinating financial execution. In a recommendation-first MVP, they are not the first thing to build.

## Product Thesis For V1

Shadow CFO is a personal finance operating layer that finds hidden leakage across a user's real accounts and converts it into explainable, user-executed next steps.

Core promise:

> Sarah connects her data and sees what she is losing, why it is happening, what to do next, where to do it, and when it matters.

## Sarah Experience In V1

### 1. Connect

Sarah either:

- connects accounts through read-only Plaid, or
- uploads CSV / statement files as fallback

### 2. Understand

The dashboard shows:

- total annual leakage found
- categories of leakage
- actions ready now
- actions that need CPA / attorney / HR follow-up
- confidence level and data provenance for each finding

### 3. Act

Each finding becomes a guided action card with:

- `Why this matters`
- `How we calculated it`
- `When to act`
- `Where to go`
- `Exact next steps`
- `What data we used`
- `What could change this conclusion`
- clear educational disclaimer

### 4. Track

Sarah can mark an action as:

- `not now`
- `started`
- `completed by me`
- `needs help`

### 5. Re-verify

On the next sync or upload, Shadow CFO can:

- confirm whether the underlying condition changed
- keep the action marked as pending if data has not changed
- avoid claiming money was saved before the accounts reflect it

## Scope In

These are the right V1 features for this repo:

### P0

- auth and secure user sessions
- Plaid read-only account connection
- CSV upload fallback for statements / transactions
- deterministic leakage detection for safe categories
- explainable findings dashboard
- guided action queue
- audit log of AI-generated or system-generated findings
- legal disclaimers on every finding and action plan
- Stripe billing and trial handling

### Safe First Detection Categories

- cash drag
- subscription leakage
- employer match gap
- basic loan / high-interest debt alerts
- OBBBA informational flags that explicitly require CPA review

### P1 After Initial Validation

- weekly digest
- score history and progress views
- CPA memo generation
- manual document upload workflows
- better confidence scoring and re-verification

## Scope Out

These should not be built in the first coded MVP:

- direct transfers or bank execution
- "Approve and we do it" flows
- ACH orchestration
- shadow ledger for pending money movement
- WebAuthn consent for transfer authorization
- investment product swaps with named funds
- personalized buy / sell / rebalance recommendations
- `$SOLV` token economy
- Architect tier unlocks
- alt alpha or private asset access

## Compliance Interpretation

The founder's updated direction is the safest product lane:

- educational and coaching framing stays intact
- user remains the executor
- Shadow CFO does not touch funds
- Shadow CFO does not claim to be an advisor
- the product explains options and next steps using user data, but avoids personalized securities advice

Recommended wording shift:

- replace `One-Tap Fix Queue` with `Guided Action Queue`
- replace `Approve` with `Open Steps` or `Mark Started`
- replace `One tap executes` with `We show you exactly how to do this`
- replace `Done. We've moved...` with `Marked complete. We'll verify on your next sync.`

## Technical Direction For This Repo

Because this workspace is code-first and currently empty, the implementation should not mirror the no-code Bubble plan literally. The safer code-first equivalent is:

- Next.js + TypeScript for app + server routes
- Supabase for auth, Postgres, and row-level security
- Plaid for read-only data ingestion
- Stripe for billing
- PostHog for product analytics

Do not start this repo with the Bun-based execution backend from the technical design doc. That backend is a Phase 2 design for a more regulated product mode.

## Recommended Initial Data Model

Start with these tables:

- `users`
- `connected_accounts`
- `account_snapshots`
- `transactions`
- `findings`
- `action_plans`
- `action_events`
- `audit_log`
- `document_uploads`

Recommended `findings.status`:

- `new`
- `reviewed`
- `started`
- `user_confirmed`
- `reverified`
- `dismissed`

Recommended `action_plans.type`:

- `self_serve`
- `needs_cpa`
- `needs_attorney`
- `needs_hr`
- `monitor_only`

## UX Rules That Should Be Locked

Every finding card should answer:

- why this matters
- how the number was estimated
- what account or pattern triggered it
- what Sarah should do next
- where she should go to do it
- when urgency matters
- whether Shadow CFO can verify completion later

Every action card should also show:

- confidence level
- data freshness
- disclaimer
- risk note if assumptions are incomplete

## Black Swan Risks Neutralized By This Scope

This scope directly lowers the risks raised in the April 2026 review:

- `CFPB 1033 stay risk`: mitigated by CSV / statement upload fallback
- `MSB / money transmission risk`: largely avoided because users execute actions themselves
- `ACH race conditions`: avoided because V1 does not initiate transfers
- `shadow ledger mismatch`: deferred until execution is a real product requirement
- `$SOLV` securities risk: avoided by de-scoping `$SOLV` from MVP

## What The Friend's Review Got Right

The review is directionally right about the major risks. But the best response is not to build the hardened execution stack first. The best response is to remove execution from the MVP scope, prove users trust the findings and action plans, and only then decide whether transfer initiation is worth the added legal and technical burden.

## Build Order I Recommend

### Slice 1

- app shell
- auth
- user onboarding
- Plaid sandbox connection
- sample seeded findings

### Slice 2

- deterministic cash-drag detector
- guided action card format
- dashboard + action queue screens

### Slice 3

- employer match detector
- subscription leakage detector
- audit log + explainability trace

### Slice 4

- CSV upload fallback
- weekly digest
- self-confirmed completion + re-verification states

## First Coding Target

Do not start with `feat(core): init shadow-ledger`.

Start with:

`feat(core): guided findings + action plans`

Tests for that first slice should prove:

- findings are explainable
- findings never render without a disclaimer
- action plans include why / how / when / where fields
- no action plan in V1 implies Shadow CFO executed a transaction
- score or progress does not increase purely because a recommendation was shown

## Final Scope Statement

Shadow CFO V1 is an explainable, read-only financial intelligence dashboard for Sarah.

It finds leakage from real account data, turns that into guided next steps, and helps her follow through without pretending to be a financial advisor or silently crossing into money movement.
