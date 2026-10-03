'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { requestFcmToken } from '@/lib/firebaseClient';

type NotificationBellProps = {
  role: 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI';
  variant?: 'subadmin' | 'default';
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  schoolLogo?: string | null;
  trustLogo?: string | null;
  schoolName?: string | null;
};

function formatTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Now';
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ role, variant = 'default' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const containerRef = useRef<HTMLDivElement>(null);

  const isFirstLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  const checkPushPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  };

  const handleEnablePush = async () => {
    const token = await requestFcmToken();
    checkPushPermission();
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const list: NotificationItem[] = data.notifications || [];
      
      // If new unread notifications arrive after initial load, pop up toast banner!
      if (!isFirstLoadRef.current && typeof window !== 'undefined') {
        const incomingUnread = list.filter(n => !n.isRead && !knownNotificationIdsRef.current.has(n.id));
        if (incomingUnread.length > 0) {
          incomingUnread.forEach(n => {
            window.dispatchEvent(new CustomEvent('app-notification-toast', { detail: n }));
          });
        }
      }

      knownNotificationIdsRef.current = new Set(list.map(n => n.id));
      isFirstLoadRef.current = false;
      setNotifications(list);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    checkPushPermission();
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const markRead = async (id: string, link?: string | null) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'read' }),
    }).catch(() => {});
    await loadNotifications();
    if (link) window.location.href = link;
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read-all' }),
    }).catch(() => {});
    await loadNotifications();
  };

  const isSubadminTopbar = variant === 'subadmin';
  const buttonClass = isSubadminTopbar
    ? 'relative p-2.5 bg-white/80 hover:bg-white border border-[#E6DFD3] rounded-xl text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm cursor-pointer group'
    : `relative p-2 transition-colors ${role === 'ALUMNI' ? 'text-slate-600 hover:text-blue-600' : 'text-slate-400 hover:text-[#3f72af]'}`;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button className={buttonClass} onClick={() => setOpen((value) => !value)} title="Notifications">
        <Bell size={isSubadminTopbar ? 17 : 20} className="transition-transform group-hover:scale-105" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-[85] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Container */}
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[22rem] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/15 z-[90] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white/80">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={15} />
                    <span className="hidden sm:inline text-[11px]">Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 sm:hidden cursor-pointer"
                  aria-label="Close notifications"
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            </div>

            {/* FCM Push Notification Permission Bar */}
            <div className="bg-slate-50/90 border-b border-slate-100 px-4 py-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 min-w-0">
                {pushPermission === 'granted' ? (
                  <>
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 truncate">Push Alerts Active</span>
                  </>
                ) : pushPermission === 'denied' ? (
                  <>
                    <ShieldAlert size={14} className="text-rose-500 shrink-0" />
                    <span className="text-rose-600 truncate">Push Blocked in Browser</span>
                  </>
                ) : (
                  <>
                    <Bell size={14} className="text-amber-500 shrink-0" />
                    <span className="truncate">Browser Push Disabled</span>
                  </>
                )}
              </span>

              {pushPermission !== 'granted' && pushPermission !== 'denied' && (
                <button
                  onClick={handleEnablePush}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Enable Push
                </button>
              )}
            </div>

            <div className="max-h-[min(65vh,420px)] overflow-y-auto divide-y divide-slate-100/80">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center text-xs font-semibold text-slate-500">
                  <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const logoSrc = item.schoolLogo || item.trustLogo || '/my-gurukul.png';
                  return (
                    <button
                      key={item.id}
                      onClick={() => markRead(item.id, item.link)}
                      className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 cursor-pointer ${
                        item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50/80'
                      }`}
                    >
                      <img
                        src={logoSrc}
                        alt="School Logo"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 leading-snug truncate">{item.title}</p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">{formatTime(item.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{item.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400">{item.type}</span>
                          {!item.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
