import DashboardLayout from '@/components/layout/DashboardLayout';
import AlumniCommunicationManager from '@/components/dashboard/super-admin/AlumniCommunicationManager';

export default function SuperadminAlumniCommunicationPage() {
  return (
    <DashboardLayout title="Alumni Communication" role="SUPER_ADMIN" activeItem="Alumni Communication">
      <AlumniCommunicationManager />
    </DashboardLayout>
  );
}
