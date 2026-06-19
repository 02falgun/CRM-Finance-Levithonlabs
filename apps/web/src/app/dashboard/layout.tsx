import { redirect } from 'next/navigation';
import { getServerSession } from '../../lib/server/session';
import DashboardShell from './dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardShell user={session.user} tenant={session.tenant}>
      {children}
    </DashboardShell>
  );
}
