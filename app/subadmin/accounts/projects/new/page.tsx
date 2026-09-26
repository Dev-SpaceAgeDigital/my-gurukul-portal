'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddProjectForm from '@/components/dashboard/sub-admin/AddProjectForm';

export default function SubAdminNewProjectPage() {
  return (
    <DashboardLayout title="Add Project" role="SUB_ADMIN" activeItem="Accounts">
      <AddProjectForm />
    </DashboardLayout>
  );
}
