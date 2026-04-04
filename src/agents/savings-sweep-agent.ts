import type { TestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";

export interface SweepParams {
  userId: string;
  fromAccount: string;
  toAccount: string;
  amountCents: number;
  requestId: string;
  consentSignature: string;
}

export interface SweepValidation {
  allowed: boolean;
  reason?: string;
}

export interface SweepResult {
  success: boolean;
  entry?: ShadowLedgerEntry;
  error?: string;
}

const BUFFER_AMOUNT_CENTS = 50000; // $500 default buffer

export class SavingsSweepAgent {
  constructor(private readonly supabase: TestSupabaseClient) {}

  async validateSweep(params: {
    userId: string;
    fromAccount: string;
    amountCents: number;
    currentBalanceCents: number;
    bufferCents?: number;
  }): Promise<SweepValidation> {
    const buffer = params.bufferCents ?? BUFFER_AMOUNT_CENTS;
    const remainingBalance = params.currentBalanceCents - params.amountCents;

    if (remainingBalance < buffer) {
      return {
        allowed: false,
        reason: `below_buffer: remaining ${remainingBalance} below required ${buffer}`
      };
    }

    return { allowed: true };
  }

  async executeSweep(params: SweepParams): Promise<SweepResult> {
    // 1. Validate consent signature
    if (!params.consentSignature) {
      return { success: false, error: "CONSENT_REQUIRED: Valid consent signature required" };
    }

    // 2. Check idempotency (has this request already been processed?)
    const { data: existing } = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("request_id", params.requestId)
      .eq("user_id", params.userId)
      .single();

    if (existing) {
      return { success: true, entry: existing };
    }

    // 3. Create pending ledger entry
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
      source_action: "savings-sweep-agent",
      description: `HYSA sweep: $${params.amountCents / 100} from ${params.fromAccount} to ${params.toAccount}`,
      initiated_at: now,
      settled_at: null,
      failed_at: null,
      failure_reason: null,
      ach_trace_id: null,
      created_at: now
    };

    await this.supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry);

    return { success: true, entry };
  }

  async getScoreContributingEntries(userId: string): Promise<ShadowLedgerEntry[]> {
    const { data } = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "settled");

    return data ?? [];
  }
}
