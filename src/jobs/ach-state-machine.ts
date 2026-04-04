import type { TestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";
import type { LedgerStatus } from "../ledger/shadow-ledger";

const ACH_TIMEOUT_MS = 72 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
const BALANCE_TOLERANCE_CENTS = 100;

export class ACHStateMachine {
  constructor(private readonly supabase: TestSupabaseClient) {}

  async processTimeouts(): Promise<number> {
    const now = Date.now();

    const { data: pendingEntries } = await this.supabase
      .from("shadow_ledger")
      .select("*")
      .eq("status", "pending")
      .executeMany();

    const entries = pendingEntries as ShadowLedgerEntry[];
    let processed = 0;
    for (const entry of entries ?? []) {
      const initiatedTime = new Date(entry.initiated_at).getTime();
      if (now - initiatedTime > ACH_TIMEOUT_MS) {
        await this.transitionToExpired(entry.id);
        processed++;
      }
    }

    return processed;
  }

  async processRetries(): Promise<number> {
    const { data: retryingEntries } = await this.supabase
      .from("shadow_ledger")
      .select("*")
      .eq("status", "retrying")
      .executeMany();

    const entries = retryingEntries as ShadowLedgerEntry[];
    let processed = 0;
    for (const entry of entries ?? []) {
      if (entry.retry_count >= MAX_RETRIES) {
        await this.transitionToAborted(entry.id);
        processed++;
      }
    }

    return processed;
  }

  async processSettlement(entryId: string, achTraceId: string): Promise<void> {
    await this.transitionToSettled(entryId, achTraceId);
  }

  async transitionToExpired(entryId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await this.supabase
      .from("shadow_ledger")
      .select("*")
      .eq("id", entryId)
      .update({
        status: "expired" as LedgerStatus,
        failed_at: now,
        failure_reason: "ACH_72H_TIMEOUT"
      });
  }

  async transitionToAborted(entryId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await this.supabase
      .from("shadow_ledger")
      .select("*")
      .eq("id", entryId)
      .update({
        status: "aborted" as LedgerStatus,
        failed_at: now,
        failure_reason: "MAX_RETRIES_EXCEEDED"
      });
  }

  async transitionToSettled(entryId: string, achTraceId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await this.supabase
      .from("shadow_ledger")
      .select("*")
      .eq("id", entryId)
      .update({
        status: "settled" as LedgerStatus,
        settled_at: now,
        ach_trace_id: achTraceId
      });
  }

  async verifyBalanceChange(
    _entryId: string,
    expectedChangeCents: number,
    actualChangeCents: number
  ): Promise<boolean> {
    const difference = Math.abs(expectedChangeCents - actualChangeCents);
    return difference <= BALANCE_TOLERANCE_CENTS;
  }
}
