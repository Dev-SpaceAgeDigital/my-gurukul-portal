'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditProjectForm from '@/components/dashboard/sub-admin/EditProjectForm';

export default function SubAdminEditProjectPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <DashboardLayout title="Edit Project" role="SUB_ADMIN" activeItem="Accounts">
      <EditProjectForm projectId={id} />
    </DashboardLayout>
  );
}
