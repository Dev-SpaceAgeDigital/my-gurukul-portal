'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Plus,
  Trash2,
  Edit3,
  School as SchoolIcon,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  phoneNo: string | null;
  address: string | null;
  relation: string | null;
  schoolId: string | null;
  schoolName?: string;
}

export default function SubAdminManagement() {
  const [subadmins, setSubadmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subadmins');
      const data = await res.json();
      if (res.ok) {
        setSubadmins(data);
      } else {
        showAlert({ title: 'Load failed', message: data.error || 'Failed to sync roster.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Communication error', message: 'Unable to load sub-admin roster.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'De-provision this officer?',
      message: 'This sub-admin account will lose access to the dashboard.',
      confirmText: 'De-provision',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch('/api/admin/subadmins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      showAlert({ title: 'Delete failed', message: 'The officer could not be removed. Please try again.', variant: 'danger' });
    }
  };

  return (
    <>
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Page Actions */}
      <div className="flex justify-end pt-2">
        <Link
          href="/superadmin/subadmin/new"
          className="bg-[#0b1525] text-white px-5 py-3 rounded-xl hover:bg-[#162a45] transition-all font-semibold text-xs shadow-sm flex items-center group gap-2"
        >
          <Plus size={15} strokeWidth={2.5} className="group-hover:scale-115 transition-transform" />
          <span>Provision Sub-admin</span>
        </Link>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[35%]">Officer</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[25%]">Assignment</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[30%]">Contact Terminal</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-right w-[10%] pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && !subadmins.length ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-slate-400 mx-auto mb-2" size={32} />
                    <p className="text-slate-400 text-xs font-medium">Scanning roster...</p>
                  </td>
                </tr>
              ) : subadmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-medium text-sm italic">
                    No administrative officers provisioned.
                  </td>
                </tr>
              ) : (
                subadmins.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:bg-[#1A3D63]/10 group-hover:text-[#1A3D63] transition-all">
                          <UserIcon size={18} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 leading-snug group-hover:text-[#1A3D63] transition-colors">{sub.name}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium italic">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                       <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-slate-600">
                             <SchoolIcon size={12} className="text-slate-300" />
                             <span className="text-[12px] font-semibold truncate max-w-[180px]">{sub.schoolName || 'Floating identity'}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold opacity-70 ml-5 uppercase tracking-tighter">{sub.relation || 'Officer'}</p>
                       </div>
                    </td>
                    <td className="px-6 py-3.5">
                       <div className="space-y-1.5 text-[11px] font-semibold text-slate-500">
                          <div className="flex items-center space-x-2">
                             <Phone size={12} className="text-slate-300" />
                             <span className="tracking-tight">{sub.phoneNo || 'SECURE TERMINAL'}</span>
                          </div>
                          {sub.address && (
                            <div className="flex items-center space-x-2 opacity-60">
                               <MapPin size={12} className="text-slate-300 flex-shrink-0" />
                               <span className="truncate max-w-[200px] font-medium italic">{sub.address}</span>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-3.5 text-right pr-8 relative">
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-1 px-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <Link href={`/superadmin/subadmin/${sub.id}/edit`} className="p-1.5 text-slate-400 hover:text-[#1A3D63] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all" title="Modify Credentials">
                           <Edit3 size={14} />
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all" title="De-provision Account">
                           <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
    {dialog}
    </>
  );
}
