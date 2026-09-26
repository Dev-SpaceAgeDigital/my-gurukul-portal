'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  batchYear: '',
  currentTitle: '',
  currentBio: '',
  linkedIn: '',
};

function AlumniRegisterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [invite, setInvite] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/public/alumni-register?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invite link is invalid');
        setInvite(data.invite);
        setForm((current) => ({
          ...current,
          email: data.invite.email || '',
          batchYear: data.invite.batchYear || '',
        }));
      } catch (error: any) {
        setStatus({ type: 'error', message: error?.message || 'Invite link is invalid' });
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/public/alumni-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit registration');
      setStatus({ type: 'success', message: data.message || 'Registration submitted for school approval.' });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || 'Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#eaf4f0] via-white to-[#fff8ec] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-[28px] bg-white/90 backdrop-blur-md border border-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="bg-[#1A6B5A] text-white px-6 sm:px-10 py-8">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
            <GraduationCap size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Join Madni Alumni Family</h1>
          <p className="text-sm text-emerald-50 mt-2 font-medium">
            Register as an old student. Your school subadmin will approve before credentials are emailed.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex justify-center text-[#1A6B5A]"><Loader2 className="animate-spin" /></div>
          ) : !invite ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-bold text-rose-700">
              {status?.message || 'Invite link is invalid.'}
            </div>
          ) : status?.type === 'success' ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-600 mb-4" />
              <h2 className="text-xl font-black text-slate-900">Registration submitted</h2>
              <p className="text-sm font-semibold text-slate-600 mt-2">{status.message}</p>
              <a href="/alumni/login" className="inline-flex mt-6 rounded-xl bg-[#1A6B5A] text-white px-5 py-3 text-sm font-black no-underline">Back to Login</a>
            </div>
          ) : (
            <form onSubmit={submitRegistration} className="space-y-5">
              <div className="rounded-2xl bg-[#eaf4f0] border border-emerald-100 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#1A6B5A]">School Verified</p>
                <p className="text-lg font-black text-slate-900 mt-1">{invite.schoolName}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['name', 'Full Name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['batchYear', 'Batch Year'],
                  ['currentTitle', 'Current Work / Study Title'],
                  ['linkedIn', 'LinkedIn / Work Link'],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                    <input
                      value={form[key as keyof typeof initialForm]}
                      onChange={(e) => updateField(key as keyof typeof initialForm, e.target.value)}
                      disabled={key === 'email' && Boolean(invite.email)}
                      required={['name', 'email'].includes(key)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                    />
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Short Bio</span>
                <textarea
                  value={form.currentBio}
                  onChange={(e) => updateField('currentBio', e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {status?.type === 'error' && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-bold text-rose-700">{status.message}</div>
              )}

              <button disabled={submitting} className="w-full rounded-xl bg-[#1A6B5A] text-white py-3 text-sm font-black hover:bg-[#0F3D35] disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Submit for Approval
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AlumniRegisterPage() {
  return (
    <Suspense fallback={null}>
      <AlumniRegisterContent />
    </Suspense>
  );
}
