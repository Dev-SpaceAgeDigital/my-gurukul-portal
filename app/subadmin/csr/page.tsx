import DashboardLayout from '@/components/layout/DashboardLayout';
import CSRManagement from '@/components/dashboard/admin/CSRManagement';

export default function SubadminCSRPage() {
  return (
    <DashboardLayout title="CSR Management" role="SUB_ADMIN" activeItem="CSR Management">
      <CSRManagement role="SUB_ADMIN" />
    </DashboardLayout>
  );
}
