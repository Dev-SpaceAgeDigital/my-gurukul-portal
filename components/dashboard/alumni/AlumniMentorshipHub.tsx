'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Calendar,
  Info,
  Loader2,
  ChevronRight,
  UserCheck,
  Tags,
  Handshake,
  Send
} from 'lucide-react';
import RegisterOpportunityModal from './RegisterOpportunityModal';

const PROFESSIONAL_CATEGORIES = [
  "Engineering & Tech",
  "Business & Finance",
  "Healthcare & Medicine",
  "Arts & Design",
  "Law & Public Policy",
  "Education & Academics",
  "Sales & Marketing",
  "General / Other"
];

interface MentorshipPost {
  id: string;
  title: string;
  description: string;
  targetStudent: string | null;
  availability: string | null;
  category: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AlumniMentorshipHubProps {
  autoOpenForm?: boolean;
}

export default function AlumniMentorshipHub({ autoOpenForm }: AlumniMentorshipHubProps) {
  const [posts, setPosts] = useState<MentorshipPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetStudent: '',
    availability: '',
    category: 'Engineering & Tech'
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPost, setSelectedPost] = useState<MentorshipPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerModalPost, setRegisterModalPost] = useState<{
    id: string;
    title: string;
    postType: 'CAREER' | 'MENTORSHIP';
    authorName?: string;
    subtitle?: string;
  } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/alumni/mentorship');
      const data = await res.json();
      if (res.ok) setPosts(data);
    } catch (err) {
      console.error('Failed to fetch mentorship posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/alumni/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ title: '', description: '', targetStudent: '', availability: '', category: 'Engineering & Tech' });
        fetchPosts();
      }
    } catch (err) {
      console.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/60 uppercase tracking-wider shadow-sm"><CheckCircle2 size={12} className="mr-1.5" /> Approved</span>;
      case 'REJECTED':
        return <span className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100/60 uppercase tracking-wider shadow-sm"><XCircle size={12} className="mr-1.5" /> Rejected</span>;
      default:
        return <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100/60 uppercase tracking-wider shadow-sm"><Clock size={12} className="mr-1.5" /> Pending review</span>;
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">

      {/* Detail View Section */}
      {selectedPost ? (
        <div className="animate-in slide-in-from-right duration-300 space-y-4">
          <button 
            onClick={() => setSelectedPost(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/80 bg-white/80 text-xs font-bold text-indigo-700 shadow-xs hover:bg-white hover:text-indigo-900 transition-all cursor-pointer active:scale-95"
          >
            <span>← Back to Mentorship Hub</span>
          </button>

          <div className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-900/5 border border-white/80 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="p-4 sm:p-6 md:p-8 border-b border-white/50 bg-white/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
              <div className="flex items-center space-x-3.5 sm:space-x-5 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-xs border border-indigo-100/70 shrink-0">
                  <UserCheck size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug truncate">{selectedPost.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mentorship Offer
                    </span>
                    {selectedPost.category && (
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/80 text-indigo-600 font-bold rounded-md text-[10px]">
                        {selectedPost.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="self-start sm:self-auto shrink-0">
                {getStatusBadge(selectedPost.status)}
              </div>
            </div>
            
            <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 relative z-10">
              {/* Description Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                  <div className="flex items-center text-[10px] sm:text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    <Info size={14} className="mr-1.5 shrink-0" />
                    <span>Mentorship Objective & Description</span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed bg-white/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/90 shadow-xs">
                    {selectedPost.description}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Program Parameters */}
                  <div className="bg-white/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/90 shadow-xs space-y-4">
                    <h4 className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2">Session Parameters</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <Users size={12} className="mr-1.5" /> Target Mentees
                        </div>
                        <p className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                          {selectedPost.targetStudent || 'Open to all students'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <Calendar size={12} className="mr-1.5" /> Availability
                        </div>
                        <p className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                          {selectedPost.availability || 'Flexible Scheduling'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Card */}
                  <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white space-y-3 shadow-md">
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock size={12} className="mr-1.5" /> System Metadata
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Offering ID</span>
                        <span className="text-[11px] font-mono text-indigo-400">{selectedPost.id.substring(0, 13)}...</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Created On</span>
                        <span className="text-[11px] font-mono text-slate-300">{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-white/50 bg-white/40 flex justify-center relative z-10">
              <button
                onClick={() => setSelectedPost(null)}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Return to Mentorship Listing
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Action Row when list is non-empty */}
          {!showForm && posts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-sm">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">Your Mentorship Offers</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Manage and offer student guidance sessions</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl sm:rounded-2xl shadow-md flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Add New Mentorship</span>
              </button>
            </div>
          )}

          {/* Filter Chips - Horizontal Scrollable Row on Mobile */}
          {!showForm && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm border ${selectedCategory === 'All' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent' : 'bg-white/60 text-slate-600 border-white hover:bg-white'}`}
              >
                All Mentorships
              </button>
              {PROFESSIONAL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm border ${selectedCategory === cat ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent' : 'bg-white/60 text-slate-600 border-white hover:bg-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {showForm && (
            <div className="bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-300 relative">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="p-4 sm:p-6 md:p-10 border-b border-white/40 bg-white/30">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Program Design</h3>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Define your mentorship goals and availability</p>
              </div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-10 space-y-4 sm:space-y-8 relative z-10">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Mentorship Title / Expertise Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Career Guidance for Engineers"
                    value={formData.title ?? ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Profession Category</label>
                  <select 
                    value={formData.category ?? 'Engineering & Tech'}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                  >
                     {PROFESSIONAL_CATEGORIES.map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                  </select>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="What will you teach? What can students expect..."
                    value={formData.description ?? ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-8">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Target Mentees / Eligibility</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard 10 Students with math interest..."
                      value={formData.targetStudent ?? ''}
                      onChange={e => setFormData({ ...formData, targetStudent: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Visit / Session Availability</label>
                    <input
                      type="text"
                      placeholder="e.g. Weekends, Monthly visits..."
                      value={formData.availability ?? ''}
                      onChange={e => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-100/50">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 bg-white/60 text-slate-600 border border-slate-200/60 rounded-xl sm:rounded-2xl font-bold text-xs hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 sm:px-10 sm:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCheck size={16} className="mr-2" />}
                    Submit Offer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loading ? (
              <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Accessing Mentorship Hub...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-8">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
                  <Handshake size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Mentorship Offers Added Yet</h3>
                <p className="text-slate-500 text-xs font-medium mt-1.5 max-w-sm mx-auto">Become a beacon of guidance for Madni students and junior alumni.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] mt-5"
                >
                  <Plus size={16} />
                  <span>Add Now</span>
                </button>
              </div>
            ) : posts.filter(post => selectedCategory === 'All' || post.category === selectedCategory).length === 0 ? (
              <div className="lg:col-span-2 py-32 text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
                <div className="w-24 h-24 bg-white border border-slate-100 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <Tags size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No offers in this category</h3>
                <p className="text-slate-500 text-sm font-medium mt-2">Try selecting a different filter.</p>
              </div>
            ) : posts.filter(post => selectedCategory === 'All' || post.category === selectedCategory).map(post => (
              <div key={post.id} className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-white/80 shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all duration-300 overflow-hidden group relative">
                 <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none transition-all group-hover:bg-indigo-500/10"></div>
                 
                <div className="p-4 sm:p-6 md:p-8 relative z-10 space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-xs border border-indigo-100/70 shrink-0">
                        <UserCheck size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors tracking-tight truncate">{post.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Mentorship Program
                        </p>
                        {post.category && (
                          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/90 border border-slate-200/80 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider shadow-xs">
                             {post.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="self-start sm:self-auto shrink-0">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3">{post.description}</p>

                  <div className="grid grid-cols-2 gap-3 bg-white/80 p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Group</div>
                      <p className="text-xs font-bold text-slate-800 truncate">{post.targetStudent || 'General'}</p>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Availability</div>
                      <p className="text-xs font-bold text-slate-800 truncate">{post.availability || 'TBD'}</p>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar size={13} className="mr-1.5 shrink-0 text-slate-400" />
                      <span>Offered on {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <button 
                        type="button"
                        onClick={() => setRegisterModalPost({
                          id: post.id,
                          title: post.title,
                          postType: 'MENTORSHIP',
                          subtitle: post.category || 'Mentorship Program',
                        })}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 h-8 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all text-[10px] font-bold uppercase tracking-wider shadow-xs cursor-pointer active:scale-95"
                      >
                        <Send size={11} />
                        <span>Register</span>
                      </button>
                      <button 
                        onClick={() => setSelectedPost(post)}
                        className="flex-1 sm:flex-initial flex items-center justify-center h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95"
                      >
                        Manage <ChevronRight size={13} className="ml-0.5" />
                      </button>
                      <Link
                        href={`/alumni/registrations?postType=MENTORSHIP&postId=${post.id}`}
                        className="flex-1 sm:flex-initial flex items-center justify-center h-8 px-3 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 transition-all text-[10px] font-bold uppercase tracking-wider shadow-xs active:scale-95"
                      >
                        Registrations
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>

      {registerModalPost && (
        <RegisterOpportunityModal
          isOpen={Boolean(registerModalPost)}
          onClose={() => setRegisterModalPost(null)}
          post={registerModalPost}
        />
      )}
    </>
  );
}
