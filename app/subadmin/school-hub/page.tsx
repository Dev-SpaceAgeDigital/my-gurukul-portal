import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchoolHubManager from '@/components/dashboard/sub-admin/SchoolHubManager';

const validTabs = ['school-page', 'updates', 'events'] as const;

export default async function SubadminSchoolHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getSessionFromCookies('ADMIN');
  if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
    redirect('/subadmin/login');
  }

  const params = searchParams ? await searchParams : {};
  const initialTab = validTabs.find((tab) => tab === params.tab) || 'school-page';

  return (
    <DashboardLayout title="School Hub" role="SUB_ADMIN" activeItem="School Hub">
      <SchoolHubManager schoolId={session.schoolId} initialTab={initialTab} />
    </DashboardLayout>
  );
}
