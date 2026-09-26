'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PromotionHub from '@/components/dashboard/super-admin/PromotionHub';

export default function SubAdminPromotionPage() {
  return (
    <DashboardLayout title="Promotion" role="SUB_ADMIN" activeItem="Promotion">
      <div className="py-4"><PromotionHub /></div>
    </DashboardLayout>
  );
}
