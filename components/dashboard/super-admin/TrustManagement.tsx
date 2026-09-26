'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  User as UserIcon,
  Phone,
  Hash,
  X,
  Loader2,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Trust {
  id: string;
  trustName: string;
  registrationNo: string;
  establishmentYear: number | null;
  presidentName: string | null;
  presidentNo: string | null;
  trusteesName: string[];
  trusteesNo: string[];
  createdAt: string;
  updatedAt: string;
}

export default function TrustManagement() {
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchTrusts();
  }, []);

  const fetchTrusts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trusts');
      const data = await res.json();
      if (res.ok) setTrusts(data);
      else showAlert({ title: 'Load failed', message: data.error || 'Unable to load trusts.', variant: 'danger' });
    } catch (err) {
      showAlert({ title: 'Communication failed', message: 'Unable to load trusts.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Delete this trust?',
      message: 'This trust record will be removed from the admin registry.',
      confirmText: 'Delete trust',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch('/api/admin/trusts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchTrusts();
    } catch (err) {
      showAlert({ title: 'Delete failed', message: 'The trust could not be deleted. Please try again.', variant: 'danger' });
    }
  };


  return (
    <>
    <div className="space-y-4 animate-in fade-in duration-500">

      <div className="flex justify-end pt-2">
        <Link
          href="/superadmin/trust/new"
          className="bg-[#0b1525] text-white px-5 py-3 rounded-xl hover:bg-[#162a45] transition-all font-semibold text-xs shadow-sm flex items-center group gap-2"
        >
          <Plus size={15} strokeWidth={2.5} className="group-hover:scale-115 transition-transform" />
          <span>New trust</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[35%]">Trust name</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[22%]">Registration</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-center w-[8%]">Est.</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[17%]">President</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[18%] pr-14">Trustees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && !trusts.length ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-slate-400 mx-auto mb-2" size={32} />
                    <p className="text-slate-400 text-xs font-medium">Loading trusts...</p>
                  </td>
                </tr>
              ) : trusts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-medium text-sm">
                    No trusts registered.
                  </td>
                </tr>
              ) : (
                trusts.map(trust => (
                <tr key={trust.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100/50 border border-slate-200/60 flex flex-shrink-0 items-center justify-center text-slate-400 group-hover:bg-[#1A3D63]/10 group-hover:text-[#1A3D63] transition-all">
                          <Building2 size={18} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 leading-snug group-hover:text-[#1A3D63] transition-colors">{trust.trustName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-600 tracking-tight leading-tight">
                          {trust.registrationNo}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium tracking-tighter italic">Official registration</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="text-[12px] font-semibold text-slate-500 font-mono tracking-tighter">
                        {trust.establishmentYear || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-semibold text-slate-700">{trust.presidentName || 'N/A'}</p>
                        <div className="flex items-center space-x-1.5 opacity-60">
                          <Phone size={10} className="text-slate-500" />
                          <p className="text-[10px] text-slate-600 font-semibold">{trust.presidentNo || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 pr-14 relative">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5">
                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1A3D63]/5 text-[#1A3D63] text-[10px] font-semibold border border-[#1A3D63]/10 flex-shrink-0">
                            {trust.trusteesName?.length || 0}
                          </span>
                          <p className="text-[10px] font-semibold text-slate-500 tracking-widest">Active trustees</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">
                          {Array.isArray(trust.trusteesName) && trust.trusteesName.length > 0
                            ? trust.trusteesName.join(', ')
                            : 'None listed'}
                        </p>
                      </div>

                      {/* Actions Overlay for a cleaner idle look */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-1 px-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <Link href={`/superadmin/trust/${trust.id}/edit`} className="p-1.5 text-slate-400 hover:text-[#1A3D63] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all" title="Edit Record">
                          <Edit3 size={14} />
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(trust.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all" title="Delete Permanent">
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
