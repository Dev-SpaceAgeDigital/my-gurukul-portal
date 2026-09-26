'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TransactionHistory from '@/components/dashboard/sub-admin/TransactionHistory';

export default function SubAdminDonationsPage() {
  return (
    <DashboardLayout title="Donations" role="SUB_ADMIN" activeItem="Donations">
      <div className="py-4"><TransactionHistory /></div>
    </DashboardLayout>
  );
}
