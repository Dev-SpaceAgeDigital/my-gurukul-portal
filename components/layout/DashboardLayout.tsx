'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  Search,
  Settings,
  User,
  ChevronDown,
  LayoutDashboard,
  Building2,
  School,
  Users,
  GraduationCap,
  Moon,
  Sun,
  Shield,
  Activity,
  Layers,
  UserCog,
  History,
  Globe,
  Briefcase,
  UserCheck,
  Sparkles,
  Wallet,
  Calendar,
  ArrowUpCircle,
  UserSearch,
  Handshake,
  Trophy,
  BookOpen,
  Heart,
  PieChart,
  Newspaper,
  Plus,
  Mail,
  FileCheck2,
  Camera
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import CreatePostModal from '../dashboard/alumni/CreatePostModal';
import { requestFcmPermissionAndRegister } from '@/lib/firebaseClient';

interface DashboardLayoutProps {
  title: string;
  role: 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI';
  activeItem?: string;
  onNavigate?: (item: string) => void;
  children: React.ReactNode;
}

const TAB_BADGE_MAP: Record<string, string> = {
  'Community Feed': 'feed',
  'School Memories': 'memories',
  'Give Back': 'giveBack',
  'My Posts': 'myPosts',
  'My Impact': 'impact',
};

export default function DashboardLayout({ title, role, activeItem: externalActiveItem, onNavigate, children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [internalActiveItem, setInternalActiveItem] = useState('Dashboard');
  const [greeting, setGreeting] = useState('Welcome back');
  const [tabBadges, setTabBadges] = useState<Record<string, number>>({});
  const [adminBadges, setAdminBadges] = useState<Record<string, number>>({});
  const activeItem = externalActiveItem || internalActiveItem;
  const router = useRouter();

  const [tenantInfo, setTenantInfo] = useState<{ logoUrl: string; name: string; trustName?: string } | null>(null);

  const fetchAdminBadges = async () => {
    if (role !== 'SUPER_ADMIN' && role !== 'SUB_ADMIN') return;
    try {
      const res = await fetch('/api/admin/nav-badges');
      if (res.ok) {
        const data = await res.json();
        if (data?.badges) {
          setAdminBadges(data.badges);
        }
      }
    } catch { }
  };

  const fetchTabBadges = async () => {
    if (role !== 'ALUMNI') return;
    try {
      const feedSince = typeof window !== 'undefined' ? localStorage.getItem('alumni_visited_feed') : null;
      const memoriesSince = typeof window !== 'undefined' ? localStorage.getItem('alumni_visited_memories') : null;
      const giveBackSince = typeof window !== 'undefined' ? localStorage.getItem('alumni_visited_giveBack') : null;
      const myPostsSince = typeof window !== 'undefined' ? localStorage.getItem('alumni_visited_myPosts') : null;
      const impactSince = typeof window !== 'undefined' ? localStorage.getItem('alumni_visited_impact') : null;

      const params = new URLSearchParams();
      if (feedSince) params.set('feedSince', feedSince);
      if (memoriesSince) params.set('memoriesSince', memoriesSince);
      if (giveBackSince) params.set('giveBackSince', giveBackSince);
      if (myPostsSince) params.set('myPostsSince', myPostsSince);
      if (impactSince) params.set('impactSince', impactSince);

      const res = await fetch(`/api/alumni/tab-badges?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTabBadges(data || {});
      }
    } catch { }
  };

  const markTabVisited = (tabName: string) => {
    const badgeKey = TAB_BADGE_MAP[tabName];
    if (badgeKey && typeof window !== 'undefined') {
      localStorage.setItem(`alumni_visited_${badgeKey}`, Date.now().toString());
      setTabBadges(prev => ({ ...prev, [badgeKey]: 0 }));
    }
  };

  useEffect(() => {
    if (activeItem) {
      markTabVisited(activeItem);
    }
  }, [activeItem]);

  useEffect(() => {
    if (role === 'ALUMNI') {
      fetchTabBadges();
      const interval = setInterval(fetchTabBadges, 30000);
      return () => clearInterval(interval);
    } else if (role === 'SUPER_ADMIN' || role === 'SUB_ADMIN') {
      fetchAdminBadges();
      const interval = setInterval(fetchAdminBadges, 25000);
      return () => clearInterval(interval);
    }
  }, [role]);

  useEffect(() => {
    // 1. Fetch authenticated user profile
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (!data.error) {
        setUserData(data);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          requestFcmPermissionAndRegister().catch(() => {});
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
      }
    }).catch(() => { });

    // 2. Fetch tenant branding (Trust / School Name & Logo for White-Labeling)
    fetch('/api/public/tenant-info').then(res => res.json()).then(tData => {
      if (tData?.success) {
        const brand = {
          name: tData.name || 'Educational Platform',
          logoUrl: tData.logoUrl || '/my-gurukul.png',
          trustName: tData.trustName
        };
        setTenantInfo(brand);

        // Dynamically update Chrome Tab Title
        const portalLabel = role === 'SUPER_ADMIN' ? 'Governance' : role === 'SUB_ADMIN' ? 'School Admin' : 'Alumni Hub';
        const pageLabel = activeItem || title || portalLabel;
        document.title = `${brand.name} - ${pageLabel}`;

        // Dynamically update Tab Favicon
        if (brand.logoUrl && brand.logoUrl !== '/my-gurukul.png') {
          const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (link) {
            link.href = brand.logoUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = brand.logoUrl;
            document.head.appendChild(newLink);
          }
        }
      }
    }).catch(() => {});

    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [activeItem, title, role]);

  const getHeaderTitle = () => {
    if (activeItem === 'Dashboard') {
      const name = userData?.name ? userData.name.split(' ')[0] : (role === 'SUPER_ADMIN' ? 'Admin' : role === 'SUB_ADMIN' ? 'Officer' : 'Alumni');
      return `${greeting}, ${name} 👋`;
    }
    return activeItem || title;
  };

  const handleNavigate = (item: string) => {
    markTabVisited(item);
    if (onNavigate) {
      onNavigate(item);
    } else {
      setInternalActiveItem(item);
      const rolePath = role.toLowerCase().replace('_', '');
      if (item === 'Dashboard') {
        router.push(`/${rolePath}/dashboard`);
      } else {
        const routeMap: Record<string, string> = {
          'Subadmins': 'subadmin',
          'Schools': 'school',
          'Trusts': 'trust',
          'Academic Years': 'academic-year',
          'Mission Stats': 'mission-stats',
          'Monitoring': 'monitoring',
          'Alumni Communication': 'alumni-communication',
          'Alumni': 'alumni',
          'Profile': 'profile',
          'Careers': 'careers',
          'Mentorship': 'mentorship',
          'Academic': 'academic',
          'Accounts': 'accounts',
          'Donations': 'donations',
          'Donations & Projects': 'donations',
          'Students': 'students',
          'Promotion': 'promotion',
          'Events': 'events',
          'Events & Memories': 'events',
          'School Memories': 'dashboard?tab=memories',
          'Updates': 'updates',
          'School Page': 'school-page',
          'School Hub': 'school-hub',
          'Class Setup': 'class-setup',
          'CSR Management': 'csr',
          '80G Requests': '80g-requests'
        };
        const path = routeMap[item];
        if (path) {
          router.push(`/${rolePath}/${path}`);
        }
      }
    }
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push(`/${role.toLowerCase().replace('_', '')}/login`);
      router.refresh();
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, role: ['SUPER_ADMIN', 'SUB_ADMIN', 'ALUMNI'] },
    { name: 'Community Feed', icon: <Sparkles size={18} />, role: ['ALUMNI'] },
    { name: 'School Memories', icon: <Camera size={18} />, role: ['ALUMNI'] },
    { name: 'My Posts', icon: <Plus size={18} />, role: ['ALUMNI'] },
    { name: 'Find Alumni', icon: <UserSearch size={18} />, role: ['ALUMNI'] },
    { name: 'Give Back', icon: <Heart size={18} />, role: ['ALUMNI'] },
    { name: 'CSR Referrals', icon: <Handshake size={18} />, role: ['ALUMNI'] },
    { name: 'My Impact', icon: <PieChart size={18} />, role: ['ALUMNI'] },
    { name: 'Trusts', icon: <Building2 size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Schools', icon: <School size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Mission Stats', icon: <Activity size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Donations & Projects', icon: <Wallet size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Monitoring', icon: <Shield size={18} />, role: ['SUPER_ADMIN', 'SUB_ADMIN'] },
    { name: 'Alumni Communication', icon: <Mail size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Events & Memories', icon: <Camera size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'CSR Management', icon: <Handshake size={18} />, role: ['SUPER_ADMIN', 'SUB_ADMIN'] },
    { name: 'Updates', icon: <Newspaper size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'School Hub', icon: <BookOpen size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Class Setup', icon: <Sparkles size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Academic', icon: <Layers size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Accounts', icon: <Wallet size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Donations', icon: <History size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Students', icon: <Users size={18} />, role: ['SUPER_ADMIN', 'SUB_ADMIN'] },
    { name: 'Alumni', icon: <GraduationCap size={18} />, role: ['SUB_ADMIN'] },
    { name: 'Subadmins', icon: <UserCog size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Academic Years', icon: <Calendar size={18} />, role: ['SUPER_ADMIN'] },
    { name: '80G Requests', icon: <FileCheck2 size={18} />, role: ['SUPER_ADMIN'] },
    { name: 'Promotion', icon: <ArrowUpCircle size={18} />, role: ['SUB_ADMIN'] },
  ].filter(item => item.role.includes(role));

  const getLayoutColors = () => {
    switch (role) {
      case 'SUB_ADMIN': return {
        sidebar: 'bg-gradient-to-br from-[#1b4a50] via-[#143d43] to-[#0d2a4a] text-white border-r border-[#215B63]/20 shadow-2xl',
        active: 'text-white',
        hover: 'hover:bg-white/5 text-slate-300 hover:text-[#AAFFC7]',
        logoBg: 'bg-[#AAFFC7]/15'
      };
      case 'ALUMNI': return {
        sidebar: 'bg-white/30 text-slate-700',
        active: 'bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/10',
        hover: 'hover:bg-white/20 text-slate-600 hover:text-slate-900',
        logoBg: 'bg-blue-500/10'
      };
      default: return {
        sidebar: 'bg-[#0b1525] rounded-r-[32px] border-r-0',
        active: 'bg-[#3f72af]/85 text-white rounded-xl shadow-md shadow-[#3f72af]/10',
        hover: 'hover:bg-white/10 text-slate-300 hover:text-white',
        logoBg: 'bg-white/10'
      };
    }
  };

  const formatGreetingDate = () => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return new Date().toLocaleDateString('en-US', options);
    } catch (e) {
      return '';
    }
  };

  const colors = getLayoutColors();

  return (
    <div className={`h-[100dvh] min-h-[100dvh] overflow-hidden ${role === 'SUPER_ADMIN'
      ? 'bg-gradient-to-br from-[#ebf2f7] via-[#f1f6fa] to-[#f7fbfd]'
      : role === 'SUB_ADMIN'
        ? 'bg-subadmin-gradient'
        : role === 'ALUMNI'
          ? 'bg-gradient-to-tr from-[#5a8ba8] via-[#a8c3d4] to-[#e1e9ee]'
          : 'bg-[#F1F5F9]'
      } ${role === 'SUB_ADMIN' ? 'subadmin-portal' : ''} text-slate-900 font-inter antialiased overflow-x-clip`}>

      {role === 'SUB_ADMIN' ? (
        <div className="flex flex-col h-full min-h-0">
          {/* Horizontal Topbar */}
          <header className="sticky top-0 z-50 shrink-0 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4">
            {/* Logo Section (Left-aligned) */}
            <div className="flex items-center cursor-pointer shrink-0" onClick={() => handleNavigate('Dashboard')}>
              <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                <Image src={tenantInfo?.logoUrl || userData?.logoUrl || "/my-gurukul.png"} alt="Logo" fill className="object-contain p-1" priority />
              </div>
            </div>

            {/* Centered Navigation Tabs */}
            <nav className="hidden lg:flex items-center justify-center flex-1 mx-4 min-w-0 overflow-x-auto no-scrollbar py-1">
              <div className="inline-flex items-center rounded-xl border border-[#E6DFD3]/70 bg-white/80 backdrop-blur-md px-2 py-1.5 gap-1.5 shadow-sm max-w-full overflow-x-auto no-scrollbar">
                {menuItems.map((item) => {
                  const badgeCount = adminBadges[item.name] || 0;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigate(item.name)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                        activeItem === item.name
                          ? 'bg-[#18181b] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-[#E4E0D5]/70 hover:text-slate-900'
                      }`}
                    >
                      <span>{item.name}</span>
                      {badgeCount > 0 && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full shadow-xs ${
                          activeItem === item.name 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-rose-500 text-white animate-pulse'
                        }`}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Right Accessories */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 bg-white border border-[#E6DFD3] rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm lg:hidden cursor-pointer"
              >
                <Menu size={16} />
              </button>

              {(role as string) === 'ALUMNI' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Create</span>
                </button>
              )}

              <NotificationBell role={role} variant="subadmin" />

              <div className="h-6 w-px bg-[#E6DFD3] hidden md:block"></div>

              {/* Profile Info & Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 bg-white/80 hover:bg-white border border-[#E6DFD3] rounded-xl transition-all shadow-sm group cursor-pointer"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#18181b] to-[#27272a] text-white font-bold text-xs flex items-center justify-center border border-[#E6DFD3] shadow-inner shrink-0">
                    {userData?.profilePic ? (
                      <img src={userData.profilePic} alt={userData.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      userData?.name ? userData.name[0].toUpperCase() : 'S'
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                      {userData?.name || 'Sub Admin'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 max-w-[120px] truncate">
                      {userData?.schoolName || 'Officer'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Backdrop to dismiss dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                        <p className="text-xs font-bold text-slate-900 truncate">{userData?.name || 'Sub Admin'}</p>
                        <p className="text-[11px] font-medium text-slate-500 truncate">{userData?.email || ''}</p>
                        {(userData?.schoolName || userData?.trustName) && (
                          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-bold truncate max-w-full">
                            {userData.schoolName || userData.trustName}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleNavigate('Profile');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-2 cursor-pointer"
                      >
                        <User size={14} className="text-slate-500" />
                        <span>Profile Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 border-t border-slate-100 cursor-pointer"
                      >
                        <LogOut size={14} className="text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
              {/* Drawer */}
              <div className="fixed inset-y-0 right-0 w-72 bg-[#FAF7F0] p-6 shadow-2xl flex flex-col justify-between border-l border-[#E6DFD3] animate-in slide-in-from-right duration-300">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-slate-900 text-sm">Navigation</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
                      <X size={18} />
                    </button>
                  </div>
                  <nav className="flex flex-col space-y-2">
                    {menuItems.map((item) => {
                      const badgeCount = adminBadges[item.name] || 0;
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigate(item.name)}
                          className={`w-full flex items-center justify-between px-5 py-3 rounded-full text-xs font-semibold transition-all ${
                            activeItem === item.name
                              ? 'bg-[#18181b] text-white shadow-sm'
                              : 'bg-white/60 border border-[#E6DFD3]/30 text-slate-700 hover:bg-[#EFECE5]'
                          }`}
                        >
                          <span>{item.name}</span>
                          {badgeCount > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-xs">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-all">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-4 md:px-8 py-6 lg:py-4 flex flex-col w-full mx-auto">

            <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <>
          {/* Mobile Backdrop */}
          {role !== 'ALUMNI' && isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Minimalist Bottom Dock (Alumni Portal Only - 100% Mobile Responsive) */}
          {role === 'ALUMNI' && (
            <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none w-full max-w-[94vw] sm:max-w-lg px-2 sm:px-4">
              <div className="flex items-center space-x-1 sm:space-x-1.5 bg-white/75 sm:bg-white/40 backdrop-blur-xl border border-white/80 shadow-2xl rounded-full px-3 sm:px-4 py-1.5 sm:py-2 pointer-events-auto transition-all overflow-visible max-w-full">
                {menuItems.map((item) => {
                  const isActive = activeItem === item.name;
                  const badgeKey = TAB_BADGE_MAP[item.name];
                  const badgeCount = badgeKey ? (tabBadges[badgeKey] || 0) : 0;

                  return (
                    <div key={item.name} className="relative group shrink-0">
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 whitespace-nowrap shadow-lg">
                        {item.name}
                        {badgeCount > 0 && !isActive && (
                          <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] text-white">
                            {badgeCount}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleNavigate(item.name)}
                        aria-label={item.name}
                        title={item.name}
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 relative ${isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/30 hover:scale-105'
                          }`}
                      >
                        {item.icon}
                        {badgeCount > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sidebar - Clean & Sober */}
          {role !== 'ALUMNI' && (
            <aside className={`fixed z-[60] transition-all duration-300 ease-in-out 
              top-0 left-0 h-full shadow-xl
              ${colors.sidebar}
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
              ${isSidebarOpen ? 'w-64' : 'lg:w-20 w-64'} flex flex-col`}>

              {/* Simple Logo Section */}
              <div className={`h-20 flex items-center transition-all duration-300 ease-in-out ${isSidebarOpen ? 'px-6' : 'px-4'} ${role === 'SUPER_ADMIN' ? '' : 'border-b border-white/5'} relative z-10`}>
                <div className="flex items-center space-x-3">
                  <div className={`relative w-12 h-12 flex items-center justify-center shrink-0 rounded-md ${colors.logoBg}`}>
                    <Image src={tenantInfo?.logoUrl || userData?.logoUrl || "/my-gurukul.png"} alt="Logo" fill className="object-contain" priority />
                  </div>
                  {isSidebarOpen && (
                    <span className="text-white font-bold tracking-tight text-sm truncate max-w-[140px]">
                      {userData?.schoolName || userData?.trustName || tenantInfo?.name || 'My Gurukul'}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items - Small Text */}
              <div className="flex-1 px-3 py-6 overflow-y-auto space-y-4 relative z-10 scrollbar-none">
                <div>
                  <nav className="space-y-1">
                    {menuItems.map((item) => {
                      const badgeCount = adminBadges[item.name] || 0;
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigate(item.name)}
                          className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                            activeItem === item.name
                              ? colors.active
                              : `${colors.hover} hover:text-slate-900`
                          }`}
                        >
                          <div className="flex-shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-105">
                            {item.icon}
                            {badgeCount > 0 && !isSidebarOpen && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-white animate-pulse">
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                          </div>
                          {isSidebarOpen && (
                            <div className="ml-3 flex-1 flex items-center justify-between min-w-0 relative z-10">
                              <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap truncate transition-transform duration-200 group-hover:translate-x-0.5">
                                {item.name}
                              </span>
                              {badgeCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-xs animate-pulse shrink-0">
                                  {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className={`p-4 mt-auto mb-2 relative z-10`}>
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full bg-black border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {userData?.name ? userData.name[0] : 'S'}
                    </div>
                    {isSidebarOpen && (
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-[13px] font-medium"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    )}
                  </div>
                  {!isSidebarOpen && (
                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-lg bg-black/40 text-slate-400 hover:text-white transition-colors`}
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <main className={`transition-all duration-300 ease-in-out 
            ${role === 'ALUMNI'
              ? 'lg:pl-0 pl-0 pb-16 sm:pb-20'
              : (isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20')
            } 
            h-full min-h-0 overflow-hidden flex flex-col w-full`}>

            {/* Topbar - Premium & Glassmorphic */}
            <header className={`sticky top-0 z-40 h-16 sm:h-20 shrink-0 px-4 md:px-6 transition-all ${role === 'ALUMNI'
                ? 'bg-transparent border-b-0 shadow-none'
                : 'bg-white/70 backdrop-blur-md border-b border-slate-200/50 shadow-sm'
              }`}>
              <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-4">
                  {role !== 'ALUMNI' && (
                  <>
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
                    >
                      <Menu size={20} />
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-2 transition-all hidden lg:flex items-center justify-center rounded-lg border border-slate-200 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-sm"
                    >
                      {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </>
                )}
                <h2 className="text-lg md:text-xl font-bold text-[#0b1525]">{getHeaderTitle()}</h2>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative group hidden md:block">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`text-sm outline-none transition-all pl-9 pr-4 py-2 w-64 ${role === 'ALUMNI'
                      ? 'bg-white/50 hover:bg-white/70 focus:bg-white border border-white/60 rounded-xl focus:ring-1 focus:ring-blue-500/30 text-slate-700 placeholder-slate-400 shadow-sm'
                      : 'bg-[#EBF2F7]/80 hover:bg-[#EBF2F7] focus:bg-white border-0 rounded-xl focus:ring-1 focus:ring-[#3f72af]/30 text-slate-700 placeholder-slate-400'
                      }`}
                  />
                </div>

                <NotificationBell role={role} />

                <div className="h-6 w-px bg-slate-200/80 mx-1"></div>

                {/* Profile & Dropdown */}
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                      role === 'ALUMNI' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-[#0b1525] hover:bg-[#16325c] text-white shadow-sm'
                    }`}
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  >
                    {userData?.profilePic ? (
                      <img src={userData.profilePic} alt={userData.name || 'Profile'} className="w-full h-full object-cover" />
                    ) : (
                      userData?.name ? userData.name[0].toUpperCase() : (role === 'ALUMNI' ? 'A' : 'S')
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                          <p className="text-xs font-bold text-slate-900 truncate">{userData?.name || (role === 'ALUMNI' ? 'Alumni User' : 'Admin User')}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate">{userData?.email || ''}</p>
                          {(userData?.schoolName || userData?.trustName) && (
                            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/70 text-[10px] font-bold truncate max-w-full">
                              {userData.schoolName || userData.trustName}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleNavigate('Profile');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center space-x-2 cursor-pointer"
                        >
                          <User size={14} className="text-slate-500" />
                          <span>Profile Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 border-t border-slate-100 cursor-pointer"
                        >
                          <LogOut size={14} className="text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              </div>
            </header>

            {/* Content Body - Clean Workspace */}
            <section className={`px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${role === 'ALUMNI' ? 'pb-10 sm:pb-12' : 'pb-10'}`}>
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </section>
          </main>
        </>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.9;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 8px 16px -4px rgba(103, 192, 144, 0.3);
          }
          50% {
            opacity: 1;
            box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.25), 0 12px 24px -2px rgba(103, 192, 144, 0.5);
          }
        }

        @keyframes scale-y-bar {
          0% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        .animate-scale-y {
          animation: scale-y-bar 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .subadmin-sidebar-pattern {
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(135deg, rgba(103, 192, 144, 0.03) 0%, transparent 50%, rgba(18, 65, 112, 0.05) 100%);
          background-size: 16px 16px, 100% 100%;
        }
      `}</style>
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelectType={() => {
          handleNavigate('My Posts');
        }}
      />
    </div>
  );
}
