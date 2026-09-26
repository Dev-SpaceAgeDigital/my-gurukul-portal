'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AlumniContributions from '@/components/dashboard/alumni/AlumniContributions';
import React, { Suspense, useEffect, useState } from 'react';
import { Heart, Briefcase, Handshake, GraduationCap, Calendar, Sparkles, Megaphone, ArrowUpRight, Award, Target, Flame, Users, Trophy, UserSearch, Building2, CheckCircle2, Clock, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import AlumniCareerHub from '@/components/dashboard/alumni/AlumniCareerHub';
import AlumniMentorshipHub from '@/components/dashboard/alumni/AlumniMentorshipHub';
import AlumniProfile from '@/components/dashboard/alumni/AlumniProfile';
import AlumniDirectory from '@/components/dashboard/alumni/AlumniDirectory';
import AlumniAchievementHub from '@/components/dashboard/alumni/AlumniAchievementHub';
import AlumniBlogHub from '@/components/dashboard/alumni/AlumniBlogHub';
import AlumniDonationHistory from '@/components/dashboard/alumni/AlumniDonationHistory';
import AlumniCommunityFeed from '@/components/dashboard/alumni/AlumniCommunityFeed';
import AlumniMyPostsHub from '@/components/dashboard/alumni/AlumniMyPostsHub';
import AlumniCSRHub from '@/components/dashboard/alumni/AlumniCSRHub';
import AlumniMemoriesHub from '@/components/dashboard/alumni/AlumniMemoriesHub';

import { useRouter, useSearchParams } from 'next/navigation';

interface NewsUpdate {
  id: string;
  title: string;
  description: string;
  category: string;
  publishDate: string | null;
  imageUrl: string | null;
  createdAt: string;
  schoolName: string;
}

const TAB_MAP: Record<string, string> = {
  'dashboard': 'Dashboard',
  'feed': 'Community Feed',
  'memories': 'School Memories',
  'my-posts': 'My Posts',
  'find-alumni': 'Find Alumni',
  'give-back': 'Give Back',
  'csr': 'CSR Referrals',
  'impact': 'My Impact',
  'profile': 'Profile',
};

const REVERSE_TAB_MAP: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Community Feed': 'feed',
  'School Memories': 'memories',
  'My Posts': 'my-posts',
  'Find Alumni': 'find-alumni',
  'Give Back': 'give-back',
  'CSR Referrals': 'csr',
  'My Impact': 'impact',
  'Profile': 'profile',
};

function AlumniDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [data, setData] = useState<any>(null);
  const [updates, setUpdates] = useState<NewsUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [selectedSpotlight, setSelectedSpotlight] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<{ logoUrl: string; name: string } | null>(null);
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_MAP[tabParam]) {
      setActiveTab(TAB_MAP[tabParam]);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    fetchUpdates();
    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((tData) => {
        if (tData?.success) {
          setTenantInfo({
            logoUrl: tData.logoUrl || '/my-gurukul.png',
            name: tData.name || 'Alumni Network',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const slug = REVERSE_TAB_MAP[newTab] || 'dashboard';
    router.push(`/alumni/dashboard?tab=${slug}`, { scroll: false });
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/alumni/stats');
      const d = await res.json();
      if (res.ok) setData(d);
    } catch { }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/alumni/news-updates');
      const d = await res.json();
      if (res.ok) setUpdates(Array.isArray(d.updates) ? d.updates : []);
    } catch {
      setUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const formatUpdateDate = (update: NewsUpdate) => {
    const date = update.publishDate || update.createdAt;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [mobileFeedTab, setMobileFeedTab] = useState<'OVERVIEW' | 'NEWS' | 'SPOTLIGHT'>('OVERVIEW');

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': {
        const pendingTotal = (data?.pending?.career || 0) + (data?.pending?.mentorship || 0) + (data?.pending?.blogs || 0) + (data?.pending?.achievements || 0) + (data?.pending?.csr || 0);
        const urgent = data?.urgentCause;
        const urgentProgress = urgent ? Math.min(100, Math.round((Number(urgent.paidAmount || 0) / Number(urgent.estimatedCost || 1)) * 100)) : 0;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* ─── Mobile View Filter Selector (Hidden on Desktop) ─── */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setMobileFeedTab('OVERVIEW')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  mobileFeedTab === 'OVERVIEW'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/80 text-slate-600 border border-slate-200/80'
                }`}
              >
                Overview & Network
              </button>
              <button
                type="button"
                onClick={() => setMobileFeedTab('NEWS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  mobileFeedTab === 'NEWS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/80 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Megaphone size={13} />
                <span>Campus News {updates.length > 0 && `(${updates.length})`}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileFeedTab('SPOTLIGHT')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  mobileFeedTab === 'SPOTLIGHT'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-white/80 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Trophy size={13} />
                <span>Alumni Spotlight</span>
              </button>
            </div>

            {/* ─── Main 3-Column LinkedIn Grid on Desktop / Responsive Stack on Mobile ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              
              {/* ══════════════════════════════════════════════════════════════
                  LEFT COLUMN (Desktop: 3/12 cols): Identity Snapshot Card
                  ══════════════════════════════════════════════════════════════ */}
              <div className={`lg:col-span-3 space-y-4 ${mobileFeedTab !== 'OVERVIEW' ? 'hidden lg:block' : ''}`}>
                
                {/* ─── Mobile Collapsed Mini Bar (< lg) ─── */}
                <div className="block lg:hidden">
                  {!isProfileCardExpanded ? (
                    <div
                      onClick={() => setIsProfileCardExpanded(true)}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-200 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {data?.alumni?.profilePic ? (
                            <img
                              src={data.alumni.profilePic}
                              alt={data.alumni.name || 'Alumni'}
                              className="w-11 h-11 rounded-xl object-cover border border-white shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs border border-white">
                              {data?.alumni?.name?.charAt(0) || 'A'}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white shadow-2xs">
                            <CheckCircle2 size={9} />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xs font-extrabold text-slate-900 tracking-tight truncate">
                            {data?.alumni?.name || 'Alumni Member'}
                          </h3>
                          <p className="text-[10px] font-semibold text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="text-blue-600 font-bold">Batch of {data?.alumni?.batchYear || '2026'}</span>
                            <span>•</span>
                            <span className="truncate">{data?.alumni?.currentTitle || 'Alumni Graduate'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          {data?.profileCompletion || 0}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileCardExpanded(true);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors"
                          aria-label="Expand profile"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* ─── Full Profile Card (Always on Desktop, Collapsible on Mobile) ─── */}
                <div className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-xl shadow-blue-900/5 p-5 relative overflow-hidden group hover:border-blue-200 transition-all ${
                  !isProfileCardExpanded ? 'hidden lg:block' : 'block'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-2xl rounded-full pointer-events-none"></div>

                  {/* Mobile Collapse Header (< lg only) */}
                  <div className="flex lg:hidden items-center justify-between pb-3 mb-3 border-b border-slate-100 relative z-10">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Alumni Profile Overview
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProfileCardExpanded(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      <span>Collapse</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="relative">
                      {data?.alumni?.profilePic ? (
                        <img
                          src={data.alumni.profilePic}
                          alt={data.alumni.name || 'Alumni'}
                          className="w-18 h-18 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
                        />
                      ) : (
                        <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
                          {data?.alumni?.name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Verified Alumni">
                        <CheckCircle2 size={11} />
                      </span>
                    </div>

                    <div className="space-y-1 w-full">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                        {data?.alumni?.name || 'Alumni Member'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 truncate">
                        {data?.alumni?.currentTitle || 'Alumni Graduate'}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <GraduationCap size={11} />
                          <span>Batch of {data?.alumni?.batchYear || 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    {/* School Badge */}
                    <div className="w-full bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-left flex items-center gap-2.5">
                      <img
                        src={tenantInfo?.logoUrl || '/my-gurukul.png'}
                        alt="Logo"
                        className="w-7 h-7 object-contain rounded-lg shrink-0"
                      />
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {data?.alumni?.schoolName || tenantInfo?.name || 'Educational Institution'}
                      </span>
                    </div>

                    {/* Profile Completeness Bar */}
                    <div className="w-full pt-1 space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Profile Strength</span>
                        <span className="text-blue-600">{data?.profileCompletion || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                          style={{ width: `${Math.min(100, data?.profileCompletion || 0)}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('Profile')}
                        className="w-full mt-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Edit & Complete Profile</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="w-full pt-2 border-t border-slate-100/80 space-y-1 text-left">
                      <button
                        type="button"
                        onClick={() => handleTabChange('My Posts')}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText size={14} className="text-blue-500" />
                          <span>My Published Posts</span>
                        </span>
                        <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {data?.stats?.totalPosts || 0}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTabChange('My Impact')}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Heart size={14} className="text-rose-500" />
                          <span>My Giving History</span>
                        </span>
                        <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          ₹{(data?.stats?.totalDonated || 0).toLocaleString()}
                        </span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Pending Approval Notice (Compact) */}
                {pendingTotal > 0 && (
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <Clock size={15} className="text-amber-600 shrink-0" />
                      <span>{pendingTotal} Post{pendingTotal > 1 ? 's' : ''} Awaiting Review</span>
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium">
                      School administrators are reviewing your submission. It will appear live once approved.
                    </p>
                  </div>
                )}

              </div>

              {/* ══════════════════════════════════════════════════════════════
                  MIDDLE COLUMN (Desktop: 6/12 cols): Feed, Actions & Causes
                  ══════════════════════════════════════════════════════════════ */}
              <div className={`lg:col-span-6 space-y-5 ${mobileFeedTab !== 'OVERVIEW' ? 'hidden lg:block' : ''}`}>
                
                {/* 1. LinkedIn-Style Quick Post Composer */}
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-md shadow-slate-900/5 p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center gap-3">
                    {data?.alumni?.profilePic ? (
                      <img
                        src={data.alumni.profilePic}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {data?.alumni?.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTabChange('Careers')}
                      className="flex-1 bg-slate-50/90 hover:bg-white border border-slate-300 hover:border-blue-400 rounded-2xl px-4 py-2.5 text-left text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all shadow-xs cursor-pointer truncate"
                    >
                      Share a job opening, mentorship, or story with alumni...
                    </button>
                  </div>

                  {/* 4 Quick Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleTabChange('Careers')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Briefcase size={14} className="text-emerald-600 shrink-0" />
                      <span>Post Job</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('Mentorship')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold text-purple-800 bg-purple-50/90 hover:bg-purple-100 border border-purple-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Handshake size={14} className="text-purple-600 shrink-0" />
                      <span>Mentor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('Achievements')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold text-amber-800 bg-amber-50/90 hover:bg-amber-100 border border-amber-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Award size={14} className="text-amber-600 shrink-0" />
                      <span>Story</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('CSR Referrals')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-bold text-cyan-800 bg-cyan-50/90 hover:bg-cyan-100 border border-cyan-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Building2 size={14} className="text-cyan-600 shrink-0" />
                      <span>CSR Lead</span>
                    </button>
                  </div>
                </div>

                {/* 2. Four Core Impact Counters (Single Row on Desktop, 2x2 on Mobile) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Alumni Network */}
                  <div
                    onClick={() => handleTabChange('Find Alumni')}
                    className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-2 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Network</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={14} />
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900">{data?.stats?.totalAlumni || 0}</span>
                  </div>

                  {/* Active Jobs */}
                  <div
                    onClick={() => handleTabChange('Careers')}
                    className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-2 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Careers</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Briefcase size={14} />
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900">{data?.stats?.activeJobs || 0}</span>
                  </div>

                  {/* Mentors */}
                  <div
                    onClick={() => handleTabChange('Mentorship')}
                    className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-2 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mentors</span>
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Handshake size={14} />
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900">{data?.stats?.totalMentors || 0}</span>
                  </div>

                  {/* Giving */}
                  <div
                    onClick={() => handleTabChange('My Impact')}
                    className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-2 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Donated</span>
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Heart size={14} />
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-900 truncate">₹{(data?.stats?.totalDonated || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* 3. 🚨 Urgent Campus Cause Banner Card (Prominent & High-Conversion) */}
                {urgent && (
                  <div className="bg-gradient-to-br from-rose-500/10 via-rose-50/80 to-white backdrop-blur-xl rounded-3xl border-2 border-rose-200/80 shadow-lg shadow-rose-900/5 p-5 space-y-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm shadow-rose-500/30">
                        <Flame size={12} className="animate-pulse" />
                        <span>Urgent Campus Appeal</span>
                      </span>
                      <span className="text-xs font-black text-rose-700">
                        {urgentProgress}% Funded
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                        {urgent.title}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                        {urgent.description || 'Support this urgent campus initiative to help our junior students succeed.'}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000"
                          style={{ width: `${urgentProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>₹{Number(urgent.paidAmount || 0).toLocaleString()} raised</span>
                        <span>Goal: ₹{Number(urgent.estimatedCost || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleTabChange('Give Back')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Heart size={14} />
                        <span>Support this Cause</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTabChange('Give Back')}
                        className="py-2.5 px-4 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs border border-slate-200/80 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Live Community Stream Quick Link */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Explore Community Feed</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Read recent alumni stories, blogs, and career insights.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('Community Feed')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    Open Feed →
                  </button>
                </div>

              </div>

              {/* ══════════════════════════════════════════════════════════════
                  RIGHT COLUMN (Desktop: 3/12 cols): Campus News & Spotlights
                  ══════════════════════════════════════════════════════════════ */}
              <div className={`lg:col-span-3 space-y-4 ${mobileFeedTab === 'OVERVIEW' ? 'hidden lg:block' : ''}`}>
                
                {/* Meetup / Virtual Meet Card (if available) */}
                {data?.upcomingMeet && (
                  <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-blue-100 shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Calendar size={11} />
                        <span>Upcoming Meetup</span>
                      </span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {data.upcomingMeet.subject}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500">
                      Google Meet link sent to your registered inbox.
                    </p>
                  </div>
                )}

                {/* Alumni Spotlight Card */}
                {(mobileFeedTab === 'SPOTLIGHT' || mobileFeedTab === 'OVERVIEW') && (
                  <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-4 shadow-md backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        <Trophy size={11} />
                        <span>Alumni Spotlight</span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">Featured</span>
                    </div>

                    <div className="space-y-2">
                      {(data?.spotlights?.length ? data.spotlights : [data?.spotlight].filter(Boolean)).slice(0, 3).map((spotlight: any, index: number) => (
                        <button
                          key={spotlight.id || `${spotlight.name}-${index}`}
                          type="button"
                          onClick={() => setSelectedSpotlight(spotlight)}
                          className="group/spotlight w-full rounded-2xl border border-amber-100/80 bg-white/80 p-2.5 text-left shadow-xs transition-all hover:border-amber-200 hover:bg-white flex items-center gap-2.5 cursor-pointer"
                        >
                          {spotlight?.profilePic ? (
                            <img src={spotlight.profilePic} alt={spotlight.name} className="h-10 w-10 shrink-0 rounded-xl border border-amber-300 object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm">
                              {spotlight?.name ? spotlight.name.charAt(0) : 'A'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-extrabold text-slate-900 group-hover/spotlight:text-amber-700 truncate">{spotlight?.name || 'Alumni Leader'}</h5>
                            <p className="text-[11px] font-medium text-slate-500 truncate">{spotlight?.headline || spotlight?.currentTitle || 'Community Leader'}</p>
                          </div>
                          <ArrowUpRight size={13} className="shrink-0 text-amber-600" />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTabChange('Find Alumni')}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserSearch size={13} />
                      <span>Alumni Directory</span>
                    </button>
                  </div>
                )}

                {/* Campus Announcements News Feed */}
                {(mobileFeedTab === 'NEWS' || mobileFeedTab === 'OVERVIEW') && (
                  <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-white/80 shadow-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Megaphone size={14} className="text-blue-600" />
                        <span>Campus News</span>
                      </h4>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                    </div>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
                      {updatesLoading ? (
                        <div className="p-3 text-[11px] font-bold text-slate-400">Loading campus updates...</div>
                      ) : updates.length === 0 ? (
                        <div className="p-3 text-[11px] font-medium text-slate-500">No campus updates published yet.</div>
                      ) : (
                        updates.map((update, index) => (
                          <div
                            key={update.id}
                            className={`p-3 rounded-2xl border transition-colors ${
                              index === 0 ? 'bg-blue-50/40 border-blue-100' : 'bg-slate-50/60 border-slate-100'
                            }`}
                          >
                            {update.imageUrl && (
                              <div className="mb-2 relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                                <img src={update.imageUrl} alt={update.title} className="absolute inset-0 w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 mb-1">
                              <Calendar size={11} />
                              <span>{formatUpdateDate(update)}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug">{update.title}</h5>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed">{update.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        );
      }
      case 'Community Feed':
        return <AlumniCommunityFeed />;
      case 'School Memories':
        return <AlumniMemoriesHub />;
      case 'My Posts':
        return <AlumniMyPostsHub />;
      case 'Give Back':
        return <AlumniContributions />;
      case 'CSR Referrals':
        return <AlumniCSRHub />;
      case 'My Impact':
        return <AlumniDonationHistory />;
      case 'Careers':
        return <AlumniCareerHub />;
      case 'Mentorship':
        return <AlumniMentorshipHub />;
      case 'Achievements':
        return <AlumniAchievementHub />;
      case 'Blogs':
        return <AlumniBlogHub />;
      case 'Find Alumni':
        return <AlumniDirectory />;
      case 'Profile':
        return <AlumniProfile />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Alumni Network Portal"
      role="ALUMNI"
      activeItem={activeTab}
      onNavigate={handleTabChange}
    >
      {renderContent()}
      {selectedSpotlight && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setSelectedSpotlight(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:text-slate-900"
              aria-label="Close alumni spotlight"
            >
              <X size={16} />
            </button>

            <div className="pr-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                <Trophy size={12} />
                Alumni Spotlight
              </span>
              <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">{selectedSpotlight.name}</h3>
              <p className="mt-1 text-sm font-bold text-amber-700">{selectedSpotlight.headline || selectedSpotlight.currentTitle || 'Alumni contributor'}</p>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-3xl border border-amber-100 bg-amber-50/60 p-4">
              {selectedSpotlight.profilePic ? (
                <img src={selectedSpotlight.profilePic} alt={selectedSpotlight.name} className="h-16 w-16 shrink-0 rounded-2xl border-2 border-amber-300 object-cover shadow-md" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-300 bg-gradient-to-tr from-amber-500 to-amber-600 text-2xl font-black text-white shadow-md">
                  {selectedSpotlight.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-sm font-black text-slate-900">{selectedSpotlight.currentTitle || 'Alumni'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{selectedSpotlight.schoolName || tenantInfo?.name || 'Educational Institution'}</p>
                <p className="mt-1 text-[11px] font-bold text-amber-700">Batch of {selectedSpotlight.batchYear || 'Alumni'}</p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Why they are spotlighted</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                {selectedSpotlight.reason || 'Recognized for meaningful contribution, mentorship, and continued connection with the alumni community.'}
              </p>
            </div>

            {Array.isArray(selectedSpotlight.highlights) && selectedSpotlight.highlights.length > 0 && (
              <div className="mt-5 space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Highlights</h4>
                {selectedSpotlight.highlights.slice(0, 3).map((highlight: string, index: number) => (
                  <div key={`${highlight}-${index}`} className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs font-bold text-slate-700">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="break-words">{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AlumniDashboard() {
  return (
    <Suspense fallback={null}>
      <AlumniDashboardContent />
    </Suspense>
  );
}
