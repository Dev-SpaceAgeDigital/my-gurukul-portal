'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Info, 
  Loader2, 
  BookOpen,
  Image as ImageIcon,
  Video,
  Tags,
  FileText
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AlumniBlogHubProps {
  autoOpenForm?: boolean;
}

type BlogFormData = {
  title: string;
  content: string;
  tags: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  file: File | null;
};

const emptyBlogFormData: BlogFormData = {
  title: '',
  content: '',
  tags: '',
  mediaType: 'IMAGE',
  mediaUrl: '',
  file: null,
};

const AlumniBlogHub: React.FC<AlumniBlogHubProps> = ({ autoOpenForm }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(() => ({ ...emptyBlogFormData }));

  useEffect(() => {
    if (autoOpenForm) {
      setFormData({ ...emptyBlogFormData });
      setShowForm(true);
    }
  }, [autoOpenForm]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/alumni/blogs');
      const data = await response.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
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
      form.append('content', formData.content);
      form.append('tags', formData.tags);
      form.append('mediaType', formData.mediaType);
      
      if (formData.mediaType === 'IMAGE' && formData.file) {
        form.append('file', formData.file);
      } else if (formData.mediaType === 'VIDEO') {
        form.append('mediaUrl', formData.mediaUrl);
      }

      const response = await fetch('/api/alumni/blogs', {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ ...emptyBlogFormData });
        fetchBlogs();
      }
    } catch (error) {
      console.error('Error creating blog:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1.5 bg-emerald-50/80 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shadow-sm">Live</span>;
      case 'REJECTED':
        return <span className="px-3 py-1.5 bg-rose-50/80 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-100 shadow-sm">Hidden</span>;
      default:
        return <span className="px-3 py-1.5 bg-amber-50/80 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100 shadow-sm">Reviewing</span>;
    }
  };

  const renderMedia = (blog: Blog) => {
    if (!blog.mediaUrl) return null;

    if (blog.mediaType === 'IMAGE') {
        return (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white shadow-md">
                <img src={blog.mediaUrl} alt={blog.title} className="object-cover w-full h-full" />
            </div>
        );
    } else if (blog.mediaType === 'VIDEO') {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = blog.mediaUrl.match(regExp);
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
        } else {
            return (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-dotted border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400">
                    <Video size={16} className="mr-2" /> Invalid YouTube Link: {blog.mediaUrl}
                </div>
            )
        }
    }
    return null;
  };

  const openBlogForm = () => {
    setFormData({ ...emptyBlogFormData });
    setShowForm(true);
  };

  const closeBlogForm = () => {
    setShowForm(false);
    setFormData({ ...emptyBlogFormData });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {selectedBlog ? (
        <div className="animate-in slide-in-from-right duration-500 space-y-6">
          <button 
            onClick={() => setSelectedBlog(null)}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider hover:translate-x-[-4px] transition-transform"
          >
            ← Back to Blog Hub
          </button>

          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-900/5 border border-white/60 overflow-hidden">
            <div className="p-8 md:p-10 border-b border-white/50 bg-white/20">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedBlog.title}</h3>
                        </div>
                        <div className="pl-[4.5rem]">
                            {getStatusBadge(selectedBlog.status)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {renderMedia(selectedBlog)}
                        
                        <div className="space-y-4 bg-white/50 p-8 rounded-3xl border border-white shadow-sm">
                            <div className="flex items-center text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                                <FileText size={16} className="mr-2" /> Article Content
                            </div>
                            <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {selectedBlog.content}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] border border-slate-700 shadow-xl space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full"></div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3">Metadata</h4>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Calendar size={14} className="mr-2" /> Published
                                    </div>
                                    <p className="text-sm font-bold text-white">
                                        {new Date(selectedBlog.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Tags size={14} className="mr-2" /> Tags
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedBlog.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] font-bold px-3 py-1.5 bg-white/10 text-white rounded-full uppercase">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
          {!showForm && blogs.length > 0 && (
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/60 shadow-sm mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Your Stories & Blogs</h3>
                <p className="text-xs text-slate-500 font-medium">Manage and compose your published articles</p>
              </div>
              <button
                onClick={openBlogForm}
                className="bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Add New Story / Blog</span>
              </button>
            </div>
          )}

          {showForm && (
            <div className="bg-white/40 backdrop-blur-md p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="mb-5 sm:mb-8 border-b border-white/50 pb-4 sm:pb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Compose Article</h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">Inspire the community with your words</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter a compelling title..."
                    value={formData.title ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Content</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Write your article here..."
                    value={formData.content ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 resize-none animate-transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Life Advice, Career, Tech"
                      value={formData.tags ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Media Type</label>
                    <div className="flex space-x-2 sm:space-x-4 bg-white/50 p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, mediaType: 'IMAGE', mediaUrl: '' }))}
                            className={`flex-1 flex items-center justify-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'IMAGE' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ImageIcon size={15} className="mr-1.5 sm:mr-2" /> Image
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, mediaType: 'VIDEO', file: null }))}
                            className={`flex-1 flex items-center justify-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${formData.mediaType === 'VIDEO' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Video size={15} className="mr-1.5 sm:mr-2" /> YouTube
                        </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">
                    {formData.mediaType === 'IMAGE' ? 'Upload Illustration' : 'YouTube Link'}
                  </label>
                  {formData.mediaType === 'IMAGE' ? (
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 animate-transition"
                    />
                  ) : (
                    <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.mediaUrl ?? ''}
                        onChange={e => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4 border-t border-white/50">
                  <button
                    type="button"
                    onClick={closeBlogForm}
                    className="w-full sm:w-auto px-5 py-2.5 text-slate-500 rounded-xl sm:rounded-2xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <BookOpen size={16} className="mr-2" />}
                    Publish Article
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center space-y-4 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Loading articles...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
                  <BookOpen size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Stories Added Yet</h3>
                <p className="text-slate-500 text-xs font-medium mt-1.5 max-w-sm mx-auto">Share your experience, articles, or student memories to inspire the community.</p>
                <button
                  onClick={openBlogForm}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] mt-5"
                >
                  <Plus size={16} />
                  <span>Add Now</span>
                </button>
              </div>
            ) : blogs.map(blog => (
              <div key={blog.id} className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                        <BookOpen size={18} className="sm:w-[20px] sm:h-[20px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate">{blog.title}</h4>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                          Knowledge Pool
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(blog.status)}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed line-clamp-3">{blog.content}</p>

                    <div className="pt-3 sm:pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Calendar size={12} className="mr-1.5" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => setSelectedBlog(blog)}
                        className="flex items-center text-[10px] font-bold text-blue-600 hover:text-indigo-700 uppercase tracking-widest group/btn"
                      >
                        Manage 
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

export default AlumniBlogHub;
