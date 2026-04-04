import Link from 'next/link';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function WelcomePage() {
  const { profile, pendingActions, activeFindings, stats } = await getDashboardData();
  const isDemo = Boolean(profile.is_demo);

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">
          {isDemo ? 'Demo ready' : `Welcome, ${profile.full_name || 'there'}`}
        </div>
        <p className="page-subtitle">
          {isDemo
            ? 'You are inside the seeded Sarah-style experience. Explore the beta or replace the demo with your own uploaded statements.'
            : 'Your account is ready. Choose whether to explore with starter data or jump straight into your own file upload.'}
        </p>
      </div>

      <div className="onboarding-grid">
        <section className="onboarding-card">
          <div className="eyebrow">Option 1</div>
          <h2 className="section-heading">Explore the app first</h2>
          <p className="onboarding-copy">
            Start with {activeFindings.length} findings, {pendingActions.length} pending fixes, and a live score so you can understand the product loop before uploading anything.
          </p>
          <div className="onboarding-stats">
            <div className="stat-card compact">
              <div className="eyebrow">Score</div>
              <div className="stat-number">{profile.solvency_score ?? 50}</div>
            </div>
            <div className="stat-card compact">
              <div className="eyebrow">Leakage</div>
              <div className="stat-number">{stats.totalLeakageDisplay}</div>
            </div>
          </div>
          <Link href="/dashboard" className="primary-link-button">
            Open dashboard
          </Link>
        </section>

        <section className="onboarding-card">
          <div className="eyebrow">Option 2</div>
          <h2 className="section-heading">Upload your own statement</h2>
          <p className="onboarding-copy">
            CSV is the strongest path today. PDF, OFX, and QFX work in beta and create educational findings plus a fresh Fix Queue.
          </p>
          <ul className="onboarding-list">
            <li>Read-only beta flow</li>
            <li>No direct money movement</li>
            <li>Good for live tester demos</li>
          </ul>
          <Link href="/accounts" className="secondary-link-button">
            Go to uploads
          </Link>
        </section>
      </div>
    </div>
  );
}
