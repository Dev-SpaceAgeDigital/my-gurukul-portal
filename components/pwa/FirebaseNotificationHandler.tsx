'use client';

import React, { useEffect, useState } from 'react';
import { requestFcmToken, listenToForegroundNotifications } from '@/lib/firebaseClient';
import { Bell, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function FirebaseNotificationHandler() {
  const [notification, setNotification] = useState<{
    title: string;
    body: string;
    icon?: string;
    link?: string | null;
  } | null>(null);

  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (!('Notification' in window)) {
        setPermissionState('unsupported');
        return;
      }

      setPermissionState(Notification.permission || 'default');

      // Initialize FCM Token & SW registration if permission is granted
      if (Notification.permission === 'granted') {
        requestFcmToken().catch(() => {});
      }

      const showInAppToast = (title: string, body: string, icon?: string, link?: string | null) => {
        setNotification({
          title,
          body,
          icon: icon || '/my-gurukul.png',
          link: link || null,
        });

        // Trigger native notification if allowed
        if (Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: icon || '/my-gurukul.png',
                badge: icon || '/my-gurukul.png',
                data: { url: link || '/' },
              });
            }).catch(() => {});
          }
        }

        // Auto-dismiss in-app toast after 7 seconds
        setTimeout(() => setNotification(null), 7000);
      };

      // 1. Listen for In-App Toast events triggered by database sync
      const handleAppToast = (e: any) => {
        const item = e.detail;
        if (!item) return;
        const logo = item.schoolLogo || item.trustLogo || '/my-gurukul.png';
        showInAppToast(item.title, item.message, logo, item.link);
      };
      window.addEventListener('app-notification-toast', handleAppToast);

      // 2. Listen for FCM foreground push notifications
      listenToForegroundNotifications((payload) => {
        try {
          const title = payload.notification?.title || payload.data?.title || 'EduTrust Alert';
          const body = payload.notification?.body || payload.data?.body || 'You have received a new update.';
          const icon = payload.notification?.icon || payload.data?.icon || '/my-gurukul.png';
          const link = payload.data?.link || payload.data?.url || null;

          showInAppToast(title, body, icon, link);
        } catch (innerErr) {
          console.error('Foreground notification parse error:', innerErr);
        }
      }).catch(() => {});

      return () => {
        window.removeEventListener('app-notification-toast', handleAppToast);
      };
    } catch (err) {
      console.warn('Push notification initialization skipped:', err);
      setPermissionState('unsupported');
    }
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      await requestFcmToken();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Foreground In-App Toast Banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-[calc(100vw-2.5rem)] sm:w-full bg-slate-900/95 text-white backdrop-blur-xl p-4 rounded-2xl border border-slate-700/80 shadow-2xl shadow-slate-950/40 animate-in slide-in-from-top-5 duration-300 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 mt-0.5">
            <Bell size={20} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">{notification.title}</h4>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-2 mt-0.5">{notification.body}</p>
            {notification.link && (
              <a
                href={notification.link}
                onClick={() => setNotification(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 mt-2 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close alert"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Permission Request Prompt Banner (if not yet granted and not dismissed) */}
      {!isDismissed && permissionState === 'default' && (
        <div className="fixed bottom-5 right-5 z-[9990] max-w-md w-[calc(100vw-2.5rem)] sm:w-full bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-blue-200/80 shadow-2xl shadow-blue-900/15 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Bell size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-slate-900 leading-tight">Allow Push Notifications</h5>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Stay updated with instant community & event alerts.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Allow'}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
