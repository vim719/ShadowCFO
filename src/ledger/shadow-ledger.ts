import type { TestSupabaseClient } from "../test-utils/supabase";

export type LedgerEntryType =
  | "DEBIT"
  | "CREDIT"
  | "PENDING_DEBIT"
  | "PENDING_CREDIT"
  | "REVERSAL";

export type LedgerStatus = "pending" | "settled" | "failed" | "reversed";

export interface CreateLedgerEntryInput {
  userId: string;
  requestId: string;
  entryType: LedgerEntryType;
  accountRef: string;
  amountCents: number;
  currency?: string;
  status?: LedgerStatus;
  sourceAction: string;
  description: string;
  achTraceId?: string;
}

export interface ShadowLedgerEntry {
  id: string;
  user_id: string;
  request_id: string;
  entry_type: LedgerEntryType;
  account_ref: string;
  amount_cents: number;
  currency: string;
  status: LedgerStatus;
  source_action: string;
  description: string;
  initiated_at: string;
  settled_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  ach_trace_id: string | null;
  created_at: string;
}

export interface SweepValidationResult {
  permitted: boolean;
  reason?: string;
}

export class ShadowLedger {
  constructor(private readonly supabase: TestSupabaseClient) {}

  async createEntry(input: CreateLedgerEntryInput): Promise<ShadowLedgerEntry> {
    const existing = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("request_id", input.requestId)
      .single();

    if (existing.data) {
      return existing.data;
    }

    const now = new Date().toISOString();
    const entry: ShadowLedgerEntry = {
      id: crypto.randomUUID(),
      user_id: input.userId,
      request_id: input.requestId,
      entry_type: input.entryType,
      account_ref: input.accountRef,
      amount_cents: input.amountCents,
      currency: input.currency ?? "USD",
      status: input.status ?? "pending",
      source_action: input.sourceAction,
      description: input.description,
      initiated_at: now,
      settled_at: null,
      failed_at: null,
      failure_reason: null,
      ach_trace_id: input.achTraceId ?? null,
      created_at: now
    };

    await this.supabase.from<ShadowLedgerEntry>("shadow_ledger").insert(entry);
    return entry;
  }

  async getNetBalance(userId: string, status: LedgerStatus): Promise<number> {
    const { data } = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .executeMany();

    return data.reduce((sum, entry) => sum + this.toSignedAmount(entry), 0);
  }

  async getSettledEntriesForScoring(userId: string): Promise<ShadowLedgerEntry[]> {
    const { data } = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "settled")
      .executeMany();

    return data.filter(
      (entry) => entry.entry_type === "DEBIT" || entry.entry_type === "CREDIT"
    );
  }

  async validateSweepAmount(
    _userId: string,
    _accountRef: string,
    amountCents: number,
    currentBalanceCents: number,
    bufferCents: number
  ): Promise<SweepValidationResult> {
    const remainingBalance = currentBalanceCents - amountCents;

    if (remainingBalance < bufferCents) {
      return {
        permitted: false,
        reason: `below_buffer: remaining balance ${remainingBalance} is below required buffer ${bufferCents}`
      };
    }

    return { permitted: true };
  }

  private toSignedAmount(entry: ShadowLedgerEntry): number {
    switch (entry.entry_type) {
      case "CREDIT":
      case "PENDING_CREDIT":
        return entry.amount_cents;
      case "DEBIT":
      case "PENDING_DEBIT":
        return -entry.amount_cents;
      default:
        return 0;
    }
  }
}
