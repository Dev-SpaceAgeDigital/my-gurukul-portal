'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Award, GraduationCap, School, Calendar, Layers, ChevronRight, UserCircle, Users, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SchoolData {
  id: string;
  schoolName: string;
}

interface StandardData {
  id: string;
  standardName: string;
}

interface AcademicYear {
  id: string;
  label: string;
  isActive: boolean;
}

interface Student {
  id: string;
  name: string;
  studentCode: string;
  percentage: string | number;
  rank: number;
  schoolName?: string;
  standardName?: string;
  enrollmentStatus?: string;
}

export default function SuperAdminStudentsAnalytics() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [standards, setStandards] = useState<StandardData[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Load initial dropdowns
  useEffect(() => {
    fetch('/api/admin/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(Array.isArray(data) ? data : []);
        setLoadingSchools(false);
      })
      .catch(() => setLoadingSchools(false));

    fetch('/api/superadmin/academic-years')
      .then((res) => res.json())
      .then((data) => {
        setAcademicYears(Array.isArray(data) ? data : []);
        setLoadingYears(false);
      })
      .catch(() => setLoadingYears(false));
  }, []);

  // Fetch standards when selected school changes
  useEffect(() => {
    if (selectedSchool && selectedSchool !== 'ALL') {
      setLoadingStandards(true);
      fetch(`/api/superadmin/standards?schoolId=${selectedSchool}`)
        .then((res) => res.json())
        .then((data) => {
          setStandards(Array.isArray(data) ? data : []);
          setLoadingStandards(false);
        })
        .catch(() => setLoadingStandards(false));
    } else {
      setStandards([]);
      setSelectedStandard('ALL');
    }
  }, [selectedSchool]);

  // Fetch students whenever filters change
  useEffect(() => {
    fetchStudents();
  }, [selectedSchool, selectedStandard, selectedYear]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (selectedSchool !== 'ALL') params.append('schoolId', selectedSchool);
      if (selectedStandard !== 'ALL') params.append('standardId', selectedStandard);
      if (selectedYear !== 'ALL') params.append('academicYearId', selectedYear);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/superadmin/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
      setCurrentPage(1);
    }
  };

  // Client-side search filter
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const term = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
        (s.schoolName && s.schoolName.toLowerCase().includes(term)) ||
        (s.standardName && s.standardName.toLowerCase().includes(term))
    );
  }, [students, search]);

  // Derive Toppers
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
  }, [filteredStudents]);

  const toppers = useMemo(() => {
    return sortedStudents.filter((s) => Number(s.percentage) > 0).slice(0, 3);
  }, [sortedStudents]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout title="Students Analytics" role="SUPER_ADMIN" activeItem="Students">
      <div className="space-y-5 animate-in fade-in duration-500 pb-12">
        {/* Header Bar */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-[#3f72af]/10 text-[#3f72af] text-[11px] font-bold uppercase tracking-wider">
                  Academic Governance
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Enrolled Student Registry</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="text-[#3f72af]" size={26} />
                Students & Academic Performance
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Monitor student rosters, academic batches, and top performers across all Trust schools.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
              <GraduationCap className="text-[#3f72af]" size={18} />
              <span className="text-xs font-black text-slate-900">{students.length} Total Enrolled</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, GR code..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#3f72af]"
              />
            </div>

            {/* School Filter */}
            <div className="relative">
              <School size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#3f72af] text-xs font-bold text-slate-700 appearance-none cursor-pointer"
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedStandard('ALL');
                }}
                disabled={loadingSchools}
              >
                <option value="ALL">All Schools in Trust</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
              </select>
            </div>

            {/* Batch / Academic Year Filter */}
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#3f72af] text-xs font-bold text-slate-700 appearance-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loadingYears}
              >
                <option value="ALL">All Academic Years</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
            </div>

            {/* Standard Filter */}
            <div className="relative">
              <Layers size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#3f72af] text-xs font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                disabled={selectedSchool === 'ALL' || loadingStandards}
              >
                <option value="ALL">{selectedSchool === 'ALL' ? 'Select School for Standards' : 'All Standards'}</option>
                {standards.map(s => <option key={s.id} value={s.id}>{s.standardName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* TOPPERS PODIUM (If percentage data exists) */}
        {toppers.length > 0 && (
          <div className="bg-gradient-to-br from-[#0b1525] via-[#162a45] to-[#1A3D63] p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Award size={160} />
            </div>
            
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <Award className="mr-2.5 text-amber-400" size={22} /> Top Academic Performers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {toppers.map((topper, index) => {
                const colors = [
                  'bg-gradient-to-b from-amber-200/90 to-amber-500/90 text-amber-950 border-amber-300 shadow-amber-500/30',
                  'bg-gradient-to-b from-slate-200/90 to-slate-400/90 text-slate-800 border-slate-300 shadow-slate-400/30',
                  'bg-gradient-to-b from-orange-300/90 to-orange-600/90 text-orange-950 border-orange-400 shadow-orange-600/30'
                ];
                return (
                  <div key={topper.id} className={`p-4 rounded-2xl shadow-lg border ${colors[index]} flex flex-col items-center text-center backdrop-blur-sm`}>
                    <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center mb-2 text-lg font-black shadow-inner">
                      #{index + 1}
                    </div>
                    <h3 className="font-bold text-sm mb-0.5">{topper.name}</h3>
                    <p className="text-[11px] opacity-80 mb-2 font-semibold tracking-wide">
                      {topper.studentCode || 'GR Code N/A'} • {topper.schoolName || 'School'}
                    </p>
                    <div className="mt-auto px-4 py-1 bg-black/10 rounded-xl font-black text-sm backdrop-blur-md w-full">
                      {topper.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FULL STUDENT LIST */}
        {loadingStudents ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#3f72af] mx-auto mb-2" />
            <p className="text-slate-500 text-xs font-bold">Scanning student records across schools...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Directory</h3>
                <p className="text-xs text-slate-500 font-medium">Showing {filteredStudents.length} registered students</p>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-black">
                  <tr>
                    <th className="px-6 py-4">Student GR Code</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">School</th>
                    <th className="px-6 py-4">Standard / Grade</th>
                    <th className="px-6 py-4">Academic Score</th>
                    <th className="px-6 py-4">Enrollment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 font-medium text-sm">
                        <Users className="mx-auto mb-2 text-slate-300" size={32} />
                        No student records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const rankNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                              {student.studentCode || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900 text-sm">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {student.schoolName || 'School'}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {student.standardName || 'Standard N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {Number(student.percentage) > 0 ? (
                              <span className="font-black text-emerald-600 text-sm">
                                {student.percentage}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">Not Graded</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {student.enrollmentStatus || 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Container */}
            {sortedStudents.length > 0 && (
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedStudents.length)} of {sortedStudents.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

