'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Loader2,
  School as SchoolIcon,
  Phone,
  Mail,
  User,
  Briefcase,
  Link2,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Users
} from 'lucide-react';
import { COUNTRY_CODES } from '@/lib/countryCodes';

interface SchoolItem {
  id: string;
  schoolName: string;
  establishYear?: number;
  address?: string;
  imageUrls?: string[];
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
  const [tenantInfo, setTenantInfo] = useState<{ logoUrl: string; name: string; trustName?: string } | null>(null);

  useEffect(() => {
    // Fetch tenant branding info
    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setTenantInfo({
            logoUrl: data.logoUrl || '/my-gurukul.png',
            name: data.name || 'EduTrust Platform',
            trustName: data.trustName || 'EduTrust Network',
          });
        }
      })
      .catch(() => {});

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

          const matchedSchool =
            data.selectedSchool ||
            data.schools?.find((s: SchoolItem) => s.id === (data.invite?.schoolId || schoolIdParam)) ||
            (data.schools?.length === 1 ? data.schools[0] : null);

          if (matchedSchool) {
            setSelectedSchool(matchedSchool);
            setForm((current) => ({ ...current, schoolId: matchedSchool.id }));
            document.title = `${matchedSchool.schoolName} - Alumni Onboarding`;
          } else {
            document.title = 'Alumni Registration - Governance Console';
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
    <main className="min-h-screen w-full bg-[#EBF2F7] text-[#0b1525] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans">
      
      {/* Ambient SuperAdmin Soft Blue Glows */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-[#3f72af]/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#16325c]/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Central SuperAdmin Master Card */}
      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[32px] border border-[#D0DFEB] shadow-[0_20px_50px_rgba(11,21,37,0.08)] overflow-hidden my-auto">
        
        {/* Left Panel — SuperAdmin Deep Navy Showcase Panel */}
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0b1525] via-[#112240] to-[#16325c] text-white">
          
          <div className="space-y-8 relative z-10">
            {/* Brand Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wide shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{tenantInfo?.name || selectedSchool?.schoolName || "EduTrust OS"}</span>
            </div>

            {/* Logo Badge */}
            <div className="relative group">
              <div className="relative w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-500 p-2 overflow-hidden">
                <Image
                  src={tenantInfo?.logoUrl || "/my-gurukul.png"}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Typography Block */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {selectedSchool?.schoolName || invite?.schoolName || 'Alumni Network'} <br />
                <span className="text-[#93c5fd]">
                  Onboarding Portal
                </span>
              </h1>
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                Official alumni community registry. Connect with your alma mater, mentor upcoming batches, and collaborate on institutional development.
              </p>
            </div>
          </div>

          {/* Feature Badges & Footer */}
          <div className="space-y-6 pt-8 relative z-10">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <ShieldCheck size={13} className="text-emerald-300" /> Verified Access
                </div>
                <div className="text-xs font-bold text-white mt-1">Admin Approved</div>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <Users size={13} className="text-blue-300" /> Community
                </div>
                <div className="text-xs font-bold text-white mt-1">Global Directory</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 border-t border-white/15 pt-4">
              <span>© {new Date().getFullYear()} {tenantInfo?.trustName || "EduTrust Platform"}</span>
              <span className="text-slate-300 font-mono">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Right Panel — Pure White SuperAdmin Form */}
        <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 bg-white flex flex-col justify-center relative">
          
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-[#3f72af]">
              <Loader2 className="animate-spin mb-3" size={36} />
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Loading Portal Parameters...</p>
            </div>
          ) : token && !invite && status?.type === 'error' ? (
            <div className="max-w-[420px] mx-auto w-full text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Invalid or Expired Link</h3>
                <p className="text-xs font-medium text-slate-500 mt-2">{status.message}</p>
              </div>
              <a
                href="/alumni/login"
                className="inline-flex rounded-xl bg-[#0b1525] hover:bg-[#16325c] text-white px-6 py-3 text-xs font-extrabold uppercase tracking-wider no-underline transition-all shadow-md"
              >
                Back to Alumni Login
              </a>
            </div>
          ) : status?.type === 'success' ? (
            <div className="max-w-[460px] mx-auto w-full text-center space-y-6 animate-in zoom-in-95 duration-400">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles size={13} /> Application Received
                </span>
                <h2 className="text-2xl font-extrabold text-[#0b1525] tracking-tight">Registration Submitted</h2>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Your alumni onboarding profile for <strong>{status.schoolName}</strong> has been submitted to institutional governance.
                </p>
              </div>

              <div className="rounded-2xl bg-[#EBF2F7] border border-[#D0DFEB] p-4.5 text-left text-xs font-medium text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0b1525]">
                  <Mail size={15} className="text-[#3f72af]" />
                  <span>Next Step: Credentials Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upon verification by the school administration, your temporary login password will be emailed to <strong className="text-slate-800">{form.email}</strong>.
                </p>
              </div>

              <a
                href="/alumni/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#0b1525] hover:bg-[#16325c] text-white py-3.5 text-xs font-extrabold uppercase tracking-wider no-underline transition-all shadow-lg shadow-[#0b1525]/20 active:scale-[0.99]"
              >
                <span>Proceed to Alumni Portal Login</span>
                <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <div className="max-w-[480px] mx-auto w-full space-y-6">
              
              {/* Header Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold border uppercase tracking-wider bg-[#EBF2F7] text-[#0b1525] border-[#D0DFEB]">
                    <GraduationCap size={14} className="text-[#3f72af]" />
                    <span>Alumni Self-Registration</span>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#0b1525] tracking-tight">
                  {selectedSchool?.schoolName ? `${selectedSchool.schoolName}` : 'Student Onboarding'}
                </h2>
                <p className="text-slate-600 text-xs font-medium">
                  Submit your details for verification by the school administration.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={submitRegistration} className="space-y-4">
                
                {/* Target School Badge / Selector */}
                {invite ? (
                  <div className="rounded-2xl bg-[#EBF2F7] border border-[#D0DFEB] p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0b1525] text-white flex items-center justify-center shrink-0">
                      <SchoolIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3f72af]">Assigned Alma Mater</span>
                      <p className="text-xs font-extrabold text-[#0b1525] truncate">{invite.schoolName}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <SchoolIcon size={13} className="text-[#3f72af]" /> School Graduated From <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.schoolId}
                      onChange={(e) => updateField('schoolId', e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all cursor-pointer"
                    >
                      <option value="">-- Select Graduated School --</option>
                      {schools.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.schoolName} {sch.establishYear ? `(Est. ${sch.establishYear})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <User size={13} className="text-[#3f72af]" /> Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required
                      placeholder="e.g. Zahid Qureshi"
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <Mail size={13} className="text-[#3f72af]" /> Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      disabled={Boolean(invite?.email)}
                      required
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Phone & Batch Year Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <Phone size={13} className="text-[#3f72af]" /> Phone Number
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={form.countryCode}
                        onChange={(e) => updateField('countryCode', e.target.value)}
                        className="w-24 px-2 py-2.5 rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white text-[11px] font-bold text-[#0b1525] outline-none focus:border-[#3f72af]"
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
                        className="flex-1 rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-[#3f72af]" /> Batch / Year
                    </label>
                    <input
                      value={form.batchYear}
                      onChange={(e) => updateField('batchYear', e.target.value)}
                      placeholder="e.g. 2022-23 or 2021"
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Current Role & LinkedIn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-[#3f72af]" /> Current Role / Work
                    </label>
                    <input
                      value={form.currentTitle}
                      onChange={(e) => updateField('currentTitle', e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <Link2 size={13} className="text-[#3f72af]" /> LinkedIn / Portfolio
                    </label>
                    <input
                      type="url"
                      value={form.linkedIn}
                      onChange={(e) => updateField('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Short Bio */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#3f72af]" /> Short Bio / Note to School
                  </label>
                  <textarea
                    value={form.currentBio}
                    onChange={(e) => updateField('currentBio', e.target.value)}
                    rows={2}
                    placeholder="Brief background or note for institutional verification..."
                    className="w-full rounded-xl border border-[#D0DFEB] bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b1525] outline-none focus:border-[#3f72af] focus:ring-4 focus:ring-[#3f72af]/20 transition-all placeholder:text-slate-400"
                  />
                </div>

                {status?.type === 'error' && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700">
                    {status.message}
                  </div>
                )}

                {/* Submit Button matching SuperAdmin Primary Button */}
                <button
                  type="submit"
                  disabled={submitting || (!form.schoolId && !invite?.schoolId)}
                  className="w-full rounded-xl bg-[#0b1525] hover:bg-[#16325c] text-white py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-[#0b1525]/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                  <span>Submit for Verification</span>
                </button>
              </form>
            </div>
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
