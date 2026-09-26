'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditEventForm from '@/components/dashboard/sub-admin/EditEventForm';

export default function SubAdminEditEventPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <DashboardLayout title="Edit Event" role="SUB_ADMIN" activeItem="School Hub">
      <EditEventForm eventId={id} />
    </DashboardLayout>
  );
}
