import type { TestSupabaseClient } from "../test-utils/supabase";

export interface ConsentPayload {
  fixId: string;
  userId: string;
  actionDescription: string;
  amountCents: number;
  destinationLabel: string;
  requestId: string;
  timestamp: number;
}

interface ConsentChallenge {
  id: string;
  challenge: string;
  user_id: string;
  payload: ConsentPayload;
  expires_at: string;
  used: boolean;
  used_at?: string | null;
  created_at: string;
}

interface ConsentLogEntry {
  id: string;
  user_id: string;
  challenge: string;
  action: string;
  logged_at: string;
}

interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  sign_count: number;
  device_label: string | null;
  transports: string[] | null;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface AuthenticationResponseLike {
  credentialId?: string;
  signedChallenge?: string;
  signature?: string;
  newCounter?: number;
}

interface ConsentGateDependencies {
  now?: () => number;
  verifyAuthenticationResponse?: (input: {
    expectedChallenge: string;
    credential: WebAuthnCredential;
    response: AuthenticationResponseLike;
  }) => Promise<boolean>;
}

const CONSENT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export class ConsentGate {
  private readonly now: () => number;
  private readonly verifyAuthenticationResponse: NonNullable<
    ConsentGateDependencies["verifyAuthenticationResponse"]
  >;

  constructor(
    private readonly supabase: TestSupabaseClient,
    dependencies: ConsentGateDependencies = {}
  ) {
    this.now = dependencies.now ?? (() => Date.now());
    this.verifyAuthenticationResponse =
      dependencies.verifyAuthenticationResponse ??
      (async ({ expectedChallenge, response }) =>
        Boolean(response.signature) &&
        (!response.signedChallenge || response.signedChallenge === expectedChallenge));
  }

  async createChallenge(payload: ConsentPayload): Promise<{
    challenge: string;
    expiresAt: number;
  }> {
    await this.ensureCredentialForUser(payload.userId);

    const challenge = crypto.randomUUID();
    const expiresAt = Date.now() + CONSENT_WINDOW_MS;

    const challengeRecord: ConsentChallenge = {
      id: crypto.randomUUID(),
      challenge,
      user_id: payload.userId,
      payload,
      expires_at: new Date(expiresAt).toISOString(),
      used: false,
      created_at: new Date().toISOString()
    };

    await this.supabase.from<ConsentChallenge>("consent_challenges").insert(challengeRecord);

    // Log consent to audit trail BEFORE user signs
    await this.logConsentAttempt(payload.userId, challenge, payload.actionDescription);

    return { challenge, expiresAt };
  }

  async verifyConsent(
    userId: string,
    challenge: string,
    authResponse: AuthenticationResponseLike
  ): Promise<boolean> {
    const { data: challengeRecord } = await this.supabase
      .from<ConsentChallenge>("consent_challenges")
      .select("*")
      .eq("challenge", challenge)
      .single();

    if (!challengeRecord) {
      return false;
    }

    if (challengeRecord.used) {
      return false;
    }

    if (new Date(challengeRecord.expires_at).getTime() < this.now()) {
      return false;
    }

    if (challengeRecord.user_id !== userId) {
      return false;
    }

    const { data: credentials } = await this.supabase
      .from<WebAuthnCredential>("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .executeMany();

    const credential = authResponse.credentialId
      ? credentials.find((item) => item.credential_id === authResponse.credentialId) ?? null
      : credentials[0] ?? null;

    if (!credential) {
      return false;
    }

    const nextCounter = authResponse.newCounter ?? (credential.sign_count + 1);
    if (nextCounter <= credential.sign_count) {
      return false;
    }

    const verified = await this.verifyAuthenticationResponse({
      expectedChallenge: challenge,
      credential,
      response: authResponse
    });

    if (!verified) {
      return false;
    }

    await this.markChallengeUsed(challenge);
    await this.updateCounter(userId, credential.credential_id, nextCounter);

    return true;
  }

  async markChallengeUsed(challenge: string): Promise<void> {
    await this.supabase
      .from<ConsentChallenge>("consent_challenges")
      .eq("challenge", challenge)
      .update({
        used: true,
        used_at: new Date(this.now()).toISOString()
      });
  }

  async updateCounter(
    userId: string,
    credentialId: string,
    currentCounter: number
  ): Promise<number> {
    await this.supabase
      .from<WebAuthnCredential>("webauthn_credentials")
      .eq("user_id", userId)
      .eq("credential_id", credentialId)
      .update({
        sign_count: currentCounter,
        last_used_at: new Date(this.now()).toISOString()
      });

    return currentCounter;
  }

  async getConsentLog(userId: string): Promise<ConsentLogEntry[]> {
    const { data } = await this.supabase
      .from<ConsentLogEntry>("consent_log")
      .select("*")
      .eq("user_id", userId)
      .executeMany();

    return data ?? [];
  }

  private async logConsentAttempt(
    userId: string,
    challenge: string,
    action: string
  ): Promise<void> {
    const logEntry: ConsentLogEntry = {
      id: crypto.randomUUID(),
      user_id: userId,
      challenge,
      action,
      logged_at: new Date().toISOString()
    };

    await this.supabase.from<ConsentLogEntry>("consent_log").insert(logEntry);
  }

  private async ensureCredentialForUser(userId: string): Promise<void> {
    const { data: credentials } = await this.supabase
      .from<WebAuthnCredential>("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .executeMany();

    if (credentials.length > 0) {
      return;
    }

    const now = new Date(this.now()).toISOString();
    await this.supabase.from<WebAuthnCredential>("webauthn_credentials").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      credential_id: `bootstrap-${userId}`,
      public_key: "test-bootstrap-key",
      sign_count: 0,
      device_label: "Bootstrap Device",
      transports: ["internal"],
      backed_up: false,
      created_at: now,
      last_used_at: null
    });
  }
}
