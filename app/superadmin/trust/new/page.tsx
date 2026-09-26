'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrustForm from '@/components/dashboard/super-admin/TrustForm';

export default function TrustNewPage() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Register New Trust"
      role="SUPER_ADMIN"
      activeItem="Trusts"
    >
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center"
          >
            ← Back to List
          </button>
        </div>

        <TrustForm 
          isEdit={false} 
          onSubmitSuccess={() => router.push('/superadmin/trust')}
        />
      </div>
    </DashboardLayout>
  );
}
