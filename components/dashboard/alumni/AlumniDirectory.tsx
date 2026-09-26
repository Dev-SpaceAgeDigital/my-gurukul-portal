'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, Building2, GraduationCap, Search, Sparkles, Tag, Users, User, ChevronRight, ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface AlumniMember {
  id: string;
  name: string;
  email: string;
  batchYear: string | null;
  linkedIn: string | null;
  profilePic: string | null;
  currentTitle: string | null;
  currentBio: string | null;
  workLink: string | null;
  industry: string | null;
  schoolName: string | null;
}

const itemsPerPage = 9;

function normalizeLinkedInUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function LinkedInIcon() {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.68H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.38 4.27 5.47v6.28ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
    </svg>
  );
}

function AlumniAvatar({ name, profilePic, size = 52 }: { name: string; profilePic?: string | null; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');

  if (profilePic) {
    return (
      <div style={{ width: size, height: size }} className="relative shrink-0 overflow-hidden rounded-lg border border-white shadow-sm">
        <Image src={profilePic} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      className="flex shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 font-black text-blue-700 shadow-sm"
    >
      {initials || 'A'}
    </div>
  );
}

function AlumniCardSkeleton() {
  return (
    <article className="flex min-h-[230px] animate-pulse flex-col gap-4 rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-200/70" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-slate-200/80" />
          <div className="h-6 w-28 rounded-full bg-blue-100/80" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="h-3 w-4/5 rounded-full bg-slate-200/80" />
        <div className="h-3 w-3/5 rounded-full bg-slate-200/80" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-slate-200/70" />
        <div className="h-3 w-3/4 rounded-full bg-slate-200/70" />
      </div>
      <div className="mt-auto flex justify-end border-t border-slate-100 pt-3">
        <div className="h-10 w-10 rounded-2xl bg-[#0a66c2]/20" />
      </div>
    </article>
  );
}

export default function AlumniDirectory() {
  const [alumniList, setAlumniList] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alumni/directory');
      if (res.ok) {
        const data = await res.json();
        setAlumniList(Array.isArray(data) ? data : []);
      }
    } catch {
      setAlumniList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const batchYears = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map(alumni => alumni.batchYear).filter(Boolean) as string[]))].sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return b.localeCompare(a);
    }),
    [alumniList]
  );

  const schools = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map(alumni => alumni.schoolName).filter(Boolean) as string[]))].sort(),
    [alumniList]
  );

  const industries = useMemo(
    () => ['All', ...Array.from(new Set(alumniList.map(alumni => alumni.industry).filter(Boolean) as string[]))].sort(),
    [alumniList]
  );

  const activeFilterCount = (selectedBatch !== 'All' ? 1 : 0) + (selectedSchool !== 'All' ? 1 : 0) + (selectedIndustry !== 'All' ? 1 : 0);

  const filteredAlumni = alumniList.filter((alumni) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      alumni.name.toLowerCase().includes(query) ||
      (alumni.currentTitle || '').toLowerCase().includes(query) ||
      (alumni.schoolName || '').toLowerCase().includes(query) ||
      (alumni.batchYear || '').toLowerCase().includes(query) ||
      (alumni.industry || '').toLowerCase().includes(query) ||
      (alumni.currentBio || '').toLowerCase().includes(query);
    const matchesBatch = selectedBatch === 'All' || alumni.batchYear === selectedBatch;
    const matchesSchool = selectedSchool === 'All' || alumni.schoolName === selectedSchool;
    const matchesIndustry = selectedIndustry === 'All' || alumni.industry === selectedIndustry;

    return matchesSearch && matchesBatch && matchesSchool && matchesIndustry;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAlumni.length / itemsPerPage));
  const paginated = filteredAlumni.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch, selectedSchool, selectedIndustry]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3.5 pb-28 animate-in fade-in duration-300 sm:gap-5 sm:pb-16">
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-6">
        <div className="relative z-10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/10 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 sm:text-[11px]">
              <Sparkles size={11} className="animate-pulse" />
              Alumni Directory
            </span>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm sm:px-3 sm:py-1 sm:text-[11px]">
              <Users size={12} className="text-blue-600" />
              {filteredAlumni.length} alumni found
            </span>
          </div>

          <h2 className="text-base font-extrabold tracking-tight text-slate-800 sm:text-2xl">Find Alumni</h2>
          <p className="mt-0.5 max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
            Search classmates and seniors by name, batch, school, industry, or current role, then connect through LinkedIn.
          </p>
        </div>
      </section>

      {/* ─── Single Line Search & Filter Bar (Mobile Optimized) ─── */}
      <div className="flex flex-col gap-2">
        <section className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          
          {/* Left: Single-line Search Input */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search alumni..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="h-10 sm:h-11 w-full rounded-xl sm:rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-9 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <span className="text-xs font-bold leading-none">✕</span>
              </button>
            )}
          </div>

          {/* Right: Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(prev => !prev)}
            className={`h-10 sm:h-11 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 border shadow-xs ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                : 'bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white border-slate-200/90'
            }`}
            title="Toggle filters"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={15} className={isFilterOpen || activeFilterCount > 0 ? 'text-white' : 'text-blue-600'} />
            <span className="text-xs font-extrabold sm:text-sm">Filter</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] font-black h-4.5 min-w-4.5 px-1 rounded-full bg-white text-blue-700 shadow-xs">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </section>

        {/* Expandable Filter Panel (Shown when Filter button is clicked) */}
        {isFilterOpen && (
          <section className="animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 p-3.5 sm:p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <SlidersHorizontal size={13} className="text-blue-600" />
                <span>Filter Alumni</span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {activeFilterCount} Selected
                  </span>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatch('All');
                    setSelectedSchool('All');
                    setSelectedIndustry('All');
                  }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* 3 Dropdown Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* 1. Batch Dropdown */}
              <div className="relative min-w-0">
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Graduation Batch</label>
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                  <select
                    value={selectedBatch}
                    onChange={event => setSelectedBatch(event.target.value)}
                    className={`h-10 sm:h-11 w-full appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-bold shadow-xs outline-none transition-all hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer truncate ${
                      selectedBatch !== 'All' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {batchYears.map(batch => (
                      <option key={batch} value={batch} className="bg-white text-slate-800 font-medium py-2">
                        {batch === 'All' ? 'All Batches' : `Batch of ${batch}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. School Dropdown */}
              <div className="relative min-w-0">
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">School / Institute</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select
                    value={selectedSchool}
                    onChange={event => setSelectedSchool(event.target.value)}
                    className={`h-10 sm:h-11 w-full appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-bold shadow-xs outline-none transition-all hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer truncate ${
                      selectedSchool !== 'All' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {schools.map(school => (
                      <option key={school} value={school} className="bg-white text-slate-800 font-medium py-2">
                        {school === 'All' ? 'All Schools' : school}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 3. Industry Dropdown */}
              <div className="relative min-w-0">
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Industry / Domain</label>
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                  <select
                    value={selectedIndustry}
                    onChange={event => setSelectedIndustry(event.target.value)}
                    className={`h-10 sm:h-11 w-full appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-bold shadow-xs outline-none transition-all hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer truncate ${
                      selectedIndustry !== 'All' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {industries.map(ind => (
                      <option key={ind} value={ind} className="bg-white text-slate-800 font-medium py-2">
                        {ind === 'All' ? 'All Industries' : ind}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

            </div>
          </section>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <AlumniCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-8">
          <Users size={36} className="text-slate-300" />
          <h3 className="mt-3 text-sm font-black text-slate-900 sm:text-base">No alumni found</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Try changing the search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map(member => {
              const linkedInUrl = member.linkedIn ? normalizeLinkedInUrl(member.linkedIn) : '';

              return (
                <article
                  key={member.id}
                  className="group flex min-h-[220px] flex-col gap-2.5 rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-md shadow-slate-900/5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-xl sm:min-h-[240px] sm:gap-3.5 sm:rounded-3xl sm:p-5"
                >
                  <Link
                    href={`/alumni/peer-profile/${member.id}`}
                    className="flex items-start gap-3 sm:gap-4 cursor-pointer"
                  >
                    <AlumniAvatar name={member.name} profilePic={member.profilePic} size={46} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-xs font-black text-slate-900 transition-colors group-hover:text-blue-600 sm:text-base">{member.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50/90 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                          <GraduationCap size={11} />
                          Batch of {member.batchYear || 'N/A'}
                        </span>
                        {member.industry && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/90 border border-emerald-200/60 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                            <Tag size={11} />
                            {member.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[10.5px] font-bold text-slate-600 sm:space-y-2 sm:rounded-2xl sm:p-3 sm:text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Building2 size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">{member.schoolName || 'Madni Education Trust'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Briefcase size={12} className="shrink-0 text-blue-500" />
                      <span className="truncate">{member.currentTitle || 'Alumnus'}</span>
                    </div>
                  </div>

                  {/* Bio display */}
                  <div className="rounded-xl border border-slate-100/80 bg-slate-50/60 p-2.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Bio</p>
                    <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-600 italic sm:text-xs">
                      {member.currentBio ? `"${member.currentBio}"` : 'No biography provided.'}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:pt-3">
                    <Link
                      href={`/alumni/peer-profile/${member.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[11px] font-extrabold border border-blue-100 transition-all cursor-pointer shadow-xs"
                    >
                      <User size={13} />
                      <span>View Profile</span>
                      <ChevronRight size={13} />
                    </Link>

                    {linkedInUrl ? (
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${member.name}'s LinkedIn profile`}
                        title="Open LinkedIn profile"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a66c2] text-white shadow-sm transition-all hover:bg-[#004182] hover:shadow-md sm:h-9 sm:w-9 sm:rounded-xl"
                      >
                        <LinkedInIcon />
                      </a>
                    ) : (
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[9.5px] font-bold text-slate-400">
                        No LinkedIn
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 disabled:opacity-40 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs"
              >
                Previous
              </button>
              <span className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 disabled:opacity-40 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
