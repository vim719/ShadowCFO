import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Brain, TrendingUp } from "lucide-react";
import AgentInsightCard, { LeakInsight } from "@/components/shared/AgentInsightCard";
import { Button } from "@/components/ui/button";

interface FirstLeakScreenProps {
  onBack: () => void;
  onDone: () => void;
}

const LEAKS: LeakInsight[] = [
  {
    id: "leak-1",
    title: "Netflix double-billed across two cards",
    amount: 34,
    frequency: "monthly",
    confidence: 94,
    category: "Duplicate Subscription",
    agentReasoning:
      "I noticed you're paying for Netflix on 2 cards since March. Chase + Apple Pay. One is redundant.",
    agentEvidence: [
      "Chase ···4521: $34.99 on Mar 3 — Netflix (recurring)",
      "Apple Pay ···8872: $34.99 on Mar 5 — Netflix (recurring)",
      "Both transactions match the Netflix merchant fingerprint and have run every month since Jan 2025",
      "Pattern: 2-day offset suggests failed auto-cancel from a previous card switch",
    ],
    fixDescription:
      "Cancel the Apple Pay Netflix subscription. Chase billing stays active. $34/mo recovered.",
    fixDestination: "Chase ···4521 (keep)",
  },
  {
    id: "leak-2",
    title: "Idle Dropbox Plus — last used 4 months ago",
    amount: 11,
    frequency: "monthly",
    confidence: 88,
    category: "Idle Subscription",
    agentReasoning:
      "Dropbox Plus is billing you $11.99/mo but your last file activity was December 2024.",
    agentEvidence: [
      "Wells Fargo ···3310: $11.99/mo — Dropbox Plus (14 consecutive months)",
      "No API file access events logged since Dec 28, 2024",
      "Free tier covers your actual storage usage (2.1 GB of 2 TB used)",
    ],
    fixDescription:
      "Cancel Dropbox Plus and downgrade to free. Your 2.1 GB of files are safe on the free tier.",
  },
  {
    id: "leak-3",
    title: "ATM fee pattern — 3 out-of-network withdrawals/mo",
    amount: 9,
    frequency: "monthly",
    confidence: 78,
    category: "Avoidable Fees",
    agentReasoning:
      "You're averaging $2.99 ATM fees 3× per month from non-Chase ATMs near your workplace.",
    agentEvidence: [
      "3 ATM fee charges at 'Broadway & 42nd' ($2.99 each) in March",
      "Same pattern in February (3×) and January (3×)",
      "Chase ATM is 0.3 miles away — same block, Starbucks location",
    ],
    fixDescription:
      "Switch to the Chase ATM at 234 W 42nd St (in the Starbucks). Saves ~$9/mo, $108/yr.",
  },
];

const TOTAL_MONTHLY = LEAKS.reduce((sum, l) => sum + l.amount, 0);
const TOTAL_ANNUAL = TOTAL_MONTHLY * 12;

export default function FirstLeakScreen({ onBack, onDone }: FirstLeakScreenProps) {
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const handleFix = (id: string) => {
    setFixingId(id);
    setTimeout(() => {
      setFixingId(null);
      setFixedIds((prev) => new Set([...prev, id]));
    }, 1600);
  };

  const handleSkip = (id: string) => {
    setSkippedIds((prev) => new Set([...prev, id]));
  };

  const fixedAmount = LEAKS.filter((l) => fixedIds.has(l.id)).reduce(
    (sum, l) => sum + l.amount,
    0
  );

  const remainingLeaks = LEAKS.filter(
    (l) => !fixedIds.has(l.id) && !skippedIds.has(l.id)
  );

  const allActedOn =
    fixedIds.size + skippedIds.size >= LEAKS.length;

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-16 relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background glow - soft amber/blue mix */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 10%, rgba(240,165,0,0.03) 0%, transparent 80%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,112,243,0.02) 0%, transparent 70%)",
        }}
      />

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-6 left-6 gap-1.5 text-sm h-11 px-5 rounded-full border border-slate-100 bg-white/50 backdrop-blur-sm"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
        aria-label="Go back to previous screen"
      >
        <ChevronLeft size={18} />
        Back
      </Button>

      {/* Step indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--accent-emerald)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ✓
          </div>
          <div
            className="w-16 h-px"
            style={{ background: "var(--accent-cyan)" }}
          />
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-mono)",
            }}
          >
            2
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg pt-6">
        {/* AI surfacing header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5"
            style={{
              background: "rgba(240,165,0,0.08)",
              border: "1px solid rgba(240,165,0,0.2)",
              color: "var(--accent-amber)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.06em",
            }}
          >
            <Brain size={11} />
            SHADOW CFO FOUND SOMETHING
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {fixedAmount > 0 ? (
              <>
                Saving{" "}
                <span style={{ color: "var(--accent-emerald)" }}>${fixedAmount}/mo</span>
                {fixedAmount < TOTAL_MONTHLY && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75em" }}>
                    {" "}so far
                  </span>
                )}
              </>
            ) : (
              <>
                I found{" "}
                <span style={{ color: "var(--accent-amber)" }}>
                  ${TOTAL_MONTHLY}/mo
                </span>{" "}
                leaking
              </>
            )}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {allActedOn
              ? "All leaks reviewed. Great work."
              : `That's $${TOTAL_ANNUAL.toLocaleString()}/year — here's exactly what I found and why:`}
          </p>
        </motion.div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-4">
            {[
              { label: "Leaks found", value: `${LEAKS.length}`, color: "var(--accent-amber)" },
              { label: "Monthly savings", value: `$${TOTAL_MONTHLY}`, color: "var(--accent-emerald)" },
              { label: "Annual impact", value: `$${TOTAL_ANNUAL}`, color: "var(--accent-cyan)" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-sm font-bold"
                  style={{
                    color: stat.color,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          {fixedAmount > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--accent-emerald)", fontFamily: "var(--font-display)" }}
            >
              <TrendingUp size={13} />
              {Math.round((fixedAmount / TOTAL_MONTHLY) * 100)}% fixed
            </div>
          )}
        </motion.div>

        {/* Leak cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {LEAKS.map((leak, i) => {
              const isSkipped = skippedIds.has(leak.id);
              if (isSkipped) return null;
              return (
                <motion.div
                  key={leak.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <AgentInsightCard
                    insight={leak}
                    onFix={handleFix}
                    onSkip={handleSkip}
                    isFixing={fixingId === leak.id}
                    isFixed={fixedIds.has(leak.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* All done state */}
        <AnimatePresence>
          {allActedOn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl p-6 text-center"
              style={{
                background: "rgba(0,200,150,0.06)",
                border: "1px solid rgba(0,200,150,0.2)",
              }}
            >
              <div
                className="text-lg font-bold mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--accent-emerald)",
                }}
              >
                ${fixedAmount}/mo recovered
              </div>
              <div
                className="text-sm mb-5"
                style={{ color: "var(--text-muted)" }}
              >
                That's ${fixedAmount * 12}/year back in your pocket. Shadow CFO
                keeps scanning 24/7 for new leaks.
              </div>
              <Button
                onClick={onDone}
                className="font-bold px-8 h-11"
                style={{
                  background: "var(--accent-emerald)",
                  color: "var(--bg-base)",
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 0 24px rgba(0,200,150,0.2)",
                }}
              >
                Go to dashboard →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button if not all done */}
        {!allActedOn && fixedAmount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 flex justify-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onDone}
              className="text-sm h-11"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
            >
              Skip remaining → view dashboard
            </Button>
          </motion.div>
        )}

        {/* Consent ledger preview */}
        {fixedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl p-4"
            style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="text-xs mb-2"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: "0.6rem",
              }}
            >
              Consent ledger — live
            </div>
            {[...fixedIds].map((id) => {
              const leak = LEAKS.find((l) => l.id === id)!;
              return (
                <div
                  key={id}
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                >
                  <span style={{ color: "var(--accent-emerald)" }}>FIXED</span>{" "}
                  {leak.category} · ${leak.amount}/mo ·{" "}
                  <span style={{ color: "var(--text-subtle)" }}>
                    consent:signed · idempotent:✓
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
