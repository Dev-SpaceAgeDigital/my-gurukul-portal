import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddEventForm from '@/components/dashboard/sub-admin/AddEventForm';

export default function SuperAdminAddEventPage() {
  return (
    <DashboardLayout title="Create Event" role="SUPER_ADMIN" activeItem="Events & Memories">
      <AddEventForm isSuperAdmin />
    </DashboardLayout>
  );
}
