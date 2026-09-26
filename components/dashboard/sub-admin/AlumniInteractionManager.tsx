'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Star,
  Trophy,
  UserCheck,
  Users,
  XCircle,
  MapPin,
  DollarSign,
  Award,
  Link as LinkIcon,
  Send,
  Handshake,
  ThumbsUp,
  Building2,
  Globe,
  Tag,
  Tags
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type ModerationTab = 'job' | 'mentorship' | 'blog' | 'achievement' | 'aoy';
type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Interaction {
  id: string;
  type?: 'JOB' | 'INTERNSHIP';
  title?: string;
  companyName?: string;
  companyLink?: string | null;
  role?: string;
  description?: string;
  content?: string;
  category?: string | null;
  relation?: string | null;
  location?: string | null;
  workMode?: 'ON_SITE' | 'REMOTE' | 'HYBRID' | null;
  salary?: string | null;
  duration?: string | null;
  experienceLevel?: string | null;
  applyLink?: string | null;
  deadline?: string | null;
  interestedCount?: number;
  referralCount?: number;
  targetStudent?: string | null;
  availability?: string | null;
  status: ModerationStatus;
  isFeatured?: boolean;
  alumniName: string;
  alumniEmail: string;
  createdAt: string;
}

interface ModerationData {
  jobs: Interaction[];
  mentorships: Interaction[];
  blogs: Interaction[];
  achievements: Interaction[];
}

const tabs: Array<{ id: ModerationTab; label: string; icon: React.ReactNode }> = [
  { id: 'job', label: 'Opportunities', icon: <Briefcase size={14} className="mr-2 inline" /> },
  { id: 'mentorship', label: 'Mentorships', icon: <UserCheck size={14} className="mr-2 inline" /> },
  { id: 'blog', label: 'Stories', icon: <BookOpen size={14} className="mr-2 inline" /> },
  { id: 'achievement', label: 'Achievements', icon: <Trophy size={14} className="mr-2 inline" /> },
  { id: 'aoy', label: 'Alumni of the Year', icon: <Star size={14} className="mr-2 inline" /> },
];

export default function AlumniInteractionManager() {
  const [data, setData] = useState<ModerationData>({ jobs: [], mentorships: [], blogs: [], achievements: [] });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [activeTab, setActiveTab] = useState<ModerationTab>('job');
  const { dialog, showAlert } = usePortalDialog();

  // Alumni of the Year state
  const [aoyYear, setAoyYear] = useState<number>(2026);
  const [aoyData, setAoyData] = useState<any>(null);
  const [aoyLoading, setAoyLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [aoyForm, setAoyForm] = useState({
    headline: '',
    reason: '',
    highlight1: '',
    highlight2: '',
    highlight3: ''
  });
  const [aoySubmitting, setAoySubmitting] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, []);

  useEffect(() => {
    if (activeTab === 'aoy') {
      fetchAoyData(aoyYear);
    }
  }, [activeTab, aoyYear]);

  const fetchAoyData = async (year: number) => {
    setAoyLoading(true);
    try {
      const res = await fetch(`/api/subadmin/alumni-of-the-year?year=${year}`);
      const json = await res.json();
      if (res.ok) {
        setAoyData(json);
        if (json.currentAward) {
          setAoyForm({
            headline: json.currentAward.headline || '',
            reason: json.currentAward.reason || '',
            highlight1: json.currentAward.highlights?.[0] || '',
            highlight2: json.currentAward.highlights?.[1] || '',
            highlight3: json.currentAward.highlights?.[2] || ''
          });
        }
      }
    } catch {
      console.error('Failed to load AOY data');
    } finally {
      setAoyLoading(false);
    }
  };

  const handleSelectWinnerCandidate = (candidate: any, categoryName?: string) => {
    setSelectedCandidate(candidate);
    const defaultHeadline = categoryName
      ? `Top ${categoryName} Contributor ${aoyYear}`
      : `Alumni of the Year ${aoyYear}`;
    
    const highlights = [];
    if (candidate.stats.financialAidTotal > 0) highlights.push(`Sponsored ₹${candidate.stats.financialAidTotal.toLocaleString()} for student aid & school support`);
    if (candidate.stats.jobsCount > 0) highlights.push(`Posted ${candidate.stats.jobsCount} career opportunities & referrals`);
    if (candidate.stats.mentorshipsCount > 0) highlights.push(`Conducted ${candidate.stats.mentorshipsCount} mentorship sessions for students`);
    if (candidate.stats.achievementsCount > 0) highlights.push(`Achieved ${candidate.stats.achievementsCount} career milestones & publications`);

    setAoyForm({
      headline: defaultHeadline,
      reason: `${candidate.name} is awarded Alumni of the Year ${aoyYear} for exceptional contributions to the Madni Education community.`,
      highlight1: highlights[0] || 'Outstanding community contribution',
      highlight2: highlights[1] || 'Dedicated support for students',
      highlight3: highlights[2] || 'Inspirational career leader'
    });
  };

  const handleSaveAoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate && !aoyData?.currentAward) return;

    setAoySubmitting(true);

    const targetAlumniId = selectedCandidate?.id || aoyData.currentAward.alumniId;
    const targetSchoolId = selectedCandidate?.schoolId || aoyData.currentAward?.schoolId;
    const targetStats = selectedCandidate?.stats || {};

    try {
      const res = await fetch('/api/subadmin/alumni-of-the-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: targetSchoolId,
          alumniId: targetAlumniId,
          year: aoyYear,
          headline: aoyForm.headline,
          reason: aoyForm.reason,
          highlights: [aoyForm.highlight1, aoyForm.highlight2, aoyForm.highlight3].filter(Boolean),
          totalFinancialAid: targetStats.financialAidTotal || 0,
          studentsHelpedCount: Math.max(1, targetStats.contributionsCount || 1),
          jobsPostedCount: targetStats.jobsCount || 0,
          mentorshipsCount: targetStats.mentorshipsCount || 0,
          mediaUrl: selectedCandidate?.profilePic || null
        })
      });

      if (res.ok) {
        showAlert({
          title: 'Alumni of the Year declared',
          message: `Successfully declared Alumni of the Year ${aoyYear}.`,
          variant: 'success',
        });
        setSelectedCandidate(null);
        fetchAoyData(aoyYear);
      }
    } catch {
      showAlert({ title: 'Save failed', message: 'Failed to save Alumni of the Year.', variant: 'danger' });
    } finally {
      setAoySubmitting(false);
    }
  };


  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      const res = await fetch('/api/subadmin/alumni-interactions');
      const json = await res.json();
      if (res.ok) setData({
        jobs: Array.isArray(json.jobs) ? json.jobs : [],
        mentorships: Array.isArray(json.mentorships) ? json.mentorships : [],
        blogs: Array.isArray(json.blogs) ? json.blogs : [],
        achievements: Array.isArray(json.achievements) ? json.achievements : [],
      });
      else showAlert({ title: 'Load failed', message: json.error || 'Unable to load moderation queue.', variant: 'danger' });
    } catch {
      showAlert({ title: 'Communication failed', message: 'Unable to load moderation queue.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const patchInteraction = async (
    id: string,
    type: ModerationTab,
    payload: { status?: ModerationStatus; isFeatured?: boolean },
  ) => {
    setUpdatingId(id);

    try {
      const res = await fetch('/api/subadmin/alumni-interactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, ...payload }),
      });

      if (res.ok) fetchInteractions();
      else {
        const json = await res.json();
        showAlert({ title: 'Update failed', message: json.error || 'The moderation action could not be saved.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Update failed', message: 'The moderation action could not be saved.', variant: 'danger' });
    } finally {
      setUpdatingId('');
    }
  };

  const currentList = activeTab === 'job'
    ? data.jobs
    : activeTab === 'mentorship'
      ? data.mentorships
      : activeTab === 'blog'
        ? data.blogs
        : data.achievements;

  const getTitle = (item: Interaction) => {
    if (activeTab === 'job') return `${item.role || 'Opportunity'} @ ${item.companyName || 'Organization'}`;
    return item.title || 'Untitled submission';
  };

  const getDescription = (item: Interaction) => {
    if (activeTab === 'blog') return item.content || '';
    return item.description || '';
  };

  const getTypeLabel = (item: Interaction) => {
    if (activeTab === 'job') return item.type || 'Opportunity';
    if (activeTab === 'mentorship') return 'Mentorship Offer';
    if (activeTab === 'blog') return 'Alumni Story';
    return item.category || 'Achievement';
  };

  const isFeatureCapable = activeTab === 'blog' || activeTab === 'achievement';

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Alumni Interactions</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Review alumni posts, stories, achievements, and offers</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-md overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#18181b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'aoy' ? (
        <div className="flex-1 min-h-0 overflow-auto space-y-6 pb-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-200/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Star size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Alumni of the Year Selection</h3>
                <p className="text-xs text-slate-500 font-medium">Ranked by real database metrics (donations, jobs, mentorships)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Year:</label>
              <select
                value={aoyYear}
                onChange={(e) => setAoyYear(parseInt(e.target.value, 10))}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          {aoyData?.currentAward && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={aoyData.currentAward.alumniProfilePic || '/images/img-101.jpg'}
                    alt={aoyData.currentAward.alumniName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                  />
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider mb-1">
                      🏆 Current Winner ({aoyYear})
                    </span>
                    <h4 className="text-lg font-black text-slate-900">{aoyData.currentAward.alumniName}</h4>
                    <p className="text-xs font-bold text-amber-900">{aoyData.currentAward.headline}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs font-semibold text-slate-600 space-y-1">
                  <p>Batch of {aoyData.currentAward.alumniBatchYear || 'Alumni'}</p>
                  <p className="text-[11px] text-slate-500 italic">{aoyData.currentAward.reason}</p>
                </div>
              </div>
            </div>
          )}

          {aoyLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin text-amber-500 mb-3" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Gathering DB Contribution Metrics for {aoyYear}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Top Candidates Ranked by DB Impact ({aoyYear})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                      💰 Financial & Aid Leader
                    </span>
                  </div>

                  {aoyData?.categories?.topFinancial ? (
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{aoyData.categories.topFinancial.name}</h5>
                      <p className="text-xs text-slate-500">{aoyData.categories.topFinancial.currentTitle || 'Alumni'}</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-emerald-700">
                        Total Aid: ₹{(aoyData.categories.topFinancial.stats.financialAidTotal || 0).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleSelectWinnerCandidate(aoyData.categories.topFinancial, 'Financial Aid')}
                        className="mt-4 w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all"
                      >
                        Select as Winner
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">No financial contributions recorded in {aoyYear}.</p>
                  )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      💼 Top Career Champion
                    </span>
                  </div>

                  {aoyData?.categories?.topCareer ? (
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{aoyData.categories.topCareer.name}</h5>
                      <p className="text-xs text-slate-500">{aoyData.categories.topCareer.currentTitle || 'Alumni'}</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-blue-700">
                        Jobs Posted: {aoyData.categories.topCareer.stats.jobsCount} Opportunities
                      </div>
                      <button
                        onClick={() => handleSelectWinnerCandidate(aoyData.categories.topCareer, 'Career')}
                        className="mt-4 w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all"
                      >
                        Select as Winner
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">No jobs posted in {aoyYear}.</p>
                  )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                      🤝 Top Mentor & Achiever
                    </span>
                  </div>

                  {aoyData?.categories?.topMentorship ? (
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{aoyData.categories.topMentorship.name}</h5>
                      <p className="text-xs text-slate-500">{aoyData.categories.topMentorship.currentTitle || 'Alumni'}</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-purple-700">
                        Mentorships: {aoyData.categories.topMentorship.stats.mentorshipsCount} Sessions
                      </div>
                      <button
                        onClick={() => handleSelectWinnerCandidate(aoyData.categories.topMentorship, 'Mentorship')}
                        className="mt-4 w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all"
                      >
                        Select as Winner
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">No mentorships recorded in {aoyYear}.</p>
                  )}
                </div>
              </div>

              {(selectedCandidate || aoyData?.currentAward) && (
                <form onSubmit={handleSaveAoy} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900">
                      Publish Alumni of the Year {aoyYear} for {selectedCandidate?.name || aoyData?.currentAward?.alumniName}
                    </h4>
                    {selectedCandidate && (
                      <button type="button" onClick={() => setSelectedCandidate(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">
                        Cancel Selection
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Headline / Title</label>
                    <input
                      type="text"
                      required
                      value={aoyForm.headline}
                      onChange={(e) => setAoyForm({ ...aoyForm, headline: e.target.value })}
                      placeholder="e.g. Leader in Educational Aid & Digital Lab Support 2026"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detailed Citation / Reason</label>
                    <textarea
                      rows={3}
                      required
                      value={aoyForm.reason}
                      onChange={(e) => setAoyForm({ ...aoyForm, reason: e.target.value })}
                      placeholder="Explain why this alumni was awarded Alumni of the Year..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top 3 Highlight Bullets (Displayed on Public Spotlight & Donate Page)</label>
                    <input
                      type="text"
                      required
                      value={aoyForm.highlight1}
                      onChange={(e) => setAoyForm({ ...aoyForm, highlight1: e.target.value })}
                      placeholder="Highlight 1: e.g. Sponsored ₹1,20,000 for student aid"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                    <input
                      type="text"
                      value={aoyForm.highlight2}
                      onChange={(e) => setAoyForm({ ...aoyForm, highlight2: e.target.value })}
                      placeholder="Highlight 2: e.g. Donated 10 Laptops for Computer Lab"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                    <input
                      type="text"
                      value={aoyForm.highlight3}
                      onChange={(e) => setAoyForm({ ...aoyForm, highlight3: e.target.value })}
                      placeholder="Highlight 3: e.g. Conducted 6 Student Mentorship Sessions"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={aoySubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {aoySubmitting ? 'Publishing...' : `🏆 Declare Alumni of the Year ${aoyYear}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-md border border-slate-100 shadow-sm py-20">
          <Loader2 className="animate-spin text-[#dac48b] mb-4" size={32} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Checking Moderation Queue...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-md border border-slate-100 shadow-sm py-20">
          <CheckCircle2 size={40} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Queue is empty</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">No {activeTab} submissions to review.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3 pb-4">
            {currentList.map((item) => (
              <div key={item.id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden group">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-72 p-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 shrink-0">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-[#dac48b] shadow-sm">
                        {item.alumniName?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{item.alumniName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Verified Alumni</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-xs font-medium text-slate-600 break-all">
                        <Mail size={13} className="mr-3 text-slate-400 shrink-0" />
                        {item.alumniEmail}
                      </div>
                      <div className="flex items-center text-xs font-medium text-slate-600">
                        <Calendar size={13} className="mr-3 text-slate-400 shrink-0" />
                        Submitted {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${activeTab === 'achievement' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-[#a98f4a] border-amber-100'}`}>
                            {getTypeLabel(item)}
                          </span>
                          {activeTab === 'job' && item.workMode && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-200">
                              {item.workMode === 'REMOTE' ? '🏠 Remote' : item.workMode === 'HYBRID' ? '🌐 Hybrid' : '🏢 On-Site'}
                            </span>
                          )}
                          {activeTab === 'job' && item.location && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-100 flex items-center gap-1">
                              <MapPin size={10} /> {item.location}
                            </span>
                          )}
                          {activeTab === 'job' && item.salary && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider bg-amber-50 text-amber-900 border-amber-200 flex items-center gap-1">
                              <DollarSign size={10} /> {item.salary}
                            </span>
                          )}
                          {item.isFeatured && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider bg-[#18181b] text-white border-[#18181b]">
                              Featured
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{getTitle(item)}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => patchInteraction(item.id, activeTab, { status: 'REJECTED' })}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-all"
                              title="Reject"
                              disabled={updatingId === item.id}
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              onClick={() => patchInteraction(item.id, activeTab, { status: 'APPROVED' })}
                              className="flex items-center px-4 py-2 bg-[#18181b] text-white rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm hover:bg-black transition-all disabled:opacity-50"
                              disabled={updatingId === item.id}
                            >
                              <CheckCircle2 size={14} className="mr-2" /> Approve Post
                            </button>
                          </>
                        ) : (
                          <div className={`flex items-center px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {item.status === 'APPROVED' ? <CheckCircle2 size={12} className="mr-1.5" /> : <XCircle size={12} className="mr-1.5" />}
                            {item.status}
                          </div>
                        )}

                        {isFeatureCapable && item.status === 'APPROVED' && (
                          <button
                            onClick={() => patchInteraction(item.id, activeTab, { isFeatured: !item.isFeatured })}
                            className={`flex items-center px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${item.isFeatured ? 'bg-[#18181b] text-white border-[#18181b]' : 'bg-white text-slate-500 border-slate-200 hover:text-[#a98f4a] hover:border-[#dac48b]'}`}
                            title={item.isFeatured ? 'Remove featured status' : 'Feature this submission'}
                            disabled={updatingId === item.id}
                          >
                            <Star size={13} className="mr-1.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                            {item.isFeatured ? 'Featured' : 'Feature'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Description */}
                      <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-100">
                        {getDescription(item)}
                      </p>

                      {/* Job / Internship Full Details Grid */}
                      {activeTab === 'job' && (
                        <div className="space-y-3 bg-white p-4 rounded-md border border-slate-200/80">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            {item.category && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                                <Tags size={14} className="text-blue-600 shrink-0" />
                                <span>Category: <strong className="text-slate-900">{item.category}</strong></span>
                              </div>
                            )}
                            {item.experienceLevel && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                                <Award size={14} className="text-purple-600 shrink-0" />
                                <span>Exp: <strong className="text-slate-900">{item.experienceLevel}</strong></span>
                              </div>
                            )}
                            {item.duration && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                                <Clock size={14} className="text-teal-600 shrink-0" />
                                <span>Duration: <strong className="text-slate-900">{item.duration}</strong></span>
                              </div>
                            )}
                            {item.deadline && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                                <Calendar size={14} className="text-amber-600 shrink-0" />
                                <span>Deadline: <strong className="text-slate-900">{new Date(item.deadline).toLocaleDateString()}</strong></span>
                              </div>
                            )}
                            {item.companyLink && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold truncate">
                                <Globe size={14} className="text-slate-500 shrink-0" />
                                <a href={item.companyLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                                  {item.companyLink}
                                </a>
                              </div>
                            )}
                            {item.applyLink && (
                              <div className="flex items-center space-x-2 text-slate-700 font-semibold truncate">
                                <Send size={14} className="text-emerald-600 shrink-0" />
                                <a href={item.applyLink.startsWith('http') ? item.applyLink : `mailto:${item.applyLink}`} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline truncate">
                                  Apply Link / Email
                                </a>
                              </div>
                            )}
                          </div>

                          {item.relation && (
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-800 font-bold bg-indigo-50/60 p-2.5 rounded-md">
                              <Handshake size={14} className="shrink-0 text-indigo-600" />
                              <span>Referral Note: {item.relation}</span>
                            </div>
                          )}

                          {/* Live Engagement Counters */}
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs font-bold">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                              <ThumbsUp size={13} className="text-blue-600" />
                              Interested Alumni: {item.interestedCount || 0}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-100">
                              <Handshake size={13} className="text-purple-600" />
                              Referral Contacts: {item.referralCount || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Mentorship Details */}
                      {activeTab === 'mentorship' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3">
                            <Users size={14} className="text-[#dac48b] mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Students</p>
                              <p className="text-xs font-semibold text-slate-700">{item.targetStudent || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Clock size={14} className="text-[#dac48b] mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Availability</p>
                              <p className="text-xs font-semibold text-slate-700">{item.availability || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    {dialog}
    </>
  );
}
