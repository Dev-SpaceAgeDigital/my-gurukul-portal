'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ChevronRight,
  Search,
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Filter,
  CheckSquare,
  Square,
  Send,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface School { id: string; schoolName: string; }
interface Standard { id: string; standardName: string; division: string; schoolId: string; }
interface Student { id: string; name: string; studentCode: string; standardId: string; currentClass: string; }
interface AcademicYear { id: string; label: string; isActive: boolean; }

interface PromotionHubProps {
  schoolId?: string;
  isAdmin?: boolean;
}

export default function PromotionHub({ schoolId: propSchoolId, isAdmin = false }: PromotionHubProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedSchool, setSelectedSchool] = useState(propSchoolId || '');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [targetStandard, setTargetStandard] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [toppers, setToppers] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { dialog, showAlert } = usePortalDialog();
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    fetchInitialData();
    if (!isAdmin) {
      fetchStandards('local');
      setSelectedSchool('local');
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const schoolsUrl = isAdmin ? '/api/admin/schools' : null;
      const yearsUrl = isAdmin
        ? `/api/superadmin/academic-years${propSchoolId ? `?schoolId=${propSchoolId}` : ''}`
        : '/api/subadmin/academic-years';

      const resData = await Promise.all([
        schoolsUrl ? fetch(schoolsUrl).then(r => r.json()) : Promise.resolve([]),
        fetch(yearsUrl).then(r => r.json())
      ]);

      setSchools(resData[0]);
      const years = resData[1];
      setAcademicYears(years);
      const activeYear = years.find((y: any) => y.isActive);
      if (activeYear) setSelectedYear(activeYear.id);
    } catch (err) {
      console.error('Failed to fetch initial data');
    }
  };

  useEffect(() => {
    if (selectedSchool) {
      fetchStandards(selectedSchool);
    }
  }, [selectedSchool]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStandard]);

  const fetchStandards = async (schoolId: string) => {
    try {
      const url = isAdmin
        ? `/api/superadmin/standards?schoolId=${schoolId}`
        : `/api/subadmin/standards`;
      const res = await fetch(url);
      setStandards(await res.json());
    } catch (err) {
      console.error('Failed to fetch standards');
    }
  };

  const loadStudents = async () => {
    if (!selectedStandard) return;
    setIsLoading(true);
    try {
      const url = isAdmin
        ? `/api/superadmin/students?standardId=${selectedStandard}&academicYearId=${selectedYear}`
        : `/api/subadmin/students?standardId=${selectedStandard}&academicYearId=${selectedYear}`;
      const res = await fetch(url);
      setStudents(await res.json());
      setSelectedStudents([]);
      setToppers({});
      setPercentages({});
    } catch (err) {
      console.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async (status: 'PROMOTED' | 'REPEATING' | 'DROPPED' | 'GRADUATED') => {
    if (selectedStudents.length === 0) return;
    if (status !== 'DROPPED' && status !== 'GRADUATED' && (!targetStandard || !targetYear)) {
      showAlert({
        title: 'Select target class',
        message: 'Please select both the target standard and academic year before promotion.',
        variant: 'danger',
      });
      return;
    }

    setIsPromoting(true);
    try {
      // Format toppers array from state
      const toppersArray = Object.entries(toppers)
        .filter(([id, rank]) => selectedStudents.includes(id))
        .map(([studentId, rank]) => ({ 
          studentId, 
          rank, 
          percentage: percentages[studentId] ? parseFloat(percentages[studentId]) : null 
        }));

      // Also gather non-topper percentages
      const otherPercentages = Object.entries(percentages)
        .filter(([id, pct]) => selectedStudents.includes(id) && !toppers[id] && pct)
        .map(([studentId, pct]) => ({
          studentId,
          percentage: parseFloat(pct)
        }));

      const url = isAdmin ? '/api/superadmin/promotions' : '/api/subadmin/promotions';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
          targetStandardId: targetStandard || selectedStandard,
          academicYearId: targetYear || selectedYear,
          status,
          currentAcademicYearId: selectedYear,
          schoolId: propSchoolId,
          toppers: toppersArray,
          otherPercentages
        })
      });

      if (res.ok) {
        showAlert({ title: 'Promotion processed', message: 'Selected student records were updated successfully.', variant: 'success' });
        loadStudents();
      } else {
        showAlert({ title: 'Promotion failed', message: 'The promotion request could not be completed.', variant: 'danger' });
      }
    } catch (err) {
      console.error('Promotion error:', err);
    } finally {
      setIsPromoting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleRankChange = (studentId: string, rank: string) => {
    setToppers(prev => {
      const newToppers = { ...prev };
      if (!rank) {
        delete newToppers[studentId];
      } else {
        newToppers[studentId] = parseInt(rank);
      }
      return newToppers;
    });
  };

  const handlePercentageChange = (studentId: string, pct: string) => {
    setPercentages(prev => ({
      ...prev,
      [studentId]: pct
    }));
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const currentStudentData = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Promotion Hub</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Move students to their next class</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/50">
          <Sparkles size={13} className="text-[#dac48b]" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Promotions Active</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {/* Filters Panel */}
        <div className="lg:w-72 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 flex items-center uppercase tracking-wide">
              <Filter size={14} className="mr-2 text-[#dac48b]" /> Current Class
            </h3>

            <div className="space-y-4">
              {isAdmin && !propSchoolId && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Select school</label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-[#f8fafc] focus:bg-[#ffffff]"
                  >
                    <option value="">Choose school...</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Source academic year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-[#f8fafc] focus:bg-[#ffffff]"
                >
                  <option value="">Choose year...</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.label} {y.isActive ? '(Active)' : ''}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Source standard</label>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-[#f8fafc] focus:bg-[#ffffff]"
                  disabled={!selectedSchool}
                >
                  <option value="">Choose standard...</option>
                  {standards.map(s => <option key={s.id} value={s.id}>{s.standardName} - {s.division}</option>)}
                </select>
              </div>

              <button
                onClick={loadStudents}
                disabled={!selectedStandard || isLoading}
                className="w-full bg-[#18181b] text-white font-bold text-[11px] py-2.5 rounded-md hover:bg-black transition-all disabled:opacity-50 shadow-sm uppercase tracking-wider"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Load students'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 flex items-center uppercase tracking-wide">
              <ArrowRightCircle size={14} className="mr-2 text-[#dac48b]" /> Next Class
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Target standard</label>
                <select
                  value={targetStandard}
                  onChange={(e) => setTargetStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-amber-50/10 focus:bg-[#ffffff]"
                >
                  <option value="">Next standard...</option>
                  {standards.map(s => <option key={s.id} value={s.id}>{s.standardName} - {s.division}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Next academic year</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-amber-50/10 focus:bg-[#ffffff]"
                >
                  <option value="">Target year...</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.label} {y.isActive ? '(Active)' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Students Registry Table */}
        <div className="flex-1 min-w-0 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {students.length > 0 ? (
            <>
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                <div className="relative group w-full md:w-64">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b]" />
                  <input
                    type="text"
                    placeholder="Filter registry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#dac48b]/20 transition-all bg-[#ffffff]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePromote('PROMOTED')}
                    disabled={isPromoting || selectedStudents.length === 0}
                    className="flex items-center px-4 py-1.5 bg-[#18181b] text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isPromoting ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-2" />}
                    Promote ({selectedStudents.length})
                  </button>
                  <button
                    onClick={() => handlePromote('REPEATING')}
                    disabled={isPromoting || selectedStudents.length === 0}
                    className="flex items-center px-4 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50 border border-slate-200"
                  >
                    <RotateCcw size={14} className="mr-2" /> Repeat
                  </button>
                  <button
                    onClick={() => handlePromote('DROPPED')}
                    disabled={isPromoting || selectedStudents.length === 0}
                    className="flex items-center px-4 py-1.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-50 border border-rose-100"
                  >
                    <XCircle size={14} className="mr-2" /> Drop
                  </button>
                  
                  {standards.find(s => s.id === selectedStandard)?.standardName.includes('12') && (
                    <button
                      onClick={() => handlePromote('GRADUATED')}
                      disabled={isPromoting || selectedStudents.length === 0}
                      className="flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all disabled:opacity-50 border border-indigo-100"
                    >
                      <Sparkles size={14} className="mr-2" /> Graduate
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <button onClick={toggleSelectAll} className="text-[#dac48b] hover:scale-110 transition-transform">
                          {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Identity Code</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Score %</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Academic Rank</th>
                      <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right">Selection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentStudentData.map((s) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/50 transition-colors group ${selectedStudents.includes(s.id) ? 'bg-[#dac48b]/5' : ''}`}
                      >
                        <td className="px-6 py-4 cursor-pointer" onClick={() => toggleStudent(s.id)}>
                          <div className={`${selectedStudents.includes(s.id) ? 'text-[#dac48b]' : 'text-slate-300'} group-hover:scale-110 transition-transform`}>
                            {selectedStudents.includes(s.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </div>
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => toggleStudent(s.id)}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs transition-colors ${selectedStudents.includes(s.id) ? 'bg-[#dac48b] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#dac48b]/10 group-hover:text-[#dac48b]'}`}>
                              {s.name[0]}
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-black transition-colors">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => toggleStudent(s.id)}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.studentCode}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {toppers[s.id] ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="95.5"
                              value={percentages[s.id] || ''}
                              onChange={(e) => handlePercentageChange(s.id, e.target.value)}
                              className="w-16 px-2 py-1 rounded-md text-[10px] font-bold text-center border outline-none transition-all bg-transparent text-[#dac48b] border-[#dac48b] focus:ring-1 focus:ring-[#dac48b]"
                              autoFocus
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={toppers[s.id] || ''}
                            onChange={(e) => handleRankChange(s.id, e.target.value)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border outline-none transition-all ${toppers[s.id] ? 'bg-amber-50 text-[#dac48b] border-amber-100' : 'bg-transparent text-slate-400 border-slate-200 focus:border-[#dac48b]'}`}
                          >
                            <option value="">- None -</option>
                            <option value="1" disabled={Object.entries(toppers).some(([id, rank]) => rank === 1 && id !== s.id)}>
                              {Object.entries(toppers).some(([id, rank]) => rank === 1 && id !== s.id) ? 'Rank 1 (Taken)' : 'Rank 1 (Gold)'}
                            </option>
                            <option value="2" disabled={Object.entries(toppers).some(([id, rank]) => rank === 2 && id !== s.id)}>
                              {Object.entries(toppers).some(([id, rank]) => rank === 2 && id !== s.id) ? 'Rank 2 (Taken)' : 'Rank 2 (Silver)'}
                            </option>
                            <option value="3" disabled={Object.entries(toppers).some(([id, rank]) => rank === 3 && id !== s.id)}>
                              {Object.entries(toppers).some(([id, rank]) => rank === 3 && id !== s.id) ? 'Rank 3 (Taken)' : 'Rank 3 (Bronze)'}
                            </option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right cursor-pointer" onClick={() => toggleStudent(s.id)}>
                          {selectedStudents.includes(s.id) ? (
                            <span className="text-[9px] font-bold bg-[#dac48b] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Queued</span>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider group-hover:bg-slate-200">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredStudents.length > 0 && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length}
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-[#efebe1] border border-[#e4dcd1] text-[#8b7355] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 uppercase tracking-tight">Ready to Start</h3>
              <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">Select a source standard and year to start promoting students.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    {dialog}
    </>
  );
}
