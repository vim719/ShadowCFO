# ADR-002: CFPB 1033 Contingency Plan

**Date:** April 3, 2026  
**Status:** Accepted  

## Context

CFPB Section 1033 grants users the right to share financial data with authorized
representatives. Industry lobbying (bank trade groups) could trigger an 
administrative stay on enforcement.

## Trigger

```
CFPB issues 90-day stay on Section 1033 enforcement
```

## Immediate Actions (Week 1)

### 1. Pause New Connections
```typescript
// Flag in database
ALTER TABLE plaid_connections ADD COLUMN IF NOT EXISTS 
  connection_paused_due_to_regulatory_stay BOOLEAN DEFAULT FALSE;
```

### 2. Review Existing Plaid Connections
Plaid has contractual data sharing agreements with banks independent of CFPB 1033.
These likely survive a regulatory stay.

### 3. Legal Counsel Review
Does our "authorized representative" framing survive without 1033?
- Answer: likely yes, via contractual basis

## Fallback Data Strategy

### Primary: Manual CSV Upload
```
User downloads CSV from Chase/Fidelity/etc
  ↓
Shadow CFO parses and analyzes
  ↓
No real-time sync, but data still available
```

Precedent: Monarch Money has this fallback today.

### Secondary: Screen Scraping via Ocrolus API
```
User uploads PDF statements
  ↓
Ocrolus extracts structured data
  ↓
Compliant with all current regs (user provides data)
```

## Product Impact

| Feature | Impact | Fallback |
|---------|--------|----------|
| Ghost Money Scanner | Degraded | Manual CSV upload |
| Real-time sync | Disabled | Manual refresh |
| Fix Queue | Works | Works (user-initiated) |
| Score | Stale | Updates on manual upload |

## Communication

```typescript
// Email template
const emailContent = {
  subject: "Updating how we connect to your accounts",
  body: "We're improving our connection method to ensure the best experience..."
  // Do NOT say "regulatory issue"
}
```

## Ship Timeline

- Manual CSV upload: 14 days from stay announcement
- Ocrolus integration: 30 days from stay announcement

---

*This ADR defines our contingency for CFPB 1033 enforcement changes.*
