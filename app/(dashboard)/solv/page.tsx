import { getDashboardData, getTier } from '@/lib/dashboard-data';

export default async function SolvPage() {
  const { profile, solvHistory } = await getDashboardData();
  const balance = profile.solv_balance ?? 0;
  const tier = getTier(balance);
  const progressToArchitect = Math.min((balance / 1000) * 100, 100);
  const remaining = Math.max(1000 - balance, 0);

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">Your $SOLV</div>
        <p className="page-subtitle">
          Earned through financial health actions. Soul-bound and never usable as a subscription discount.
        </p>
      </div>

      <section className="solv-card">
        <div className="solv-header">
          <div>
            <div className="eyebrow">Balance</div>
            <div className="solv-balance">{balance} $SOLV</div>
          </div>
          <span className="tier-pill">{tier}</span>
        </div>

        <div className="solv-progress">
          <div className="solv-progress-fill" style={{ width: `${progressToArchitect}%` }} />
        </div>

        <div className="solv-meta">
          <span>500 — Protector</span>
          <span className="solv-next">
            {remaining > 0 ? `${remaining} to Architect` : 'Architect unlocked'}
          </span>
          <span>1,000 — Architect</span>
        </div>
      </section>

      <div className="section-heading">Architect tier unlocks</div>
      {[
        {
          name: 'Alt Alpha Pool',
          description: 'Private credit and real estate access',
        },
        {
          name: 'Priority scanning',
          description: 'Real-time account monitoring',
        },
        {
          name: 'Trump Account setup',
          description: 'Automated generational wealth planning for children',
        },
      ].map((unlock) => (
        <div key={unlock.name} className="unlock-row">
          <div>
            <div className="unlock-name">{unlock.name}</div>
            <div className="unlock-description">{unlock.description}</div>
          </div>
          <span className="unlock-pill">{remaining > 0 ? `${remaining} away` : 'Unlocked'}</span>
        </div>
      ))}

      <div className="section-heading">Earning history</div>
      <section className="history-card">
        {solvHistory.length === 0 ? (
          <div className="empty-inline">No history yet. Complete actions to start earning.</div>
        ) : (
          solvHistory.map((entry) => (
            <div key={entry.id} className="history-row">
              <span>{entry.action}</span>
              <span>+{entry.amount}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
