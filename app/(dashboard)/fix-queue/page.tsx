import { DownloadMemoButton } from '@/components/download-memo-button';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function FixQueuePage() {
  const { pendingActions, completedActions } = await getDashboardData();

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">Fix Queue</div>
        <p className="page-subtitle">
          Review and approve. Every completed action updates your score path and earns $SOLV.
        </p>
      </div>

      {pendingActions.length === 0 && completedActions.length === 0 ? (
        <section className="empty-card">
          <h2>All caught up</h2>
          <p>We are monitoring for new opportunities and will repopulate the queue after your next scan.</p>
        </section>
      ) : null}

      {pendingActions.map((action) => (
        <section key={action.id} className="queue-card">
          <div className="queue-meta">
            {action.meta ?? 'Guided action'} · +{action.solv_reward ?? 0} $SOLV
          </div>
          <div className="queue-header">
            <h2 className="queue-title">{action.title}</h2>
            <div className="queue-impact">
              {action.impact_amount_display} <small>/ yr</small>
            </div>
          </div>
          <p className="queue-body">{action.description}</p>

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-label">Why</div>
              <p>{action.meta?.split('·')[0]?.trim() || 'Financial leak'} is one of the highest-confidence opportunities in your account graph.</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">How</div>
              <p>{action.description ?? 'Follow the exact external workflow shown here.'}</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">When</div>
              <p>Do it during this trial window so the before/after effect is visible in your next score refresh.</p>
            </div>
            <div className="detail-card">
              <div className="detail-label">Where</div>
              <p>
                {action.action_type === 'needs_cpa'
                  ? 'Through your CPA or tax preparer workflow.'
                  : action.action_type === 'manual'
                    ? 'Through your employer or institution portal.'
                    : 'Through the destination institution or linked account portal.'}
              </p>
            </div>
          </div>

          <div className="inline-actions">
            <form action="/api/actions" method="post">
              <input type="hidden" name="actionId" value={action.id} />
              <input type="hidden" name="status" value="completed" />
              <button type="submit" className="primary-button compact-button">
                Approve → +{action.solv_reward ?? 0} $SOLV
              </button>
            </form>
            <form action="/api/actions" method="post">
              <input type="hidden" name="actionId" value={action.id} />
              <input type="hidden" name="status" value="dismissed" />
              <button type="submit" className="ghost-button compact-button">
                Dismiss
              </button>
            </form>
            {action.action_type === 'needs_cpa' ? (
              <DownloadMemoButton label="Generate CPA Memo" />
            ) : null}
          </div>

          <div className="fine-print">
            Educational only. Shadow CFO explains what to do and why, but does not directly execute financial transactions in beta.
          </div>
        </section>
      ))}

      {completedActions.length > 0 ? (
        <div className="screen-stack">
          <div className="section-heading">Completed</div>
          {completedActions.map((action) => (
            <section key={action.id} className="queue-card completed">
              <div className="queue-meta">Completed · +{action.solv_reward ?? 0} $SOLV earned</div>
              <div className="queue-header">
                <h2 className="queue-title">{action.title}</h2>
                <div className="queue-impact">
                  {action.impact_amount_display} <small>/ yr</small>
                </div>
              </div>
              <p className="queue-body">{action.description}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
