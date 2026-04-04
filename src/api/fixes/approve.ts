import type { TestSupabaseClient } from "../../test-utils/supabase";
import type { ShadowLedgerEntry } from "../../ledger/shadow-ledger";
import { IdempotencyGuard } from "../../idempotency/idempotency-guard";
import { ConsentGate } from "../../consent/consent-gate";

export interface ApproveFixParams {
  fixId: string;
  userId: string;
  requestId: string;
  consentSignature: string;
  consentChallenge: string;
  fromAccount: string;
  toAccount: string;
  amountCents: number;
}

export interface ApproveFixResult {
  success: boolean;
  entry?: ShadowLedgerEntry;
  status?: number;
  error?: string;
}

export async function approveFix(
  supabase: TestSupabaseClient,
  params: ApproveFixParams
): Promise<ApproveFixResult> {
  const idempotencyGuard = new IdempotencyGuard(supabase);
  const consentGate = new ConsentGate(supabase);

  // 1. Validate request ID (idempotency)
  const requestIdValidation = idempotencyGuard.validateRequestId(params.requestId);
  if (!requestIdValidation.valid) {
    return {
      success: false,
      status: 400,
      error: requestIdValidation.error
    };
  }

  // 2. Check idempotency first so client retries return the original result
  const idempotencyResult = await idempotencyGuard.checkOrCreate({
    requestId: params.requestId,
    userId: params.userId,
    action: "fix_approve",
    payloadHash: hashPayload(params)
  });

  if (!idempotencyResult.isNew && idempotencyResult.existingEntry) {
    // Idempotent response - return existing entry
    return {
      success: true,
      entry: idempotencyResult.existingEntry,
      status: 200
    };
  }

  // 3. Verify consent signature for first-time processing only
  const consentValid = await consentGate.verifyConsent(
    params.userId,
    params.consentChallenge,
    { signature: params.consentSignature }
  );

  if (!consentValid) {
    return {
      success: false,
      status: 403,
      error: "CONSENT_REQUIRED: Valid consent signature required"
    };
  }

  // 4. Create shadow ledger entry (pending)
  const now = new Date().toISOString();
  const entry: ShadowLedgerEntry = {
    id: crypto.randomUUID(),
    user_id: params.userId,
    request_id: params.requestId,
    entry_type: "PENDING_DEBIT",
    account_ref: params.fromAccount,
    amount_cents: params.amountCents,
    currency: "USD",
    status: "pending",
    source_action: params.fixId,
    description: `Fix approval: ${params.amountCents / 100} from ${params.fromAccount} to ${params.toAccount}`,
    initiated_at: now,
    settled_at: null,
    failed_at: null,
    failure_reason: null,
    ach_trace_id: null,
    created_at: now
  };

  await supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry);

  // 5. Return 202 Accepted (async processing)
  return {
    success: true,
    entry,
    status: 202
  };
}

function hashPayload(params: ApproveFixParams): string {
  const str = JSON.stringify({
    fixId: params.fixId,
    amountCents: params.amountCents,
    fromAccount: params.fromAccount,
    toAccount: params.toAccount
  });
  
  // Simple hash for demo
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
