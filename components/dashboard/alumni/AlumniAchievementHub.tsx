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
  FileText
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string | null;
  category: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AlumniAchievementHubProps {
  hideHeader?: boolean;
  autoOpenForm?: boolean;
}

const AlumniAchievementHub: React.FC<AlumniAchievementHubProps> = ({ hideHeader, autoOpenForm }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    mediaUrl: '',
    file: null as File | null
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('date', formData.date);
      form.append('category', formData.category);
      form.append('mediaType', formData.mediaType);
      
      if (formData.mediaType === 'IMAGE' && formData.file) {
        form.append('file', formData.file);
      } else if (formData.mediaType === 'VIDEO') {
        form.append('mediaUrl', formData.mediaUrl);
      }

      const response = await fetch('/api/alumni/achievements', {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ title: '', description: '', date: '', category: '', mediaType: 'IMAGE', mediaUrl: '', file: null });
        fetchAchievements();
      }
    } catch (error) {
      console.error('Error reporting achievement:', error);
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

  const renderMedia = (achievement: Achievement) => {
    if (!achievement.mediaUrl) return null;

    if (achievement.mediaType === 'IMAGE') {
        return (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white shadow-md">
                <img src={achievement.mediaUrl} alt={achievement.title} className="object-cover w-full h-full" />
            </div>
        );
    } else if (achievement.mediaType === 'VIDEO') {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = achievement.mediaUrl.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            return (
                <div className="aspect-video rounded-2xl overflow-hidden border border-white shadow-md bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            );
        }
    }
    return null;
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
                        {renderMedia(selectedAchievement)}
                        
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
                                        <Calendar size={14} className="mr-2" /> Ceremony Date
                                    </div>
                                    <p className="text-sm font-bold text-white">
                                        {selectedAchievement.date ? new Date(selectedAchievement.date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Star size={14} className="mr-2" /> Recognition Area
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
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">Help us celebrate your growth</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Achievement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Promoted to Senior Architect / Gold Medalist"
                    value={formData.title ?? ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Context & Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us more about this milestone..."
                    value={formData.description ?? ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 resize-none animate-transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Recognition Date</label>
                    <input
                      type="date"
                      value={formData.date ?? ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Sector / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Professional, Academic Excellence"
                      value={formData.category ?? ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Proof Attachment Type</label>
                    <div className="flex space-x-2 sm:space-x-4 bg-white/50 p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mediaType: 'IMAGE' })}
                            className={`flex-1 flex items-center justify-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'IMAGE' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ImageIcon size={15} className="mr-1.5 sm:mr-2" /> Image / Certificate Proof
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mediaType: 'VIDEO' })}
                            className={`flex-1 flex items-center justify-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'VIDEO' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Video size={15} className="mr-1.5 sm:mr-2" /> Video Link / YouTube
                        </button>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">
                        {formData.mediaType === 'IMAGE' ? 'Select Proof File (Photo/Certificate)' : 'Video Reference URL'}
                    </label>
                    {formData.mediaType === 'IMAGE' ? (
                        <div>
                          <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                              className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 animate-transition"
                          />
                          {formData.file && (
                            <div className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl inline-block">
                              ✓ Selected: {formData.file.name}
                            </div>
                          )}
                        </div>
                    ) : (
                        <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={formData.mediaUrl ?? ''}
                            onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                            className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                        />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4 border-t border-white/50">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-slate-500 rounded-xl sm:rounded-2xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs shadow-md shadow-blue-500/10 active:scale-95 transition-all disabled:opacity-50"
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
