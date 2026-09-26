import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmailAutomationManager from '@/components/dashboard/sub-admin/EmailAutomationManager';
import { getSessionFromCookies } from '@/lib/auth';

export default async function SubadminEmailAutomationPage() {
  const session = await getSessionFromCookies('SUB_ADMIN');
  if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
    redirect('/subadmin/login');
  }

  return (
    <DashboardLayout title="Email Automation" role="SUB_ADMIN" activeItem="Dashboard">
      <EmailAutomationManager />
    </DashboardLayout>
  );
}
