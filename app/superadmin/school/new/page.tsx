'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchoolForm from '@/components/dashboard/super-admin/SchoolForm';

export default function SchoolNewPage() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Register New School"
      role="SUPER_ADMIN"
      activeItem="Schools"
    >
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="text-sm font-bold text-slate-400 hover:text-[#1A3D63] transition-colors flex items-center group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Institutional Registry
          </button>
        </div>

        <SchoolForm 
          isEdit={false} 
          onSubmitSuccess={() => router.push('/superadmin/school')}
        />
      </div>
    </DashboardLayout>
  );
}
