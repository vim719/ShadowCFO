'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type DashboardShellProps = {
  children: React.ReactNode;
  pendingCount?: number;
};

const tabs = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'findings', href: '/findings', label: 'Findings' },
  { key: 'fix-queue', href: '/fix-queue', label: 'Fix Queue' },
  { key: 'solv', href: '/solv', label: '$SOLV' },
  { key: 'quiz', href: '/quiz', label: 'Fluency Quiz' },
  { key: 'accounts', href: '/accounts', label: 'Accounts' },
] as const;

export function DashboardShell({
  children,
  pendingCount = 0,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="dashboard-app-shell">
      <header className="dashboard-brandbar">
        <div>
          <div className="brand-mark">Shadow CFO</div>
          <p className="brand-copy">
            Guided money intelligence with clear next steps and hardened rails underneath.
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="ghost-button compact-button">
            Sign out
          </button>
        </form>
      </header>

      <div className="dashboard-frame">
        <nav className="dashboard-tabs" aria-label="Primary">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={pathname === tab.href ? 'dashboard-tab active' : 'dashboard-tab'}
            >
              {tab.label}
              {tab.key === 'fix-queue' && pendingCount > 0 ? (
                <span className="dashboard-tab-count">{pendingCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="dashboard-body">{children}</div>
      </div>
    </div>
  );
}
