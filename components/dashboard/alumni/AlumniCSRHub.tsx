'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Handshake, Loader2, Send, Sparkles } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type CsrInquiry = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  category: string;
  budgetRange?: string | null;
  message?: string | null;
  status: string;
  schoolName?: string | null;
  createdAt: string;
};

const initialForm = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  category: 'Student Sponsorship',
  budgetRange: '',
  message: '',
};

export default function AlumniCSRHub() {
  const [inquiries, setInquiries] = useState<CsrInquiry[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alumni/csr');
      const data = await res.json();
      if (res.ok) setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } finally {
      setLoading(false);
    }
  };

  const submitReferral = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/alumni/csr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit CSR referral');

      setForm(initialForm);
      await fetchInquiries();
      showAlert({
        title: 'CSR referral sent',
        message: 'Your company referral is now visible to the school and trust team.',
        variant: 'success',
      });
    } catch (error: any) {
      showAlert({
        title: 'Referral failed',
        message: error?.message || 'Please try again after some time.',
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-3 pb-28 animate-in fade-in duration-300 sm:space-y-5 sm:pb-16">
        <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-6">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 sm:px-3 sm:py-1 sm:text-[11px]">
                <Sparkles size={12} />
                CSR Referrals
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-2xl">Connect companies with Madni impact.</h2>
              <p className="mt-1 max-w-2xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
                Refer a company or workplace that may support students, infrastructure, events, libraries, labs, or scholarships.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[220px] sm:gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-2.5 sm:rounded-2xl sm:p-3.5">
                <div className="text-lg font-black text-blue-700 sm:text-2xl">{inquiries.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500 sm:text-[11px]">My Referrals</div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-2.5 sm:rounded-2xl sm:p-3.5">
                <div className="text-lg font-black text-emerald-700 sm:text-2xl">{inquiries.filter((i) => i.status === 'APPROVED').length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-500 sm:text-[11px]">Approved</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[400px_1fr] xl:gap-6">
          <form onSubmit={submitReferral} className="space-y-2.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-md backdrop-blur-md sm:space-y-3.5 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-10 sm:w-10 sm:rounded-2xl">
                <Handshake size={18} className="sm:size-[20px]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 sm:text-sm">Refer a Company</h3>
                <p className="text-[10.5px] font-semibold text-slate-500">The admin team will follow up.</p>
              </div>
            </div>

            {[
              ['companyName', 'Company Name'],
              ['contactPerson', 'Contact Person'],
              ['email', 'Company Email'],
              ['phone', 'Phone Number'],
              ['budgetRange', 'Budget Range'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 sm:text-[11px]">{label}</span>
                <input
                  value={form[key as keyof typeof initialForm]}
                  onChange={(e) => updateField(key as keyof typeof initialForm, e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                  required={['companyName', 'contactPerson', 'email'].includes(key)}
                />
              </label>
            ))}

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 sm:text-[11px]">Support Category</span>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="mt-0.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <option>Student Sponsorship</option>
                <option>Infrastructure</option>
                <option>Digital Classroom</option>
                <option>Library or Lab</option>
                <option>Event Sponsorship</option>
                <option>General CSR Support</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 sm:text-[11px]">Message</span>
              <textarea
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                rows={3}
                className="mt-0.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white transition-all hover:bg-blue-700 disabled:opacity-60 sm:min-h-11 sm:rounded-2xl sm:py-3 sm:text-sm"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Submit Referral
            </button>
          </form>

          <div className="rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-md backdrop-blur-md sm:rounded-3xl sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-black text-slate-900 sm:text-sm">
              <Building2 size={18} className="text-blue-600" />
              My CSR Referral Tracking
            </h3>

            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`csr-skeleton-${index}`} className="animate-pulse rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="h-3.5 w-2/3 rounded-full bg-slate-200" />
                    <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-200/80" />
                    <div className="mt-1.5 h-3 w-3/4 rounded-full bg-slate-200/70" />
                  </div>
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center sm:rounded-2xl sm:p-8">
                <p className="text-xs font-bold text-slate-700 sm:text-sm">No CSR referrals yet.</p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Submit your first company referral from the form.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="break-words text-xs font-black text-slate-900 sm:text-sm">{inquiry.companyName}</h4>
                        <p className="mt-0.5 break-words text-[11px] font-semibold text-slate-500">{inquiry.category} · {inquiry.contactPerson}</p>
                        <p className="mt-0.5 break-words text-[11px] text-slate-500">{inquiry.email}</p>
                      </div>
                      <span className="w-fit rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[9.5px] font-black text-blue-700 sm:px-3 sm:py-1 sm:text-[10px]">
                        {inquiry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {dialog}
    </>
  );
}
