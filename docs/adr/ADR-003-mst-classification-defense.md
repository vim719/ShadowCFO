# ADR-003: MSB Classification Defense

**Date:** April 3, 2026  
**Status:** Accepted  

## Context

Money Services Business (MSB) classification is a risk if an aggressive state AG
argues that Shadow CFO's Fix Queue constitutes unauthorized money transmission.

## Current Defense

### Why We Are NOT an MSB

1. **We do not hold funds**
   - Shadow CFO never takes custody of user money
   - All transfers are user-initiated and user-executed

2. **We do not initiate transfers**
   - Every action requires explicit user approval
   - Transfers are executed by the user on their bank's website

3. **We are a software tool**
   - Shows recommendations and instructions
   - User executes transactions themselves
   - Precedent: Mint, YNAB, Personal Capital have never been MSBs

### Technical Enforcement

```typescript
// Consent Gate enforces user-initiated action
// Every fix approval requires:
// 1. Valid WebAuthn consent signature
// 2. x-shadow-request-id header
// 3. User explicitly taps "Approve"
```

## If Challenged

### Immediate Response (Within 24 hours)
1. Engage fintech regulatory counsel
2. Do NOT respond to press or regulators without counsel
3. Preserve all records

### Product Response
1. Add friction to Fix Queue:
```typescript
// New consent step
const fixQueueConsent = {
  message: "I understand I am executing this transfer myself",
  required: true,
  checkbox: true
}
```

2. Add "We do not touch your money" language to every Fix Queue card:
```typescript
const fixCardDisclaimer = 
  "Shadow CFO does not initiate or execute transfers. 
   All actions are taken by you on your bank's website."
```

## Legal Precedent

| Company | Status | Defense |
|---------|--------|---------|
| Mint | Never classified as MSB | Advisory only |
| YNAB | Never classified as MSB | Budgeting tool |
| Personal Capital | Never classified as MSB | Portfolio tracking |

## Never Do

- ❌ Initiate transfers programmatically
- ❌ Store payment credentials or routing numbers
- ❌ Position as executing transactions on behalf of users
- ❌ Use language like "we move your money"

## Always Do

- ✅ "User-initiated"
- ✅ "We recommend, you execute"
- ✅ "We never touch your funds"
- ✅ Cryptographic consent proof

---

*This ADR documents our MSB defense posture and escalation procedures.*
