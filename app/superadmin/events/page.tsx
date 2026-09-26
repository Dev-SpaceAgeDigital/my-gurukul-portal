import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventGallery from '@/components/dashboard/sub-admin/EventGallery';

export default function SuperAdminEventsPage() {
  return (
    <DashboardLayout title="Events & Memories" role="SUPER_ADMIN" activeItem="Events & Memories">
      <div className="py-4">
        <EventGallery isSuperAdmin />
      </div>
    </DashboardLayout>
  );
}
