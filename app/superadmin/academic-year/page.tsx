'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AcademicYearManager from '@/components/dashboard/super-admin/AcademicYearManager';

export default function SuperAdminAcademicYearPage() {
  return (
    <DashboardLayout
      title="Academic calendar"
      role="SUPER_ADMIN"
      activeItem="Academic Years"
    >
      <div className="py-4">
        <AcademicYearManager isAdmin={true} />
      </div>
    </DashboardLayout>
  );
}
