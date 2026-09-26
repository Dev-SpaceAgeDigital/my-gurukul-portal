'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentList from '@/components/dashboard/sub-admin/StudentList';

export default function SubAdminStudentsPage() {
  return (
    <DashboardLayout title="Students" role="SUB_ADMIN" activeItem="Students">
      <div className="py-4"><StudentList /></div>
    </DashboardLayout>
  );
}
