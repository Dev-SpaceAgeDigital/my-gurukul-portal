'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, GraduationCap, Loader2, School, Phone, Mail, User, Briefcase, Link2, FileText, ArrowRight } from 'lucide-react';
import { COUNTRY_CODES } from '@/lib/countryCodes';

interface SchoolItem {
  id: string;
  schoolName: string;
  establishYear?: number;
  address?: string;
}

const initialForm = {
  name: '',
  email: '',
  countryCode: '+91',
  phone: '',
  schoolId: '',
  batchYear: '',
  currentTitle: '',
  currentBio: '',
  linkedIn: '',
};

function AlumniRegisterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const schoolIdParam = searchParams.get('schoolId') || '';

  const [invite, setInvite] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; schoolName?: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const queryParams = new URLSearchParams();
        if (token) queryParams.set('token', token);
        if (schoolIdParam) queryParams.set('schoolId', schoolIdParam);

        const res = await fetch(`/api/public/alumni-register?${queryParams.toString()}`);
        const data = await res.json();

        if (res.ok) {
          if (data.invite) {
            setInvite(data.invite);
            setForm((current) => ({
              ...current,
              email: data.invite.email || '',
              batchYear: data.invite.batchYear || '',
              schoolId: data.invite.schoolId || '',
            }));
          }

          if (Array.isArray(data.schools)) {
            setSchools(data.schools);
          }

          const matchedSchool = data.selectedSchool || data.schools?.find((s: SchoolItem) => s.id === (data.invite?.schoolId || schoolIdParam)) || (data.schools?.length === 1 ? data.schools[0] : null);

          if (matchedSchool) {
            setSelectedSchool(matchedSchool);
            setForm((current) => ({ ...current, schoolId: matchedSchool.id }));
            document.title = `${matchedSchool.schoolName} - Alumni Onboarding`;
          } else {
            document.title = 'Alumni Registration & Onboarding';
          }
        } else {
          if (token) {
            setStatus({ type: 'error', message: data.error || 'Invite link is invalid or has expired.' });
          }
        }
      } catch (error: any) {
        if (token) {
          setStatus({ type: 'error', message: error?.message || 'Failed to load registration details.' });
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, schoolIdParam]);

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'schoolId') {
      const match = schools.find((s) => s.id === value) || null;
      setSelectedSchool(match);
      if (match) {
        document.title = `${match.schoolName} - Alumni Onboarding`;
      }
    }
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.schoolId && !invite?.schoolId) {
      setStatus({ type: 'error', message: 'Please select the school you graduated from.' });
      return;
    }

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
      setStatus({
        type: 'success',
        message: data.message || 'Registration submitted for school administration approval.',
        schoolName: data.schoolName || selectedSchool?.schoolName || 'the Institution',
      });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || 'Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0e2a22] via-[#12382e] to-[#0a1f19] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#1A6B5A] to-[#124d40] text-white px-6 sm:px-10 py-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-13 h-13 rounded-2xl bg-white/15 flex items-center justify-center mb-4 shadow-inner border border-white/20">
            <GraduationCap size={28} className="text-emerald-200" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Join {selectedSchool?.schoolName || invite?.schoolName || 'Alumni'} Network
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 font-medium leading-relaxed">
            Register as an alumnus to stay connected, mentor junior students, and access institutional updates.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#1A6B5A]">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading registration portal...</p>
            </div>
          ) : token && !invite && status?.type === 'error' ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center">
              <p className="text-sm font-bold text-rose-700">{status.message}</p>
              <a href="/alumni/login" className="inline-flex mt-5 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-black no-underline">
                Back to Login
              </a>
            </div>
          ) : status?.type === 'success' ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registration Submitted!</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Thank you for submitting your details. The school administration of <strong>{status.schoolName}</strong> will review and approve your registration.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-200/80 text-xs font-medium text-slate-600 max-w-md mx-auto text-left">
                ℹ️ Once approved, your alumni login credentials will be delivered directly to <strong>{form.email}</strong>.
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href="/alumni/login" className="rounded-xl bg-[#1A6B5A] text-white px-6 py-3 text-xs font-bold no-underline hover:bg-[#135043] transition-all shadow-md inline-flex items-center gap-2">
                  <span>Go to Alumni Login</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submitRegistration} className="space-y-5">
              
              {/* Selected School Banner / Selector */}
              {invite ? (
                <div className="rounded-2xl bg-[#eaf4f0] border border-emerald-200/80 p-4.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A6B5A] text-white flex items-center justify-center shrink-0">
                    <School size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1A6B5A]">Verified School</span>
                    <p className="text-sm font-black text-slate-900">{invite.schoolName}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <School size={14} className="text-[#1A6B5A]" /> Select School Graduated From <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.schoolId}
                    onChange={(e) => updateField('schoolId', e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                  >
                    <option value="">-- Select School --</option>
                    {schools.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.schoolName} {sch.establishYear ? `(Est. ${sch.establishYear})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-[#1A6B5A]" /> Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    placeholder="e.g. Zahid Qureshi"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-[#1A6B5A]" /> Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={Boolean(invite?.email)}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Phone with Country Code & Batch Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#1A6B5A]" /> Phone Number
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={form.countryCode}
                      onChange={(e) => updateField('countryCode', e.target.value)}
                      className="w-26 px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#1A6B5A]"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="9876543210"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-[#1A6B5A]" /> Batch / Passing Year
                  </label>
                  <input
                    value={form.batchYear}
                    onChange={(e) => updateField('batchYear', e.target.value)}
                    placeholder="e.g. 2021-22 or 2020"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* Current Role & LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={13} className="text-[#1A6B5A]" /> Current Role / Organization
                  </label>
                  <input
                    value={form.currentTitle}
                    onChange={(e) => updateField('currentTitle', e.target.value)}
                    placeholder="e.g. Software Engineer at Infosys"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Link2 size={13} className="text-[#1A6B5A]" /> LinkedIn / Portfolio Link
                  </label>
                  <input
                    type="url"
                    value={form.linkedIn}
                    onChange={(e) => updateField('linkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* Bio / Message */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#1A6B5A]" /> Short Bio / Note to School
                </label>
                <textarea
                  value={form.currentBio}
                  onChange={(e) => updateField('currentBio', e.target.value)}
                  rows={3}
                  placeholder="Share what you are currently doing or any message for the school administration..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1A6B5A] focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              {status?.type === 'error' && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-700">
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (!form.schoolId && !invite?.schoolId)}
                className="w-full rounded-xl bg-[#1A6B5A] text-white py-3.5 text-xs font-black uppercase tracking-wider hover:bg-[#124d40] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1A6B5A]/20 cursor-pointer transition-all active:scale-[0.99]"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                Submit Alumni Registration
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
