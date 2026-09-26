'use client';

import React, { useState } from 'react';
import { X, Sparkles, Trophy, BookOpen, Briefcase, Handshake, CheckCircle2, ArrowRight } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'achievement' | 'story' | 'job' | 'mentorship') => void;
}

export default function CreatePostModal({ isOpen, onClose, onSelectType }: CreatePostModalProps) {
  if (!isOpen) return null;

  const options = [
    {
      id: 'achievement' as const,
      title: 'Share Achievement',
      badge: 'Highlights & Milestones',
      description: 'Promotions, awards, degrees, published research, or career achievements.',
      icon: Trophy,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      textColor: 'text-amber-700',
    },
    {
      id: 'story' as const,
      title: 'Post Story / Blog',
      badge: 'Alumni Articles',
      description: 'Inspirational journeys, student memories, industry tips, and thought pieces.',
      icon: BookOpen,
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      textColor: 'text-blue-700',
    },
    {
      id: 'job' as const,
      title: 'Post Job or Internship',
      badge: 'Career Board',
      description: 'Share hiring opportunities, referrals, or internships at your company.',
      icon: Briefcase,
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      textColor: 'text-emerald-700',
    },
    {
      id: 'mentorship' as const,
      title: 'Offer Mentorship',
      badge: 'Student Guidance',
      description: 'Offer 1-on-1 career guidance, resume reviews, or interview prep sessions.',
      icon: Handshake,
      color: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Create & Share</h3>
              <p className="text-xs text-slate-500 font-medium">Select what you would like to share with the community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectType(opt.id);
                  onClose();
                }}
                className={`p-5 rounded-2xl border ${opt.borderColor} ${opt.hoverBorder} ${opt.lightBg} hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between group relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 ${opt.textColor} border border-slate-100 uppercase tracking-wider`}>
                      {opt.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                  <span>Open Form</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Approved posts are published to the Madni Alumni feed
          </span>
          <button onClick={onClose} className="hover:underline font-bold text-slate-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
