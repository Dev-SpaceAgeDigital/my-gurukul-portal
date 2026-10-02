import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminDonationsManager from '@/components/dashboard/super-admin/SuperAdminDonationsManager';

export default function SuperAdminDonationsPage() {
  return (
    <DashboardLayout title="Donations & Projects" role="SUPER_ADMIN" activeItem="Donations & Projects">
      <div className="py-2">
        <SuperAdminDonationsManager />
      </div>
    </DashboardLayout>
  );
}
