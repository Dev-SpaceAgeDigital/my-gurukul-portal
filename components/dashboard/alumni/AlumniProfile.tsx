'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Briefcase,
  Globe,
  Camera,
  Save,
  Loader2,
  FileText,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  School,
  Building2,
  Tag,
  Phone,
  MapPin,
  KeyRound,
  Lock,
  Edit3,
  CheckCircle2,
  X
} from 'lucide-react';
import Image from 'next/image';
import { usePortalDialog } from '@/components/ui/PortalDialog';
import TwoFactorAuthSetupCard from '@/components/TwoFactorAuthSetupCard';
import TwoFactorAuthVerifyModal from '@/components/TwoFactorAuthVerifyModal';
import NotificationSettingsCard from '@/components/NotificationSettingsCard';

import {
  getCountryList,
  getCountryCodeList,
  getStatesByCountry,
  getCitiesByState
} from '@/lib/data/locationData';

function AlumniProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-28 animate-pulse sm:space-y-6 sm:pb-16">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100/50">
        <div className="space-y-2">
          <div className="h-6 sm:h-8 w-48 rounded-full bg-slate-200/80" />
          <div className="h-3 sm:h-4 w-72 max-w-full rounded-full bg-slate-200/60" />
        </div>
      </div>

      {/* Grid: Left column (cards) & Right column (form) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        
        {/* Left column skeleton */}
        <div className="order-2 lg:order-1 space-y-4 sm:space-y-6 mt-2 lg:mt-0">
          {/* ID Card Preview */}
          <div className="bg-white/70 backdrop-blur-xl p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/80 shadow-xl shadow-blue-900/5 space-y-4">
            <div className="h-12 w-12 mx-auto rounded-xl bg-slate-200/70" />
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-slate-200/80 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded-full bg-slate-200/80" />
                <div className="h-3 w-1/2 rounded-full bg-blue-100" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded-full bg-slate-200/60" />
              <div className="h-3 w-4/5 rounded-full bg-slate-200/60" />
            </div>
          </div>

          {/* Push Notification Skeleton */}
          <div className="bg-white/70 backdrop-blur-xl p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/80 shadow-xl shadow-blue-900/5 h-28" />

          {/* 2FA Card Skeleton */}
          <div className="bg-white/70 backdrop-blur-xl p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/80 shadow-xl shadow-blue-900/5 h-36" />
        </div>

        {/* Right column skeleton: Form */}
        <div className="order-1 lg:order-2 lg:col-span-2 bg-white/70 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-white/80 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-slate-200/80 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 rounded-full bg-slate-200/80" />
              <div className="h-3 w-48 rounded-full bg-slate-200/60" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-11 rounded-xl bg-slate-100" />
            <div className="h-11 rounded-xl bg-slate-100" />
            <div className="h-11 rounded-xl bg-slate-100" />
            <div className="h-11 rounded-xl bg-slate-100" />
          </div>

          <div className="h-24 rounded-xl bg-slate-100" />

          <div className="flex justify-end pt-2">
            <div className="h-11 w-36 rounded-xl bg-blue-200/70" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AlumniProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { dialog, showAlert } = usePortalDialog();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    batchYear: '',
    schoolName: '',
    schoolLogo: '/madni-logo.png',
    currentTitle: '',
    industry: '',
    phone: '',
    countryCode: '+91',
    country: 'India',
    state: '',
    city: '',
    currentBio: '',
    workLink: '',
    linkedIn: '',
    profilePic: '',
    is2FAEnabled: false
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // ─── Step-Up 2FA Security Modal States ───
  const [activeSecurityModal, setActiveSecurityModal] = useState<'EMAIL' | 'PHONE' | 'PASSWORD' | null>(null);
  const [is2FAChallengeOpen, setIs2FAChallengeOpen] = useState(false);
  const [credentialFormError, setCredentialFormError] = useState('');

  // Credential input states
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('+91');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/alumni/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          batchYear: data.batchYear || '',
          schoolName: data.schoolName || '',
          schoolLogo: data.logoUrl || data.schoolLogo || '/madni-logo.png',
          currentTitle: data.currentTitle || '',
          industry: data.industry || '',
          phone: data.phone || '',
          countryCode: data.countryCode || '+91',
          country: data.country || 'India',
          state: data.state || '',
          city: data.city || '',
          currentBio: data.currentBio || '',
          workLink: data.workLink || '',
          linkedIn: data.linkedIn || '',
          profilePic: data.profilePic || '',
          is2FAEnabled: !!data.twoFactorEnabled
        });
        if (data.profilePic) setPreviewImage(data.profilePic);
      }
    } catch (err) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (selectedCountry: string) => {
    const countryList = getCountryList();
    const matched = countryList.find(c => c.name === selectedCountry);
    const newCountryCode = matched ? matched.code : profile.countryCode;
    const availableStates = getStatesByCountry(selectedCountry);
    const isStateValid = availableStates.includes(profile.state);
    const newState = isStateValid ? profile.state : (availableStates[0] || '');
    const availableCities = getCitiesByState(selectedCountry, newState);
    const isCityValid = availableCities.includes(profile.city);
    const newCity = isCityValid ? profile.city : '';

    setProfile(prev => ({
      ...prev,
      country: selectedCountry,
      countryCode: newCountryCode,
      state: newState,
      city: newCity
    }));
  };

  const handleStateChange = (selectedState: string) => {
    const availableCities = getCitiesByState(profile.country, selectedState);
    const isCityValid = availableCities.includes(profile.city);
    const newCity = isCityValid ? profile.city : '';

    setProfile(prev => ({
      ...prev,
      state: selectedState,
      city: newCity
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewImage(URL.createObjectURL(selectedFile));
    }
  };

  // Standard non-sensitive profile update (Title, Bio, Location, Links, Pic)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('currentTitle', profile.currentTitle || '');
    formData.append('industry', profile.industry || '');
    formData.append('country', profile.country || '');
    formData.append('state', profile.state || '');
    formData.append('city', profile.city || '');
    formData.append('currentBio', profile.currentBio || '');
    formData.append('workLink', profile.workLink || '');
    formData.append('linkedIn', profile.linkedIn || '');
    formData.append('existingProfilePic', profile.profilePic || '');
    if (file) {
      formData.append('profilePic', file);
    }

    try {
      const res = await fetch('/api/alumni/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => ({
          ...prev,
          name: updated.name || prev.name,
          currentTitle: updated.currentTitle || '',
          industry: updated.industry || '',
          country: updated.country || '',
          state: updated.state || '',
          city: updated.city || '',
          currentBio: updated.currentBio || '',
          workLink: updated.workLink || '',
          linkedIn: updated.linkedIn || '',
          profilePic: updated.profilePic || ''
        }));
        showAlert({
          title: 'Profile synchronized',
          message: 'Professional identity & location details synchronized successfully.',
          variant: 'success',
        });
      } else {
        const err = await res.json();
        showAlert({ title: 'Synchronization failed', message: err.error || 'Professional profile could not be updated.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network transition error', message: 'Please check your connection and try again.', variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Step-Up 2FA Credential Submission ───
  const initiateCredentialChange = (type: 'EMAIL' | 'PHONE' | 'PASSWORD') => {
    setCredentialFormError('');
    if (type === 'EMAIL') setNewEmail('');
    if (type === 'PHONE') {
      setNewPhone('');
      setNewCountryCode(profile.countryCode || '+91');
    }
    if (type === 'PASSWORD') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setActiveSecurityModal(type);
  };

  const handleOpen2FAChallenge = () => {
    setCredentialFormError('');
    if (activeSecurityModal === 'EMAIL') {
      if (!newEmail || !newEmail.includes('@')) {
        setCredentialFormError('Please enter a valid email address.');
        return;
      }
    }
    if (activeSecurityModal === 'PHONE') {
      if (!newPhone || newPhone.length < 5) {
        setCredentialFormError('Please enter a valid phone number.');
        return;
      }
    }
    if (activeSecurityModal === 'PASSWORD') {
      if (!newPassword || newPassword.length < 6) {
        setCredentialFormError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredentialFormError('New password and confirm password do not match.');
        return;
      }
    }

    setIs2FAChallengeOpen(true);
  };

  const handleExecute2FAUpdate = async (totpCode: string) => {
    let payload: any = {
      changeType: activeSecurityModal,
      totpCode
    };

    if (activeSecurityModal === 'EMAIL') payload.email = newEmail;
    if (activeSecurityModal === 'PHONE') {
      payload.phone = newPhone;
      payload.countryCode = newCountryCode;
    }
    if (activeSecurityModal === 'PASSWORD') {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const res = await fetch('/api/alumni/security/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authorize credential change');
    }

    // Success! Update local state
    if (activeSecurityModal === 'EMAIL') setProfile(prev => ({ ...prev, email: newEmail }));
    if (activeSecurityModal === 'PHONE') setProfile(prev => ({ ...prev, phone: newPhone, countryCode: newCountryCode }));

    setActiveSecurityModal(null);
    setIs2FAChallengeOpen(false);

    showAlert({
      title: 'Security Credential Updated',
      message: `${activeSecurityModal === 'PASSWORD' ? 'Password' : activeSecurityModal === 'EMAIL' ? 'Email' : 'Phone'} updated securely with 2FA verification. Institutional monitoring log recorded.`,
      variant: 'success'
    });
  };

  const scrollTo2FASetup = () => {
    const el = document.getElementById('two-factor-setup-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return <AlumniProfileSkeleton />;
  }

  const locationSummary = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  const countryCodesList = getCountryCodeList();
  const countryList = getCountryList();
  const stateList = getStatesByCountry(profile.country);
  const cityList = getCitiesByState(profile.country, profile.state);

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-4 pb-28 animate-in fade-in duration-300 sm:space-y-6 sm:pb-16">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100/50">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Professional Identity</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Manage and share your global institutional profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">

        {/* Left: ID Card Preview (Order 2 on mobile, Order 1 on desktop) */}
        <div className="order-2 lg:order-1 space-y-4 sm:space-y-6 mt-2 lg:mt-0">
          <div className="bg-white/60 backdrop-blur-xl p-4 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/80 shadow-xl shadow-blue-900/5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/5 blur-[50px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-blue-400/15"></div>

            <div className="space-y-3.5 sm:space-y-5 relative z-10">

              {/* Logo section */}
              <div className="flex justify-center mb-2 border-b border-slate-100/80 pb-3">
                <Image src={profile.schoolLogo || "/madni-logo.png"} alt={profile.schoolName || "Institutional Logo"} width={48} height={48} className="object-contain sm:w-[60px] sm:h-[60px]" />
              </div>

              {/* Profile Pic & Basic info row */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-slate-100 rounded-full overflow-hidden relative shadow-md ring-2 ring-white sm:ring-4 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
                  {previewImage ? (
                    <Image src={previewImage} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User size={22} className="text-slate-300 sm:size-[26px]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors tracking-tight truncate">{profile.name || 'Alumni Name'}</h3>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <p className="text-[9.5px] sm:text-[10px] font-bold text-blue-700 bg-blue-50/80 border border-blue-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                      <GraduationCap size={11} />
                      <span>Batch of {profile.batchYear || 'N/A'}</span>
                    </p>
                    {profile.industry && (
                      <p className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                        <Tag size={11} />
                        <span>{profile.industry}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic School, Designation & Location details */}
              <div className="bg-slate-50/60 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100/60 space-y-2">
                <div className="flex items-center text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <Building2 size={12} className="mr-1.5 text-slate-400 shrink-0 sm:size-[13px]" />
                  <span className="truncate">{profile.schoolName || 'Madni High School'}</span>
                </div>
                <div className="flex items-center text-[11px] sm:text-xs text-slate-700 font-bold">
                  <Briefcase size={12} className="mr-1.5 text-blue-400 shrink-0 sm:size-[13px]" />
                  <span className="truncate">{profile.currentTitle || 'Graduate'}</span>
                </div>
                {locationSummary && (
                  <div className="flex items-center text-[11px] sm:text-xs text-slate-600 font-semibold">
                    <MapPin size={12} className="mr-1.5 text-rose-500 shrink-0 sm:size-[13px]" />
                    <span className="truncate">{locationSummary}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center text-[11px] sm:text-xs text-slate-600 font-semibold">
                    <Phone size={12} className="mr-1.5 text-blue-500 shrink-0 sm:size-[13px]" />
                    <span className="truncate">{profile.countryCode} {profile.phone}</span>
                  </div>
                )}
              </div>

              {/* Professional Biography */}
              {profile.currentBio ? (
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium line-clamp-3 italic px-0.5">
                  "{profile.currentBio}"
                </p>
              ) : (
                <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-medium italic px-0.5">
                  No bio description provided.
                </p>
              )}
            </div>
          </div>

          {/* Institutional Banner */}
          <div className="bg-blue-50/50 border border-blue-100/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full"></div>
            <h5 className="text-[9.5px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>Step-Up 2FA Protected</span>
            </h5>
            <p className="text-[11px] sm:text-xs text-blue-900/60 font-medium leading-relaxed">
              Primary email, phone number, and password changes require 2FA authorization. School administrators receive real-time alerts upon verified modifications.
            </p>
          </div>
        </div>

        {/* Right: Editable Profile Workspace (Order 1 on mobile, Order 2 on desktop) */}
        <div className="order-1 lg:order-2 lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white/40 backdrop-blur-md p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] border border-white/60 shadow-xl shadow-slate-900/5 space-y-5 sm:space-y-8">

            {/* Profile Image Upload Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-4 border-b border-slate-100/80 sm:pb-6">
              <div className="relative group cursor-pointer w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <div className="absolute inset-0 bg-slate-900/40 rounded-2xl sm:rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                  <Camera className="text-white transform scale-90 group-hover:scale-100 transition-transform duration-300" size={18} />
                </div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100/60 border-2 border-slate-200/80 rounded-2xl sm:rounded-[1.5rem] overflow-hidden relative shadow-inner flex items-center justify-center">
                  {previewImage ? (
                    <Image src={previewImage} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User size={28} className="text-slate-300 sm:size-[32px]" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
              </div>
              <div className="space-y-1 text-center sm:text-left mt-1 sm:space-y-2 sm:mt-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">Profile Picture</h3>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 max-w-sm leading-relaxed">Upload a professional headshot to be displayed on your Alumni ID Card and the community directory. Max size 2MB.</p>
              </div>
            </div>

            {/* ─── Account Security & Primary Credentials Card ─── */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-blue-100/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-blue-600" />
                  <span className="text-xs font-black text-slate-900">Security Credentials (2FA Protected)</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  High Security
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Email Card */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail size={11} />
                    <span>Primary Email</span>
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate" title={profile.email}>{profile.email}</p>
                  <button
                    type="button"
                    onClick={() => initiateCredentialChange('EMAIL')}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Change Email</span>
                  </button>
                </div>

                {/* Phone Card */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone size={11} />
                    <span>Phone Number</span>
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {profile.phone ? `${profile.countryCode} ${profile.phone}` : 'Not added'}
                  </p>
                  <button
                    type="button"
                    onClick={() => initiateCredentialChange('PHONE')}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>{profile.phone ? 'Change Phone' : 'Add Phone'}</span>
                  </button>
                </div>

                {/* Password Card */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={11} />
                    <span>Account Password</span>
                  </p>
                  <p className="text-xs font-bold text-slate-800">••••••••••</p>
                  <button
                    type="button"
                    onClick={() => initiateCredentialChange('PASSWORD')}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Designation & Industry Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  <Briefcase size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> Current Professional Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Product Designer at Apple"
                  value={profile.currentTitle || ''}
                  onChange={(e) => setProfile({ ...profile, currentTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  <Tag size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> Industry / Field of Work
                </label>
                <select
                  value={profile.industry || ''}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">Select Industry / Field</option>
                  <option value="Information Technology & Software">Information Technology & Software</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Education & Academia">Education & Academia</option>
                  <option value="Engineering & Manufacturing">Engineering & Manufacturing</option>
                  <option value="Consulting & Strategy">Consulting & Strategy</option>
                  <option value="Media, Arts & Entertainment">Media, Arts & Entertainment</option>
                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                  <option value="Real Estate & Construction">Real Estate & Construction</option>
                  <option value="Public Sector & Law">Public Sector & Law</option>
                  <option value="Aerospace & Defense">Aerospace & Defense</option>
                  <option value="Agriculture & Farming">Agriculture & Farming</option>
                  <option value="Automotive & Transportation">Automotive & Transportation</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Marketing & Advertising">Marketing & Advertising</option>
                  <option value="Non-Profit & NGO">Non-Profit & NGO</option>
                  <option value="Pharmaceuticals & Biotechnology">Pharmaceuticals & Biotechnology</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Other">Other</option>
                  {profile.industry && ![
                    'Information Technology & Software',
                    'Healthcare & Life Sciences',
                    'Finance & Banking',
                    'Education & Academia',
                    'Engineering & Manufacturing',
                    'Consulting & Strategy',
                    'Media, Arts & Entertainment',
                    'E-commerce & Retail',
                    'Real Estate & Construction',
                    'Public Sector & Law',
                    'Aerospace & Defense',
                    'Agriculture & Farming',
                    'Automotive & Transportation',
                    'Energy & Utilities',
                    'Hospitality & Tourism',
                    'Marketing & Advertising',
                    'Non-Profit & NGO',
                    'Pharmaceuticals & Biotechnology',
                    'Telecommunications',
                    'Other'
                  ].includes(profile.industry) && (
                    <option value={profile.industry}>{profile.industry}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Location Row: Country, State, City */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  <MapPin size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> Country
                </label>
                <select
                  value={profile.country || 'India'}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">Select Country</option>
                  {countryList.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {profile.country && !countryList.some(c => c.name === profile.country) && (
                    <option value={profile.country}>{profile.country}</option>
                  )}
                </select>
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  State / Region
                </label>
                <select
                  value={profile.state || ''}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">Select State / Region</option>
                  {stateList.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  {profile.state && !stateList.includes(profile.state) && (
                    <option value={profile.state}>{profile.state}</option>
                  )}
                </select>
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  City
                </label>
                <select
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">Select City</option>
                  {cityList.map(ct => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                  {profile.city && !cityList.includes(profile.city) && (
                    <option value={profile.city}>{profile.city}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Social & Portfolio Links Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  <ExternalLink size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="linkedin.com/in/username"
                  value={profile.linkedIn || ''}
                  onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                  <Globe size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> Personal Portfolio / Work Link
                </label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={profile.workLink || ''}
                  onChange={(e) => setProfile({ ...profile, workLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 animate-transition"
                />
              </div>
            </div>

            {/* Professional Bio */}
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center">
                <FileText size={12} className="mr-1.5 text-slate-400 sm:size-[13px]" /> Professional Bio & Biography
              </label>
              <textarea
                rows={4}
                placeholder="Introduce yourself to the community. Share your technical skillset, career path achievements, or mentorship goals..."
                value={profile.currentBio || ''}
                onChange={(e) => setProfile({ ...profile, currentBio: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white/50 border border-slate-200/80 hover:bg-white focus:bg-white focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 resize-none animate-transition"
              />
            </div>

            {/* Action Submit */}
            <div className="pt-4 sm:pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl sm:rounded-2xl transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{saving ? 'Synchronizing Identity...' : 'Save Professional Identity'}</span>
              </button>
            </div>

          </div>
        </div>
      </form>

      {/* Notifications Preferences */}
      <div className="mt-8">
        <NotificationSettingsCard />
      </div>

      {/* Security & 2FA Section */}
      <div id="two-factor-setup-section" className="mt-6">
        <TwoFactorAuthSetupCard
          key={profile.email + (profile.is2FAEnabled ? '-active' : '-inactive')}
          email={profile.email}
          role="ALUMNI"
          isEnabledInitially={profile.is2FAEnabled}
          onStatusChange={(enabled) => setProfile(prev => ({ ...prev, is2FAEnabled: enabled }))}
        />
      </div>

    </div>

    {/* ─── Step-Up 2FA Challenge Modal ─── */}
    <TwoFactorAuthVerifyModal
      isOpen={is2FAChallengeOpen}
      onClose={() => setIs2FAChallengeOpen(false)}
      is2FAEnabled={profile.is2FAEnabled}
      title={`Authorize ${activeSecurityModal === 'PASSWORD' ? 'Password Change' : activeSecurityModal === 'EMAIL' ? 'Email Change' : 'Phone Change'}`}
      description={`Enter your 6-digit Authenticator code to authorize updating your primary ${activeSecurityModal?.toLowerCase()}. School administrators will be notified.`}
      onConfirm={handleExecute2FAUpdate}
      onNavigateTo2FA={scrollTo2FASetup}
    />

    {/* ─── Credential Edit Dialog (Email / Phone / Password Input) ─── */}
    {activeSecurityModal && !is2FAChallengeOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {activeSecurityModal === 'EMAIL' ? <Mail size={16} /> : activeSecurityModal === 'PHONE' ? <Phone size={16} /> : <KeyRound size={16} />}
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {activeSecurityModal === 'EMAIL' && 'Update Primary Email'}
                {activeSecurityModal === 'PHONE' && 'Update Phone Number'}
                {activeSecurityModal === 'PASSWORD' && 'Change Account Password'}
              </h3>
            </div>
            <button
              onClick={() => setActiveSecurityModal(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          {credentialFormError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {credentialFormError}
            </div>
          )}

          {/* Form Content */}
          {activeSecurityModal === 'EMAIL' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">New Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                A 6-digit Authenticator code will be required on the next step to confirm this email change.
              </p>
            </div>
          )}

          {activeSecurityModal === 'PHONE' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">New Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={newCountryCode}
                    onChange={e => setNewCountryCode(e.target.value)}
                    className="w-28 h-11 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >
                    {countryCodesList.map(item => (
                      <option key={item.value + item.label} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                A 6-digit Authenticator code will be required on the next step to confirm this phone change.
              </p>
            </div>
          )}

          {activeSecurityModal === 'PASSWORD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveSecurityModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpen2FAChallenge}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Continue to 2FA Verification →
            </button>
          </div>

        </div>
      </div>
    )}

    {dialog}
    </>
  );
}

