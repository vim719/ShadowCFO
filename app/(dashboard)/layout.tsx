import { DashboardShell } from '@/components/dashboard-shell';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pendingActions } = await getDashboardData();

  return (
    <DashboardShell pendingCount={pendingActions.length}>
      {children}
    </DashboardShell>
  );
}
