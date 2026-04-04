import Link from 'next/link';
import { DownloadMemoButton } from '@/components/download-memo-button';
import { formatCategoryLabel, getDashboardData } from '@/lib/dashboard-data';

export default async function FindingsPage() {
  const { findings, activeFindings, stats } = await getDashboardData();

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">Your findings</div>
        <p className="page-subtitle">
          Total: <strong>{stats.totalLeakageDisplay}/year</strong> across {activeFindings.length}{' '}
          active categories.
        </p>
      </div>

      {findings.length === 0 ? (
        <section className="empty-card">
          <h2>No findings yet</h2>
          <p>Upload a CSV or PDF to generate educational recommendations and a live Fix Queue.</p>
          <Link href="/accounts" className="primary-link-button">
            Connect statements
          </Link>
        </section>
      ) : (
        findings.map((finding) => {
          const isFixed = finding.status === 'fixed';
          const needsMemo = ['obbba', 'auto_loan'].includes(finding.category);

          return (
            <section key={finding.id} className={isFixed ? 'finding-card subdued' : 'finding-card'}>
              <div className="finding-header">
                <div className="badge-row">
                  <span className="badge badge-category">{formatCategoryLabel(finding.category)}</span>
                  <span
                    className={
                      isFixed
                        ? 'badge badge-muted'
                        : finding.badge_color === 'amber'
                          ? 'badge badge-warning'
                          : 'badge badge-success'
                    }
                  >
                    {isFixed ? 'Fixed' : finding.badge ?? 'In review'}
                  </span>
                </div>
                <div className="finding-amount">
                  {finding.impact_amount_display} <small>/ yr</small>
                </div>
              </div>

              <h2 className="finding-title">{finding.title}</h2>
              <p className="finding-body">{finding.description}</p>

              <div className="inline-actions">
                {isFixed ? (
                  <button type="button" className="success-button compact-button" disabled>
                    Approved
                  </button>
                ) : (
                  <Link href="/fix-queue" className="primary-link-button">
                    View in Fix Queue
                  </Link>
                )}
                {needsMemo ? (
                  <DownloadMemoButton
                    label={finding.category === 'auto_loan' ? 'Add to CPA Memo' : 'Generate CPA Memo'}
                  />
                ) : (
                  <Link href="/accounts" className="secondary-link-button">
                    See source account
                  </Link>
                )}
              </div>

              {finding.disclaimer ? <div className="fine-print">{finding.disclaimer}</div> : null}
            </section>
          );
        })
      )}
    </div>
  );
}
