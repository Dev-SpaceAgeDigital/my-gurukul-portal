import DashboardLayout from '@/components/layout/DashboardLayout';
import CSRManagement from '@/components/dashboard/admin/CSRManagement';

export default function SuperadminCSRPage() {
  return (
    <DashboardLayout title="CSR Management" role="SUPER_ADMIN" activeItem="CSR Management">
      <CSRManagement role="SUPER_ADMIN" />
    </DashboardLayout>
  );
}
