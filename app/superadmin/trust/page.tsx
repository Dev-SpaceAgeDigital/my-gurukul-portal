'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrustManagement from '@/components/dashboard/super-admin/TrustManagement';

export default function SuperAdminTrustPage() {
  return (
    <DashboardLayout
      title="Trust organizations"
      role="SUPER_ADMIN"
      activeItem="Trusts"
    >
      <div className="py-4">
        <TrustManagement />
      </div>
    </DashboardLayout>
  );
}
