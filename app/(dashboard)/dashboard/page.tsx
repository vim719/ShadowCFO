import Link from 'next/link';
import { getDashboardData, formatCategoryLabel } from '@/lib/dashboard-data';

export default async function DashboardPage() {
  const {
    profile,
    activeFindings,
    fixedFindings,
    pendingActions,
    stats,
  } = await getDashboardData();

  const featuredFinding = activeFindings[0] ?? null;
  const score = profile.solvency_score ?? 50;
  const fixedAmountLabel = stats.fixedAmountDisplay.replace('/yr', '');

  const categoryBreakdown = [
    { label: 'Cash drag', total: activeFindings.filter((finding) => finding.category === 'cash_drag').reduce((sum, finding) => sum + (finding.impact_amount_cents ?? 0), 0) },
    { label: 'Fee drag', total: activeFindings.filter((finding) => finding.category === 'fee_drag').reduce((sum, finding) => sum + (finding.impact_amount_cents ?? 0), 0) },
    { label: 'Match gap', total: activeFindings.filter((finding) => finding.category === 'employer_match').reduce((sum, finding) => sum + (finding.impact_amount_cents ?? 0), 0) },
    { label: 'OBBBA', total: activeFindings.filter((finding) => ['obbba', 'auto_loan'].includes(finding.category)).reduce((sum, finding) => sum + (finding.impact_amount_cents ?? 0), 0) },
  ];

  return (
    <div className="screen-stack">
      <div className="page-title">
        Good morning, {profile.full_name || 'there'}{' '}
        <span className="page-title-muted">— {stats.trialDays} days left in trial</span>
      </div>

      <div className="score-row">
        <div className="score-box">
          <div className="score-number">{score}</div>
          <div className="score-copy">
            <div className="eyebrow">Solvency Score</div>
            <div className="score-delta">+13 this month</div>
            <div className="score-note">
              {fixedFindings.length > 0
                ? `${fixedAmountLabel}/year already recovered`
                : 'Complete one fix to start improving your score'}
            </div>
            <div className="score-progress">
              <div className="score-progress-fill" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <div className="leakage-box">
          <div className="eyebrow">Total found</div>
          <div className="leakage-total">{stats.totalLeakageDisplay}/yr</div>
          {categoryBreakdown.map((item) => (
            <div key={item.label} className="leakage-row">
              <span>{item.label}</span>
              <span>${(item.total / 100).toLocaleString()}</span>
            </div>
          ))}
          <div className="leakage-row leakage-row-strong">
            <span>Fixed</span>
            <span>{stats.fixedAmountDisplay}</span>
          </div>
        </div>
      </div>

      <Link href="/fix-queue" className="banner-card">
        <div>
          <div className="banner-title">{pendingActions.length} fixes ready — each one earns $SOLV</div>
          <div className="banner-subtitle">See the steps, the impact, and the exact next click.</div>
        </div>
        <div className="banner-arrow">→</div>
      </Link>

      {featuredFinding ? (
        <section className="finding-card">
          <div className="finding-header">
            <div className="badge-row">
              <span className="badge badge-category">{formatCategoryLabel(featuredFinding.category)}</span>
              {featuredFinding.badge ? (
                <span
                  className={
                    featuredFinding.badge_color === 'amber'
                      ? 'badge badge-warning'
                      : 'badge badge-success'
                  }
                >
                  {featuredFinding.badge}
                </span>
              ) : null}
            </div>
            <div className="finding-amount">
              {featuredFinding.impact_amount_display} <small>/ yr</small>
            </div>
          </div>

          <h2 className="finding-title">{featuredFinding.title}</h2>
          <p className="finding-body">{featuredFinding.description}</p>

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-label">Why</div>
              <p>We found a recurring pattern where the value recovered materially exceeds the effort required.</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">How</div>
              <p>Open the Fix Queue and we will show the institution, the action, and the expected result step by step.</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">When</div>
              <p>Best done this week while the trial is active and your baseline is still fresh.</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">Where</div>
              <p>Inside the destination institution portal or through your CPA workflow depending on the action type.</p>
            </div>
          </div>

          <div className="inline-actions">
            <Link href="/fix-queue" className="primary-link-button">
              Open Fix Queue
            </Link>
            <Link href="/findings" className="secondary-link-button">
              See all findings
            </Link>
          </div>

          {featuredFinding.disclaimer ? (
            <div className="fine-print">{featuredFinding.disclaimer}</div>
          ) : null}
        </section>
      ) : (
        <section className="empty-card">
          <h2>No findings yet</h2>
          <p>Upload a statement or start in demo mode to generate your first guided action plan.</p>
          <Link href="/accounts" className="primary-link-button">
            Upload a statement
          </Link>
        </section>
      )}
    </div>
  );
}
