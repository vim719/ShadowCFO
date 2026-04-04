import { createSupabaseAdminClient, hasSupabaseAdminEnv, hasSupabaseBrowserEnv } from "../lib/supabase";

export const dynamic = "force-dynamic";

type ReadinessState = "live" | "missing" | "warning";

interface StatusCard {
  label: string;
  value: string;
  state: ReadinessState;
  detail: string;
}

interface ActionCard {
  category: string;
  title: string;
  impact: string;
  why: string;
  how: string;
  when: string;
  where: string;
  steps: string[];
  disclaimer: string;
}

interface SystemSnapshot {
  cards: StatusCard[];
  ledgerEntries: number | null;
  consentChallenges: number | null;
  credentials: number | null;
  databaseMessage: string;
}

const actionCards: ActionCard[] = [
  {
    category: "Cash Drag",
    title: "Move idle cash into a high-yield savings account",
    impact: "$883 / year",
    why: "Cash sitting at 0.01% silently loses purchasing power while the rest of Sarah's financial life stays fragmented across apps.",
    how: "Estimate the spread between the linked account's yield and a current high-yield benchmark, then annualize it on the idle balance above buffer.",
    when: "Act this week if the money is emergency-fund cash and not earmarked for a bill due in the next 30 days.",
    where: "Inside the existing bank app or the destination HYSA provider Sarah already trusts.",
    steps: [
      "Confirm the destination savings account is FDIC-insured and already open.",
      "Keep the first $500 buffer in checking before moving anything.",
      "Initiate the transfer directly in the bank interface.",
      "Mark the action complete and let Shadow CFO verify it on the next sync."
    ],
    disclaimer: "Educational information only. Shadow CFO does not move funds for the user."
  },
  {
    category: "Employer Match",
    title: "Increase 401(k) contribution to the full company match",
    impact: "$3,200 / year",
    why: "This is usually the highest-confidence wealth-building action because it captures compensation Sarah has already earned.",
    how: "Compare current deferral percentage against the employer match ceiling and annualize the missed match.",
    when: "Before the next payroll cutoff, especially if the plan resets contributions each year.",
    where: "HR portal, payroll software, or the 401(k) provider dashboard.",
    steps: [
      "Open the payroll or benefits settings page.",
      "Raise the employee contribution from the current rate to the match threshold.",
      "Save confirmation or screenshot for records.",
      "Return to Shadow CFO and mark it started or complete."
    ],
    disclaimer: "Educational information only. Contribution changes are executed by the user."
  },
  {
    category: "OBBBA",
    title: "Prepare a CPA memo for a possible overtime deduction",
    impact: "$3,080 est.",
    why: "The tax opportunity is material, but qualification depends on facts outside the transaction feed, so this belongs in a CPA-reviewed lane.",
    how: "Aggregate payroll descriptors that suggest overtime income, then estimate tax impact conservatively at the user's marginal rate.",
    when: "Before tax filing or any extension decision, not after return submission.",
    where: "CPA email, tax organizer, or secure document portal.",
    steps: [
      "Export the payroll evidence and summary figures.",
      "Send the memo to the CPA with a note asking for qualification review.",
      "Wait for CPA confirmation before counting savings as realized.",
      "Track the outcome as 'needs help' or 'completed by CPA'."
    ],
    disclaimer: "Educational information only. Tax treatment must be confirmed by a qualified professional."
  }
];

async function getTableCount(table: string): Promise<number | null> {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return null;
  }

  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    return null;
  }

  return count ?? 0;
}

async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const hasBrowserEnv = hasSupabaseBrowserEnv();
  const hasAdminEnv = hasSupabaseAdminEnv();

  const [ledgerEntries, consentChallenges, credentials] = hasAdminEnv
    ? await Promise.all([
        getTableCount("shadow_ledger"),
        getTableCount("consent_challenges"),
        getTableCount("webauthn_credentials")
      ])
    : [null, null, null];

  const databaseConnected =
    hasAdminEnv &&
    ledgerEntries !== null &&
    consentChallenges !== null &&
    credentials !== null;

  const cards: StatusCard[] = [
    {
      label: "Deployment",
      value: "Vercel live",
      state: "live",
      detail: "The app shell is reachable and ready for product UI work."
    },
    {
      label: "Supabase Client",
      value: hasBrowserEnv ? "Configured" : "Missing env",
      state: hasBrowserEnv ? "live" : "missing",
      detail: hasBrowserEnv
        ? "Browser credentials are present for app-side auth and reads."
        : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
    },
    {
      label: "Supabase Admin",
      value: databaseConnected ? "Connected" : hasAdminEnv ? "Check tables" : "Missing env",
      state: databaseConnected ? "live" : hasAdminEnv ? "warning" : "missing",
      detail: databaseConnected
        ? "Server-side checks can read hardened rails and readiness counts."
        : hasAdminEnv
          ? "Admin env exists, but one or more tables did not return a count."
          : "Set SUPABASE_SERVICE_ROLE_KEY in Vercel for server-side health checks."
    },
    {
      label: "Hardened Rails",
      value: "8 commits complete",
      state: "live",
      detail: "Ledger, consent, idempotency, ACH, SOLV guard, ADRs, and API endpoint are all in place."
    }
  ];

  const databaseMessage = databaseConnected
    ? "Live database checks are running against the hardened Shadow CFO tables."
    : "The command center is ready, but live database verification needs all Supabase env vars and tables in place.";

  return {
    cards,
    ledgerEntries,
    consentChallenges,
    credentials,
    databaseMessage
  };
}

function statusTone(state: ReadinessState) {
  switch (state) {
    case "live":
      return {
        background: "rgba(15, 108, 92, 0.12)",
        color: "#0b5b4e"
      };
    case "warning":
      return {
        background: "rgba(138, 90, 23, 0.14)",
        color: "#7b4c15"
      };
    default:
      return {
        background: "rgba(151, 47, 47, 0.12)",
        color: "#8d2828"
      };
  }
}

export default async function HomePage() {
  const snapshot = await getSystemSnapshot();

  return (
    <main
      style={{
        padding: "32px 18px 72px",
        maxWidth: "1280px",
        margin: "0 auto"
      }}
    >
      <section
        style={{
          background: "linear-gradient(145deg, rgba(255,250,242,0.92), rgba(240,233,220,0.88))",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "28px 24px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ maxWidth: "760px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 12px",
                borderRadius: "999px",
                background: "rgba(15, 108, 92, 0.1)",
                color: "var(--accent-strong)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Shadow CFO Command Center
            </div>
            <h1
              style={{
                margin: "18px 0 10px",
                fontFamily: "var(--font-display), serif",
                fontSize: "clamp(2.8rem, 7vw, 5.4rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.04em",
                fontWeight: 600
              }}
            >
              Guided money intelligence, with hardened rails underneath.
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: "62ch",
                fontSize: "1.05rem",
                lineHeight: 1.7,
                color: "var(--muted)"
              }}
            >
              The live app now reflects the real Shadow CFO direction: explain what matters, show the exact next step,
              and keep ledger, consent, idempotency, and compliance protections in the foundation.
            </p>
          </div>

          <div
            style={{
              minWidth: "260px",
              padding: "18px",
              borderRadius: "var(--radius-lg)",
              background: "rgba(255,255,255,0.56)",
              border: "1px solid var(--line)"
            }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "6px" }}>
              Current Focus
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "8px" }}>
              App layer on top of the hardened backend
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Next.js UI is now the active build surface. Supabase wiring is surfaced here so we can quickly see whether the live environment is ready.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            padding: "18px 24px 26px"
          }}
        >
          {snapshot.cards.map((card) => {
            const tone = statusTone(card.state);
            return (
              <article
                key={card.label}
                style={{
                  padding: "18px",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(255,255,255,0.62)",
                  border: "1px solid var(--line)",
                  minHeight: "168px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    {card.label}
                  </div>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: tone.background,
                      color: tone.color
                    }}
                  >
                    {card.value}
                  </span>
                </div>
                <p style={{ margin: "18px 0 0", fontSize: "0.98rem", lineHeight: 1.65, color: "var(--muted)" }}>
                  {card.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.9fr)",
          gap: "18px",
          marginTop: "22px"
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow)",
            padding: "24px"
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "8px" }}>
              Sarah View
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display), serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1
              }}
            >
              Guided Action Queue
            </h2>
            <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
              This is the product lane we scoped: explain each action clearly, tell Sarah where it lives, and let her execute it herself.
            </p>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            {actionCards.map((card) => (
              <article
                key={card.title}
                style={{
                  background: "var(--surface-strong)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        padding: "5px 10px",
                        borderRadius: "999px",
                        background: "var(--accent-soft)",
                        color: "var(--accent-strong)",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em"
                      }}
                    >
                      {card.category}
                    </div>
                    <h3 style={{ margin: "12px 0 0", fontSize: "1.35rem", lineHeight: 1.2 }}>
                      {card.title}
                    </h3>
                  </div>
                  <div
                    style={{
                      minWidth: "120px",
                      padding: "12px 14px",
                      borderRadius: "16px",
                      background: "rgba(15, 108, 92, 0.08)",
                      color: "var(--accent-strong)",
                      fontWeight: 700,
                      textAlign: "right"
                    }}
                  >
                    {card.impact}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginTop: "18px"
                  }}
                >
                  {[
                    ["Why", card.why],
                    ["How", card.how],
                    ["When", card.when],
                    ["Where", card.where]
                  ].map(([label, text]) => (
                    <div
                      key={label}
                      style={{
                        padding: "14px",
                        borderRadius: "16px",
                        background: "rgba(244, 239, 228, 0.75)",
                        border: "1px solid var(--line)"
                      }}
                    >
                      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "8px" }}>
                        {label}
                      </div>
                      <div style={{ color: "var(--ink)", lineHeight: 1.65 }}>{text}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "10px" }}>
                    Exact Next Steps
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "20px", color: "var(--ink)", lineHeight: 1.8 }}>
                    {card.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--line)",
                    fontSize: "0.92rem",
                    color: "var(--muted)"
                  }}
                >
                  {card.disclaimer}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside
          style={{
            display: "grid",
            gap: "18px"
          }}
        >
          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow)",
              padding: "22px"
            }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "8px" }}>
              Live System Readiness
            </div>
            <h3 style={{ margin: 0, fontSize: "1.5rem", lineHeight: 1.15 }}>
              Infrastructure snapshot
            </h3>
            <p style={{ margin: "12px 0 18px", color: "var(--muted)", lineHeight: 1.7 }}>
              {snapshot.databaseMessage}
            </p>

            <div style={{ display: "grid", gap: "12px" }}>
              {[
                ["Ledger entries", snapshot.ledgerEntries],
                ["Consent challenges", snapshot.consentChallenges],
                ["WebAuthn credentials", snapshot.credentials]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "16px",
                    border: "1px solid var(--line)",
                    background: "rgba(255,255,255,0.62)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    alignItems: "center"
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <strong style={{ fontSize: "1.15rem" }}>
                    {value === null ? "Pending" : value}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow)",
              padding: "22px"
            }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "8px" }}>
              Guardrails
            </div>
            <h3 style={{ margin: 0, fontSize: "1.5rem", lineHeight: 1.15 }}>
              What the platform enforces
            </h3>
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {[
                "No duplicate request IDs for the same user action.",
                "No fund-adjacent action without consent proof.",
                "No score improvement before settlement state.",
                "No SOLV-based subscription discount under ADR-001."
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "16px",
                    background: "rgba(15, 108, 92, 0.08)",
                    color: "var(--accent-strong)",
                    lineHeight: 1.55
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
