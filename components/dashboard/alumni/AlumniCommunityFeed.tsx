'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Megaphone,
  Briefcase,
  CheckCircle,
  ChevronDown,
  GraduationCap,
  Handshake,
  Hash,
  Heart,
  Plus,
  RotateCw,
  Share2,
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Send,
  Video,
  School,
  Calendar,
  Repeat,
  Layers,
  Globe,
  Users,
  MapPin,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreatePostSubmenu from './CreatePostSubmenu';
import RegisterOpportunityModal from './RegisterOpportunityModal';

interface FeedItem {
  id: string;
  itemType: 'achievement' | 'story' | 'job' | 'internship' | 'mentorship' | 'news';
  title: string;
  content: string;
  badge?: string;
  mediaUrl?: string | null;
  createdAt: string;
  alumniName: string;
  currentTitle?: string | null;
  batchYear?: string | number | null;
  profilePic?: string | null;
  schoolName?: string | null;
  format?: string | null;
  deliveryMode?: string | null;
  meetingLink?: string | null;
  sessionDate?: string | null;
  sessionTime?: string | null;
  frequency?: string | null;
  category?: string | null;
  targetStudent?: string | null;
  availability?: string | null;
  likeCount?: number;
  viewCount?: number;
  userLiked?: boolean;
}

interface AlumniCommunityFeedProps {
  onOpenCreateModal?: () => void;
}

type FeedFilter = 'all' | 'stories' | 'achievements' | 'news' | 'jobs' | 'internships' | 'mentorships';

const filters: Array<{ id: FeedFilter; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'stories', label: 'Stories', icon: BookOpen },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'news', label: 'School News & Broadcasts', icon: Megaphone },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'internships', label: 'Internships', icon: GraduationCap },
  { id: 'mentorships', label: 'Mentorship', icon: Handshake },
];

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'A';
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 1000));

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getItemBadge(item: FeedItem) {
  switch (item.itemType) {
    case 'news':
      return { label: item.badge || 'Campus Announcement', icon: Megaphone, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'achievement':
      return { label: item.badge || 'Achievement', icon: Trophy, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'story':
      return { label: 'Story', icon: BookOpen, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'job':
      return { label: item.badge || 'Job', icon: Briefcase, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'internship':
      return { label: item.badge || 'Internship', icon: GraduationCap, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    case 'mentorship':
      return { label: item.badge || 'Mentorship', icon: Handshake, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    default:
      return { label: 'Post', icon: Sparkles, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
}

function getPreviewText(text: string, expanded: boolean) {
  const normalized = String(text || 'No details added.').trim();
  if (expanded || normalized.length <= 150) {
    return { text: normalized, canToggle: normalized.length > 150 };
  }

  return { text: `${normalized.slice(0, 150).trim()}...`, canToggle: true };
}

function FeedCardSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-slate-200/80" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-4 w-32 rounded-full bg-slate-200/80" />
            <div className="h-4 w-20 rounded-full bg-blue-100/90" />
          </div>
          <div className="h-5 w-3/4 rounded-full bg-slate-200/80" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200/70" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200/70" />
          </div>
          <div className="aspect-video rounded-2xl bg-slate-100" />
          <div className="flex gap-3 border-t border-slate-100 pt-3">
            <div className="h-8 w-16 rounded-full bg-slate-100" />
            <div className="h-8 w-20 rounded-full bg-slate-100" />
            <div className="ml-auto h-8 w-8 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AlumniCommunityFeed({ onOpenCreateModal }: AlumniCommunityFeedProps) {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [interestedState, setInterestedState] = useState<Record<string, 'interested' | 'have_people' | null>>({});
  const [suggestedAlumni, setSuggestedAlumni] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [tenantInfo, setTenantInfo] = useState<{ logoUrl: string; name: string } | null>(null);
  const [registerModalPost, setRegisterModalPost] = useState<{
    id: string;
    title: string;
    postType: 'CAREER' | 'MENTORSHIP';
    authorName?: string;
    subtitle?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setTenantInfo({ logoUrl: data.logoUrl || '/my-gurukul.png', name: data.name || 'Alumni Network' });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchFeed(1, true);
    fetchSuggestedAlumni();
  }, [filter]);

  const fetchSuggestedAlumni = async () => {
    try {
      const res = await fetch('/api/alumni/directory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSuggestedAlumni(data.slice(0, 4));
      }
    } catch { }
  };

  const fetchFeed = async (pageNum: number = 1, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const tabParam = filter === 'all' ? 'feed' : filter;
      const res = await fetch(`/api/alumni/community?tab=${tabParam}&page=${pageNum}&limit=10`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.items)) {
        setItems((prev) => isInitial || pageNum === 1 ? data.items : [...prev, ...data.items]);
        if (Array.isArray(data.trending)) setTrendingTopics(data.trending);

        const userLikesMap: Record<string, boolean> = {};
        const countsMap: Record<string, number> = {};
        const viewsMap: Record<string, number> = {};
        const itemIdsToRecordView: string[] = [];

        data.items.forEach((item: FeedItem) => {
          userLikesMap[item.id] = Boolean(item.userLiked);
          countsMap[item.id] = item.likeCount ?? 0;
          viewsMap[item.id] = item.viewCount ?? 0;
          if (item.id) itemIdsToRecordView.push(item.id);
        });

        if (isInitial || pageNum === 1) {
          setLikes(userLikesMap);
          setLikeCounts(countsMap);
          setViewCounts(viewsMap);
        } else {
          setLikes((prev) => ({ ...prev, ...userLikesMap }));
          setLikeCounts((prev) => ({ ...prev, ...countsMap }));
          setViewCounts((prev) => ({ ...prev, ...viewsMap }));
        }

        if (itemIdsToRecordView.length > 0) {
          fetch('/api/alumni/community/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedItemIds: itemIdsToRecordView }),
          }).catch(() => { });
        }

        setHasMore(data.hasMore ?? data.items.length >= 10);
      } else {
        if (isInitial) setItems([]);
        setHasMore(false);
      }
    } catch {
      if (isInitial) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, false);
  };

  const toggleLike = async (id: string, itemType: string) => {
    const isLiked = likes[id] || false;
    setLikes((prev) => ({ ...prev, [id]: !isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + (isLiked ? -1 : 1)),
    }));

    try {
      const res = await fetch('/api/alumni/community/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId: id, itemType, liked: !isLiked }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.liked === 'boolean') setLikes((prev) => ({ ...prev, [id]: data.liked }));
        if (typeof data.likeCount === 'number') setLikeCounts((prev) => ({ ...prev, [id]: data.likeCount }));
      }
    } catch { }
  };

  const toggleInterest = (id: string, type: 'interested' | 'have_people') => {
    setInterestedState(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreate = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
      return;
    }
    router.push('/alumni/dashboard?tab=my-posts');
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-28 sm:gap-5 sm:pb-16 animate-in fade-in duration-300">
      <section className="relative overflow-visible rounded-3xl border border-white/60 bg-white/40 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-6">
        <div className="relative z-10 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/10 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600">
              <Sparkles size={11} className="animate-pulse" />
              {tenantInfo?.name || 'Alumni Network Hub'}
            </span>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight text-slate-800 sm:text-2xl">Community Feed</h2>
            <p className="mt-1 max-w-xl text-[11px] font-medium leading-relaxed text-slate-600 sm:text-xs">
              See approved stories, achievements, mentorship offers, and opportunities shared by verified alumni.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white bg-white/80 text-slate-600 shadow-sm transition-all hover:text-blue-600 disabled:opacity-60 sm:h-10 sm:w-10"
            >
              <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 text-[11px] font-extrabold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/50 p-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {filters.map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-[11px] font-bold transition-all sm:min-h-10 sm:gap-2 sm:text-xs ${active
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-white bg-white/80 text-slate-600 hover:border-blue-200 hover:text-blue-700'
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <FeedCardSkeleton key={index} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-white/70 bg-white/60 p-8 text-center shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <Sparkles size={40} className="text-blue-200" />
              <h3 className="mt-4 text-base font-black text-slate-900">No posts in this feed yet</h3>
              <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
                Be the first to share an achievement, story, mentorship offer, or career referral.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus size={14} />
                Create First Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const badge = getItemBadge(item);
                const BadgeIcon = badge.icon;
                const isLiked = likes[item.id] ?? Boolean(item.userLiked);
                const currentLikes = likeCounts[item.id] ?? (item.likeCount || 0);
                const currentViews = viewCounts[item.id] ?? (item.viewCount || 0);
                const isOpportunity = item.itemType === 'job' || item.itemType === 'internship' || item.itemType === 'mentorship';
                const interested = interestedState[item.id];
                const expanded = Boolean(expandedItems[item.id]);
                const preview = getPreviewText(item.content, expanded);

                return (
                  <article
                    key={item.id}
                    className="group rounded-3xl border border-white/80 bg-white/70 p-3.5 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all hover:bg-white/85 hover:shadow-xl sm:p-5"
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 sm:gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white bg-blue-50 shadow-sm sm:h-11 sm:w-11">
                        {item.profilePic ? (
                          <img src={item.profilePic} alt={item.alumniName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-sm font-black text-blue-700">
                            {getInitials(item.alumniName)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="max-w-full truncate text-sm font-black text-slate-900">{item.alumniName}</h3>
                              <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(item.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">
                              {item.currentTitle || item.schoolName || 'Madni Alumni'}
                              {item.batchYear ? ` | Batch '${String(item.batchYear).slice(-2)}` : ''}
                            </p>
                          </div>

                          <span className={`inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${badge.color}`}>
                            <BadgeIcon size={12} />
                            <span className="truncate">{badge.label}</span>
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
                          <h4 className="break-words text-[15px] font-black leading-snug text-slate-900 transition-colors group-hover:text-blue-700 sm:text-base">
                            {item.title}
                          </h4>
                          <p className="whitespace-pre-line break-words text-[13px] font-medium leading-relaxed text-slate-600 sm:text-sm">
                            {preview.text}
                          </p>
                          {preview.canToggle && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id)}
                              className="text-[12px] font-black text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              {expanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>

                        {/* Mentorship Structured Details Box */}
                        {item.itemType === 'mentorship' && (
                          <div className="mt-3 space-y-2.5 rounded-2xl bg-indigo-50/60 p-3 sm:p-4 border border-indigo-100 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5 font-bold">
                              {item.format && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10.5px]">
                                  <Layers size={12} /> {item.format}
                                </span>
                              )}
                              {item.deliveryMode && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10.5px]">
                                  {item.deliveryMode === 'AT_CAMPUS' ? <School size={12} /> : <Video size={12} />}
                                  {item.deliveryMode === 'AT_CAMPUS' ? 'At School Campus' : 'Online Virtual'}
                                </span>
                              )}
                              {item.frequency && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10.5px]">
                                  <Repeat size={12} /> {item.frequency}
                                </span>
                              )}
                            </div>

                            {(item.sessionDate || item.sessionTime || item.targetStudent) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-indigo-100/70 text-[11px] text-slate-700">
                                {(item.sessionDate || item.sessionTime) && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-indigo-600 shrink-0" />
                                    <span>
                                      <strong>Schedule:</strong> {[item.sessionDate ? new Date(item.sessionDate).toLocaleDateString() : null, item.sessionTime].filter(Boolean).join(' @ ')}
                                    </span>
                                  </div>
                                )}
                                {item.targetStudent && (
                                  <div className="flex items-center gap-1.5">
                                    <Users size={13} className="text-indigo-600 shrink-0" />
                                    <span className="truncate">
                                      <strong>Target:</strong> {item.targetStudent}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.meetingLink && (
                              <div className="pt-2 border-t border-indigo-100/70 flex items-center gap-2 text-[11.5px] font-semibold text-indigo-950 bg-white/90 p-2.5 rounded-xl">
                                {item.deliveryMode === 'AT_CAMPUS' ? (
                                  <School size={14} className="text-amber-600 shrink-0" />
                                ) : (
                                  <Globe size={14} className="text-blue-600 shrink-0" />
                                )}
                                <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-500 shrink-0">
                                  {item.deliveryMode === 'AT_CAMPUS' ? 'Venue:' : 'Meeting Link:'}
                                </span>
                                {item.meetingLink.startsWith('http') ? (
                                  <a
                                    href={item.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all truncate font-bold font-mono"
                                  >
                                    {item.meetingLink}
                                  </a>
                                ) : (
                                  <span className="font-bold text-slate-800 break-all">{item.meetingLink}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {item.mediaUrl && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 sm:mt-4">
                            <div className="aspect-video max-h-[360px] w-full">
                              <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                            </div>
                          </div>
                        )}

                        {isOpportunity && (
                          <div className="mt-3 space-y-2 sm:mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setRegisterModalPost({
                                  id: item.id,
                                  title: item.title,
                                  postType: item.itemType === 'mentorship' ? 'MENTORSHIP' : 'CAREER',
                                  authorName: item.alumniName,
                                  subtitle: item.itemType === 'mentorship' ? `${item.format || 'Mentorship'} • ${item.category || ''}` : item.badge,
                                })}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 text-xs font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                              >
                                <Send size={13} />
                                <span>{item.itemType === 'mentorship' ? 'Register Mentorship' : 'Apply / Register'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleInterest(item.id, 'interested')}
                                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-3 text-xs font-bold transition-all cursor-pointer ${interested === 'interested'
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  }`}
                              >
                                <CheckCircle size={14} />
                                <span className="truncate">{interested === 'interested' ? 'Interested' : "I'm Interested"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleInterest(item.id, 'have_people')}
                                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-3 text-xs font-bold transition-all cursor-pointer ${interested === 'have_people'
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                              >
                                <UserPlus size={14} />
                                <span className="truncate">{interested === 'have_people' ? 'Have Referral' : 'I Have People'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {isOpportunity && interested && (
                          <div className={`mt-3 rounded-2xl px-3 py-2 text-xs font-bold ${interested === 'interested' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                            {interested === 'interested'
                              ? `You marked interest in this ${item.itemType} post.`
                              : `You indicated that you have referral contacts for this ${item.itemType}.`}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-500 sm:mt-4 sm:pt-3">
                          <button
                            type="button"
                            onClick={() => toggleLike(item.id, item.itemType)}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 transition-colors ${isLiked ? 'bg-rose-50 text-rose-600' : 'hover:bg-rose-50 hover:text-rose-600'
                              }`}
                          >
                            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                            <span>{currentLikes}</span>
                          </button>

                          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-slate-400">
                            <BarChart2 size={15} />
                            <span>{currentViews} views</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({ title: item.title, text: item.content, url: window.location.href });
                              } else {
                                navigator.clipboard.writeText(window.location.href);
                              }
                            }}
                            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                            title="Share"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 text-xs font-extrabold text-slate-800 shadow-sm transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <RotateCw size={14} className="animate-spin text-blue-600" />
                        <span>Loading posts...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More</span>
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="hidden space-y-5 lg:block">
          <div className="sticky top-6 space-y-5">
            <div className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <TrendingUp size={16} className="text-blue-600" />
                Trending
              </h3>
              <div className="mt-3 space-y-2">
                {(trendingTopics.length > 0
                  ? trendingTopics
                  : [
                    { tag: '#TechCareerReferrals', category: 'Jobs & Internships', count: items.filter(i => i.itemType === 'job' || i.itemType === 'internship').length, filterId: 'jobs' },
                    { tag: '#SuccessWall', category: 'Achievements', count: items.filter(i => i.itemType === 'achievement').length, filterId: 'achievements' },
                    { tag: '#Mentorship2026', category: 'Mentorship', count: items.filter(i => i.itemType === 'mentorship').length, filterId: 'mentorships' },
                    { tag: '#AlumniVoices', category: 'Stories', count: items.filter(i => i.itemType === 'story').length, filterId: 'stories' },
                  ]).map((topic, index) => (
                    <button
                      key={`${topic.tag}-${index}`}
                      type="button"
                      onClick={() => setFilter(topic.filterId as FeedFilter)}
                      className="flex w-full items-center justify-between rounded-2xl p-2 text-left transition-colors hover:bg-blue-50/70"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold text-slate-400">{topic.category}</span>
                        <span className="block truncate text-xs font-black text-slate-800">{topic.tag}</span>
                        <span className="block text-[10px] font-medium text-slate-400">{topic.count || 0} active posts</span>
                      </span>
                      <Hash size={14} className="shrink-0 text-slate-300" />
                    </button>
                  ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <UserPlus size={16} className="text-blue-600" />
                Suggested Alumni
              </h3>
              <div className="mt-3 space-y-3">
                {suggestedAlumni.length === 0 ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex animate-pulse items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-slate-200/80" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded-full bg-slate-200/80" />
                        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))
                ) : (
                  suggestedAlumni.map((alumni) => (
                    <div key={alumni.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {alumni.profilePic ? (
                          <img src={alumni.profilePic} alt={alumni.name} className="h-9 w-9 shrink-0 rounded-2xl border border-slate-200 object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xs font-black text-blue-700">
                            {getInitials(alumni.name || 'Alumni')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-black text-slate-800">{alumni.name}</h4>
                          <p className="truncate text-[10px] font-semibold text-slate-400">
                            {alumni.currentTitle || alumni.schoolName || 'Madni Alumnus'}
                          </p>
                        </div>
                      </div>
                      {alumni.linkedIn && (
                        <a
                          href={alumni.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-full bg-[#0a66c2] px-3 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#004182]"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {registerModalPost && (
        <RegisterOpportunityModal
          isOpen={Boolean(registerModalPost)}
          onClose={() => setRegisterModalPost(null)}
          post={registerModalPost}
        />
      )}
    </div>
  );
}
