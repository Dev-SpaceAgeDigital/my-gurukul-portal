'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlumniManagement from '@/components/dashboard/super-admin/AlumniManagement';

export default function SuperAdminAlumniPage() {
  return (
    <DashboardLayout
      title="Alumni directory"
      role="SUPER_ADMIN"
      activeItem="Alumnis"
    >
      <div className="py-4">
        <AlumniManagement />
      </div>
    </DashboardLayout>
  );
}
