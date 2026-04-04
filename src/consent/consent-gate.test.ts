import { beforeEach, describe, expect, it } from "bun:test";
import { ConsentGate } from "./consent-gate";
import { createTestSupabaseClient, TestSupabaseClient } from "../test-utils/supabase";

describe("ConsentGate", () => {
  let supabase: TestSupabaseClient;
  let consentGate: ConsentGate;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    consentGate = new ConsentGate(supabase, {
      verifyAuthenticationResponse: async ({ expectedChallenge, response }) =>
        response.signedChallenge === expectedChallenge && response.signature === "valid"
    });
  });

  describe("test_reject_action_without_signed_consent", () => {
    it("should reject fix approval without valid consent signature", async () => {
      const result = await consentGate.verifyConsent(
        "test-user-1",
        "invalid-challenge",
        {} as any
      );

      expect(result).toBe(false);
    });
  });

  describe("test_consent_challenge_expires_after_5_minutes", () => {
    it("should reject consent challenge older than 5 minutes", async () => {
      // Create a challenge that has already expired
      const expiredChallenge = {
        id: "expired-challenge-id",
        challenge: "expired-challenge-uuid",
        user_id: "test-user-1",
        payload: {} as any,
        expires_at: new Date(Date.now() - (6 * 60 * 1000)).toISOString(), // 6 minutes ago
        used: false,
        created_at: new Date().toISOString()
      };

      const supabase = createTestSupabaseClient();
      await supabase.from("consent_challenges").insert(expiredChallenge);
      consentGate = new ConsentGate(supabase);

      const isValid = await consentGate.verifyConsent(
        "test-user-1",
        "expired-challenge-uuid",
        {} as any
      );

      expect(isValid).toBe(false);
    });
  });

  describe("test_used_challenge_cannot_be_reused", () => {
    it("should reject a challenge that has already been used", async () => {
      const usedChallenge = {
        id: "used-challenge-id",
        challenge: "used-challenge-uuid",
        user_id: "test-user-1",
        payload: {} as any,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        used: true, // Already used
        created_at: new Date().toISOString()
      };

      const supabase = createTestSupabaseClient();
      await supabase.from("consent_challenges").insert(usedChallenge);
      consentGate = new ConsentGate(supabase);

      const isReused = await consentGate.verifyConsent(
        "test-user-1",
        "used-challenge-uuid",
        {} as any
      );

      expect(isReused).toBe(false);
    });
  });

  describe("test_webauthn_counter_increments_on_verify", () => {
    it("should increment WebAuthn counter on successful verification", async () => {
      const initialCounter = 0;

      await supabase.from("webauthn_credentials").insert({
        id: "cred-row-1",
        user_id: "test-user-1",
        credential_id: "cred-123",
        public_key: "pk-test",
        sign_count: initialCounter,
        device_label: "Sarah's iPhone",
        transports: ["internal"],
        backed_up: true,
        created_at: new Date().toISOString(),
        last_used_at: null
      });

      const payload = {
        fixId: "fix-123",
        userId: "test-user-1",
        actionDescription: "Move funds",
        amountCents: 1840000,
        destinationLabel: "HYSA",
        requestId: "req-001",
        timestamp: Date.now()
      };

      const { challenge } = await consentGate.createChallenge(payload);

      const verified = await consentGate.verifyConsent("test-user-1", challenge, {
        credentialId: "cred-123",
        signedChallenge: challenge,
        signature: "valid",
        newCounter: 1
      });

      const { data: updatedCredential } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", "cred-123")
        .single();

      expect(verified).toBe(true);
      expect(updatedCredential?.sign_count).toBe(1);
    });
  });
});

describe("Consent Gate Invariants", () => {
  let consentGate: ConsentGate;

  beforeEach(() => {
    const supabase = createTestSupabaseClient();
    consentGate = new ConsentGate(supabase);
  });

  it("test_consent_logged_before_action", async () => {
    const consentPayload = {
      fixId: "fix-789",
      userId: "test-user-1",
      actionDescription: "Test action",
      amountCents: 100_00,
      destinationLabel: "Test Account",
      requestId: "req-003",
      timestamp: Date.now()
    };

    const { challenge } = await consentGate.createChallenge(consentPayload);
    
    // Consent should be logged before any action executes
    const logged = await consentGate.getConsentLog("test-user-1");
    
    expect(logged.some(entry => entry.challenge === challenge)).toBe(true);
  });
});
