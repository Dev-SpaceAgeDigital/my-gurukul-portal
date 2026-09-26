'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import NewsUpdatesManager from '@/components/dashboard/shared/NewsUpdatesManager';

export default function SuperAdminUpdatesPage() {
  return (
    <DashboardLayout title="Updates" role="SUPER_ADMIN" activeItem="Updates">
      <NewsUpdatesManager role="SUPER_ADMIN" />
    </DashboardLayout>
  );
}
