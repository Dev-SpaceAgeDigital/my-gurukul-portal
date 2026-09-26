'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SetupWizard from '@/components/dashboard/sub-admin/SetupWizard';

export default function SubAdminClassSetupPage() {
  return (
    <DashboardLayout title="Class Setup" role="SUB_ADMIN" activeItem="Class Setup">
      <div className="py-4"><SetupWizard /></div>
    </DashboardLayout>
  );
}
