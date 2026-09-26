'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Image as ImageIcon,
  Video,
  Trash2,
  Loader2,
  X,
  PlayCircle,
  Pencil,
  Tag,
  Filter
} from 'lucide-react';
import Image from 'next/image';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Media {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  fileId?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  category?: string;
  date: string;
  media: Media[];
}

interface EventGalleryProps {
  schoolId?: string;
  isSuperAdmin?: boolean;
}

const DEFAULT_CATEGORIES = [
  'Annual Day',
  'Cultural',
  'School Life',
  'Campaign',
  'Sports',
  'Academics',
  'Excursion'
];

export default function EventGallery({ schoolId: _schoolId, isSuperAdmin = false }: EventGalleryProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Youtube Video Modal state
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const endpoint = isSuperAdmin ? '/api/superadmin/events' : '/api/subadmin/events';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : (data.events || []));
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Derive unique categories from DEFAULT_CATEGORIES and existing events
  const existingCategories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...events.map(e => e.category).filter(Boolean) as string[]
    ])
  );

  const handleDeleteEvent = async (id: string) => {
    if (!(await confirmDialog({
      title: 'Delete this event?',
      message: 'This will remove the full event and all attached media.',
      confirmText: 'Delete event',
      variant: 'danger',
    }))) return;
    try {
      const endpoint = isSuperAdmin ? `/api/superadmin/events?id=${id}` : `/api/subadmin/events?id=${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      setEvents((current) => current.filter(e => e.id !== id));
      showAlert({ title: 'Event deleted', message: 'The event and its media have been removed.', variant: 'success' });
    } catch (error) {
      showAlert({ title: 'Delete failed', message: 'The event could not be deleted.', variant: 'danger' });
    }
  };

  const handleDeleteMedia = async (eventId: string, mediaId: string) => {
    if (!(await confirmDialog({
      title: 'Delete this media?',
      message: 'This photo or video will be removed from the event gallery.',
      confirmText: 'Delete media',
      variant: 'danger',
    }))) return;
    try {
      const res = await fetch(`/api/subadmin/events/media?id=${mediaId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete media');
      setEvents((current) => current.map(e => {
        if (e.id === eventId) {
          return { ...e, media: e.media.filter(m => m.id !== mediaId) };
        }
        return e;
      }));
      showAlert({ title: 'Media deleted', message: 'The media item has been removed from this event.', variant: 'success' });
    } catch (error) {
      showAlert({ title: 'Delete failed', message: 'The media item could not be deleted.', variant: 'danger' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    
    setIsAddingMedia(true);
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('mediaType', 'IMAGE');
    formData.append('file', file);

    try {
      const res = await fetch('/api/subadmin/events/media', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newMedia = await res.json();
        setEvents((current) => current.map(ev => {
          if (ev.id === eventId) {
            return { ...ev, media: [newMedia, ...ev.media] };
          }
          return ev;
        }));
        showAlert({ title: 'Photo uploaded', message: 'The event photo has been added successfully.', variant: 'success' });
      } else {
        showAlert({ title: 'Upload failed', message: 'The image could not be added to the event.', variant: 'danger' });
      }
    } catch (error) {
      showAlert({ title: 'Upload failed', message: 'The image could not be added to the event.', variant: 'danger' });
    } finally {
      setIsAddingMedia(false);
    }
  };

  const handleAddYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId || !youtubeUrl) return;
    
    setIsAddingMedia(true);
    const formData = new FormData();
    formData.append('eventId', activeEventId);
    formData.append('mediaType', 'VIDEO');
    formData.append('url', youtubeUrl);

    try {
      const res = await fetch('/api/subadmin/events/media', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newMedia = await res.json();
        setEvents((current) => current.map(ev => {
          if (ev.id === activeEventId) {
            return { ...ev, media: [newMedia, ...ev.media] };
          }
          return ev;
        }));
        setIsYoutubeModalOpen(false);
        setYoutubeUrl('');
        showAlert({ title: 'Video added', message: 'The YouTube video has been added to the event.', variant: 'success' });
      } else {
        showAlert({ title: 'Failed to add video', message: 'The video link could not be added to the gallery.', variant: 'danger' });
      }
    } catch (error) {
      showAlert({ title: 'Failed to add video', message: 'The video link could not be added to the gallery.', variant: 'danger' });
    } finally {
      setIsAddingMedia(false);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const filteredEvents = selectedCategoryFilter === 'ALL'
    ? events
    : events.filter(e => (e.category || 'General').toLowerCase() === selectedCategoryFilter.toLowerCase());

  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId) || filteredEvents[0] || null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-[#dac48b]" size={36} />
      </div>
    );
  }

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Event Gallery</h2>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Manage school events, categories, photos, and videos</p>
        </div>
        <Link
          href="/subadmin/events/add"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#18181b] text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus size={16} className="mr-2" />
          Create Event
        </Link>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 overflow-hidden">
        <aside className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Events</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{events.length} total events</p>
              </div>
              <Filter size={15} className="text-slate-400" />
            </div>
          </div>

          {events.length > 0 && (
            <div className="px-3 py-3 border-b border-slate-100 shrink-0">
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-[#EFECE5]'
                  }`}
                >
                  All ({events.length})
                </button>
                {existingCategories.map((cat) => {
                  const count = events.filter(e => (e.category || 'General').toLowerCase() === cat.toLowerCase()).length;
                  if (count === 0) return null;
                  const isSelected = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#18181b] text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-[#EFECE5]'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {events.length === 0 ? (
              <div className="h-full min-h-72 flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 bg-[#efebe1] border border-[#e4dcd1] text-[#8b7355] rounded-md flex items-center justify-center mb-4 shadow-sm">
                  <CalendarDays size={28} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Events Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">Create an event to start uploading school photos and videos.</p>
                <Link href="/subadmin/events/add" className="inline-flex items-center px-4 py-2 bg-[#18181b] text-white rounded-md text-xs font-bold shadow-sm hover:bg-black transition-all">
                  <Plus size={14} className="mr-2" />
                  Create Event
                </Link>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="h-full min-h-72 flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm text-slate-500 font-medium">No events found under "{selectedCategoryFilter}".</p>
                <button onClick={() => setSelectedCategoryFilter('ALL')} className="mt-3 text-xs text-[#18181b] font-bold hover:underline">
                  Show All Events
                </button>
              </div>
            ) : (
              filteredEvents.map((event, eventIndex) => {
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <button
                    key={`event-nav-${event.id || eventIndex}-${eventIndex}`}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full text-left rounded-md border px-3 py-3 transition-all ${
                      isSelected
                        ? 'bg-[#18181b] text-white border-[#18181b] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-[#EFECE5] hover:text-slate-950'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-xs font-bold truncate">{event.title || 'Untitled event'}</span>
                        <span className={`mt-1 block text-[11px] leading-relaxed ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                          {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-black ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                        {event.media?.length || 0}
                      </span>
                    </span>
                    <span className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${isSelected ? 'bg-white/10 text-white/80' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      <Tag size={11} />
                      {event.category || 'General'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="bg-white rounded-md border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar min-h-0">
          {!selectedEvent ? (
            <div className="h-full min-h-96 flex flex-col items-center justify-center text-center p-8">
              <CalendarDays size={42} className="text-slate-300 mb-4" />
              <h3 className="text-base font-bold text-slate-900">Select an event</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">Choose an event from the left panel to manage photos, videos, and event actions.</p>
            </div>
          ) : (
            <div className="min-h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900">{selectedEvent.title || 'Untitled event'}</h2>
                    <span className="px-2.5 py-1 bg-[#18181b]/5 text-[#18181b] border border-[#18181b]/20 rounded-md text-[11px] font-bold flex items-center gap-1.5">
                      <Tag size={12} />
                      {selectedEvent.category || 'General'}
                    </span>
                    <span className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-md text-[11px] font-bold uppercase tracking-wider">
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {selectedEvent.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{selectedEvent.description}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleImageUpload(e, selectedEvent.id)}
                      disabled={isAddingMedia}
                    />
                    <button className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-all pointer-events-none shadow-xs">
                      <ImageIcon size={14} className="mr-2 text-[#dac48b]" />
                      Upload Photo
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setActiveEventId(selectedEvent.id);
                      setIsYoutubeModalOpen(true);
                    }}
                    disabled={isAddingMedia}
                    className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-all shadow-xs"
                  >
                    <Video size={14} className="mr-2 text-red-500" />
                    Add Video
                  </button>
                  <Link
                    href={`/subadmin/events/edit/${selectedEvent.id}`}
                    className="p-2 text-slate-600 hover:text-[#1b4a50] hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-md transition-colors"
                    title="Edit Event Page"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Media Gallery</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{selectedEvent.media?.length || 0} items</span>
                </div>
                {!selectedEvent.media || selectedEvent.media.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <ImageIcon size={34} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No media uploaded yet for this event.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {selectedEvent.media.map((item, mediaIndex) => (
                      <div key={`media-${item.id || mediaIndex}-${mediaIndex}`} className="relative group aspect-video bg-slate-100 rounded-md overflow-hidden border border-slate-200 shadow-xs">
                        {item.mediaType === 'IMAGE' ? (
                          <Image src={item.url} alt="Event photo" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full relative">
                            <Image
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(item.url)}/maxresdefault.jpg`}
                              alt="Video thumbnail"
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = `https://img.youtube.com/vi/${getYoutubeVideoId(item.url)}/hqdefault.jpg`;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <PlayCircle size={32} className="text-white drop-shadow-md" />
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteMedia(selectedEvent.id, item.id)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform scale-90 group-hover:scale-100 shadow-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add YouTube Modal */}
      {isYoutubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsYoutubeModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-lg font-bold text-slate-900">Add YouTube Video</h3>
              <button onClick={() => setIsYoutubeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddYoutube} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">YouTube Video URL</label>
                <input
                  required
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAddingMedia}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isAddingMedia ? <Loader2 size={16} className="animate-spin" /> : 'Add Video Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    {dialog}
    </>
  );
}
