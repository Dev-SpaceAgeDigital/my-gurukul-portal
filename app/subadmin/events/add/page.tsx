import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddEventForm from '@/components/dashboard/sub-admin/AddEventForm';

export default async function AddEventPage() {
  const session = await getSessionFromCookies('ADMIN');
  if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
    redirect('/subadmin/login');
  }

  return (
    <DashboardLayout title="Add Event" role="SUB_ADMIN" activeItem="School Hub">
      <AddEventForm />
    </DashboardLayout>
  );
}
