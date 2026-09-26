'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User, Mail, Phone, ExternalLink, MessageSquare, Loader2, Sparkles, Send } from 'lucide-react';

interface RegisterOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    postType: 'CAREER' | 'MENTORSHIP';
    authorName?: string;
    subtitle?: string;
  } | null;
  onSuccess?: () => void;
}

export default function RegisterOpportunityModal({
  isOpen,
  onClose,
  post,
  onSuccess,
}: RegisterOpportunityModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      // Fetch logged-in user profile to prefill
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((user) => {
          if (user && !user.error) {
            if (user.name) setName(user.name);
            if (user.email) setEmail(user.email);
            if (user.phoneNo || user.phone) setPhoneNo(user.phoneNo || user.phone);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/opportunity-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: post.postType,
          postId: post.id,
          name: name.trim(),
          email: email.trim(),
          phoneNo: phoneNo.trim(),
          linkedInUrl: linkedInUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit registration. Please try again.');
        return;
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Registration Confirmed!</h3>
              <p className="text-xs font-medium text-slate-600 max-w-xs mx-auto">
                Your details have been submitted to{' '}
                <span className="font-bold text-slate-800">{post.authorName || 'the post author'}</span>. They will review and reach out to you directly.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                <Sparkles size={11} />
                {post.postType === 'MENTORSHIP' ? 'Mentorship Registration' : 'Opportunity Application'}
              </span>
              <h3 className="mt-2 text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 truncate">
                {post.title}
              </h3>
              {post.subtitle && (
                <p className="text-xs font-semibold text-slate-500 truncate">{post.subtitle}</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                  LinkedIn Profile URL <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{post.postType === 'MENTORSHIP' ? 'Register for Mentorship' : 'Submit Application'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
