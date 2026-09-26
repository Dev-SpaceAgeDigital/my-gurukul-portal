'use client';

import React, { useRef, useEffect } from 'react';
import { X, Sparkles, Trophy, BookOpen, Briefcase, GraduationCap, Handshake, ChevronRight } from 'lucide-react';

interface CreatePostSubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'achievement' | 'story' | 'job' | 'internship' | 'mentorship') => void;
}

export default function CreatePostSubmenu({ isOpen, onClose, onSelectType }: CreatePostSubmenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const options = [
    {
      id: 'job' as const,
      title: 'Add Job',
      icon: Briefcase,
      color: 'bg-emerald-600 text-white',
      lightBg: 'bg-emerald-50/80 hover:bg-emerald-100',
      borderColor: 'border-emerald-200/80',
      textColor: 'text-emerald-900',
    },
    {
      id: 'internship' as const,
      title: 'Add Internship',
      icon: GraduationCap,
      color: 'bg-teal-600 text-white',
      lightBg: 'bg-teal-50/80 hover:bg-teal-100',
      borderColor: 'border-teal-200/80',
      textColor: 'text-teal-900',
    },
    {
      id: 'mentorship' as const,
      title: 'Offer Mentorship',
      icon: Handshake,
      color: 'bg-indigo-600 text-white',
      lightBg: 'bg-indigo-50/80 hover:bg-indigo-100',
      borderColor: 'border-indigo-200/80',
      textColor: 'text-indigo-900',
    },
    {
      id: 'story' as const,
      title: 'Add Story / Blog',
      icon: BookOpen,
      color: 'bg-sky-600 text-white',
      lightBg: 'bg-sky-50/80 hover:bg-sky-100',
      borderColor: 'border-sky-200/80',
      textColor: 'text-sky-900',
    },
    {
      id: 'achievement' as const,
      title: 'Add Achievement',
      icon: Trophy,
      color: 'bg-amber-500 text-white',
      lightBg: 'bg-amber-50/80 hover:bg-amber-100',
      borderColor: 'border-amber-200/80',
      textColor: 'text-amber-900',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl p-3.5 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Submenu Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={13} className="animate-pulse" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Create & Share</h4>
        </div>

        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* 2x2 Action Icons Grid (Icon + Label Only) */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => {
                onSelectType(opt.id);
                onClose();
              }}
              className={`p-3 rounded-2xl border ${opt.borderColor} ${opt.lightBg} transition-all duration-200 flex items-center gap-2.5 group cursor-pointer hover:scale-[1.02] shadow-sm`}
            >
              <div className={`w-8 h-8 rounded-xl ${opt.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={16} />
              </div>
              <span className={`font-extrabold text-xs ${opt.textColor} leading-tight text-left`}>
                {opt.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
