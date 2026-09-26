'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchoolManagement from '@/components/dashboard/super-admin/SchoolManagement';

export default function SuperAdminSchoolPage() {
  return (
    <DashboardLayout
      title="Institutional units"
      role="SUPER_ADMIN"
      activeItem="Schools"
    >
      <div className="py-4">
        <SchoolManagement />
      </div>
    </DashboardLayout>
  );
}
