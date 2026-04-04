import type { TestSupabaseClient } from "../../test-utils/supabase";
import type { ShadowLedgerEntry, LedgerEntryType } from "../../ledger/shadow-ledger";
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

  const requestIdValidation = idempotencyGuard.validateRequestId(params.requestId);
  if (!requestIdValidation.valid) {
    return {
      success: false,
      status: 400,
      error: requestIdValidation.error
    };
  }

  const idempotencyResult = await idempotencyGuard.checkOrCreate({
    requestId: params.requestId,
    userId: params.userId,
    action: "fix_approve",
    payloadHash: hashPayload(params)
  });

  if (!idempotencyResult.isNew && idempotencyResult.existingEntry) {
    return {
      success: true,
      entry: idempotencyResult.existingEntry,
      status: 200
    };
  }

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

  const now = new Date().toISOString();
  const entry: ShadowLedgerEntry = {
    id: crypto.randomUUID(),
    user_id: params.userId,
    request_id: params.requestId,
    entry_type: "PENDING_DEBIT" as LedgerEntryType,
    account_ref: params.fromAccount,
    amount_cents: params.amountCents,
    currency: "USD",
    status: "pending",
    source_action: params.fixId,
    description: `Fix approval: ${params.amountCents / 100} from ${params.fromAccount} to ${params.toAccount}`,
    metadata: {},
    initiated_at: now,
    settled_at: null,
    failed_at: null,
    failure_reason: null,
    ach_trace_id: null,
    retry_count: 0,
    created_at: now
  };

  await supabase.from("shadow_ledger").insert(entry);

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
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
