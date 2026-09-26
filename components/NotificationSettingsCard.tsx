'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, ShieldAlert, Smartphone, Check, Loader2, Info } from 'lucide-react';
import { requestFcmToken } from '@/lib/firebaseClient';

export default function NotificationSettingsCard() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkStatus = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const token = await requestFcmToken();
      checkStatus();
      if (token) {
        setStatusMessage('Browser push notifications enabled successfully!');
      } else if (Notification.permission === 'denied') {
        setStatusMessage('Permission was denied in your browser. Please reset permissions in browser settings.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-7 shadow-xl shadow-blue-900/5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            permission === 'granted'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : permission === 'denied'
              ? 'bg-rose-50 text-rose-600 border-rose-100'
              : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {permission === 'granted' ? (
              <ShieldCheck size={22} />
            ) : permission === 'denied' ? (
              <ShieldAlert size={22} />
            ) : (
              <Bell size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Push Notifications
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                permission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : permission === 'denied'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {permission === 'granted' ? 'Active' : permission === 'denied' ? 'Blocked' : 'Not Enabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Receive real-time alerts for community posts, mentorship requests, and institutional announcements.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {permission === 'granted' ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/80 border border-emerald-200/80 px-4 py-2.5 rounded-xl">
              <Check size={14} />
              <span>Notifications Allowed</span>
            </div>
          ) : permission === 'denied' ? (
            <div className="text-right">
              <span className="text-[11px] font-bold text-rose-600 block">Blocked in Browser</span>
              <span className="text-[10px] text-slate-400">Click 🔒 lock icon in URL bar to Allow</span>
            </div>
          ) : (
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              <span>{loading ? 'Requesting...' : 'Allow Notifications'}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
          <Info size={14} className="text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
