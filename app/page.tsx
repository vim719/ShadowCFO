import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shadow CFO',
  description:
    'Guided money intelligence that finds leakage, explains the why, and turns it into a working Fix Queue.',
};

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div>
          <div className="brand-mark">Shadow CFO</div>
          <p className="brand-copy">Explain every money move before a user takes action.</p>
        </div>
        <div className="landing-actions">
          <Link href="/login" className="secondary-link-button">
            Sign in
          </Link>
          <Link href="/signup" className="primary-link-button">
            Start beta
          </Link>
        </div>
      </header>

      <main className="landing-shell">
        <section className="hero-card">
          <div className="hero-kicker">Personal finance, presented like a mission control system</div>
          <h1 className="hero-title">Find leakage. Turn it into guided fixes. Show the why, how, when, and where.</h1>
          <p className="hero-copy">
            Shadow CFO scans statements, surfaces the highest-confidence money leaks, and converts them into educational action plans users can actually follow in under a few minutes.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="primary-link-button">
              Create account
            </Link>
            <Link href="/dashboard" className="secondary-link-button">
              View app
            </Link>
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card">
            <div className="eyebrow">Guided findings</div>
            <h2 className="feature-title">Every insight is framed as a real decision</h2>
            <p>
              We show the leakage amount, the rationale, the destination account or workflow, and the exact next step.
            </p>
          </article>
          <article className="feature-card">
            <div className="eyebrow">Fix Queue</div>
            <h2 className="feature-title">Users can make progress immediately</h2>
            <p>
              The queue is prioritized, persistent, and tied to $SOLV so testers feel momentum instead of analysis fatigue.
            </p>
          </article>
          <article className="feature-card">
            <div className="eyebrow">Hardened rails</div>
            <h2 className="feature-title">Built with ledger, consent, and idempotency underneath</h2>
            <p>
              The beta UI sits on top of the technical design doc work so the app has a believable trust story from day one.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
