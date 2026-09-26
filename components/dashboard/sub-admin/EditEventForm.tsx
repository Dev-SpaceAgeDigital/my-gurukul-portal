'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Save,
  Pencil
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

const DEFAULT_CATEGORIES = [
  'Annual Day',
  'Cultural',
  'School Life',
  'Campaign',
  'Sports',
  'Academics',
  'Excursion'
];

interface EditEventFormProps {
  eventId: string;
}

export default function EditEventForm({ eventId }: EditEventFormProps) {
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Annual Day');
  const [customCategory, setCustomCategory] = useState('');
  const [existingCategories, setExistingCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [eventMediaList, setEventMediaList] = useState<any[]>([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch('/api/subadmin/events');
      if (res.ok) {
        const events = await res.json();
        const catsFromEvents = events
          .map((e: any) => e.category)
          .filter(Boolean) as string[];
        const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...catsFromEvents]));
        setExistingCategories(combined);

        const currentEvent = events.find((e: any) => e.id === eventId);
        if (currentEvent) {
          setTitle(currentEvent.title || '');
          setTagline(currentEvent.tagline || '');
          setDescription(currentEvent.description || '');
          
          let parsedPoints: string[] = [];
          if (Array.isArray(currentEvent.points)) {
            parsedPoints = currentEvent.points;
          } else if (typeof currentEvent.points === 'string') {
            try { parsedPoints = JSON.parse(currentEvent.points); } catch {}
          }
          setPoints(parsedPoints);
          setFeaturedImage(currentEvent.featuredImage || '');
          setEventMediaList(currentEvent.media || []);

          const formattedDate = currentEvent.date
            ? new Date(currentEvent.date).toISOString().split('T')[0]
            : '';
          setDate(formattedDate);

          const cat = currentEvent.category || 'Annual Day';
          if (combined.includes(cat)) {
            setCategory(cat);
            setCustomCategory('');
          } else {
            setCategory('NEW');
            setCustomCategory(cat);
          }
        } else {
          showAlert({ title: 'Event not found', message: 'The selected event could not be found.', variant: 'danger' });
        }
      } else {
        showAlert({ title: 'Load failed', message: 'Failed to load event data.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Load failed', message: 'Error loading event data.', variant: 'danger' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    setPoints([...points, newPoint.trim()]);
    setNewPoint('');
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const finalCategory = category === 'NEW' 
      ? customCategory.trim() || 'General'
      : category;

    try {
      const res = await fetch('/api/subadmin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          title,
          tagline,
          description,
          points,
          featuredImage,
          date,
          category: finalCategory
        })
      });

      if (res.ok) {
        await showAlert({ title: 'Event updated', message: 'Event details have been synchronized successfully.', variant: 'success' });
        router.push('/subadmin/school-hub?tab=events');
      } else {
        const data = await res.json();
        showAlert({ title: 'Update failed', message: data.error || 'Failed to update event.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Update failed', message: 'Something went wrong while updating event.', variant: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="w-full flex items-center justify-center p-16">
        <Loader2 className="animate-spin text-[#18181b]" size={36} />
      </div>
    );
  }

  return (
    <>
    <div className="w-full mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="mb-6">
        <Link
          href="/subadmin/school-hub?tab=events"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#18181b] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Events
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Event</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Update event title, tagline, highlights, category, date, and featured cover image</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-[#18181b]">
            <Pencil size={22} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Event Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Cultural Day 2026"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
          </div>

          {/* Event Tagline */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Tagline (Optional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. A Night to Remember"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            >
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="NEW">+ Add New Category...</option>
            </select>

            {/* Custom Category Input */}
            {category === 'NEW' && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block text-[11px] font-bold text-[#18181b] uppercase tracking-wider mb-1">
                  New Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name..."
                  className="w-full px-4 py-3 bg-slate-50 border border-[#18181b] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 transition-all shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Date Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Event Date <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the event, scheduled activities, or highlights..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm resize-none"
            />
          </div>

          {/* Points / Highlights List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Key Event Points / Highlights (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPoint(); } }}
                placeholder="e.g. 500+ Attendees Each Year"
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={handleAddPoint}
                className="px-4 py-3 bg-[#18181b] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                + Add Point
              </button>
            </div>
            {points.length > 0 && (
              <div className="space-y-2 pt-2">
                {points.map((pt, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#18181b]" />
                      {pt}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(i)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured Image Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Featured Cover Image URL (Optional)
            </label>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Enter featured image URL or click an event image below..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] transition-all shadow-sm"
            />

            {/* Clickable Event Media Selection */}
            {eventMediaList.filter(m => m.mediaType === 'IMAGE').length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500 mb-2">Click an uploaded event image to set as featured cover:</p>
                <div className="flex flex-wrap gap-3">
                  {eventMediaList.filter(m => m.mediaType === 'IMAGE').map((m) => {
                    const isSelected = featuredImage === m.url;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setFeaturedImage(m.url)}
                        className={`relative w-24 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected ? 'border-[#18181b] ring-2 ring-[#18181b]/20 scale-105' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img src={m.url} alt="Event image" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                            ✓ Featured
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {featuredImage && (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-slate-500 mb-1">Selected Cover Preview:</p>
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                  <img src={featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
            <Link
              href="/subadmin/school-hub?tab=events"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-6 py-2.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    {dialog}
    </>
  );
}
