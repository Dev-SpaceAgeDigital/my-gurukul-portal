import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditEventForm from '@/components/dashboard/sub-admin/EditEventForm';

export default async function SuperAdminEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <DashboardLayout title="Edit Event" role="SUPER_ADMIN" activeItem="Events & Memories">
      <EditEventForm eventId={resolvedParams.id} isSuperAdmin />
    </DashboardLayout>
  );
}
