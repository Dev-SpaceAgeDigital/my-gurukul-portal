'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Grid,
  Handshake,
  Globe,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Tag,
  ThumbsUp,
  Trophy,
  User,
  Users,
  FileText,
  Clock,
  ChevronRight
} from 'lucide-react';

interface PeerAlumniData {
  id: string;
  name: string;
  batchYear: string | null;
  linkedIn: string | null;
  profilePic: string | null;
  currentTitle: string | null;
  currentBio: string | null;
  workLink: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  schoolName: string | null;
  schoolLogo: string | null;
  logoUrl: string | null;
}

interface CareerPost {
  id: string;
  type: string;
  companyName: string;
  companyLink: string | null;
  role: string;
  description: string | null;
  category: string | null;
  relation: string | null;
  location: string | null;
  workMode: string | null;
  salary: string | null;
  duration: string | null;
  experienceLevel: string | null;
  applyLink: string | null;
  deadline: string | null;
  createdAt: string;
  interestedCount: number;
  referralCount: number;
  registrationCount: number;
}

interface MentorshipPost {
  id: string;
  title: string;
  description: string;
  targetStudent: string | null;
  availability: string | null;
  category: string | null;
  createdAt: string;
  registrationCount: number;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  mediaUrl: string | null;
  mediaType: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface AchievementPost {
  id: string;
  title: string;
  description: string;
  date: string | null;
  category: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  isFeatured: boolean;
  createdAt: string;
}

function normalizeLinkedInUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function LinkedInIcon() {
  return (
    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.68H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.38 4.27 5.47v6.28ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
    </svg>
  );
}

function AlumniPeerProfileSkeleton() {
  return (
    <div className="mx-auto space-y-3.5 sm:space-y-5 pb-24 sm:pb-16 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-white/80 shadow-sm">
        <div className="h-7 w-32 rounded-xl bg-slate-200/80" />
        <div className="h-4 w-24 rounded-full bg-slate-200/70" />
      </div>

      {/* Main Profile Card Skeleton */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/80 shadow-md shadow-slate-900/5 space-y-4 sm:space-y-5">
        {/* Top: Avatar + 3 Stats */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200/80 shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-1.5 sm:gap-3">
            <div className="h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-200/70" />
            <div className="h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-100/60" />
            <div className="h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-100/60" />
          </div>
        </div>

        {/* Identity Details Skeleton */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-5 w-40 sm:w-48 rounded-full bg-slate-200/90" />
            <div className="h-4 w-16 rounded-full bg-emerald-100/80" />
          </div>
          <div className="h-4 w-52 rounded-full bg-slate-200/70" />
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-36 rounded-full bg-slate-200/60" />
            <div className="h-3.5 w-28 rounded-full bg-slate-200/60" />
          </div>
          <div className="h-14 w-full rounded-xl bg-slate-200/50" />
        </div>

        {/* Links Skeleton */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <div className="h-8 w-28 rounded-xl bg-slate-200/80" />
          <div className="h-8 w-24 rounded-xl bg-slate-200/70" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <div className="h-9 w-20 sm:w-24 rounded-xl bg-slate-300/80 shrink-0" />
        <div className="h-9 w-20 sm:w-24 rounded-xl bg-white/70 border border-white/80 shrink-0" />
        <div className="h-9 w-24 sm:w-28 rounded-xl bg-white/70 border border-white/80 shrink-0" />
        <div className="h-9 w-24 sm:w-28 rounded-xl bg-white/70 border border-white/80 shrink-0" />
      </div>

      {/* Post Cards Skeleton */}
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/80 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-200/80 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-16 rounded-full bg-blue-100/80" />
                  <div className="h-4 w-40 rounded-full bg-slate-200/90" />
                  <div className="h-3 w-24 rounded-full bg-slate-200/70" />
                </div>
              </div>
              <div className="h-3 w-14 rounded-full bg-slate-200/60" />
            </div>

            <div className="h-9 w-full rounded-xl bg-slate-200/50" />
            <div className="h-10 w-full rounded-xl bg-slate-200/40" />

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-20 rounded-lg bg-blue-100/70" />
                <div className="h-6 w-20 rounded-lg bg-purple-100/70" />
                <div className="h-6 w-20 rounded-lg bg-slate-200/70" />
              </div>
              <div className="h-7 w-16 rounded-xl bg-blue-200/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlumniPeerProfileView({ alumniId }: { alumniId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    alumni: PeerAlumniData;
    stats: {
      totalPosts: number;
      totalCareers: number;
      totalMentorships: number;
      totalBlogs: number;
      totalAchievements: number;
    };
    posts: {
      careers: CareerPost[];
      mentorships: MentorshipPost[];
      blogs: BlogPost[];
      achievements: AchievementPost[];
    };
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'CAREERS' | 'MENTORSHIPS' | 'ACHIEVEMENTS'>('ALL');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/alumni/peer-profile?id=${alumniId}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load peer profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (alumniId) {
      fetchProfile();
    }
  }, [alumniId]);

  if (loading) {
    return <AlumniPeerProfileSkeleton />;
  }

  if (!data || !data.alumni) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-md">
        <p className="text-sm font-bold text-slate-800">Alumni profile could not be found or loaded.</p>
        <Link
          href="/alumni/dashboard?tab=find-alumni"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back to Alumni Directory</span>
        </Link>
      </div>
    );
  }

  const { alumni, stats, posts } = data;
  const locationString = [alumni.city, alumni.state, alumni.country].filter(Boolean).join(', ');
  const linkedInUrl = alumni.linkedIn ? normalizeLinkedInUrl(alumni.linkedIn) : '';

  return (
    <div className="max-w-4xl mx-auto space-y-3.5 sm:space-y-5 pb-24 sm:pb-16 animate-in fade-in duration-300">

      {/* ─── Top Header Navigation Bar (Dashboard Glassmorphism Style) ─── */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-white/80 shadow-sm">
        <Link
          href="/alumni/dashboard?tab=find-alumni"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 text-xs font-bold border border-slate-200/80 shadow-xs transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </Link>

        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Alumni Profile
        </span>
      </div>

      {/* ─── Main Instagram-Style Profile Card ─── */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/80 shadow-md shadow-slate-900/5 space-y-4 sm:space-y-5 relative overflow-hidden group">
        <div className="absolute top-[10%] right-[5%] w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000"></div>

        {/* Top Section: Avatar + 3 Stat Columns (Instagram Horizontal Pattern on All Screens) */}
        <div className="flex items-center gap-3 sm:gap-6 relative z-10">

          {/* Profile Picture */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full p-0.5 sm:p-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 shadow-md">
            <div className="w-full h-full rounded-full bg-white overflow-hidden relative flex items-center justify-center">
              {alumni.profilePic ? (
                <Image src={alumni.profilePic} alt={alumni.name} fill className="object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-blue-700">
                  {alumni.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* 3 Stats Counters */}
          <div className="flex-1 grid grid-cols-3 text-center gap-1.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/80 border border-slate-100 shadow-xs">
              <span className="block text-sm sm:text-xl font-black text-slate-900 leading-none">
                {stats.totalPosts}
              </span>
              <span className="text-[9.5px] sm:text-xs font-semibold text-slate-500 mt-0.5 sm:mt-1 block truncate">Posts</span>
            </div>

            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50/80 border border-blue-100 shadow-xs">
              <span className="block text-sm sm:text-xl font-black text-blue-700 leading-none truncate">
                {alumni.batchYear || 'N/A'}
              </span>
              <span className="text-[9.5px] sm:text-xs font-semibold text-blue-600 mt-0.5 sm:mt-1 block truncate">Batch</span>
            </div>

            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-50/80 border border-purple-100 shadow-xs">
              <span className="block text-sm sm:text-xl font-black text-purple-700 leading-none">
                {stats.totalCareers}
              </span>
              <span className="text-[9.5px] sm:text-xs font-semibold text-purple-600 mt-0.5 sm:mt-1 block truncate">Jobs</span>
            </div>
          </div>
        </div>

        {/* Identity, Headline & Biography */}
        <div className="space-y-2 pt-1 border-t border-slate-100 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{alumni.name}</span>
              <CheckCircle2 size={16} className="text-blue-600 fill-blue-600/10 shrink-0" />
            </h1>
            {alumni.industry && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                <Tag size={10} />
                {alumni.industry}
              </span>
            )}
          </div>

          {/* Current Title */}
          {alumni.currentTitle && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
              <Briefcase size={13} className="text-blue-600 shrink-0" />
              <span className="truncate">{alumni.currentTitle}</span>
            </div>
          )}

          {/* School & Location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1">
              <Building2 size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{alumni.schoolName || 'Institutional Member'}</span>
            </div>
            {locationString && (
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-rose-500 shrink-0" />
                <span className="truncate">{locationString}</span>
              </div>
            )}
          </div>

          {/* Bio Box */}
          {alumni.currentBio && (
            <p className="text-xs text-slate-600 leading-relaxed pt-1 italic bg-white/70 p-3 rounded-xl border border-slate-100">
              "{alumni.currentBio}"
            </p>
          )}
        </div>

        {/* ─── Highlights / Story Links Row (LinkedIn, Portfolio) ─── */}
        {(linkedInUrl || alumni.workLink) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap relative z-10">
            {linkedInUrl && (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <LinkedInIcon />
                <span>LinkedIn Profile</span>
                <ExternalLink size={11} />
              </a>
            )}

            {alumni.workLink && (
              <a
                href={alumni.workLink.startsWith('http') ? alumni.workLink : `https://${alumni.workLink}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-xs"
              >
                <Globe size={13} className="text-slate-600" />
                <span>Portfolio / Link</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

      </div>

      {/* ─── Tab Navigation Bar (Horizontal Scroll on Mobile, No Text Wrap) ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${activeTab === 'ALL'
            ? 'bg-slate-900 text-white border-transparent'
            : 'bg-white/70 text-slate-600 border-white/80 hover:bg-white'
            }`}
        >
          <Grid size={13} />
          <span>All ({stats.totalPosts})</span>
        </button>

        <button
          onClick={() => setActiveTab('CAREERS')}
          className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${activeTab === 'CAREERS'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent'
            : 'bg-white/70 text-slate-600 border-white/80 hover:bg-white'
            }`}
        >
          <Briefcase size={13} />
          <span>Jobs ({stats.totalCareers})</span>
        </button>

        <button
          onClick={() => setActiveTab('MENTORSHIPS')}
          className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${activeTab === 'MENTORSHIPS'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent'
            : 'bg-white/70 text-slate-600 border-white/80 hover:bg-white'
            }`}
        >
          <Handshake size={13} />
          <span>Mentorship ({stats.totalMentorships})</span>
        </button>

        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${activeTab === 'ACHIEVEMENTS'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent'
            : 'bg-white/70 text-slate-600 border-white/80 hover:bg-white'
            }`}
        >
          <Trophy size={13} />
          <span>Milestones ({stats.totalBlogs + stats.totalAchievements})</span>
        </button>
      </div>

      {/* ─── Approved Posts Content Feed (Dashboard Style Cards) ─── */}
      <div className="space-y-3 sm:space-y-4">

        {/* Empty state */}
        {stats.totalPosts === 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-white/80 shadow-sm space-y-2">
            <Grid size={36} className="mx-auto text-slate-300" />
            <h4 className="text-sm sm:text-base font-bold text-slate-800">No Approved Posts Yet</h4>
            <p className="text-xs text-slate-500">This alumnus has not shared any public opportunities yet.</p>
          </div>
        )}

        {/* Career Opportunities (Jobs / Internships) */}
        {(activeTab === 'ALL' || activeTab === 'CAREERS') && posts.careers.map((post) => (
          <div
            key={post.id}
            className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/80 shadow-sm hover:bg-white/90 hover:shadow-md transition-all space-y-3 sm:space-y-4"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start space-x-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Briefcase size={18} className="sm:size-[22px]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {post.type}
                    </span>
                    {post.category && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug truncate mt-1">
                    {post.role}
                  </h4>
                  <p className="text-xs font-bold text-blue-600">{post.companyName}</p>
                </div>
              </div>

              <span className="text-[10px] sm:text-xs font-bold text-slate-400 shrink-0">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Location & Mode */}
            {(post.location || post.workMode || post.salary) && (
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                {post.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {post.location}
                  </span>
                )}
                {post.workMode && <span>• {post.workMode.replace('_', ' ')}</span>}
                {post.salary && <span className="text-emerald-700 font-bold">• {post.salary}</span>}
              </div>
            )}

            {/* Description */}
            {post.description && (
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {post.description}
              </p>
            )}

            {/* ─── LIVE METRIC COUNTERS (Interested, Referrals, Registrations) ─── */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Interested Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10.5px] sm:text-xs font-bold">
                  <ThumbsUp size={12} />
                  <span>{post.interestedCount} Interested</span>
                </div>

                {/* Referrals Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[10.5px] sm:text-xs font-bold">
                  <Handshake size={12} />
                  <span>{post.referralCount} Referrals</span>
                </div>

                {/* Registrations Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10.5px] sm:text-xs font-bold">
                  <FileText size={12} />
                  <span>{post.registrationCount} Registered</span>
                </div>
              </div>

              {post.applyLink && (
                <a
                  href={post.applyLink.startsWith('http') ? post.applyLink : `mailto:${post.applyLink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                >
                  <span>Apply</span>
                  <Send size={11} />
                </a>
              )}
            </div>
          </div>
        ))}

        {/* Mentorship Offers */}
        {(activeTab === 'ALL' || activeTab === 'MENTORSHIPS') && posts.mentorships.map((post) => (
          <div
            key={post.id}
            className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/80 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <Handshake size={18} className="sm:size-[22px]" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    Mentorship
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug mt-1">
                    {post.title}
                  </h4>
                  {post.category && <p className="text-xs text-slate-500 font-semibold">{post.category}</p>}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {post.description}
            </p>

            {post.availability && (
              <p className="text-[11px] font-semibold text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-100">
                🕒 Availability: {post.availability}
              </p>
            )}

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                <Users size={12} />
                <span>{post.registrationCount} Mentees Registered</span>
              </div>
            </div>
          </div>
        ))}

        {/* Achievements & Blogs */}
        {(activeTab === 'ALL' || activeTab === 'ACHIEVEMENTS') && (
          <>
            {posts.achievements.map((item) => (
              <div key={item.id} className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/80 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-600">Achievement</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                {item.date && <p className="text-[10px] text-slate-400 font-semibold">Earned: {item.date}</p>}
              </div>
            ))}

            {posts.blogs.map((item) => (
              <div key={item.id} className="bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/80 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-600">Article / Blog</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </>
        )}

      </div>

    </div>
  );
}
