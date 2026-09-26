'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrustForm from '@/components/dashboard/super-admin/TrustForm';
import { Loader2 } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

export default function TrustEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const [trust, setTrust] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    if (id) {
      fetch(`/api/admin/trusts/${id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setTrust(data);
          else showAlert({ title: 'Unable to load trust', message: data.error, variant: 'danger' });
        })
        .catch(() => showAlert({ title: 'Unable to load trust', message: 'Failed to fetch trust data.', variant: 'danger' }))
        .finally(() => setLoading(false));
    }
  }, [id, showAlert]);

  return (
    <DashboardLayout
      title="Edit Trust Organization"
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-slate-400 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Fetching trust records...</p>
          </div>
        ) : trust ? (
          <TrustForm 
            initialData={trust} 
            isEdit={true} 
            onSubmitSuccess={() => router.push('/superadmin/trust')}
          />
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">Trust record not found.</p>
          </div>
        )}
      </div>
      {dialog}
    </DashboardLayout>
  );
}
