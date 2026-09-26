'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Loader2, Mail, Search, Send, Square, Users } from 'lucide-react';
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
  const [meetForm, setMeetForm] = useState({
    subject: 'Madni Alumni Google Meet Invitation',
    meetLink: '',
    meetingAt: '',
    message: 'Please join this alumni meet using the Google Meet link below.',
  });
  const [inviteForm, setInviteForm] = useState({
    schoolId: '',
    batchYear: '',
    emails: '',
    message: 'We warmly invite you to join the Madni Alumni Family.',
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
              <p className="text-xs font-semibold text-slate-500 mt-1">Send Meet links to registered alumni or invite old students for approval.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button onClick={() => setActiveTab('registered')} className={`px-4 py-2 rounded-lg text-xs font-black ${activeTab === 'registered' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-500'}`}>Registered Alumni</button>
              <button onClick={() => setActiveTab('invite')} className={`px-4 py-2 rounded-lg text-xs font-black ${activeTab === 'invite' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-500'}`}>Invite Alumni</button>
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
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Mail size={18} className="text-[#3f72af]" /> Send Meet Link</h3>
              <p className="text-xs font-bold text-slate-500">Selected alumni: {selected.length}</p>
              <input value={meetForm.subject} onChange={(e) => setMeetForm({ ...meetForm, subject: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Email subject" />
              <input value={meetForm.meetLink} onChange={(e) => setMeetForm({ ...meetForm, meetLink: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Google Meet link" />
              <input value={meetForm.meetingAt} onChange={(e) => setMeetForm({ ...meetForm, meetingAt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Meeting date/time" />
              <textarea value={meetForm.message} onChange={(e) => setMeetForm({ ...meetForm, message: e.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
              <button onClick={sendMeet} disabled={sending || selected.length === 0} className="w-full rounded-xl bg-[#3f72af] text-white py-3 text-sm font-black disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Meet Link
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 max-w-3xl">
            <h3 className="font-black text-slate-900 flex items-center gap-2"><Mail size={18} className="text-[#3f72af]" /> Invite Old Students</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1 mb-5">They register from the invite link. Subadmin approval is required before credentials are sent.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select value={inviteForm.schoolId} onChange={(e) => setInviteForm({ ...inviteForm, schoolId: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                {schools.map((school) => <option key={school.id} value={school.id}>{school.schoolName}</option>)}
              </select>
              <input value={inviteForm.batchYear} onChange={(e) => setInviteForm({ ...inviteForm, batchYear: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Batch year optional" />
            </div>
            <textarea value={inviteForm.emails} onChange={(e) => setInviteForm({ ...inviteForm, emails: e.target.value })} rows={5} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Paste emails separated by comma, space, or new line" />
            <textarea value={inviteForm.message} onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })} rows={4} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" />
            <button onClick={sendInvites} disabled={sending || !inviteForm.schoolId || !inviteForm.emails.trim()} className="mt-4 rounded-xl bg-[#3f72af] text-white px-5 py-3 text-sm font-black disabled:opacity-60 flex items-center gap-2">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Invite Email
            </button>
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}
