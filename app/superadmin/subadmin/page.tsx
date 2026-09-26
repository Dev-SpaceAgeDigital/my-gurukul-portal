'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubAdminManagement from '@/components/dashboard/super-admin/SubAdminManagement';

export default function SuperAdminSubAdminPage() {
  return (
    <DashboardLayout
      title="Administrative officers"
      role="SUPER_ADMIN"
      activeItem="Subadmins"
    >
      <div className="py-4">
        <SubAdminManagement />
      </div>
    </DashboardLayout>
  );
}
