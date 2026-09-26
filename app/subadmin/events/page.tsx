import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const session = await getSessionFromCookies('ADMIN');
  if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
    redirect('/subadmin/login');
  }

  redirect('/subadmin/school-hub?tab=events');
}
