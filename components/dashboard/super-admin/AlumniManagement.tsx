'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Mail,
  Link2,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Key,
  Calendar,
  ExternalLink,
  ChevronRight,
  School,
  Star
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface EligibleStudent {
  id: string;
  name: string;
  studentCode: string;
  standardName: string;
  batchYear: string | null;
  gmailId?: string;
  linkedIn?: string;
}

interface Alumni {
  id: string;
  name: string;
  email: string;
  password?: string;
  linkedIn: string | null;
  batchYear: string;
  studentId: string | null;
  createdAt: string;
  standardName?: string;
  isFeatured?: boolean;
}

export default function AlumniManagement() {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'directory'>('eligibility');
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [selectedStandard, setSelectedStandard] = useState('All');
  const { dialog, showAlert, confirmDialog } = usePortalDialog();

  useEffect(() => {
    if (activeTab === 'eligibility') fetchEligible();
    else fetchAlumni();
  }, [activeTab, selectedStandard]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, selectedStandard]);

  const fetchEligible = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subadmin/alumni?type=eligible&standard=${selectedStandard}`);
      if (res.ok) {
        const data = await res.json();
        setEligibleStudents(data.map((s: any) => ({ ...s, gmailId: '', linkedIn: '' })));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subadmin/alumni?type=directory&standard=${selectedStandard}`);
      if (res.ok) {
        const data = await res.json();
        setAlumniList(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (student: EligibleStudent) => {
    if (!student.gmailId) {
      showAlert({
        title: 'Gmail ID required',
        message: 'Enter the student Gmail ID before authorizing alumni access.',
        variant: 'danger',
      });
      return;
    }
    setProcessingId(student.id);
    try {
      const res = await fetch('/api/subadmin/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          gmailId: student.gmailId,
          linkedIn: student.linkedIn,
          batchYear: student.batchYear || '2024-25'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData(data);
        fetchEligible();
      } else {
        const err = await res.json();
        showAlert({ title: 'Authorization failed', message: err.error || 'Unable to authorize alumni access.', variant: 'danger' });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleFeatureAlumni = async (alumni: Alumni) => {
    setProcessingId(alumni.id);
    try {
      const res = await fetch('/api/subadmin/alumni', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alumni.id, isFeatured: !alumni.isFeatured }),
      });

      if (res.ok) {
        fetchAlumni();
      } else {
        const err = await res.json();
        showAlert({ title: 'Update failed', message: err.error || 'Failed to update featured alumni.', variant: 'danger' });
      }
    } finally {
      setProcessingId(null);
    }
	  };

  const handleResetAccess = async (alumni: Alumni) => {
    const confirmed = await confirmDialog({
      title: 'Reset alumni access?',
      message: `A new temporary password will be generated and emailed to ${alumni.email}.`,
      variant: 'info',
      confirmText: 'Reset Access',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setProcessingId(alumni.id);
    try {
      const res = await fetch('/api/subadmin/alumni/reset-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumniId: alumni.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessData({ ...data, resetAccess: true });
      } else {
        showAlert({ title: 'Reset failed', message: data.error || 'Failed to reset alumni access.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Connection failed', message: 'Failed to connect to server.', variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAlumni = alumniList.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.batchYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAlumni.length / rowsPerPage) || 1;
  const currentAlumniData = filteredAlumni.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalEligiblePages = Math.ceil(eligibleStudents.length / rowsPerPage) || 1;
  const currentEligibleData = eligibleStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Alumni Directory</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Graduation Management & Directory</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setActiveTab('eligibility')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'eligibility' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Make Alumni
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'directory' ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Alumni List
          </button>
        </div>
      </div>

      {/* Standard Filters */}
      <div className="flex bg-white px-5 py-2 rounded-md border border-slate-200 shadow-sm shrink-0 items-center space-x-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-2">Filter Standard:</span>
        {['All', '10th', '11th', '12th'].map(std => (
          <button
            key={std}
            onClick={() => setSelectedStandard(std)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border ${selectedStandard === std ? 'bg-amber-50 text-[#dac48b] border-amber-100' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50'}`}
          >
            {std}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-md border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-[#dac48b] mb-4" size={32} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Analyzing cohort records...</p>
        </div>
      ) : activeTab === 'eligibility' ? (
        <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse text-[11px] min-w-[1000px]">
              <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Student identity</th>
                  <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Authorization Gmail</th>
                  <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Professional Link</th>
                  <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <CheckCircle2 size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wide">No students identified for graduating transition.</p>
                    </td>
                  </tr>
                ) : currentEligibleData.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-md bg-slate-100 text-[#dac48b] flex items-center justify-center font-bold text-sm border border-slate-200 group-hover:bg-white transition-all shrink-0">
                          {std.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 leading-snug group-hover:text-black transition-colors">{std.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400">{std.studentCode}</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Batch {std.batchYear || 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="email"
                        placeholder="Gmail username"
                        value={std.gmailId}
                        onChange={(e) => {
                          const absoluteIdx = (currentPage - 1) * rowsPerPage + idx;
                          const newList = [...eligibleStudents];
                          newList[absoluteIdx].gmailId = e.target.value;
                          setEligibleStudents(newList);
                        }}
                        className="w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs font-bold transition-all outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          type="url"
                          placeholder="LinkedIn URL"
                          value={std.linkedIn}
                          onChange={(e) => {
                            const absoluteIdx = (currentPage - 1) * rowsPerPage + idx;
                            const newList = [...eligibleStudents];
                            newList[absoluteIdx].linkedIn = e.target.value;
                            setEligibleStudents(newList);
                          }}
                          className="w-full pl-9 pr-3 py-2 rounded-md focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs font-bold transition-all outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8 relative">
                      <button
                        onClick={() => handleConvert(std)}
                        disabled={processingId === std.id}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        {processingId === std.id ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                        <span>Authorize</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {eligibleStudents.length > 0 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, eligibleStudents.length)} of {eligibleStudents.length}
              </span>
              <div className="flex items-center space-x-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                <span className="text-[10px] font-bold text-slate-900 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                  {currentPage} / {totalEligiblePages}
                </span>
                <button 
                  disabled={currentPage === totalEligiblePages} 
                  onClick={() => setCurrentPage(prev => Math.min(totalEligiblePages, prev + 1))}
                  className="px-3 py-1.5 rounded-md bg-[#18181b] text-white border border-transparent text-[10px] font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 animate-in slide-in-from-right-4 duration-500">
          {/* Directory Search */}
          <div className="bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm flex items-center space-x-4 shrink-0">
            <Search className="text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search by name, year, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-slate-700 placeholder:text-slate-300"
            />
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse text-[11px] min-w-[1000px]">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Alumni identity</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Batch</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Secured access</th>
                    <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentAlumniData.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-9 h-9 rounded-md bg-slate-100 text-[#dac48b] border border-slate-200 flex items-center justify-center font-bold text-sm group-hover:bg-white transition-all shrink-0">
                            {a.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-700 leading-snug group-hover:text-black transition-colors">{a.name}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {a.standardName && (
                                <span className="text-[10px] font-bold text-slate-400">{a.standardName}</span>
                              )}
                              {a.linkedIn && (
                                <a href={a.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#dac48b] hover:underline flex items-center font-medium">
                                  <Link2 size={10} className="mr-1" /> Profile Link
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 text-[#a98f4a] text-[10px] font-bold rounded-md border border-amber-100/50">
                          {a.batchYear}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-600 flex items-center">
                            <Mail size={12} className="mr-2 text-slate-300" />
                            {a.email}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium italic ml-5">
                            Created {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-8 relative">
	                        <div className="flex items-center justify-end space-x-2">
	                          <button
	                            onClick={() => handleFeatureAlumni(a)}
	                            disabled={processingId === a.id}
	                            className={`p-1.5 border rounded-md transition-all ${a.isFeatured ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-white hover:shadow-sm border-transparent hover:border-slate-200'}`}
	                            title={a.isFeatured ? 'Remove from Donate page impact section' : 'Show on Donate page impact section'}
	                          >
	                            <Star size={14} fill={a.isFeatured ? 'currentColor' : 'none'} />
	                          </button>
	                          <button className="p-1.5 text-slate-400 hover:text-black hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all">
                            <ShieldCheck size={14} />
                          </button>
                          <button
                            onClick={() => handleResetAccess(a)}
                            disabled={processingId === a.id}
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reset access and email temporary password"
                          >
                            <Key size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredAlumni.length > 0 && (
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredAlumni.length)} of {filteredAlumni.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] font-bold text-slate-900 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 rounded-md bg-[#18181b] text-white border border-transparent text-[10px] font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6 animate-in zoom-in duration-300 text-center">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
	            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">{successData.resetAccess ? 'Access reset' : 'Account authorized'}</h3>
	            <p className="text-slate-500 text-[12px] font-medium mb-8 leading-relaxed">
	              {successData.resetAccess ? 'A new temporary password has been generated for ' : 'Alumni access has been provisioned for '}
                <span className="text-[#1A3D63] font-bold">{successData.name}</span>.
	            </p>

            <div className="space-y-3 mb-10 text-left">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 mb-1">Authorization email</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{successData.email}</p>
              </div>
              <div className="bg-[#1A3D63]/5 p-4 rounded-2xl border border-[#1A3D63]/10">
                <p className="text-[9px] font-bold text-[#1A3D63] mb-1">Primary access key</p>
                <p className="text-[13px] font-bold text-[#1A3D63] tracking-widest">{successData.password}</p>
              </div>
            </div>

            <button
              onClick={() => setSuccessData(null)}
              className="w-full bg-[#1A3D63] hover:bg-[#0A1931] text-white font-bold py-4 rounded-2xl text-[12px] transition-all active:scale-95"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
      {dialog}

    </div>
  );
}
