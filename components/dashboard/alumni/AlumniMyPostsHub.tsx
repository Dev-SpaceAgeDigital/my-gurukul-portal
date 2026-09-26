'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Handshake,
  ListFilter,
  Plus,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import AlumniAchievementHub from './AlumniAchievementHub';
import AlumniBlogHub from './AlumniBlogHub';
import AlumniCareerHub from './AlumniCareerHub';
import AlumniMentorshipHub from './AlumniMentorshipHub';

type ManagerTab = 'all' | 'achievements' | 'blogs' | 'careers' | 'mentorship' | 'contributions';
type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type PostTypeFilter = 'ALL' | 'ACHIEVEMENT' | 'STORY' | 'JOB' | 'INTERNSHIP' | 'MENTORSHIP';

interface MyPost {
  id: string;
  title: string;
  description: string;
  type: Exclude<PostTypeFilter, 'ALL'>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt?: string | null;
  date?: string | null;
  mediaUrl?: string | null;
  companyName?: string | null;
  meta?: string | null;
}

const statusFilters: Array<{ id: StatusFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

const typeFilters: Array<{ id: PostTypeFilter; label: string }> = [
  { id: 'ALL', label: 'All Types' },
  { id: 'JOB', label: 'Jobs' },
  { id: 'INTERNSHIP', label: 'Internships' },
  { id: 'MENTORSHIP', label: 'Mentorship' },
  { id: 'STORY', label: 'Stories' },
  { id: 'ACHIEVEMENT', label: 'Achievements' },
];

const typeStyles: Record<Exclude<PostTypeFilter, 'ALL'>, { label: string; color: string; icon: React.ReactNode }> = {
  ACHIEVEMENT: {
    label: 'Achievement',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Trophy size={15} />,
  },
  STORY: {
    label: 'Story',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: <BookOpen size={15} />,
  },
  JOB: {
    label: 'Job',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Briefcase size={15} />,
  },
  INTERNSHIP: {
    label: 'Internship',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: <GraduationCap size={15} />,
  },
  MENTORSHIP: {
    label: 'Mentorship',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: <Handshake size={15} />,
  },
};

const statusStyles: Record<string, { label: string; color: string; icon: React.ReactNode; note: string }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock size={14} />,
    note: 'Waiting for review',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 size={14} />,
    note: 'Visible after approval',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <XCircle size={14} />,
    note: 'Needs revision',
  },
};

function getStatusStyle(status: string) {
  return statusStyles[status] || statusStyles.PENDING;
}

function formatDate(value?: string | null) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPostPreview(text: string, expanded: boolean) {
  const normalized = String(text || 'No description added.').trim();
  if (expanded || normalized.length <= 150) {
    return { text: normalized, canToggle: normalized.length > 150 };
  }
  return { text: `${normalized.slice(0, 150).trim()}...`, canToggle: true };
}

function PostRowSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-24 rounded-full bg-blue-100/90" />
            <div className="h-5 w-20 rounded-full bg-slate-200/80" />
            <div className="h-5 w-28 rounded-full bg-slate-100" />
          </div>
          <div className="h-5 w-3/4 rounded-full bg-slate-200/80" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200/70" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200/70" />
          </div>
        </div>
        <div className="h-10 w-24 rounded-2xl bg-slate-100" />
      </div>
    </article>
  );
}

export default function AlumniMyPostsHub() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>('ALL');
  const [initialCareerType, setInitialCareerType] = useState<'JOB' | 'INTERNSHIP'>('JOB');
  const [autoOpenForm, setAutoOpenForm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [achievementsList, setAchievementsList] = useState<any[]>([]);
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [careersList, setCareersList] = useState<any[]>([]);
  const [mentorshipList, setMentorshipList] = useState<any[]>([]);
  const [contributionsList, setContributionsList] = useState<any[]>([]);
  const [aoyWinner, setAoyWinner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (!data.error) {
        setUserData(data);
	        fetch('/api/alumni/contributions').then(r => r.json()).then(c => {
	          setContributionsList(Array.isArray(c) ? c : []);
	        }).catch(() => []);
      }
    }).catch(() => { });

    fetch('/api/public/alumni-of-the-year').then(res => res.json()).then(data => {
      if (data && !data.error) setAoyWinner(data);
    }).catch(() => { });

    fetchAllMyPosts();
  }, []);

  const fetchAllMyPosts = async () => {
    setLoading(true);
    try {
      const [achRes, blogRes, carRes, menRes] = await Promise.all([
        fetch('/api/alumni/achievements').then(r => r.json()).catch(() => []),
        fetch('/api/alumni/blogs').then(r => r.json()).catch(() => []),
        fetch('/api/alumni/career').then(r => r.json()).catch(() => []),
        fetch('/api/alumni/mentorship').then(r => r.json()).catch(() => []),
      ]);

      setAchievementsList(Array.isArray(achRes) ? achRes : []);
      setBlogsList(Array.isArray(blogRes) ? blogRes : []);
      setCareersList(Array.isArray(carRes) ? carRes : []);
      setMentorshipList(Array.isArray(menRes) ? menRes : []);
    } catch (err) {
      console.error('Error fetching my posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const posts = useMemo<MyPost[]>(() => {
    const normalized: MyPost[] = [
      ...achievementsList.map((item) => ({
        id: item.id,
        title: item.title || 'Untitled achievement',
        description: item.description || '',
        type: 'ACHIEVEMENT' as const,
        status: item.status || 'PENDING',
        createdAt: item.createdAt,
        date: item.date,
        mediaUrl: item.mediaUrl,
        meta: item.category,
      })),
      ...blogsList.map((item) => ({
        id: item.id,
        title: item.title || 'Untitled story',
        description: item.content || '',
        type: 'STORY' as const,
        status: item.status || 'PENDING',
        createdAt: item.createdAt,
        mediaUrl: item.mediaUrl,
        meta: Array.isArray(item.tags) ? item.tags.slice(0, 2).join(', ') : null,
      })),
      ...careersList.map((item) => {
        const type: MyPost['type'] = item.type === 'INTERNSHIP' ? 'INTERNSHIP' : 'JOB';
        return {
          id: item.id,
          title: item.role && item.companyName ? `${item.role} at ${item.companyName}` : item.role || 'Career opportunity',
          description: item.description || '',
          type,
          status: item.status || 'PENDING',
          createdAt: item.createdAt,
          companyName: item.companyName,
          meta: [item.location, item.workMode].filter(Boolean).join(' | '),
        };
      }),
      ...mentorshipList.map((item) => ({
        id: item.id,
        title: item.title || 'Mentorship offer',
        description: item.description || '',
        type: 'MENTORSHIP' as const,
        status: item.status || 'PENDING',
        createdAt: item.createdAt,
        meta: item.category || item.targetStudent,
      })),
    ];

    return normalized.sort((a, b) => {
      const first = new Date(a.createdAt || a.date || 0).getTime();
      const second = new Date(b.createdAt || b.date || 0).getTime();
      return second - first;
    });
  }, [achievementsList, blogsList, careersList, mentorshipList]);

  const counts = useMemo(() => {
    const byStatus = {
      ALL: posts.length,
      PENDING: posts.filter(post => post.status === 'PENDING').length,
      APPROVED: posts.filter(post => post.status === 'APPROVED').length,
      REJECTED: posts.filter(post => post.status === 'REJECTED').length,
    };

    const byType = typeFilters.reduce((acc, filter) => {
      acc[filter.id] = filter.id === 'ALL' ? posts.length : posts.filter(post => post.type === filter.id).length;
      return acc;
    }, {} as Record<PostTypeFilter, number>);

    return { byStatus, byType };
  }, [posts]);

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || post.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const handleCreateSelect = (type: 'achievement' | 'story' | 'job' | 'internship' | 'mentorship') => {
    setAutoOpenForm(true);

    if (type === 'achievement') {
      setActiveTab('achievements');
    } else if (type === 'story') {
      setActiveTab('blogs');
    } else if (type === 'job') {
      setInitialCareerType('JOB');
      setActiveTab('careers');
    } else if (type === 'internship') {
      setInitialCareerType('INTERNSHIP');
      setActiveTab('careers');
    } else if (type === 'mentorship') {
      setActiveTab('mentorship');
    }
  };

  const openManager = (postType: MyPost['type']) => {
    setAutoOpenForm(false);

    if (postType === 'ACHIEVEMENT') setActiveTab('achievements');
    else if (postType === 'STORY') setActiveTab('blogs');
    else if (postType === 'MENTORSHIP') setActiveTab('mentorship');
    else {
      if (postType === 'INTERNSHIP') setInitialCareerType('INTERNSHIP');
      else setInitialCareerType('JOB');
      setActiveTab('careers');
    }
  };

  const returnToTracker = () => {
    setAutoOpenForm(false);
    setActiveTab('all');
    fetchAllMyPosts();
  };

  const toggleExpandedPost = (key: string) => {
    setExpandedPosts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (activeTab === 'achievements') {
    return (
      <div className="space-y-4 pb-16">
        <button onClick={returnToTracker} className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs cursor-pointer active:scale-95 transition-all">
          <span>← Back to My Posts</span>
        </button>
        <AlumniAchievementHub autoOpenForm={autoOpenForm} />
      </div>
    );
  }

  if (activeTab === 'blogs') {
    return (
      <div className="space-y-4 pb-16">
        <button onClick={returnToTracker} className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs cursor-pointer active:scale-95 transition-all">
          <span>← Back to My Posts</span>
        </button>
        <AlumniBlogHub autoOpenForm={autoOpenForm} />
      </div>
    );
  }

  if (activeTab === 'careers') {
    return (
      <div className="space-y-4 pb-16">
        <button onClick={returnToTracker} className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs cursor-pointer active:scale-95 transition-all">
          <span>← Back to My Posts</span>
        </button>
        <AlumniCareerHub autoOpenForm={autoOpenForm} initialType={initialCareerType} />
      </div>
    );
  }

  if (activeTab === 'mentorship') {
    return (
      <div className="space-y-4 pb-16">
        <button onClick={returnToTracker} className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs cursor-pointer active:scale-95 transition-all">
          <span>← Back to My Posts</span>
        </button>
        <AlumniMentorshipHub autoOpenForm={autoOpenForm} />
      </div>
    );
  }

  if (activeTab === 'contributions') {
    return (
      <div className="space-y-4 pb-16 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={returnToTracker} className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs cursor-pointer active:scale-95 transition-all">
            <span>← Back to My Posts</span>
          </button>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 sm:px-3 sm:text-xs">
            <FileText size={12} />
            My Financial & Infrastructure Impact
          </span>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/50 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-6">
          <h3 className="mb-1 text-base font-black text-slate-900 sm:text-lg">My Contributions & Tax Receipts</h3>
          <p className="mb-4 text-[11px] font-medium leading-relaxed text-slate-500 sm:mb-6 sm:text-xs">Download official 80G tax receipt PDFs for all your donations, construction aid, and student sponsorships.</p>

          {contributionsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center sm:rounded-3xl sm:px-5 sm:py-16">
              <p className="text-xs font-bold text-slate-700 sm:text-sm">No financial contributions logged yet.</p>
              <p className="mt-1 max-w-sm text-[10.5px] text-slate-400 mx-auto sm:text-xs">When you sponsor student fees or construction aid, your tax receipt PDF will appear here for instant download.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              {contributionsList.map((c: any) => (
                <div key={c.id} className="flex min-w-0 flex-col justify-between space-y-3 rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-sm sm:space-y-4 sm:rounded-3xl sm:p-5">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-800 sm:text-[10px]">
                        {c.contributionType || 'FINANCIAL'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 sm:text-xs">
                        {new Date(c.date || c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="break-words text-xs font-bold text-slate-900 sm:text-sm">{c.title}</h4>
                    {c.description && <p className="mt-1 break-words text-[11px] text-slate-500 sm:text-xs">{c.description}</p>}

                    {c.amount && (
                      <div className="mt-2.5 text-base font-black text-emerald-700 sm:text-lg">
                        Rs. {parseFloat(c.amount).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <a
                    href={`/api/public/download-receipt?id=${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-black sm:min-h-10 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-xs"
                  >
                    <FileText size={13} />
                    <span>Download 80G Receipt PDF</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
	    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-28 sm:gap-5 sm:pb-16 animate-in fade-in duration-300">
      {/* {aoyWinner && (
        <section className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={aoyWinner.alumniProfilePic || '/images/img-101.jpg'}
                  alt={aoyWinner.alumniName}
                  className="h-16 w-16 rounded-2xl border-2 border-amber-400 object-cover shadow-md sm:h-20 sm:w-20"
                />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-amber-500 text-white shadow-md">
                  <Trophy size={13} />
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Alumni of the Year {aoyWinner.year || 2026}
                  </span>
                  {aoyWinner.schoolName && (
                    <span className="break-words text-[11px] font-bold text-slate-500">
                      {aoyWinner.schoolName}
                    </span>
                  )}
                </div>

                <h3 className="break-words text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  {aoyWinner.alumniName}
                </h3>
                <p className="break-words text-xs font-bold text-amber-900">
                  {aoyWinner.headline || 'Top Educational Aid & Computer Lab Sponsor'}
                </p>
                <p className="mt-1 line-clamp-2 max-w-2xl break-words text-xs font-medium text-slate-600">
                  "{aoyWinner.reason}"
                </p>
              </div>
            </div>

            {Array.isArray(aoyWinner.highlights) && aoyWinner.highlights.length > 0 && (
              <div className="w-full min-w-0 rounded-2xl border border-amber-200/60 bg-white/80 p-4 text-xs font-semibold text-slate-700 backdrop-blur-md md:w-auto md:min-w-[260px] md:shrink-0">
                <p className="border-b border-amber-100 pb-1 text-[10px] font-black uppercase tracking-widest text-amber-900">
                  Key Impact Highlights
                </p>
                <div className="mt-2 space-y-1.5">
                  {aoyWinner.highlights.map((h: string, idx: number) => (
                    <p key={idx} className="flex min-w-0 items-center gap-1.5 break-words text-[11px]">
                      <CheckCircle2 size={12} className="shrink-0 text-amber-500" />
                      <span className="min-w-0 break-words">{h}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
      {/* Alumni of the Year Spotlight Banner */}
      {/* {aoyWinner && (
        <section className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={aoyWinner.alumniProfilePic || '/images/img-101.jpg'}
                  alt={aoyWinner.alumniName}
                  className="h-16 w-16 rounded-2xl border-2 border-amber-400 object-cover shadow-md sm:h-20 sm:w-20"
                />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-amber-500 text-white shadow-md">
                  <Trophy size={13} />
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Alumni of the Year {aoyWinner.year || 2026}
                  </span>
                  {aoyWinner.schoolName && (
                    <span className="break-words text-[11px] font-bold text-slate-500">
                      {aoyWinner.schoolName}
                    </span>
                  )}
                </div>

                <h3 className="break-words text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  {aoyWinner.alumniName}
                </h3>
                <p className="break-words text-xs font-bold text-amber-900">
                  {aoyWinner.headline || 'Top Educational Aid & Computer Lab Sponsor'}
                </p>
                <p className="mt-1 line-clamp-2 max-w-2xl break-words text-xs font-medium text-slate-600">
                  "{aoyWinner.reason}"
                </p>
              </div>
            </div>

            {Array.isArray(aoyWinner.highlights) && aoyWinner.highlights.length > 0 && (
              <div className="w-full min-w-0 rounded-2xl border border-amber-200/60 bg-white/80 p-4 text-xs font-semibold text-slate-700 backdrop-blur-md md:w-auto md:min-w-[260px] md:shrink-0">
                <p className="border-b border-amber-100 pb-1 text-[10px] font-black uppercase tracking-widest text-amber-900">
                  Key Impact Highlights
                </p>
                <div className="mt-2 space-y-1.5">
                  {aoyWinner.highlights.map((h: string, idx: number) => (
                    <p key={idx} className="flex min-w-0 items-center gap-1.5 break-words text-[11px]">
                      <CheckCircle2 size={12} className="shrink-0 text-amber-500" />
                      <span className="min-w-0 break-words">{h}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )} */}

	      <section className="relative overflow-visible rounded-2xl border border-white/60 bg-white/40 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-6">
	        <div className="relative z-10 flex flex-col gap-2.5 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/10 bg-blue-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-blue-600">
              <Sparkles size={11} className="animate-pulse" />
              Submission Tracker
            </span>
	            <h2 className="mt-1.5 text-base font-extrabold tracking-tight text-slate-800 sm:text-2xl">My Posts</h2>
	            <p className="mt-0.5 max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
              Track your jobs, internships, mentorship offers, stories, and achievements in one place.
            </p>
            {userData?.schoolName && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100/80 font-bold text-[10px] sm:text-[11px]">
                <Building2 size={11} />
                <span>{userData.schoolName}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {statusFilters.map((status) => {
          const style = status.id === 'ALL'
            ? { color: 'border-slate-200 bg-white text-slate-800', icon: <FileText size={16} className="sm:w-[18px] sm:h-[18px]" /> }
            : getStatusStyle(status.id);
          const active = statusFilter === status.id;

          return (
            <button
              key={status.id}
              type="button"
              onClick={() => setStatusFilter(status.id)}
              className={`rounded-2xl sm:rounded-3xl border p-2.5 text-left shadow-md shadow-slate-900/5 backdrop-blur-md transition-all sm:p-4 ${active ? 'border-slate-950 bg-slate-950 text-white' : `${style.color} hover:border-slate-300`
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">{status.label}</span>
                <span className={active ? 'text-white' : ''}>{style.icon}</span>
              </div>
              <p className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl">{counts.byStatus[status.id]}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/50 p-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase text-slate-500">
            <ListFilter size={13} />
            <span>Post Type</span>
          </div>

          {typeFilter === 'JOB' && (
            <button
              type="button"
              onClick={() => handleCreateSelect('job')}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Post New Job</span>
            </button>
          )}
          {typeFilter === 'INTERNSHIP' && (
            <button
              type="button"
              onClick={() => handleCreateSelect('internship')}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-teal-700 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Post New Internship</span>
            </button>
          )}
          {typeFilter === 'MENTORSHIP' && (
            <button
              type="button"
              onClick={() => handleCreateSelect('mentorship')}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Offer Mentorship</span>
            </button>
          )}
          {typeFilter === 'STORY' && (
            <button
              type="button"
              onClick={() => handleCreateSelect('story')}
              className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Story / Blog</span>
            </button>
          )}
          {typeFilter === 'ACHIEVEMENT' && (
            <button
              type="button"
              onClick={() => handleCreateSelect('achievement')}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-amber-600 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Achievement</span>
            </button>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {typeFilters.map((filter) => {
            const active = typeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTypeFilter(filter.id)}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl sm:rounded-2xl border px-2.5 text-[10px] font-bold transition-all sm:min-h-10 sm:px-3 sm:text-xs ${active
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-white bg-white/80 text-slate-700 hover:border-blue-200 hover:text-blue-700'
                  }`}
              >
                <span>{filter.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] sm:text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {counts.byType[filter.id]}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveTab('contributions')}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl sm:rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 px-2.5 text-[10px] sm:text-xs font-bold transition-all hover:bg-emerald-100 sm:min-h-10 sm:px-3"
          >
            <FileText size={13} />
            <span>My Impact & Receipts</span>
            <span className="rounded-full bg-emerald-200 text-emerald-900 px-1.5 py-0.2 text-[9px] font-black">
              {contributionsList.length}
            </span>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/50 p-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1.5 sm:px-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900">Submission List</h3>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">{filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'} shown</p>
          </div>
          <div className="flex items-center gap-1.5">
            {typeFilter === 'JOB' && (
              <button
                type="button"
                onClick={() => handleCreateSelect('job')}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
              >
                <Plus size={13} />
                <span>Post New Job</span>
              </button>
            )}

            {typeFilter === 'INTERNSHIP' && (
              <button
                type="button"
                onClick={() => handleCreateSelect('internship')}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
              >
                <Plus size={13} />
                <span>Post New Internship</span>
              </button>
            )}

            {typeFilter === 'MENTORSHIP' && (
              <button
                type="button"
                onClick={() => handleCreateSelect('mentorship')}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
              >
                <Plus size={13} />
                <span>Offer Mentorship</span>
              </button>
            )}

            {typeFilter === 'STORY' && (
              <button
                type="button"
                onClick={() => handleCreateSelect('story')}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Story / Blog</span>
              </button>
            )}

            {typeFilter === 'ACHIEVEMENT' && (
              <button
                type="button"
                onClick={() => handleCreateSelect('achievement')}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-white shadow-sm hover:bg-amber-600 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Achievement</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchAllMyPosts}
              className="w-fit rounded-xl border border-white bg-white/80 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700 cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <PostRowSkeleton key={index} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-white/50 p-6 text-center sm:rounded-3xl sm:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12 sm:rounded-2xl">
              <FileText size={20} />
            </div>
            <h3 className="mt-3 text-sm font-black text-slate-900 sm:text-base">No posts submitted yet</h3>
            <p className="mt-1 max-w-md text-xs font-medium text-slate-500 sm:text-sm">
              Create your first opportunity, story, achievement, or mentorship offer on dedicated pages.
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-white/50 p-6 text-center sm:rounded-3xl sm:p-8">
            <AlertCircle className="text-slate-400" size={22} />
            <h3 className="mt-2 text-xs font-black text-slate-900 sm:text-sm">No posts match these filters</h3>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="mt-2 text-xs font-bold text-slate-700 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2">
            {filteredPosts.map((post) => {
              const typeStyle = typeStyles[post.type];
              const statusStyle = getStatusStyle(post.status);
              const postKey = `${post.type}-${post.id}`;
              const expanded = Boolean(expandedPosts[postKey]);
              const preview = getPostPreview(post.description, expanded);

              return (
                <article key={postKey} className="grid gap-2.5 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm transition-all hover:bg-white/85 hover:shadow-md sm:rounded-3xl sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] sm:text-[11px] font-black ${typeStyle.color}`}>
                        {typeStyle.icon}
                        {typeStyle.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] sm:text-[11px] font-black ${statusStyle.color}`}>
                        {statusStyle.icon}
                        {statusStyle.label}
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9.5px] sm:text-xs font-semibold text-slate-500">Submitted {formatDate(post.createdAt || post.date)}</span>
                    </div>

                    <h4 className="break-words text-xs sm:text-base font-black text-slate-950">{post.title}</h4>
                    <p className="mt-1 max-w-4xl break-words text-[11px] sm:text-sm font-medium leading-relaxed text-slate-600">
                      {preview.text}
                    </p>
                    {preview.canToggle && (
                      <button
                        type="button"
                        onClick={() => toggleExpandedPost(postKey)}
                        className="mt-1 text-[11px] sm:text-[12px] font-black text-blue-600 hover:text-blue-700"
                      >
                        {expanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500">
                      {post.meta && <span>{post.meta}</span>}
                      {post.meta && <span className="text-slate-300">|</span>}
                      <span>{statusStyle.note}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openManager(post.type)}
                    className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl border border-white bg-white/80 px-3 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700 sm:min-h-10 sm:rounded-2xl sm:text-xs"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
