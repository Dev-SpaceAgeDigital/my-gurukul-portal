'use client';

import React, { useState, useEffect } from 'react';
import StudentDetailsModal from '../../ui/StudentDetailsModal';
import { 
  Search, 
  Filter, 
  Download,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Student {
  id: string;
  name: string;
  studentCode: string | null;
  currentClass: string | null;
  section: string | null;
  standardName: string | null;
  division: string | null;
  contactNo: string | null;
  gender: string | null;
  admissionDate: string | null;
  batchYear: string | null;
}

interface Standard {
  id: string;
  standardName: string;
  division: string | null;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { dialog, showAlert } = usePortalDialog();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchStandards();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedStandardId]);

  const fetchStandards = async () => {
    try {
      const res = await fetch('/api/subadmin/standards');
      if (res.ok) {
        const data = await res.json();
        setStandards(data);
      }
    } catch (err) {
      console.error('Failed to fetch standards');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const url = selectedStandardId 
        ? `/api/subadmin/students?standardId=${selectedStandardId}` 
        : '/api/subadmin/students';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        showAlert({ title: 'Load failed', message: 'Failed to load students.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network communication error', message: 'Failed to load students.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentCode && s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStandardId]);

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Controls Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
         <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Student Directory</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Institutional database for student records</p>
         </div>

         <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b] transition-colors" size={13} />
               <input 
                 type="text" 
                 placeholder="Search students..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs transition-all w-40 focus:w-48"
               />
            </div>

            {/* Standard Filter */}
            <div className="relative group">
               <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
               <select 
                 value={selectedStandardId}
                 onChange={(e) => setSelectedStandardId(e.target.value)}
                 className="pl-9 pr-8 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs appearance-none cursor-pointer transition-all"
               >
                  <option value="">All Standards</option>
                  {standards.map(std => (
                    <option key={std.id} value={std.id}>{std.standardName} {std.division ? `(${std.division})` : ''}</option>
                  ))}
               </select>
            </div>

            <button className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm">
               <Download size={14} />
            </button>
         </div>
      </div>

      {/* Registry Table Container */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
         {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
               <Loader2 className="animate-spin text-[#dac48b] mb-4" size={32} />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accessing Registry...</p>
            </div>
         ) : (
            <div className="overflow-auto custom-scrollbar flex-1">
               <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Student identity</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Standard / Grade</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Batch</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Contact details</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {paginatedStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-3.5">
                                 <div className="w-9 h-9 rounded-md bg-slate-100/50 border border-slate-200/60 flex items-center justify-center font-bold text-[#dac48b] group-hover:bg-white transition-all shrink-0">
                                    {s.name[0]}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-slate-700 leading-snug group-hover:text-black transition-colors truncate">{s.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium italic">Code: {s.studentCode || 'N/A'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                 <p className="text-[12px] font-bold text-slate-600">{s.standardName || s.currentClass || 'General'}</p>
                                 <p className="text-[10px] text-slate-400 font-bold opacity-70">Div: {s.division || s.section || 'N/A'}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="text-[10px] font-bold text-[#dac48b] bg-amber-50 px-2 py-1 rounded-md border border-amber-100/50">
                                 {s.batchYear || 'TBD'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-0.5 text-[11px] font-medium text-slate-500">
                                 <p className="text-slate-700">{s.contactNo || 'SECURE'}</p>
                                 <p className="text-[10px] opacity-60 italic uppercase tracking-tighter">{s.gender || 'UNDEFINED'}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right pr-8">
                              <div className="flex items-center justify-end space-x-2">
                                 <button 
                                   onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                                   className="p-1.5 text-slate-400 hover:text-black hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all"
                                   title="View Transcript"
                                 >
                                    <Eye size={14} />
                                 </button>
                                 <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md transition-all" title="Archive Record">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
      {/* Pagination Container */}
      {filteredStudents.length > 0 && (
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}
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
              {currentPage} / {totalPages || 1}
            </span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-md bg-[#18181b] text-white border border-transparent text-[10px] font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isModalOpen && selectedStudent && (
        <StudentDetailsModal 
          student={selectedStudent} 
          standards={standards} 
          onClose={() => { setIsModalOpen(false); setSelectedStudent(null); }}
          onUpdate={fetchStudents}
        />
      )}

    </div>
    {dialog}
    </>
  );
}
