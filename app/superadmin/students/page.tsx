'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Award, GraduationCap, School, Calendar, Layers, ChevronRight, UserCircle } from 'lucide-react';
import Image from 'next/image';
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
}

export default function SuperAdminStudentsAnalytics() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [standards, setStandards] = useState<StandardData[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/admin/schools').then(res => res.json()).then(data => {
      setSchools(data);
      setLoadingSchools(false);
    });

    fetch('/api/superadmin/academic-years').then(res => res.json()).then(data => {
      setAcademicYears(data);
      setLoadingYears(false);
      const current = data.find((y: any) => y.isActive);
      if (current) setSelectedYear(current.id);
    });
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      setLoadingStandards(true);
      fetch(`/api/superadmin/standards?schoolId=${selectedSchool}`).then(res => res.json()).then(data => {
        setStandards(data);
        setLoadingStandards(false);
      });
    } else {
      setStandards([]);
      setSelectedStandard('');
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedStandard && selectedYear) {
      setLoadingStudents(true);
      fetch(`/api/superadmin/students?standardId=${selectedStandard}&academicYearId=${selectedYear}`)
        .then(res => res.json())
        .then(data => {
          setStudents(Array.isArray(data) ? data : []);
          setLoadingStudents(false);
          setCurrentPage(1); // Reset page on new data
        })
        .catch(() => {
          setStudents([]);
          setLoadingStudents(false);
        });
    } else {
      setStudents([]);
    }
  }, [selectedStandard, selectedYear]);

  // Derive Toppers (Top 3)
  const sortedStudents = [...students].sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
  const toppers = sortedStudents.slice(0, 3);

  // Pagination Logic
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout title="Students Analytics" role="SUPER_ADMIN" activeItem="Students">
      <div className="space-y-4 animate-in fade-in duration-500">
        
        {/* Compact Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-wrap items-center gap-4 w-full">
            {/* School Filter */}
            <div className="relative group w-full sm:w-auto">
              <School size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                className="pl-9 pr-8 py-2 w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/20 focus:bg-white text-xs font-semibold text-slate-700 transition-all appearance-none cursor-pointer"
                value={selectedSchool}
                onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setSelectedStandard('');
                }}
                disabled={loadingSchools}
              >
                <option value="">All Schools</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="relative group w-full sm:w-auto">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                className="pl-9 pr-8 py-2 w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/20 focus:bg-white text-xs font-semibold text-slate-700 transition-all appearance-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loadingYears}
              >
                <option value="">Select Batch</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
            </div>

            {/* Standard Filter */}
            <div className="relative group w-full sm:w-auto">
              <Layers size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                className="pl-9 pr-8 py-2 w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/20 focus:bg-white text-xs font-semibold text-slate-700 transition-all appearance-none cursor-pointer disabled:opacity-50"
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                disabled={!selectedSchool || loadingStandards}
              >
                <option value="">Select Standard</option>
                {standards.map(s => <option key={s.id} value={s.id}>{s.standardName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loadingStudents ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-medium">Scanning student records...</p>
          </div>
        ) : (
          selectedStandard && selectedYear && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* TOPPERS PODIUM */}
              {toppers.length > 0 && (
                <div className="bg-gradient-to-br from-[#0b1525] via-[#162a45] to-[#1A3D63] p-6 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden mt-4">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Award size={180} />
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Award className="mr-3 text-amber-400" size={24} /> Standard Toppers
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                    {toppers.map((topper, index) => {
                      const colors = [
                        'bg-gradient-to-b from-amber-200/90 to-amber-500/90 text-amber-950 border-amber-300 shadow-amber-500/30',
                        'bg-gradient-to-b from-slate-200/90 to-slate-400/90 text-slate-800 border-slate-300 shadow-slate-400/30',
                        'bg-gradient-to-b from-orange-300/90 to-orange-600/90 text-orange-950 border-orange-400 shadow-orange-600/30'
                      ];
                      return (
                        <div key={topper.id} className={`p-5 rounded-2xl shadow-lg border ${colors[index]} transform transition-all hover:-translate-y-1 flex flex-col items-center text-center backdrop-blur-sm`}>
                          <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mb-3 text-xl font-black shadow-inner">
                            #{index + 1}
                          </div>
                          <h3 className="font-bold text-lg mb-0.5">{topper.name}</h3>
                          <p className="text-[11px] opacity-80 mb-3 font-semibold tracking-wide">{topper.studentCode}</p>
                          <div className="mt-auto px-4 py-1.5 bg-black/10 rounded-xl font-bold text-sm backdrop-blur-md w-full">
                            {topper.percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FULL STUDENT LIST */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full table-fixed min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[25%]">Student Code</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[45%]">Student Name</th>
                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 text-left w-[30%]">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-20 text-center text-slate-400 font-medium text-sm">
                            No student records found for this criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((student, idx) => {
                          const rankNum = (currentPage - 1) * pageSize + idx + 1;
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                              <td className="px-6 py-3.5">
                                <span className="text-[12px] font-semibold text-slate-600 font-mono tracking-tight bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                                  {student.studentCode || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-center font-bold text-slate-400 group-hover:bg-[#1A3D63]/10 group-hover:text-[#1A3D63] transition-all shrink-0">
                                    {student.name[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-700 leading-snug group-hover:text-[#1A3D63] transition-colors truncate">{student.name}</p>
                                    <div className="mt-1 flex items-center">
                                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                                        rankNum === 1 ? 'bg-amber-100 text-amber-700' :
                                        rankNum === 2 ? 'bg-slate-200 text-slate-700' :
                                        rankNum === 3 ? 'bg-orange-100 text-orange-700' :
                                        'bg-slate-100/50 text-slate-500 border border-slate-200/60'
                                      }`}>
                                        RANK #{rankNum}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center space-x-2">
                                  <UserCircle size={14} className="text-slate-300" />
                                  <span className="text-[11px] font-medium text-slate-500">
                                    Status: <span className="font-semibold text-slate-600">{student.percentage ? 'Graded' : 'Pending'}</span>
                                  </span>
                                </div>
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
                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-3xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedStudents.length)} of {sortedStudents.length}
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
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
