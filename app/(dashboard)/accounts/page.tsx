import { AccountsUploader } from '@/components/accounts-uploader';
import { getDashboardData } from '@/lib/dashboard-data';

const demoAccounts = [
  {
    name: 'Chase Checking',
    institution: 'Chase',
    type: 'Checking',
    lastSync: '2 hours ago',
    balance: '$4,521.32',
  },
  {
    name: 'Chase Savings',
    institution: 'Chase',
    type: 'Savings',
    lastSync: '2 hours ago',
    balance: '$18,400.00',
  },
  {
    name: 'Fidelity 401(k)',
    institution: 'Fidelity',
    type: 'Investment',
    lastSync: '1 day ago',
    balance: '$205,000.00',
  },
];

export default async function AccountsPage() {
  const { profile, findings, pendingActions } = await getDashboardData();

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">Accounts</div>
        <p className="page-subtitle">
          {profile.is_demo
            ? 'Demo mode is active. Upload a file to replace seeded findings with your own beta scan.'
            : 'Upload files for a beta scan. We surface educational actions, not direct execution.'}
        </p>
      </div>

      <div className="accounts-grid">
        {demoAccounts.map((account) => (
          <section key={account.name} className="account-card">
            <div className="account-header">
              <div className="account-avatar">{account.institution[0]}</div>
              <div>
                <div className="account-name">{account.name}</div>
                <div className="account-meta">
                  {account.institution} · {account.type}
                </div>
              </div>
            </div>
            <div className="account-balance">{account.balance}</div>
            <div className="account-footer">
              <span>Synced {account.lastSync}</span>
              <span>Read only</span>
            </div>
          </section>
        ))}
      </div>

      <AccountsUploader />

      <section className="accounts-summary-grid">
        <div className="stat-card">
          <div className="eyebrow">Current findings</div>
          <div className="stat-number">{findings.length}</div>
          <p>Active recommendations generated from demo data and uploads.</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Pending fixes</div>
          <div className="stat-number">{pendingActions.length}</div>
          <p>These will update your score once marked completed.</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Scanner mode</div>
          <div className="stat-number">Beta</div>
          <p>CSV is the strongest path today. PDF and OFX/QFX fall back to lightweight heuristics.</p>
        </div>
      </section>
    </div>
  );
}
