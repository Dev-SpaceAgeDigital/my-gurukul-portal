'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  School,
  Plus,
  Trash2,
  Edit3,
  Building2,
  Users,
  Layers,
  Loader2
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface SchoolData {
  id: string;
  schoolName: string;
  currentStudentsNo: number;
  address: string | null;
  phoneNo: string | null;
  email: string | null;
  medium: string | null;
  schoolDiseNo: string | null;
  isHaveRTE: boolean;
  sscIndexNo: string | null;
  hscIndexNo: string | null;
  establishYear: number | null;
  totalStandards: number | null;
  trustId: string;
  trustName?: string;
  imageUrls?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export default function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json();
      if (res.ok) {
        setSchools(data);
      } else {
        showAlert({ title: 'Load failed', message: data.error || 'Failed to fetch registry data.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Connection failure', message: 'Unable to load school registry.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Delete this school record?',
      message: 'This school and its registry details will be removed.',
      confirmText: 'Delete school',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchSchools();
    } catch (err) {
      showAlert({ title: 'Action aborted', message: 'The school could not be deleted. Please try again.', variant: 'danger' });
    }
  };

  return (
    <>
    <div className="space-y-4 animate-in fade-in duration-500">

      <div className="flex justify-end pt-2">
        <Link
          href="/superadmin/school/new"
          className="bg-[#0b1525] text-white px-5 py-3 rounded-xl hover:bg-[#162a45] transition-all font-semibold text-xs shadow-sm flex items-center group gap-2"
        >
          <Plus size={15} strokeWidth={2.5} className="group-hover:scale-115 transition-transform" />
          <span>New school</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[40%]">School</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[25%]">Trust</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[25%]">Details</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-right w-[10%] pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && !schools.length ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-slate-400 mx-auto mb-2" size={32} />
                    <p className="text-slate-400 text-xs font-medium">Scanning registry...</p>
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-medium text-sm">
                    No units localized.
                  </td>
                </tr>
              ) : (
                schools.map(school => (
                <tr key={school.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100/50 border border-slate-200/60 flex flex-shrink-0 items-center justify-center text-slate-400 group-hover:bg-[#1A3D63]/10 group-hover:text-[#1A3D63] transition-all overflow-hidden relative">
                          {school.imageUrls && school.imageUrls[0] ? (
                            <Image src={school.imageUrls[0]} alt="" fill className="object-cover" />
                          ) : (
                            <School size={18} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 leading-snug group-hover:text-[#1A3D63] transition-colors">{school.schoolName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-medium italic">Dise: {school.schoolDiseNo || 'No record'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-2">
                        <Building2 size={14} className="text-slate-300" />
                        <span className="text-[12px] font-semibold text-slate-600 truncate max-w-[200px]">
                          {school.trustName || 'Floating identity'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-700">{school.currentStudentsNo}</span>
                          <span className="text-[8px] text-slate-400 font-medium tracking-tight">Active students</span>
                        </div>
                        <div className="w-px h-5 bg-slate-100"></div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-700">{school.totalStandards}</span>
                          <span className="text-[8px] text-slate-400 font-medium tracking-tight">Standards</span>
                        </div>
                         {school.imageUrls && school.imageUrls.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-slate-100"></div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-[#1A3D63]">{school.imageUrls.length}</span>
                              <span className="text-[9px] text-[#1A3D63]/60 font-medium tracking-tight">Archive</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right pr-8 relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-1 px-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <Link href={`/superadmin/school/${school.id}/edit`} className="p-1.5 text-slate-400 hover:text-[#1A3D63] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all" title="Edit Institutional Record">
                          <Edit3 size={14} />
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(school.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all" title="Delete Permanent">
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
