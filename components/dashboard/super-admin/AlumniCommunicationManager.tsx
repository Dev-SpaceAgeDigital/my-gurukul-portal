'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckSquare, Clock, Copy, ExternalLink, Globe, Loader2, Mail, Search, Send, Check, Square, Users, Video, School as SchoolIcon } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type AlumniRow = {
  id: string;
  name: string;
  email: string;
  batchYear?: string | null;
  currentTitle?: string | null;
  schoolId?: string | null;
  schoolName: string;
};

type School = { id: string; schoolName: string };

export default function AlumniCommunicationManager() {
  const [activeTab, setActiveTab] = useState<'registered' | 'invite'>('registered');
  const [alumni, setAlumni] = useState<AlumniRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [schoolId, setSchoolId] = useState('ALL');
  const [batchYear, setBatchYear] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [meetForm, setMeetForm] = useState({
    subject: 'Alumni Google Meet Invitation',
    meetLink: '',
    meetingDate: '',
    meetingTime: '',
    message: 'Please join this alumni meet using the Google Meet link below.',
  });

  const [inviteForm, setInviteForm] = useState({
    schoolId: '',
    batchYear: '',
    emails: '',
    message: 'We warmly invite you to join the Alumni Family.',
  });

  const { dialog, showAlert } = usePortalDialog();

  const query = useMemo(() => {
    return new URLSearchParams({ schoolId, batchYear, search }).toString();
  }, [schoolId, batchYear, search]);

  useEffect(() => {
    fetchData();
  }, [query]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/alumni-communication?${query}`);
      const data = await res.json();
      if (res.ok) {
        setAlumni(Array.isArray(data.alumni) ? data.alumni : []);
        setSchools(Array.isArray(data.schools) ? data.schools : []);
        setBatches(Array.isArray(data.batches) ? data.batches : []);
        if (!inviteForm.schoolId && data.schools?.[0]?.id) {
          setInviteForm((current) => ({ ...current, schoolId: data.schools[0].id }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    const visibleIds = alumni.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
    setSelected(allSelected ? [] : visibleIds);
  };

  const currentRegistrationLink = useMemo(() => {
    if (typeof window === 'undefined') return '/alumni/register';
    const base = window.location.origin;
    if (inviteForm.schoolId && inviteForm.schoolId !== 'ALL') {
      return `${base}/alumni/register?schoolId=${inviteForm.schoolId}`;
    }
    return `${base}/alumni/register`;
  }, [inviteForm.schoolId]);

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(currentRegistrationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const sendMeet = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/superadmin/alumni-communication/send-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumniIds: selected, ...meetForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send Meet emails');
      showAlert({ title: 'Meet emails processed', message: `Sent: ${data.sent}. Failed/skipped: ${data.failed}.`, variant: 'success' });
      setSelected([]);
    } catch (error: any) {
      showAlert({ title: 'Send failed', message: error?.message || 'Please try again.', variant: 'danger' });
    } finally {
      setSending(false);
    }
  };

  const sendInvites = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/superadmin/alumni-communication/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send invites');
      showAlert({ title: 'Invites processed', message: `Sent: ${data.sent}. Failed/skipped: ${data.failed}.`, variant: 'success' });
      setInviteForm((current) => ({ ...current, emails: '' }));
    } catch (error: any) {
      showAlert({ title: 'Invite failed', message: error?.message || 'Please try again.', variant: 'danger' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl bg-white/90 border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="text-[#3f72af]" size={22} />
                Alumni Communication
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">Send Google Meet links to registered alumni or generate shareable registration links & invite old students.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button onClick={() => setActiveTab('registered')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'registered' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-500'}`}>Registered Alumni</button>
              <button onClick={() => setActiveTab('invite')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'invite' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-500'}`}>Invite & Onboarding Link</button>
            </div>
          </div>
        </div>

        {activeTab === 'registered' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_150px] gap-3 border-b border-slate-100">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, title..." className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-[#3f72af]" />
                </div>
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700">
                  <option value="ALL">All Schools</option>
                  {schools.map((school) => <option key={school.id} value={school.id}>{school.schoolName}</option>)}
                </select>
                <select value={batchYear} onChange={(e) => setBatchYear(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700">
                  <option value="ALL">All Batches</option>
                  {batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="py-24 flex justify-center text-[#3f72af]"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] min-w-[850px]">
                    <thead className="bg-slate-900 text-white uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4"><button onClick={toggleAll}>{alumni.length > 0 && alumni.every((a) => selected.includes(a.id)) ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                        <th className="px-5 py-4">Alumni</th>
                        <th className="px-5 py-4">School</th>
                        <th className="px-5 py-4">Batch</th>
                        <th className="px-5 py-4">Current</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alumni.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4"><button onClick={() => toggleSelected(row.id)}>{selected.includes(row.id) ? <CheckSquare size={16} className="text-[#3f72af]" /> : <Square size={16} className="text-slate-400" />}</button></td>
                          <td className="px-5 py-4"><div className="font-black text-slate-900">{row.name}</div><div className="text-slate-500">{row.email}</div></td>
                          <td className="px-5 py-4 font-bold text-slate-700">{row.schoolName}</td>
                          <td className="px-5 py-4 font-bold text-slate-700">{row.batchYear || '-'}</td>
                          <td className="px-5 py-4 text-slate-500">{row.currentTitle || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4 h-fit">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Video size={18} className="text-[#3f72af]" /> Send Meet Link
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Selected alumni: {selected.length}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Email Subject</label>
                <input
                  value={meetForm.subject}
                  onChange={(e) => setMeetForm({ ...meetForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Google Meet Link</label>
                <div className="relative">
                  <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={meetForm.meetLink}
                    onChange={(e) => setMeetForm({ ...meetForm, meetLink: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Meeting Date & Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={meetForm.meetingDate}
                      onChange={(e) => setMeetForm({ ...meetForm, meetingDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-2 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af]"
                    />
                  </div>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      value={meetForm.meetingTime}
                      onChange={(e) => setMeetForm({ ...meetForm, meetingTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-2 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Message</label>
                <textarea
                  value={meetForm.message}
                  onChange={(e) => setMeetForm({ ...meetForm, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af]"
                  placeholder="Custom note or agenda for alumni..."
                />
              </div>

              <button
                onClick={sendMeet}
                disabled={sending || selected.length === 0 || !meetForm.meetLink.trim()}
                className="w-full rounded-xl bg-[#3f72af] hover:bg-[#325d91] text-white py-3 text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Meet Link ({selected.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            
            {/* Common Public Onboarding Link Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#11322b] to-[#1A6B5A] text-white p-6 sm:p-7 shadow-lg border border-emerald-700/50 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                      <Globe className="text-emerald-200" size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-base tracking-tight text-white">Common Alumni Onboarding Link</h3>
                      <p className="text-xs text-emerald-100 font-medium">Share this public link with any alumnus via WhatsApp, social media, or email.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={currentRegistrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold no-underline transition-all border border-white/20"
                    >
                      <ExternalLink size={13} />
                      <span>Open Form</span>
                    </a>
                    <button
                      onClick={copyRegistrationLink}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#1A6B5A] hover:bg-emerald-50 text-xs font-black transition-all shadow-md active:scale-95"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Common Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/25 p-3 rounded-xl border border-white/10">
                  <div className="flex-1 font-mono text-xs text-emerald-200 truncate select-all">
                    {currentRegistrationLink}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 shrink-0 text-center">
                    {inviteForm.schoolId && inviteForm.schoolId !== 'ALL' ? 'Targeted to Selected School' : 'All Trust Schools'}
                  </div>
                </div>

                <p className="text-[11px] text-emerald-200/80 font-medium mt-3">
                  ✨ When alumni open this link, they fill their name, email, phone number with country code, batch year, current work, and LinkedIn. Their submission will appear in the registration approval queue for that school.
                </p>
              </div>
            </div>

            {/* Direct Email Invites Section */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-base">
                <Mail size={18} className="text-[#3f72af]" /> Direct Email Invitations
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 mb-5">
                Send personalized invite emails with instant registration tokens to a list of email addresses.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Target School</label>
                  <select
                    value={inviteForm.schoolId}
                    onChange={(e) => setInviteForm({ ...inviteForm, schoolId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Batch Year (Optional)</label>
                  <input
                    value={inviteForm.batchYear}
                    onChange={(e) => setInviteForm({ ...inviteForm, batchYear: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                    placeholder="e.g. 2023-24"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Email Addresses</label>
                <textarea
                  value={inviteForm.emails}
                  onChange={(e) => setInviteForm({ ...inviteForm, emails: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                  placeholder="Paste alumni emails separated by comma, space, or new lines (e.g. rahul@gmail.com, priya@gmail.com)"
                />
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Invitation Message</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Alumni will receive an email invitation to register. Login credentials are only generated after subadmin review.
                </p>
                <button
                  onClick={sendInvites}
                  disabled={sending || !inviteForm.schoolId || !inviteForm.emails.trim()}
                  className="rounded-xl bg-[#3f72af] hover:bg-[#325d91] text-white px-6 py-3 text-xs font-black disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Invite Emails
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}
