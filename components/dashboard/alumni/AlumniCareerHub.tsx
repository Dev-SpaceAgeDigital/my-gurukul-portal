'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Plus, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Link as LinkIcon,
  Info,
  Loader2,
  ChevronRight,
  Tags,
  MapPin,
  DollarSign,
  Calendar,
  UserCheck,
  Handshake,
  ThumbsUp,
  Globe,
  Award,
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

interface CareerPost {
  id: string;
  type: 'JOB' | 'INTERNSHIP';
  companyName: string;
  companyLink: string | null;
  role: string;
  category: string | null;
  relation: string | null;
  description: string | null;
  location?: string | null;
  workMode?: 'ON_SITE' | 'REMOTE' | 'HYBRID' | null;
  salary?: string | null;
  duration?: string | null;
  experienceLevel?: string | null;
  applyLink?: string | null;
  deadline?: string | null;
  interestedCount?: number;
  referralCount?: number;
  userInterested?: boolean;
  userReferral?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AlumniCareerHubProps {
  autoOpenForm?: boolean;
  initialType?: 'JOB' | 'INTERNSHIP';
}

export default function AlumniCareerHub({ autoOpenForm, initialType = 'JOB' }: AlumniCareerHubProps) {
  const [posts, setPosts] = useState<CareerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(autoOpenForm));
  const [registerModalPost, setRegisterModalPost] = useState<{
    id: string;
    title: string;
    postType: 'CAREER' | 'MENTORSHIP';
    authorName?: string;
    subtitle?: string;
  } | null>(null);

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
    if (initialType) {
      setFormData((prev) => ({ ...prev, type: initialType }));
    }
  }, [autoOpenForm, initialType]);

  const [formData, setFormData] = useState({
    type: 'JOB',
    companyName: '',
    companyLink: '',
    role: '',
    category: 'Engineering & Tech',
    relation: '',
    description: '',
    location: '',
    workMode: 'ON_SITE',
    salary: '',
    duration: '',
    experienceLevel: 'Fresher / Student',
    applyLink: '',
    deadline: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/alumni/career');
      const data = await res.json();
      if (res.ok) setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch career posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/alumni/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          type: 'JOB',
          companyName: '',
          companyLink: '',
          role: '',
          category: 'Engineering & Tech',
          relation: '',
          description: '',
          location: '',
          workMode: 'ON_SITE',
          salary: '',
          duration: '',
          experienceLevel: 'Fresher / Student',
          applyLink: '',
          deadline: ''
        });
        fetchPosts();
      }
    } catch (err) {
      console.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleInterest = async (careerId: string, interestType: 'INTERESTED' | 'REFERRAL_CONTACT') => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === careerId) {
          if (interestType === 'INTERESTED') {
            const isCurr = p.userInterested;
            return {
              ...p,
              userInterested: !isCurr,
              interestedCount: Math.max(0, (p.interestedCount || 0) + (isCurr ? -1 : 1))
            };
          } else {
            const isCurr = p.userReferral;
            return {
              ...p,
              userReferral: !isCurr,
              referralCount: Math.max(0, (p.referralCount || 0) + (isCurr ? -1 : 1))
            };
          }
        }
        return p;
      }));

      const res = await fetch('/api/alumni/career/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careerId, interestType })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === careerId) {
            if (interestType === 'INTERESTED') {
              return { ...p, userInterested: data.active, interestedCount: data.count };
            } else {
              return { ...p, userReferral: data.active, referralCount: data.count };
            }
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      fetchPosts(); // sync on failure
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-100/60 uppercase tracking-wider shadow-sm shrink-0"><CheckCircle2 size={11} className="mr-1 sm:mr-1.5" /> Approved</span>;
      case 'REJECTED':
        return <span className="flex items-center text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-rose-100/60 uppercase tracking-wider shadow-sm shrink-0"><XCircle size={11} className="mr-1 sm:mr-1.5" /> Rejected</span>;
      default:
        return <span className="flex items-center text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-amber-100/60 uppercase tracking-wider shadow-sm shrink-0"><Clock size={11} className="mr-1 sm:mr-1.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Action Row when list is non-empty */}
      {!showForm && posts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-sm">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">Your Job & Internship Postings</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Manage and share hiring opportunities</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl sm:rounded-2xl shadow-md flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Add New Job / Internship</span>
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
            All Opportunities
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

      {/* Creation Form */}
      {showForm && (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-300 relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="p-4 sm:p-6 md:p-10 border-b border-white/40 bg-white/30">
             <h3 className="text-lg sm:text-xl font-bold text-slate-900">Post Job / Internship</h3>
             <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Fill in position, compensation, location & eligibility details</p>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-10 space-y-5 sm:space-y-8 relative z-10">
             
             {/* 1. Core Position Info */}
             <div className="space-y-3 sm:space-y-4">
                <h4 className="text-[11px] sm:text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-200/60 pb-1.5 sm:pb-2">1. Position & Company</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Opportunity Type *</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                      >
                         <option value="JOB">Full-Time Job</option>
                         <option value="INTERNSHIP">Internship</option>
                      </select>
                   </div>
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Designation / Role Title *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Senior Software Engineer"
                        value={formData.role ?? ''}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Company Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Company name..."
                        value={formData.companyName ?? ''}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>
                </div>
             </div>

             {/* 2. Workplace & Compensation */}
             <div className="space-y-3 sm:space-y-4">
                <h4 className="text-[11px] sm:text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-200/60 pb-1.5 sm:pb-2">2. Location, Compensation & Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Workplace Mode</label>
                      <select 
                        value={formData.workMode ?? 'ON_SITE'}
                        onChange={e => setFormData({...formData, workMode: e.target.value as any})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                      >
                         <option value="ON_SITE">🏢 On-Site (Office)</option>
                         <option value="REMOTE">🏠 Remote (Work from Home)</option>
                         <option value="HYBRID">🌐 Hybrid</option>
                      </select>
                   </div>

                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Job Location / City</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mumbai, Surat, Remote"
                        value={formData.location ?? ''}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>

                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Salary / Stipend Range</label>
                      <input 
                        type="text" 
                        placeholder={formData.type === 'INTERNSHIP' ? 'e.g. ₹15,000 / month' : 'e.g. ₹4.5 LPA - ₹6.5 LPA'}
                        value={formData.salary ?? ''}
                        onChange={e => setFormData({...formData, salary: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 pt-1 sm:pt-2">
                   {formData.type === 'INTERNSHIP' && (
                      <div className="space-y-1 sm:space-y-1.5">
                         <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Internship Duration</label>
                         <input 
                           type="text" 
                           placeholder="e.g. 3 Months, 6 Months"
                           value={formData.duration ?? ''}
                           onChange={e => setFormData({...formData, duration: e.target.value})}
                           className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                         />
                      </div>
                   )}

                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Experience Level Required</label>
                      <select 
                        value={formData.experienceLevel ?? 'Fresher / Student'}
                        onChange={e => setFormData({...formData, experienceLevel: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                      >
                         <option value="Fresher / Student">Fresher / Student (0 Years)</option>
                         <option value="Junior (1-3 Years)">Junior (1-3 Years)</option>
                         <option value="Mid-Senior (3-5 Years)">Mid-Senior (3-5 Years)</option>
                         <option value="Senior (5+ Years)">Senior (5+ Years)</option>
                      </select>
                   </div>

                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Application Deadline</label>
                      <input 
                        type="date" 
                        value={formData.deadline ?? ''}
                        onChange={e => setFormData({...formData, deadline: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 transition-all"
                      />
                   </div>
                </div>
             </div>

             {/* 3. Links & Application Route */}
             <div className="space-y-3 sm:space-y-4">
                <h4 className="text-[11px] sm:text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-slate-200/60 pb-1.5 sm:pb-2">3. Direct Apply Links & Referral Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Direct Apply Link or HR Email</label>
                      <input 
                        type="text" 
                        placeholder="e.g. https://company.com/careers OR hr@company.com"
                        value={formData.applyLink ?? ''}
                        onChange={e => setFormData({...formData, applyLink: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>
                   <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Company Website Link</label>
                      <input 
                        type="url" 
                        placeholder="https://company.com"
                        value={formData.companyLink ?? ''}
                        onChange={e => setFormData({...formData, companyLink: e.target.value})}
                        className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                   <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Your Relation / Referral Assistance</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Employee at company, can refer candidates directly to hiring manager"
                     value={formData.relation ?? ''}
                     onChange={e => setFormData({...formData, relation: e.target.value})}
                     className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all"
                   />
                </div>
             </div>
             
             {/* 4. Description */}
             <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">Role Description & Key Requirements</label>
                <textarea 
                  rows={4}
                  placeholder="Mention responsibilities, required skills, eligibility..."
                  value={formData.description ?? ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-xs font-semibold sm:font-bold text-slate-800 placeholder:text-slate-400 transition-all resize-none"
                />
             </div>

             <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-100/50">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-white/60 text-slate-600 border border-slate-200/60 rounded-xl sm:rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs shadow-md shadow-blue-500/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Briefcase size={16} className="mr-2" />}
                  Submit Career Posting
                </button>
             </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
             <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Accessing Career Hub...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-8">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                <Briefcase size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-800">No Jobs / Internships Added Yet</h3>
             <p className="text-slate-500 text-xs font-medium mt-1.5 max-w-sm mx-auto">Share hiring opportunities or referrals to help Madni students and alumni.</p>
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
             <h3 className="text-xl font-bold text-slate-900">No postings in this category</h3>
             <p className="text-slate-500 text-sm font-medium mt-2">Try selecting a different category filter.</p>
          </div>
        ) : posts.filter(post => selectedCategory === 'All' || post.category === selectedCategory).map(post => (
          <div key={post.id} className="bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-900/5 hover:scale-[1.01] transition-all duration-300 overflow-hidden group flex flex-col justify-between">
             <div className="p-3.5 sm:p-6 md:p-8 space-y-2.5 sm:space-y-5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5 sm:gap-4">
                   <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                         <Briefcase size={16} className="sm:w-[22px] sm:h-[22px]" />
                      </div>
                      <div className="min-w-0">
                         <h4 className="text-xs sm:text-base font-extrabold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">{post.role}</h4>
                         <p className="text-[10px] sm:text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{post.companyName}</span>
                         </p>
                      </div>
                   </div>
                   {getStatusBadge(post.status)}
                </div>

                {/* Badges Pill Row */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-0.5">
                   <span className="text-[8.5px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-blue-50 text-blue-700 rounded-md sm:rounded-lg border border-blue-100 uppercase">
                      {post.type}
                   </span>
                   {post.workMode && (
                      <span className="text-[8.5px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 text-slate-700 rounded-md sm:rounded-lg border border-slate-200/80">
                         {post.workMode === 'REMOTE' ? '🏠 Remote' : post.workMode === 'HYBRID' ? '🌐 Hybrid' : '🏢 On-Site'}
                      </span>
                   )}
                   {post.location && (
                      <span className="text-[8.5px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-50 text-emerald-800 rounded-md sm:rounded-lg border border-emerald-100 flex items-center gap-1">
                         <MapPin size={9} className="sm:w-[11px] sm:h-[11px]" /> {post.location}
                      </span>
                   )}
                   {post.salary && (
                      <span className="text-[8.5px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-amber-50 text-amber-900 rounded-md sm:rounded-lg border border-amber-200/80 flex items-center gap-1">
                         <DollarSign size={9} className="sm:w-[11px] sm:h-[11px]" /> {post.salary}
                      </span>
                   )}
                </div>

                {/* Description */}
                {post.description && (
                  <p className="text-[10px] sm:text-xs text-slate-600 font-medium leading-relaxed line-clamp-3 bg-white/50 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100/80">
                    {post.description}
                  </p>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[9.5px] sm:text-[11px] text-slate-500 font-medium pt-0.5">
                   {post.experienceLevel && (
                      <div className="flex items-center gap-1.5">
                         <Award size={11} className="text-slate-400 shrink-0" />
                         <span className="truncate">{post.experienceLevel}</span>
                      </div>
                   )}
                   {post.deadline && (
                      <div className="flex items-center gap-1.5">
                         <Calendar size={11} className="text-slate-400 shrink-0" />
                         <span>Apply by {new Date(post.deadline).toLocaleDateString()}</span>
                      </div>
                   )}
                   {post.relation && (
                      <div className="col-span-1 sm:col-span-2 text-indigo-700 font-bold bg-indigo-50/80 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl border border-indigo-100 flex items-center gap-1.5">
                         <Handshake size={12} className="shrink-0" />
                         <span className="truncate">Referral Note: {post.relation}</span>
                      </div>
                   )}
                </div>
             </div>

             {/* Card Footer: Interactive Response Buttons */}
             <div className="p-2.5 sm:px-7 sm:pb-7 sm:pt-3 border-t border-slate-100/80 space-y-2 sm:space-y-3 bg-slate-50/50">
                {/* 2 Interactive Buttons: I'm Interested & Referral Contact */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
                   <button
                     onClick={() => handleToggleInterest(post.id, 'INTERESTED')}
                     className={`px-1.5 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm border cursor-pointer ${
                       post.userInterested 
                         ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' 
                         : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                     }`}
                   >
                     <ThumbsUp size={12} className="sm:w-[14px] sm:h-[14px]" />
                     <span className="truncate">I'm Interested</span>
                     <span className={`text-[8.5px] sm:text-[10px] px-1 py-0.1 rounded-full font-extrabold ${
                       post.userInterested ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
                     }`}>
                       {post.interestedCount || 0}
                     </span>
                   </button>

                   <button
                     onClick={() => handleToggleInterest(post.id, 'REFERRAL_CONTACT')}
                     className={`px-1.5 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm border cursor-pointer ${
                       post.userReferral 
                         ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20' 
                         : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
                     }`}
                   >
                     <Handshake size={12} className="sm:w-[14px] sm:h-[14px]" />
                     <span className="truncate">Have Referral</span>
                     <span className={`text-[8.5px] sm:text-[10px] px-1 py-0.1 rounded-full font-extrabold ${
                       post.userReferral ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-800'
                     }`}>
                       {post.referralCount || 0}
                     </span>
                   </button>
                </div>

                {/* Secondary Actions: Link / Registrations */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-[11px] text-slate-400 font-medium pt-0.5">
                   <span className="text-[9px] sm:text-[10px]">Posted {new Date(post.createdAt).toLocaleDateString()}</span>
                   <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                       <button
                         type="button"
                         onClick={() => setRegisterModalPost({
                           id: post.id,
                           title: post.role,
                           postType: 'CAREER',
                           authorName: post.companyName,
                           subtitle: `${post.type} • ${post.companyName}`,
                         })}
                         className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[9.5px] sm:text-[10px] font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer"
                       >
                         <Send size={10} />
                         <span>Register / Apply</span>
                       </button>

                       {post.applyLink && (
                         <a
                           href={post.applyLink.startsWith('http') ? post.applyLink : `mailto:${post.applyLink}`}
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9.5px] sm:text-[10px] font-extrabold border border-emerald-200 transition-colors"
                         >
                           <ExternalLink size={9} className="sm:w-[11px] sm:h-[11px]" />
                           <span>Link</span>
                         </a>
                       )}
                       <Link
                         href={`/alumni/registrations?postType=CAREER&postId=${post.id}`}
                         className="inline-flex items-center gap-0.5 sm:gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-xl bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-slate-200 transition-all text-[9.5px] sm:text-[10px] font-extrabold shadow-xs"
                       >
                         <span>Registrations</span>
                         <ChevronRight size={10} className="sm:w-[12px] sm:h-[12px]" />
                       </Link>
                    </div>
                </div>
             </div>
          </div>
        ))}
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
