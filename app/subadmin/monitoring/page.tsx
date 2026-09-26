import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MonitoringManager from '@/components/dashboard/sub-admin/MonitoringManager';
import { getSessionFromCookies } from '@/lib/auth';

export default async function SubadminMonitoringPage() {
  const session = await getSessionFromCookies('SUB_ADMIN');
  if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
    redirect('/subadmin/login');
  }

  return (
    <DashboardLayout title="Monitoring" role="SUB_ADMIN" activeItem="Monitoring">
      <MonitoringManager />
    </DashboardLayout>
  );
}
