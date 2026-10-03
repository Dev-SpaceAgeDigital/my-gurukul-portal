'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Info, 
  Loader2, 
  Trophy,
  Image as ImageIcon,
  Video,
  Star,
  FileText,
  Upload,
  X,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import AlumniMediaGallery from './AlumniMediaGallery';
import { UPLOAD_LIMITS, validateUploadFiles } from '@/lib/fileValidation';

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string | null;
  category: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'PDF' | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AlumniAchievementHubProps {
  hideHeader?: boolean;
  autoOpenForm?: boolean;
}

const ACHIEVEMENT_CATEGORIES = [
  'Professional Milestone',
  'Academic Excellence',
  'Research & Publication',
  'Award / Honor / Recognition',
  'Startup & Entrepreneurship',
  'Social Impact & CSR',
  'Sports & Arts',
  'Other',
];

const AlumniAchievementHub: React.FC<AlumniAchievementHubProps> = ({ hideHeader, autoOpenForm }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: 'Professional Milestone',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'PDF',
    videoMode: 'URL' as 'FILE' | 'URL',
    mediaUrl: '',
    imageFiles: [] as File[],
    videoFile: null as File | null,
    pdfFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/alumni/achievements');
      const data = await response.json();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const combined = [...formData.imageFiles, ...selected].slice(0, 2);
    const val = validateUploadFiles(combined, 'IMAGE');
    if (!val.isValid) {
      setValidationError(val.error || 'Invalid image selection');
      return;
    }

    setFormData((prev) => ({ ...prev, imageFiles: combined }));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const val = validateUploadFiles([file], 'VIDEO');
    if (!val.isValid) {
      setValidationError(val.error || 'Invalid video selection');
      return;
    }

    setFormData((prev) => ({ ...prev, videoFile: file }));
    e.target.value = '';
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const val = validateUploadFiles([file], 'PDF');
    if (!val.isValid) {
      setValidationError(val.error || 'Invalid PDF file');
      return;
    }

    setFormData((prev) => ({ ...prev, pdfFile: file }));
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation before sending
    if (formData.mediaType === 'IMAGE' && formData.imageFiles.length > 0) {
      const val = validateUploadFiles(formData.imageFiles, 'IMAGE');
      if (!val.isValid) {
        setValidationError(val.error || 'Invalid image selection');
        return;
      }
    } else if (formData.mediaType === 'VIDEO') {
      if (formData.videoMode === 'FILE' && formData.videoFile) {
        const val = validateUploadFiles([formData.videoFile], 'VIDEO');
        if (!val.isValid) {
          setValidationError(val.error || 'Invalid video file');
          return;
        }
      }
    } else if (formData.mediaType === 'PDF' && formData.pdfFile) {
      const val = validateUploadFiles([formData.pdfFile], 'PDF');
      if (!val.isValid) {
        setValidationError(val.error || 'Invalid PDF file');
        return;
      }
    }

    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('date', formData.date);
      form.append('category', formData.category);
      form.append('mediaType', formData.mediaType);

      if (formData.mediaType === 'IMAGE') {
        formData.imageFiles.forEach((file) => {
          form.append('files', file);
        });
      } else if (formData.mediaType === 'VIDEO') {
        if (formData.videoMode === 'FILE' && formData.videoFile) {
          form.append('file', formData.videoFile);
        } else {
          form.append('mediaUrl', formData.mediaUrl);
        }
      } else if (formData.mediaType === 'PDF' && formData.pdfFile) {
        form.append('file', formData.pdfFile);
      }

      const response = await fetch('/api/alumni/achievements', {
        method: 'POST',
        body: form,
      });

      const resJson = await response.json();

      if (!response.ok) {
        setValidationError(resJson.error || 'Failed to submit achievement');
        return;
      }

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        category: 'Professional Milestone',
        mediaType: 'IMAGE',
        videoMode: 'URL',
        mediaUrl: '',
        imageFiles: [],
        videoFile: null,
        pdfFile: null,
      });
      fetchAchievements();
    } catch (error) {
      console.error('Error reporting achievement:', error);
      setValidationError('Network error while submitting achievement.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1.5 bg-emerald-50/80 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm">Verified</span>;
      case 'REJECTED':
        return <span className="px-3 py-1.5 bg-rose-50/80 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-100 shadow-sm">Invalid</span>;
      default:
        return <span className="px-3 py-1.5 bg-amber-50/80 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100 shadow-sm">In Review</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {selectedAchievement ? (
        <div className="animate-in slide-in-from-right duration-500 space-y-6">
          <button 
            onClick={() => setSelectedAchievement(null)}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider hover:translate-x-[-4px] transition-transform"
          >
            ← Back to Achievement Hub
          </button>

          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-900/5 border border-white/60 overflow-hidden">
            <div className="p-8 md:p-10 border-b border-white/50 bg-white/20">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Trophy size={28} />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedAchievement.title}</h3>
                        </div>
                        <div className="pl-[4.5rem]">
                          {getStatusBadge(selectedAchievement.status)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        <AlumniMediaGallery
                          mediaUrl={selectedAchievement.mediaUrl}
                          mediaType={selectedAchievement.mediaType}
                          title={selectedAchievement.title}
                        />
                        
                        <div className="space-y-4 bg-white/50 p-8 rounded-3xl border border-white shadow-sm">
                            <div className="flex items-center text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                                <FileText size={16} className="mr-2" /> Achievement Particulars
                            </div>
                            <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {selectedAchievement.description}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] border border-slate-700 shadow-xl space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full"></div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3">Highlights</h4>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Calendar size={14} className="mr-2" /> Ceremony / Date
                                    </div>
                                    <p className="text-sm font-bold text-white">
                                        {selectedAchievement.date ? new Date(selectedAchievement.date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Star size={14} className="mr-2" /> Sector / Category
                                    </div>
                                    <p className="text-sm font-bold text-white uppercase">
                                        {selectedAchievement.category || 'General'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                     <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        <Clock size={14} className="mr-2" /> Documented On
                                    </div>
                                    <p className="text-xs font-bold text-slate-300">
                                        {new Date(selectedAchievement.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Header Action Row when list is non-empty */}
          {!showForm && achievements.length > 0 && (
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/60 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Your Achievements</h3>
                <p className="text-xs text-slate-500 font-medium">Manage and document your milestones</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Add New Achievement</span>
              </button>
            </div>
          )}

          {showForm && (
            <div className="bg-white/40 backdrop-blur-md p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="mb-5 sm:mb-8 border-b border-white/50 pb-4 sm:pb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Achievement Log</h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">Help us celebrate your growth and milestones</p>
              </div>

              {validationError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Achievement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Promoted to Senior Architect / Gold Medalist / Secured Series A"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Context & Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us more about this milestone, the journey, and what made it special..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Recognition Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Sector / Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      {ACHIEVEMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Proof Attachment Type Selector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">
                      Proof Attachment Type
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {formData.mediaType === 'IMAGE' && UPLOAD_LIMITS.IMAGE.label}
                      {formData.mediaType === 'VIDEO' && UPLOAD_LIMITS.VIDEO.label}
                      {formData.mediaType === 'PDF' && UPLOAD_LIMITS.PDF.label}
                    </span>
                  </div>

                  {/* Attachment Type Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'IMAGE' })}
                      className={`flex items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'IMAGE' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <ImageIcon size={15} className="mr-1.5" />
                      <span>Photos (Max 2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'VIDEO' })}
                      className={`flex items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'VIDEO' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Video size={15} className="mr-1.5" />
                      <span>Video (1 Max)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'PDF' })}
                      className={`flex items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'PDF' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <FileText size={15} className="mr-1.5" />
                      <span>PDF Document</span>
                    </button>
                  </div>

                  {/* 1. Image Upload Section (Max 2) */}
                  {formData.mediaType === 'IMAGE' && (
                    <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-slate-200/80">
                      {formData.imageFiles.length < 2 && (
                        <div>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50/80 p-5 rounded-2xl cursor-pointer transition-colors text-center">
                            <Upload size={22} className="text-blue-600 mb-1.5" />
                            <span className="text-xs font-bold text-slate-800">
                              Upload Photos / Certificates (JPG, PNG, WEBP)
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              Select up to 2 images • Max 5MB each • {formData.imageFiles.length}/2 selected
                            </span>
                            <input
                              type="file"
                              accept={UPLOAD_LIMITS.IMAGE.acceptString}
                              multiple
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Image Preview List */}
                      {formData.imageFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {formData.imageFiles.map((file, idx) => (
                            <div key={idx} className="relative group bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm flex items-center justify-center">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                                <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                  title="Remove image"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Video Upload Section (Max 1) */}
                  {formData.mediaType === 'VIDEO' && (
                    <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoMode: 'URL', videoFile: null })}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${formData.videoMode === 'URL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          YouTube / Vimeo Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoMode: 'FILE', mediaUrl: '' })}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${formData.videoMode === 'FILE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          Upload Video File (MP4/WEBM Max 30MB)
                        </button>
                      </div>

                      {formData.videoMode === 'URL' ? (
                        <div className="space-y-1">
                          <input
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.mediaUrl}
                            onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      ) : (
                        <div>
                          {formData.videoFile ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                              <div className="flex items-center gap-2.5">
                                <Video size={18} className="text-blue-600" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{formData.videoFile.name}</p>
                                  <p className="text-[10px] text-slate-500">{(formData.videoFile.size / (1024 * 1024)).toFixed(1)} MB / 30MB Max</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, videoFile: null })}
                                className="p-1.5 text-slate-400 hover:text-red-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50/80 p-5 rounded-2xl cursor-pointer transition-colors text-center">
                              <Upload size={22} className="text-blue-600 mb-1.5" />
                              <span className="text-xs font-bold text-slate-800">Choose Video File</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">MP4, WEBM, MOV • Max 30MB (1 video allowed)</span>
                              <input
                                type="file"
                                accept={UPLOAD_LIMITS.VIDEO.acceptString}
                                onChange={handleVideoSelect}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. PDF Document Section (Max 1) */}
                  {formData.mediaType === 'PDF' && (
                    <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-slate-200/80">
                      {formData.pdfFile ? (
                        <div className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl border border-red-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{formData.pdfFile.name}</p>
                              <p className="text-[10px] text-slate-500">{(formData.pdfFile.size / (1024 * 1024)).toFixed(1)} MB / 10MB Max</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pdfFile: null })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-red-200 hover:border-red-400 bg-red-50/40 hover:bg-red-50/70 p-5 rounded-2xl cursor-pointer transition-colors text-center">
                          <Upload size={22} className="text-red-600 mb-1.5" />
                          <span className="text-xs font-bold text-slate-800">Upload Certificate / PDF Proof</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">PDF Document • Max 10MB (1 file allowed)</span>
                          <input
                            type="file"
                            accept={UPLOAD_LIMITS.PDF.acceptString}
                            onChange={handlePdfSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4 border-t border-white/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setValidationError(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-slate-500 rounded-xl sm:rounded-2xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs shadow-md shadow-blue-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trophy size={16} className="mr-2" />}
                    Submit Achievement
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center space-y-4 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Loading success stories...</p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-8">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                  <Trophy size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Achievements Added Yet</h3>
                <p className="text-slate-500 text-xs font-medium mt-1.5 max-w-sm mx-auto">Document your milestones, awards & honors to inspire the community.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] mt-5"
                >
                  <Plus size={16} />
                  <span>Add Now</span>
                </button>
              </div>
            ) : achievements.map(achievement => (
              <div key={achievement.id} className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                        <Trophy size={18} className="sm:w-[20px] sm:h-[20px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate">{achievement.title}</h4>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                          Success Record
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(achievement.status)}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed line-clamp-3">{achievement.description}</p>

                    <div className="pt-3 sm:pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Star size={12} className="mr-1.5" />
                        {achievement.category || 'Legacy'}
                      </div>
                      <button 
                        onClick={() => setSelectedAchievement(achievement)}
                        className="flex items-center text-[10px] font-bold text-blue-600 hover:text-indigo-700 uppercase tracking-widest group/btn"
                      >
                        Details 
                        <span className="w-5 h-5 ml-2 rounded-full bg-blue-50 flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                           <ChevronRight size={12} />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AlumniAchievementHub;
