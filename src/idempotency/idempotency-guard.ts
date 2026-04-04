import type { TestSupabaseClient } from "../test-utils/supabase";
import type { ShadowLedgerEntry } from "../ledger/shadow-ledger";

export interface IdempotencyKey {
  requestId: string;
  userId: string;
  action: string;
  payloadHash: string;
}

export interface IdempotencyResult {
  isNew: boolean;
  existingEntry?: ShadowLedgerEntry;
}

export interface ValidationResult {
  valid: boolean;
  status: number;
  error?: string;
}

export interface ParsedRequestId {
  userId: string;
  fixId: string;
  action: string;
  attemptId: string;
}

export class IdempotencyGuard {
  constructor(private readonly supabase: TestSupabaseClient) {}

  async checkOrCreate(key: IdempotencyKey): Promise<IdempotencyResult> {
    // Check for existing entry by request_id AND user_id
    const { data: existing } = await this.supabase
      .from<ShadowLedgerEntry>("shadow_ledger")
      .select("*")
      .eq("request_id", key.requestId)
      .eq("user_id", key.userId)
      .single();

    if (existing) {
      return { isNew: false, existingEntry: existing };
    }

    return { isNew: true };
  }

  static generateKey(userId: string, fixId: string, action: string): string {
    const base = IdempotencyGuard.buildBaseKey(userId, fixId, action);
    return `${base}:${crypto.randomUUID()}`;
  }

  static parseKey(requestId: string): ParsedRequestId {
    const parts = requestId.split(":");

    if (parts.length !== 4) {
      throw new Error("Malformed shadow request id");
    }

    const [userId, fixId, action, attemptId] = parts;
    return { userId, fixId, action, attemptId };
  }

  validateRequestId(requestId: string | undefined): ValidationResult {
    if (!requestId) {
      return {
        valid: false,
        status: 400,
        error: "x-shadow-request-id header required"
      };
    }

    let parsed: ParsedRequestId;
    try {
      parsed = IdempotencyGuard.parseKey(requestId);
    } catch {
      return {
        valid: false,
        status: 400,
        error: "x-shadow-request-id must be a valid shadow request id"
      };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      !parsed.userId ||
      !parsed.fixId ||
      !parsed.action ||
      !uuidRegex.test(parsed.attemptId)
    ) {
      return {
        valid: false,
        status: 400,
        error: "x-shadow-request-id must be a valid shadow request id"
      };
    }

    return { valid: true, status: 200 };
  }

  private static buildBaseKey(userId: string, fixId: string, action: string): string {
    return `${userId}:${fixId}:${action}`;
  }
}
