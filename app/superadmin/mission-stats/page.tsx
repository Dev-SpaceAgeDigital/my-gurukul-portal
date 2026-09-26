'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MissionStatsManager from '@/components/dashboard/super-admin/MissionStatsManager';

export default function SuperAdminMissionStatsPage() {
  return (
    <DashboardLayout
      title="Mission stats"
      role="SUPER_ADMIN"
      activeItem="Mission Stats"
    >
      <div className="py-4">
        <MissionStatsManager />
      </div>
    </DashboardLayout>
  );
}
