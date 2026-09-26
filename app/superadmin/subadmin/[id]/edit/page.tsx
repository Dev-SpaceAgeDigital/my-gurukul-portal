'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubAdminForm from '@/components/dashboard/super-admin/SubAdminForm';

export default function SubAdminEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <DashboardLayout
      title="Modify Officer Credentials"
      role="SUPER_ADMIN"
      activeItem="Subadmins"
    >
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="text-sm font-bold text-slate-400 hover:text-[#1A3D63] transition-colors flex items-center group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Administrative Roster
          </button>
        </div>

        <SubAdminForm 
          subAdminId={id}
          isEdit={true} 
          onSubmitSuccess={() => router.push('/superadmin/subadmin')}
        />
      </div>
    </DashboardLayout>
  );
}
