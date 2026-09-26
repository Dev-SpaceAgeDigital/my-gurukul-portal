'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Heart,
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
  X,
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

interface AlumniPeerProfileProps {
  alumniId: string;
  onClose: () => void;
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

export default function AlumniPeerProfileModal({ alumniId, onClose }: AlumniPeerProfileProps) {
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
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Alumni Profile...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.alumni) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <p className="text-sm font-bold text-slate-800">Alumni profile could not be loaded.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { alumni, stats, posts } = data;
  const locationString = [alumni.city, alumni.state, alumni.country].filter(Boolean).join(', ');
  const linkedInUrl = alumni.linkedIn ? normalizeLinkedInUrl(alumni.linkedIn) : '';

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-md flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-slate-50 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/80 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* ─── 1. Instagram-Style Header Bar ─── */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-center min-w-0 px-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {alumni.name}
            </h3>
            <span className="text-[10px] font-bold text-blue-600 block leading-tight">
              Batch of {alumni.batchYear || 'Alumnus'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Scrollable Profile Body ─── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-7 space-y-5 sm:space-y-6">

          {/* ─── 2. Top Profile Summary (Instagram Pattern) ─── */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/70 shadow-sm space-y-5">
            
            {/* Top row: Big Avatar + Stats Grid */}
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Profile Avatar */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 shadow-md">
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

              {/* 3 Stats Columns */}
              <div className="flex-1 grid grid-cols-3 text-center gap-1 sm:gap-2">
                <div className="p-2 sm:p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80">
                  <span className="block text-base sm:text-xl font-black text-slate-900 leading-none">
                    {stats.totalPosts}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 block">Posts</span>
                </div>

                <div className="p-2 sm:p-3 rounded-2xl bg-blue-50/80 border border-blue-100/80">
                  <span className="block text-base sm:text-xl font-black text-blue-700 leading-none">
                    {alumni.batchYear || 'N/A'}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-600 mt-1 block">Batch</span>
                </div>

                <div className="p-2 sm:p-3 rounded-2xl bg-purple-50/80 border border-purple-100/80">
                  <span className="block text-base sm:text-xl font-black text-purple-700 leading-none">
                    {stats.totalCareers}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-purple-600 mt-1 block">Jobs Shared</span>
                </div>
              </div>
            </div>

            {/* User Details & Biography */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>{alumni.name}</span>
                  <CheckCircle2 size={17} className="text-blue-600 fill-blue-600/10 shrink-0" />
                </h2>
                {alumni.industry && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <Tag size={10} />
                    {alumni.industry}
                  </span>
                )}
              </div>

              {/* Title & Organization */}
              {alumni.currentTitle && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                  <Briefcase size={13} className="text-blue-600 shrink-0" />
                  <span>{alumni.currentTitle}</span>
                </div>
              )}

              {/* School & Institution */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <span>{alumni.schoolName || 'Institutional Network Member'}</span>
              </div>

              {/* Location */}
              {locationString && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <MapPin size={13} className="text-rose-500 shrink-0" />
                  <span>{locationString}</span>
                </div>
              )}

              {/* Bio */}
              {alumni.currentBio && (
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed pt-1.5 italic bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  "{alumni.currentBio}"
                </p>
              )}
            </div>

            {/* ─── Highlights / Story Links Row (LinkedIn, Portfolio) ─── */}
            {(linkedInUrl || alumni.workLink) && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                {linkedInUrl && (
                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-sm shadow-blue-900/10 cursor-pointer"
                  >
                    <LinkedInIcon />
                    <span>LinkedIn Profile</span>
                    <ExternalLink size={12} />
                  </a>
                )}

                {alumni.workLink && (
                  <a
                    href={alumni.workLink.startsWith('http') ? alumni.workLink : `https://${alumni.workLink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                  >
                    <Globe size={13} className="text-slate-600" />
                    <span>Portfolio / Work Link</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

          </div>

          {/* ─── 3. Navigation Tabs (Instagram Grid / Tab Pattern) ─── */}
          <div className="flex items-center justify-around bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid size={14} />
              <span>All Posts ({stats.totalPosts})</span>
            </button>

            <button
              onClick={() => setActiveTab('CAREERS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'CAREERS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase size={14} />
              <span>Jobs ({stats.totalCareers})</span>
            </button>

            <button
              onClick={() => setActiveTab('MENTORSHIPS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'MENTORSHIPS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Handshake size={14} />
              <span>Mentorship ({stats.totalMentorships})</span>
            </button>

            <button
              onClick={() => setActiveTab('ACHIEVEMENTS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ACHIEVEMENTS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Trophy size={14} />
              <span>Milestones ({stats.totalBlogs + stats.totalAchievements})</span>
            </button>
          </div>

          {/* ─── 4. Approved Posts Display Grid ─── */}
          <div className="space-y-4">
            
            {/* Empty state */}
            {stats.totalPosts === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-2">
                <Grid size={36} className="mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800">No Approved Posts Yet</h4>
                <p className="text-xs text-slate-500">This alumnus has not shared any public opportunities yet.</p>
              </div>
            )}

            {/* A. Career Opportunities (Jobs / Internships) */}
            {(activeTab === 'ALL' || activeTab === 'CAREERS') && posts.careers.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Briefcase size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
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
                      <p className="text-xs font-bold text-blue-600 mt-0.5">{post.companyName}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Location & Mode */}
                {(post.location || post.workMode || post.salary) && (
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
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

                {/* ─── EXACT REQUESTED INTERACTION COUNTERS ─── */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Interested Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
                      <ThumbsUp size={13} />
                      <span>{post.interestedCount} Interested</span>
                    </div>

                    {/* Referrals Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                      <Handshake size={13} />
                      <span>{post.referralCount} Referrals</span>
                    </div>

                    {/* Registrations Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                      <FileText size={13} />
                      <span>{post.registrationCount} Registered</span>
                    </div>
                  </div>

                  {post.applyLink && (
                    <a
                      href={post.applyLink.startsWith('http') ? post.applyLink : `mailto:${post.applyLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <Send size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* B. Mentorship Offers */}
            {(activeTab === 'ALL' || activeTab === 'MENTORSHIPS') && posts.mentorships.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:border-purple-300 transition-all space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Handshake size={20} />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        Mentorship Offer
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
                  <p className="text-[11px] font-semibold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    🕒 Availability: {post.availability}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                    <Users size={13} />
                    <span>{post.registrationCount} Mentees Registered</span>
                  </div>
                </div>
              </div>
            ))}

            {/* C. Achievements & Blogs */}
            {(activeTab === 'ALL' || activeTab === 'ACHIEVEMENTS') && (
              <>
                {posts.achievements.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Achievement</span>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    {item.date && <p className="text-[10px] text-slate-400 font-semibold">Earned: {item.date}</p>}
                  </div>
                ))}

                {posts.blogs.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Article / Blog</span>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
