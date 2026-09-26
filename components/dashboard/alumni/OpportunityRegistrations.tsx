'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, ExternalLink, Loader2, Mail, Phone, UserRound } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Registration {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
  linkedInUrl: string | null;
  createdAt: string;
}

interface PostSummary {
  id: string;
  title: string;
  subtitle: string | null;
  type: string;
}

export default function OpportunityRegistrations({
  postType,
  postId,
}: {
  postType: string;
  postId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostSummary | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const params = new URLSearchParams({ postType, postId });
        const res = await fetch(`/api/alumni/registrations?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          showAlert({ title: 'Load failed', message: data.error || 'Unable to load registrations.', variant: 'danger' });
          return;
        }
        setPost(data.post);
        setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      } catch {
        showAlert({ title: 'Load failed', message: 'Unable to load registrations.', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [postId, postType]);

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <Link
        href="/alumni/dashboard?tab=my-posts"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/80 bg-white/80 text-xs font-bold text-slate-700 shadow-xs hover:bg-white hover:text-blue-600 transition-all active:scale-95"
      >
        <ArrowLeft size={14} />
        <span>Back to My Posts</span>
      </Link>

      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <Briefcase size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunity Registrations</p>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug truncate">
                {post?.title || 'Opportunity'}
              </h2>
              {post?.subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{post.subtitle}</p>}
            </div>
          </div>
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100/80 shadow-xs shrink-0">
            {registrations.length} registered
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center bg-white/40 rounded-2xl sm:rounded-3xl border border-white/60">
          <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-12 sm:py-16 px-4 text-center bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/80 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 border border-blue-100 shadow-xs">
            <UserRound size={26} />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">No registrations yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-sm mx-auto">New applicants will appear here after they submit the registration form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {registrations.map((registration) => (
            <div key={registration.id} className="bg-white/80 border border-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{registration.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Registered {new Date(registration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {registration.linkedInUrl && (
                  <a
                    href={registration.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors shrink-0 shadow-xs"
                    aria-label="Open LinkedIn profile"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100">
                <a href={`mailto:${registration.email}`} className="flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 truncate">
                  <Mail size={14} className="mr-2 text-slate-400 shrink-0" />
                  <span className="truncate">{registration.email}</span>
                </a>
                <a href={`tel:${registration.phoneNo}`} className="flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 truncate">
                  <Phone size={14} className="mr-2 text-slate-400 shrink-0" />
                  <span className="truncate">{registration.phoneNo}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    {dialog}
    </>
  );
}
