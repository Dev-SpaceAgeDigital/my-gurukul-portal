'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  CalendarDays,
  Search,
  School as SchoolIcon,
  Image as ImageIcon,
  Video,
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Loader2,
  Heart,
  Share2,
  Maximize2,
  Layers,
  Clock,
  Tag,
  Building2,
  Film,
  Camera,
  RotateCcw,
} from 'lucide-react';

interface Media {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  fileId?: string;
}

interface EventMemory {
  id: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  category?: string | null;
  date: string;
  eventYear?: string;
  schoolId?: string;
  schoolName?: string;
  featuredImage?: string | null;
  media: Media[];
  createdAt: string;
}

interface SchoolOption {
  id: string;
  schoolName: string;
}

const CATEGORIES = [
  'All',
  'Annual Day',
  'Sports',
  'Cultural',
  'School Life',
  'Farewell',
  'Academics',
  'Campaign',
  'Excursion',
];

function MemoryCardSkeleton() {
  return (
    <article className="flex min-h-[320px] animate-pulse flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 bg-white/70 p-3.5 sm:p-4 shadow-sm">
      <div className="h-44 sm:h-48 w-full rounded-xl sm:rounded-2xl bg-slate-200/70" />
      <div className="space-y-2 mt-3">
        <div className="flex justify-between">
          <div className="h-4 w-28 rounded-full bg-blue-100/80" />
          <div className="h-4 w-16 rounded-full bg-slate-200/80" />
        </div>
        <div className="h-4 w-3/4 rounded-full bg-slate-200/80" />
        <div className="h-3 w-full rounded-full bg-slate-200/60" />
      </div>
      <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
        <div className="h-6 w-20 rounded-full bg-slate-200/70" />
        <div className="h-6 w-24 rounded-full bg-slate-200/70" />
      </div>
    </article>
  );
}

export default function AlumniMemoriesHub() {
  const [events, setEvents] = useState<EventMemory[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Video Modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');

  // Likes state
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMemories();
  }, [selectedSchool, selectedYear, selectedCategory]);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSchool !== 'ALL') params.append('schoolId', selectedSchool);
      if (selectedYear !== 'ALL') params.append('year', selectedYear);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/alumni/memories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        if (data.schools?.length) setSchools(data.schools);
        if (data.years?.length) setYears(data.years);
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  const resetFilters = () => {
    setSelectedSchool('ALL');
    setSelectedYear('ALL');
    setSelectedCategory('All');
    setSearchQuery('');
  };

  const openLightbox = (images: string[], startIndex: number, title: string) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setLightboxTitle(title);
    setIsLightboxOpen(true);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : url;
  };

  const toggleLike = (id: string) => {
    setLikedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered in-memory if user types in real-time
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.schoolName && e.schoolName.toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

  // Overall statistics for stat counters
  const stats = useMemo(() => {
    let totalPhotos = 0;
    let totalVideos = 0;
    const distinctSchools = new Set<string>();

    events.forEach((ev) => {
      if (ev.schoolName) distinctSchools.add(ev.schoolName);
      if (ev.featuredImage) totalPhotos += 1;
      ev.media.forEach((m) => {
        if (m.mediaType === 'IMAGE') totalPhotos += 1;
        if (m.mediaType === 'VIDEO') totalVideos += 1;
      });
    });

    return {
      totalEvents: events.length,
      totalPhotos,
      totalVideos,
      totalSchools: distinctSchools.size || schools.length,
    };
  }, [events, schools]);

  const activeFilterCount =
    (selectedSchool !== 'ALL' ? 1 : 0) +
    (selectedYear !== 'ALL' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-28 sm:gap-5 sm:pb-16 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <section className="relative overflow-visible rounded-2xl border border-white/60 bg-white/40 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-6">
        <div className="relative z-10 flex flex-col gap-2.5 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/10 bg-blue-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-blue-600">
              <Sparkles size={11} className="animate-pulse" />
              School Memories & Event Gallery
            </span>
            <h2 className="mt-1.5 text-base font-extrabold tracking-tight text-slate-800 sm:text-2xl">
              Campus Memories
            </h2>
            <p className="mt-0.5 max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
              Relive nostalgic annual days, sports triumphs, cultural functions, and milestone school celebrations across graduating batches.
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-white hover:text-slate-950 sm:rounded-2xl sm:px-3.5 sm:py-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw size={12} />
              <span>Reset Filters ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Stat Cards Row */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="rounded-2xl sm:rounded-3xl border border-white/80 bg-white/70 p-2.5 sm:p-4 text-left shadow-md shadow-slate-900/5 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
              Events Logged
            </span>
            <span className="text-blue-600">
              <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px]" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl text-slate-900">
            {stats.totalEvents}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/80 bg-white/70 p-2.5 sm:p-4 text-left shadow-md shadow-slate-900/5 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
              Photos & Albums
            </span>
            <span className="text-emerald-600">
              <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl text-slate-900">
            {stats.totalPhotos}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/80 bg-white/70 p-2.5 sm:p-4 text-left shadow-md shadow-slate-900/5 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
              Video Highlights
            </span>
            <span className="text-purple-600">
              <Film size={16} className="sm:w-[18px] sm:h-[18px]" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl text-slate-900">
            {stats.totalVideos}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/80 bg-white/70 p-2.5 sm:p-4 text-left shadow-md shadow-slate-900/5 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
              Campuses
            </span>
            <span className="text-amber-600">
              <Building2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl text-slate-900">
            {stats.totalSchools}
          </p>
        </div>
      </section>

      {/* 3. Search & Multi-Filter Box */}
      <section className="rounded-2xl border border-white/70 bg-white/50 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories, events, celebrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </form>

          {/* School Selector */}
          <div className="sm:col-span-4 relative">
            <SchoolIcon size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-xs"
            >
              <option value="ALL">All Schools & Campuses</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-2.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Year Selector */}
          <div className="sm:col-span-3 relative">
            <CalendarDays size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-xs"
            >
              <option value="ALL">All Event Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-2.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-slate-200/60">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter size={11} />
            Category:
          </span>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-3 py-1 text-[10px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white/80 border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Memories Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center sm:rounded-3xl sm:px-5 sm:py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
            <ImageIcon size={24} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">No Memories Localized</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            No memories matched your current filters. Try changing your search query or selecting "All Schools".
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const images = event.media.filter((m) => m.mediaType === 'IMAGE').map((m) => m.url);
            if (event.featuredImage && !images.includes(event.featuredImage)) {
              images.unshift(event.featuredImage);
            }
            const videos = event.media.filter((m) => m.mediaType === 'VIDEO');
            const isLiked = likedEvents[event.id];

            return (
              <article
                key={event.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 bg-white/75 sm:bg-white/80 p-3 sm:p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Media Section */}
                <div>
                  {images.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1.5 h-48 sm:h-52 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900/5 p-1 relative">
                      {images.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => openLightbox(images, i, event.title)}
                          className="relative h-full w-full rounded-lg overflow-hidden cursor-pointer group/img bg-slate-200"
                        >
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2 size={16} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            {i + 1} / 2
                          </div>
                        </div>
                      ))}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs">
                          {event.category || 'Campus Event'}
                        </span>
                        {event.eventYear && (
                          <span className="text-[9.5px] font-bold text-blue-900 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs">
                            Year {event.eventYear}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : images.length > 0 ? (
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100">
                      <Image
                        src={images[0]}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => openLightbox(images, 0, event.title)}
                        unoptimized
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs">
                          {event.category || 'Campus Event'}
                        </span>
                        {event.eventYear && (
                          <span className="text-[9.5px] font-bold text-blue-900 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs">
                            Year {event.eventYear}
                          </span>
                        )}
                      </div>

                      {/* Photos Count */}
                      {images.length > 1 && (
                        <button
                          onClick={() => openLightbox(images, 0, event.title)}
                          className="absolute bottom-2.5 right-2.5 text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <Camera size={11} />
                          <span>{images.length} Photos</span>
                        </button>
                      )}
                    </div>
                  ) : videos.length > 0 ? (
                    <div
                      onClick={() => {
                        setActiveVideoUrl(videos[0].url);
                        setVideoTitle(event.title);
                      }}
                      className="relative h-48 sm:h-52 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-white cursor-pointer group/video"
                    >
                      <PlayCircle size={44} className="text-amber-400 group-hover/video:scale-110 transition-transform" />
                      <span className="text-xs font-bold mt-2 text-slate-200">Watch Event Video</span>
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-white bg-blue-600/90 px-2 py-0.5 rounded-full">
                          Video Highlight
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 w-full rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageIcon size={30} />
                    </div>
                  )}

                  {/* Thumbnail Row if 3+ photos */}
                  {images.length > 2 && (
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/60 rounded-xl mt-1.5">
                      {images.slice(0, 4).map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => openLightbox(images, i, event.title)}
                          className="relative h-11 rounded-lg overflow-hidden cursor-pointer bg-slate-200 hover:opacity-90 transition-opacity"
                        >
                          <Image src={imgUrl} alt="" fill className="object-cover" unoptimized />
                          {i === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center text-[10px] font-bold">
                              +{images.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="pt-3 pb-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 font-bold text-blue-700 truncate max-w-[170px]">
                        <SchoolIcon size={11} className="shrink-0" />
                        <span>{event.schoolName || 'Campus Event'}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        {formatDate(event.date)}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Attached Videos Strip */}
                    {videos.length > 0 && (
                      <div className="pt-1.5">
                        {videos.map((vid) => (
                          <button
                            key={vid.id}
                            type="button"
                            onClick={() => {
                              setActiveVideoUrl(vid.url);
                              setVideoTitle(event.title);
                            }}
                            className="w-full py-1 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-800 text-[10.5px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Video size={12} className="text-purple-600" />
                              <span>Watch Stage / Event Clip</span>
                            </span>
                            <PlayCircle size={13} className="text-purple-700" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleLike(event.id)}
                    className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                      isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    <Heart size={14} className={isLiked ? 'fill-rose-600 text-rose-600' : ''} />
                    <span className="text-[11px]">{isLiked ? 'Cherished' : 'Nostalgic'}</span>
                  </button>

                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openLightbox(images, 0, event.title)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 size={11} />
                      <span>View Album</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Fullscreen Photo Lightbox Modal */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative flex h-[85vh] w-full max-w-5xl flex-col justify-between rounded-3xl border border-white/20 bg-slate-900/90 p-4 sm:p-6 text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-lg">{lightboxTitle}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Photo {lightboxIndex + 1} of {lightboxImages.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Central Canvas */}
            <div className="relative flex-1 my-3 flex items-center justify-center overflow-hidden">
              <Image
                src={lightboxImages[lightboxIndex]}
                alt={lightboxTitle}
                fill
                className="object-contain"
                unoptimized
              />

              {/* Prev / Next */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevLightboxImage}
                    className="absolute left-2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition-all shadow-lg cursor-pointer"
                    title="Previous Photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={nextLightboxImage}
                    className="absolute right-2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition-all shadow-lg cursor-pointer"
                    title="Next Photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {lightboxImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {lightboxImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      lightboxIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. In-App Video Player Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-2">
            <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <Video size={16} className="text-purple-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">{videoTitle}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative w-full aspect-video bg-black">
              {activeVideoUrl.includes('youtube') || activeVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideoUrl)}
                  title={videoTitle}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeVideoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
