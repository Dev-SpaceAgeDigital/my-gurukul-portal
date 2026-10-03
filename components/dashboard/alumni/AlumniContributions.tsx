'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import {
   Building2,
   Heart,
   IndianRupee,
   CheckCircle2,
   Construction,
   PlayCircle,
   Search,
   Globe,
   Loader2,
   Lock,
   ArrowUpRight,
   School as SchoolIcon,
   ChevronRight,
   ChevronDown,
   SlidersHorizontal,
   RotateCcw,
   Info
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

declare global {
   interface Window {
      Razorpay: any;
   }
}

type ProjectStatusFilter = 'active' | 'completed';

function toAmount(value: any) {
   const amount = Number(value || 0);
   return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: any) {
   return `Rs. ${toAmount(value).toLocaleString()}`;
}

function getProjectProgress(item: any) {
   const estimated = toAmount(item?.estimatedCost);
   const paid = toAmount(item?.paidAmount);
   if (estimated <= 0) return 0;
   return Math.min(100, Math.round((paid / estimated) * 100));
}

function isProjectCompleted(item: any) {
   const estimated = toAmount(item?.estimatedCost);
   return estimated > 0 && toAmount(item?.paidAmount) >= estimated;
}

function ContributionSkeleton() {
   return (
      <div className="mx-auto max-w-7xl space-y-4 pb-28 sm:space-y-6 sm:pb-16">
         <div className="rounded-3xl border border-white/70 bg-white/50 p-4 shadow-xl shadow-slate-900/5 sm:p-6">
            <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200/80" />
            <div className="mt-4 h-8 w-64 max-w-full animate-pulse rounded-full bg-slate-200/80" />
            <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-slate-200/70" />
         </div>
         <div className="h-12 animate-pulse rounded-2xl border border-slate-100 bg-white/70" />
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
               <div key={`give-back-skeleton-${index}`} className="overflow-hidden rounded-3xl border border-white/70 bg-white/50 shadow-lg shadow-slate-900/5">
                  <div className="aspect-video animate-pulse bg-slate-200/70" />
                  <div className="space-y-4 p-4 sm:p-5">
                     <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-200/80" />
                     <div className="h-3 w-full animate-pulse rounded-full bg-slate-200/70" />
                     <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200/70" />
                     <div className="h-10 animate-pulse rounded-2xl bg-slate-200/80" />
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

function attachMyDonationTotals(needs: any, donations: any[]) {
   const projectTotals = new Map<string, number>();
   const aidTotals = new Map<string, { total: number; zakat: number; sadka: number; lillah: number; donation: number }>();

   donations.forEach((donation) => {
      const referenceId = String(donation.referenceId || '');
      if (!referenceId) return;

      const amount = toAmount(donation.amount);
      if (['CONSTRUCTION', 'EVENT'].includes(donation.type)) {
         projectTotals.set(referenceId, (projectTotals.get(referenceId) || 0) + amount);
         return;
      }

      if (['ZAKAT', 'SADKA', 'LILLAH', 'DONATION', 'AID', 'FEE_PAYMENT'].includes(donation.type)) {
         const current = aidTotals.get(referenceId) || { total: 0, zakat: 0, sadka: 0, lillah: 0, donation: 0 };
         current.total += amount;
         if (donation.type === 'ZAKAT') current.zakat += amount;
         if (donation.type === 'SADKA') current.sadka += amount;
         if (donation.type === 'LILLAH') current.lillah += amount;
         if (donation.type === 'DONATION' || donation.type === 'AID' || donation.type === 'FEE_PAYMENT') current.donation += amount;
         aidTotals.set(referenceId, current);
      }
   });

   return {
      expenses: (needs.expenses || []).map((expense: any) => ({
         ...expense,
         myDonatedAmount: projectTotals.get(String(expense.id)) || 0,
      })),
      financialAid: (needs.financialAid || []).map((standard: any) => {
         const totals = aidTotals.get(String(standard.standardId)) || { total: 0, zakat: 0, sadka: 0, lillah: 0, donation: 0 };
         return {
            ...standard,
            myTotalDonated: totals.total,
            myZakatDonated: totals.zakat,
            mySadkaDonated: totals.sadka,
            myLillahDonated: totals.lillah,
            myDonationDonated: totals.donation,
         };
      }),
   };
}

export default function AlumniContributions() {
   const [data, setData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState('');
   const [activeTab, setActiveTab] = useState<'construction' | 'aid'>('construction');
   const [projectStatus, setProjectStatus] = useState<ProjectStatusFilter>('active');
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedSchool, setSelectedSchool] = useState('All');
   const [isFilterOpen, setIsFilterOpen] = useState(false);

   // Payment Modal State
   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState<any>(null);
   const [paymentAmount, setPaymentAmount] = useState('');
   const [isPaying, setIsPaying] = useState(false);
   const [userData, setUserData] = useState<any>(null);
   const [tenantInfo, setTenantInfo] = useState<any>(null);
   const [is80GRequested, setIs80GRequested] = useState(false);
   const [panInput, setPanInput] = useState('');
   const { dialog, showAlert } = usePortalDialog();

   useEffect(() => {
      fetchNeeds();
      fetch('/api/auth/me').then(res => res.json()).then(d => setUserData(d));
      fetch('/api/alumni/profile').then(res => res.json()).then(d => {
         if (d?.panNo) setPanInput(d.panNo);
      }).catch(() => {});
      fetch('/api/public/tenant-info').then(res => res.json()).then(d => {
         if (d?.success) setTenantInfo(d);
      }).catch(() => {});
   }, []);

   const schools = useMemo(() => {
      const set = new Set<string>();
      (data?.expenses || []).forEach((e: any) => { if (e.schoolName) set.add(e.schoolName); });
      (data?.financialAid || []).forEach((a: any) => { if (a.schoolName) set.add(a.schoolName); });
      return ['All', ...Array.from(set).sort()];
   }, [data]);

   const fetchNeeds = async () => {
      setLoading(true);
      setLoadError('');
      try {
         const res = await fetch('/api/alumni/needs');
         const d = await res.json();
         if (!res.ok) {
            throw new Error(d.error || 'Unable to load donation needs.');
         }
         const safeNeeds = {
            expenses: Array.isArray(d.expenses) ? d.expenses : [],
            financialAid: Array.isArray(d.financialAid) ? d.financialAid : [],
         };

         let donations: any[] = [];
         try {
            const donationsRes = await fetch('/api/alumni/donations');
            const donationData = await donationsRes.json();
            donations = donationsRes.ok && Array.isArray(donationData) ? donationData : [];
         } catch {
            donations = [];
         }

         setData(attachMyDonationTotals(safeNeeds, donations));
      } catch (err) {
         console.error(err);
         setData({ expenses: [], financialAid: [] });
         setLoadError('Unable to load donation needs. Please refresh once.');
      } finally {
         setLoading(false);
      }
   };

   const min80GThreshold = tenantInfo?.min80GAmount ? Number(tenantInfo.min80GAmount) : 500;
   const is80GEligible = Boolean(tenantInfo?.is80GEnabled !== false) && parseFloat(paymentAmount || '0') >= min80GThreshold;

   const handlePayment = async () => {
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
         showAlert({ title: 'Enter a valid amount', message: 'Please enter an amount greater than zero before continuing.', variant: 'danger' });
         return;
      }

      if (is80GRequested && (!panInput || panInput.trim().length < 10)) {
         showAlert({
            title: 'PAN Card Number required',
            message: 'Please enter a valid 10-character PAN Card Number to request an official Section 80G Tax Exemption Certificate.',
            variant: 'danger',
         });
         return;
      }

      setIsPaying(true);
      try {
         const orderRes = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               amount: parseFloat(paymentAmount),
               type: selectedItem.type,
               referenceId: selectedItem.id,
               schoolId: selectedItem.schoolId
            })
         });
         const order = await orderRes.json();

         const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RXNuiBfUb7KG4A',
            amount: order.amount,
            currency: order.currency,
            name: tenantInfo?.name || "EduTrust Network",
            description: `Support - ${selectedItem.title}`,
            order_id: order.id,
            handler: async function (response: any) {
               const verifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     ...response,
                     amount: parseFloat(paymentAmount),
                     type: selectedItem.type,
                     referenceId: selectedItem.id,
                     schoolId: selectedItem.schoolId,
                     donorName: userData?.name,
                     donorEmail: userData?.email,
                     donorPhone: userData?.phoneNo,
                     donorPan: is80GRequested ? panInput.trim().toUpperCase() : null,
                     request80G: is80GRequested,
                     campaignTitle: selectedItem.title,
                     causeName: selectedItem.title
                  })
               });

               if (verifyRes.ok) {
                  showAlert({
                     title: 'Donation successful! 🎉',
                     message: is80GRequested
                        ? `Your institutional contribution of ₹${parseFloat(paymentAmount).toLocaleString()} has been recorded! Your Section 80G Tax Exemption request is logged and receipt will be issued.`
                        : 'Your institutional support has been recorded successfully.',
                     variant: 'success',
                  });
                  setIsPaymentModalOpen(false);
                  fetchNeeds();
               } else {
                  showAlert({ title: 'Verification failed', message: 'The payment could not be verified. Please contact the administration team if money was debited.', variant: 'danger' });
               }
            },
            prefill: {
               name: userData?.name,
               email: userData?.email,
               contact: userData?.phoneNo
            },
            theme: { color: "#2563eb" }
         };

         const rzp = new window.Razorpay(options);
         rzp.open();

      } catch (err) {
         console.error(err);
      } finally {
         setIsPaying(false);
      }
   };

   const filteredExpenses = data?.expenses?.filter((e: any) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
         !term ||
         e.title.toLowerCase().includes(term) ||
         (e.schoolName || '').toLowerCase().includes(term) ||
         (e.description || '').toLowerCase().includes(term);
      const matchesSchool = selectedSchool === 'All' || e.schoolName === selectedSchool;
      const completed = isProjectCompleted(e);
      const matchesStatus = projectStatus === 'completed' ? completed : !completed;

      return matchesSearch && matchesSchool && matchesStatus;
   });

   const filteredAid = data?.financialAid?.filter((a: any) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
         !term ||
         (a.schoolName || '').toLowerCase().includes(term) ||
         (a.standardName || '').toLowerCase().includes(term);
      const matchesSchool = selectedSchool === 'All' || a.schoolName === selectedSchool;

      return matchesSearch && matchesSchool;
   });

   if (loading) return <ContributionSkeleton />;

   return (
      <>
      <div className="mx-auto max-w-7xl space-y-3 pb-28 animate-in fade-in duration-300 sm:space-y-5 sm:pb-16">
         <Script src="https://checkout.razorpay.com/v1/checkout.js" />

         {/* Header */}
         <div className="rounded-2xl border border-white/70 bg-white/50 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div className="space-y-0.5">
                  <h2 className="flex items-center text-base font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                     <Heart className="mr-2 text-blue-600 shrink-0" size={18} />
                     Give Back & Donations
                  </h2>
                  <p className="ml-0.5 max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
                     Support institutional education by funding active projects or sponsoring a student's future.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md sm:flex sm:rounded-2xl">
                  <button
                     onClick={() => setActiveTab('construction')}
                     className={`rounded-lg px-2.5 py-2 text-[10.5px] font-bold transition-all sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-xs ${activeTab === 'construction' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                     Sponsor a Project
                  </button>
                  <button
                     onClick={() => setActiveTab('aid')}
                     className={`rounded-lg px-2.5 py-2 text-[10.5px] font-bold transition-all sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-xs ${activeTab === 'aid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                     Sponsor a Student
                  </button>
               </div>
            </div>
         </div>

         {/* ─── Single Line Search & School Filter Bar (Mobile Optimized) ─── */}
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
               
               {/* Left: Search Input */}
               <div className="relative min-w-0 flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                  <input
                     type="text"
                     placeholder="Search schools, standards, or projects..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="h-10 sm:h-11 w-full rounded-xl sm:rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-9 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                  {searchTerm && (
                     <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
                        aria-label="Clear search"
                     >
                        <span className="text-xs font-bold leading-none">✕</span>
                     </button>
                  )}
               </div>

               {/* Right: Filter Toggle Button */}
               <button
                  type="button"
                  onClick={() => setIsFilterOpen(prev => !prev)}
                  className={`h-10 sm:h-11 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 border shadow-xs ${
                     isFilterOpen || selectedSchool !== 'All'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                        : 'bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white border-slate-200/90'
                  }`}
                  title="Toggle school filter"
                  aria-label="Toggle school filter"
               >
                  <SlidersHorizontal size={15} className={isFilterOpen || selectedSchool !== 'All' ? 'text-white' : 'text-blue-600'} />
                  <span className="text-xs font-extrabold sm:text-sm">Filter</span>
                  {selectedSchool !== 'All' && (
                     <span className="inline-flex items-center justify-center text-[10px] font-black h-4.5 min-w-4.5 px-1 rounded-full bg-white text-blue-700 shadow-xs">
                        1
                     </span>
                  )}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
               </button>
            </div>

            {/* Expandable Filter Panel */}
            {isFilterOpen && (
               <div className="animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 p-3.5 sm:p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                     <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                        <Building2 size={13} className="text-blue-600" />
                        <span>Filter by School</span>
                        {selectedSchool !== 'All' && (
                           <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {selectedSchool}
                           </span>
                        )}
                     </div>

                     {(selectedSchool !== 'All' || searchTerm) && (
                        <button
                           type="button"
                           onClick={() => {
                              setSelectedSchool('All');
                              setSearchTerm('');
                           }}
                           className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        >
                           <RotateCcw size={11} />
                           <span>Reset Filters</span>
                        </button>
                     )}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                     <div className="relative min-w-0">
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">School / Institute</label>
                        <div className="relative">
                           <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                           <select
                              value={selectedSchool}
                              onChange={e => setSelectedSchool(e.target.value)}
                              className={`h-10 sm:h-11 w-full appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-bold shadow-xs outline-none transition-all hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer truncate ${
                                 selectedSchool !== 'All' ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-slate-200 text-slate-700'
                              }`}
                           >
                              {schools.map(school => (
                                 <option key={school} value={school} className="bg-white text-slate-800 font-medium py-2">
                                    {school === 'All' ? 'All Schools' : school}
                                 </option>
                              ))}
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Content */}
         {loadError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-xs font-bold text-rose-700 shadow-sm sm:p-4">
               {loadError}
            </div>
         )}

         {activeTab === 'construction' ? (
            <div className="space-y-3 sm:space-y-4">
               <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                     { id: 'active' as const, label: 'Active Projects' },
                     { id: 'completed' as const, label: 'Completed Projects' },
                  ].map((filter) => (
                     <button
                        key={filter.id}
                        type="button"
                        onClick={() => setProjectStatus(filter.id)}
                        className={`min-h-8 shrink-0 rounded-xl border px-3 py-1 text-[10.5px] font-bold transition-all sm:min-h-9 sm:rounded-2xl sm:px-4 sm:text-xs ${projectStatus === filter.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-white bg-white/70 text-slate-700 hover:border-blue-200 hover:text-blue-700'}`}
                     >
                        {filter.label}
                     </button>
                  ))}
               </div>

               {filteredExpenses?.length ? (
               <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
               {filteredExpenses?.map((exp: any) => {
                  const progress = getProjectProgress(exp);
                  const remaining = Math.max(0, toAmount(exp.estimatedCost) - toAmount(exp.paidAmount));
                  const completed = isProjectCompleted(exp);

                  return (
                  <div key={exp.id} className="group overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-md shadow-slate-900/5 backdrop-blur-md transition-all duration-300 hover:bg-white/80 sm:rounded-3xl">
                     <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                        {exp.mediaUrl ? (
                           <img src={exp.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                           <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <Construction size={36} />
                           </div>
                        )}
                        <div className="absolute left-2.5 top-2.5">
                           <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-[9.5px] font-bold text-white shadow-sm backdrop-blur sm:px-3 sm:py-1.5 sm:text-[10px]">
                              {exp.schoolName}
                           </span>
                        </div>
                        {completed && (
                           <div className="absolute right-2.5 top-2.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[9.5px] font-black text-white shadow-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                                 <CheckCircle2 size={11} />
                                 Completed
                              </span>
                           </div>
                        )}
                     </div>
                     <div className="relative space-y-3 p-3.5 sm:space-y-4 sm:p-5">
                        {/* Background Glow */}
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none"></div>

                        <div>
                           <h4 className="break-words text-sm font-extrabold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-lg">{exp.title}</h4>
                           <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed sm:text-xs">{exp.description}</p>
                        </div>

                        <div className="space-y-1.5">
                           <div className="flex justify-between items-end text-[10px] font-bold sm:text-[11px]">
                              <span className="text-slate-500">Funding Level</span>
                              <span className="text-blue-600">₹{parseFloat(exp.paidAmount).toLocaleString()} / ₹{parseFloat(exp.estimatedCost).toLocaleString()}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                 style={{ width: `${progress}%` }}
                              ></div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-white/70 p-2.5 sm:rounded-2xl sm:p-3">
                           <div>
                              <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 sm:text-[9px]">Remaining</p>
                              <p className="mt-0.5 text-[11px] font-black text-slate-800 sm:text-xs">{formatMoney(remaining)}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 sm:text-[9px]">You donated</p>
                              <p className="mt-0.5 text-[11px] font-black text-emerald-600 sm:text-xs">{formatMoney(exp.myDonatedAmount)}</p>
                           </div>
                        </div>

                        <button
                           disabled={completed}
                           onClick={() => {
                              setSelectedItem({ ...exp, type: 'CONSTRUCTION', title: exp.title, amountNeeded: remaining });
                              setPaymentAmount(remaining.toString());
                              setIsPaymentModalOpen(true);
                           }}
                           className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600 disabled:shadow-none sm:rounded-2xl sm:py-3"
                        >
                           {completed ? 'Project Completed' : 'Donate Now'}
                           {!completed && <ArrowUpRight size={13} />}
                        </button>
                     </div>
                  </div>
                  );
               })}
               </div>
               ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-xl shadow-slate-900/5 sm:rounded-3xl sm:p-8">
                     <Construction size={32} className="text-slate-300" />
                     <h3 className="mt-2 text-xs font-black text-slate-900 sm:text-sm">No {projectStatus} projects found</h3>
                     <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Try changing the search or project filter.</p>
                  </div>
               )}
            </div>
         ) : (
            <div className="space-y-4 sm:space-y-8">
               {Array.from(new Set(filteredAid?.map((a: any) => a.schoolName))).map((schoolName: any) => (
                  <div key={schoolName} className="space-y-3 sm:space-y-4">
                     <div className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/50 p-2.5 shadow-sm sm:gap-3.5 sm:rounded-3xl sm:p-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-10 sm:w-10 sm:rounded-xl">
                           <SchoolIcon size={16} className="sm:size-[20px]" />
                        </div>
                        <h3 className="break-words text-sm font-bold tracking-tight text-slate-800 sm:text-lg">{schoolName}</h3>
                     </div>

                     <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAid?.filter((a: any) => a.schoolName === schoolName).map((std: any) => (
                           <div key={std.standardId} className="relative space-y-3.5 overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-3.5 shadow-md shadow-slate-900/5 backdrop-blur-md transition-all duration-300 hover:bg-white/70 sm:rounded-3xl sm:p-5">
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none"></div>

                              <div className="flex justify-between items-start">
                                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 sm:w-12 sm:h-12 sm:rounded-2xl">
                                    <Building2 size={20} className="sm:size-[24px]" />
                                 </div>
                                 <span className="bg-white/80 text-slate-500 border border-slate-200/50 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shadow-sm sm:px-3 sm:py-1 sm:text-[10px]">Standard {std.standardName}</span>
                              </div>

                              <div>
                                 <h4 className="text-base font-bold text-slate-800 tracking-tight sm:text-lg">Standard {std.standardName} Aid</h4>
                                 <p className="mt-0.5 text-[10.5px] font-black text-emerald-600 sm:text-xs">You donated: {formatMoney(std.myTotalDonated)}</p>
                                 <p className="text-[11px] font-semibold text-slate-500 mt-0.5 sm:text-xs">Annual Fee: ₹{parseFloat(std.fees).toLocaleString()}</p>
                              </div>

                              <div className="space-y-2 pt-1">
                                 {/* Donation Mode / General Needy Aid */}
                                 {(std.donationCount > 0 || (std.sponsorshipMode === 'DONATION' && (std.needyCount > 0 || std.donationCount > 0)) || (!std.zakatCount && !std.sadkaCount && !std.lillahCount && (std.needyCount > 0 || std.donationCount > 0))) && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100/70 group hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer shadow-sm sm:p-3.5 sm:rounded-2xl"
                                       onClick={() => {
                                          const count = std.donationCount || std.needyCount || 1;
                                          const paid = std.donationPaid || std.totalAidPaid || 0;
                                          const needed = Math.max(0, (std.fees * count) - paid);
                                          setSelectedItem({ ...std, id: std.standardId, type: 'DONATION', title: `Donation Aid - Standard ${std.standardName}`, amountNeeded: needed });
                                          setPaymentAmount(needed.toString());
                                          setIsPaymentModalOpen(true);
                                       }}
                                    >
                                       <div>
                                          <p className="text-[9.5px] font-bold text-blue-600 uppercase tracking-wider">Donation Sponsored</p>
                                          <p className="text-xs font-bold text-slate-800 sm:text-sm">{std.donationCount || std.needyCount} Needy Students</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8.5px] font-semibold text-slate-400 uppercase">Remaining</p>
                                          <p className="mt-0.5 text-[8.5px] font-black uppercase text-emerald-600">You {formatMoney(std.myDonationDonated || std.myTotalDonated)}</p>
                                          <p className="text-xs font-bold text-blue-600 sm:text-sm">₹{Math.max(0, (std.fees * (std.donationCount || std.needyCount)) - (std.donationPaid || std.totalAidPaid || 0)).toLocaleString()}</p>
                                       </div>
                                    </div>
                                 )}

                                 {/* Zakat */}
                                 {std.zakatCount > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 group hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer shadow-sm sm:p-3.5 sm:rounded-2xl"
                                       onClick={() => {
                                          const needed = (std.fees * std.zakatCount) - std.zakatPaid;
                                          setSelectedItem({ ...std, id: std.standardId, type: 'ZAKAT', title: `Zakat Aid - Standard ${std.standardName}`, amountNeeded: needed });
                                          setPaymentAmount(needed.toString());
                                          setIsPaymentModalOpen(true);
                                       }}
                                    >
                                       <div>
                                          <p className="text-[9.5px] font-bold text-indigo-600 uppercase tracking-wider">Zakat Needy</p>
                                          <p className="text-xs font-bold text-slate-800 sm:text-sm">{std.zakatCount} Students</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8.5px] font-semibold text-slate-400 uppercase">Remaining</p>
                                          <p className="mt-0.5 text-[8.5px] font-black uppercase text-emerald-600">You {formatMoney(std.myZakatDonated)}</p>
                                          <p className="text-xs font-bold text-indigo-600 sm:text-sm">₹{((std.fees * std.zakatCount) - std.zakatPaid).toLocaleString()}</p>
                                       </div>
                                    </div>
                                 )}

                                 {/* Sadka */}
                                 {std.sadkaCount > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 group hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer shadow-sm sm:p-3.5 sm:rounded-2xl"
                                       onClick={() => {
                                          const needed = (std.fees * std.sadkaCount) - std.sadkaPaid;
                                          setSelectedItem({ ...std, id: std.standardId, type: 'SADKA', title: `Sadka Aid - Standard ${std.standardName}`, amountNeeded: needed });
                                          setPaymentAmount(needed.toString());
                                          setIsPaymentModalOpen(true);
                                       }}
                                    >
                                       <div>
                                          <p className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider">Sadka Needy</p>
                                          <p className="text-xs font-bold text-slate-800 sm:text-sm">{std.sadkaCount} Students</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8.5px] font-semibold text-slate-400 uppercase">Remaining</p>
                                          <p className="mt-0.5 text-[8.5px] font-black uppercase text-emerald-600">You {formatMoney(std.mySadkaDonated)}</p>
                                          <p className="text-xs font-bold text-amber-600 sm:text-sm">₹{((std.fees * std.sadkaCount) - std.sadkaPaid).toLocaleString()}</p>
                                       </div>
                                    </div>
                                 )}

                                 {/* Lillah */}
                                 {std.lillahCount > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer shadow-sm sm:p-3.5 sm:rounded-2xl"
                                       onClick={() => {
                                          const needed = (std.fees * std.lillahCount) - std.lillahPaid;
                                          setSelectedItem({ ...std, id: std.standardId, type: 'LILLAH', title: `Lillah Aid - Standard ${std.standardName}`, amountNeeded: needed });
                                          setPaymentAmount(needed.toString());
                                          setIsPaymentModalOpen(true);
                                       }}
                                    >
                                       <div>
                                          <p className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider">Lillah Needy</p>
                                          <p className="text-xs font-bold text-slate-800 sm:text-sm">{std.lillahCount} Students</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8.5px] font-semibold text-slate-400 uppercase">Remaining</p>
                                          <p className="mt-0.5 text-[8.5px] font-black uppercase text-emerald-600">You {formatMoney(std.myLillahDonated)}</p>
                                          <p className="text-xs font-bold text-emerald-600 sm:text-sm">₹{((std.fees * std.lillahCount) - std.lillahPaid).toLocaleString()}</p>
                                       </div>
                                    </div>
                                 )}

                                 <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/80 mt-2 sm:p-3.5 sm:rounded-2xl">
                                    <div>
                                       <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Class Strength</p>
                                       <p className="text-[11px] font-semibold text-slate-600 mt-0.5 sm:text-xs">{std.totalStudentsCount || 0} Total Students</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Current Batch</p>
                                       <p className="text-[11px] font-semibold text-slate-600 mt-0.5 sm:text-xs">2026-2027</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Payment Modal */}
         {isPaymentModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-3.5 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white/95 backdrop-blur-md w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-8 border border-white/60 space-y-5 sm:space-y-8 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                  <div className="space-y-0.5 relative">
                     <h3 className="text-lg font-bold text-slate-900 tracking-tight sm:text-2xl">Give Back & Donations</h3>
                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider sm:text-[11px]">{selectedItem?.title}</p>
                  </div>

                  <div className="space-y-4 relative sm:space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider ml-1 block">Donation Amount (Rs.)</label>
                        <div className="relative group/input">
                           <IndianRupee size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                           <input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => {
                                 setPaymentAmount(e.target.value);
                                 if (parseFloat(e.target.value || '0') < min80GThreshold) {
                                    setIs80GRequested(false);
                                 }
                              }}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-slate-800 text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner sm:rounded-2xl sm:py-3 sm:pl-10 sm:text-sm"
                              placeholder="Enter amount to donate"
                           />
                        </div>
                     </div>

                     {/* 80G Tax Exemption Option */}
                     {is80GEligible ? (
                        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/[0.05] to-emerald-500/[0.05] border border-amber-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="flex items-start justify-between gap-2">
                              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                 <input
                                    type="checkbox"
                                    checked={is80GRequested}
                                    onChange={(e) => setIs80GRequested(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                                 />
                                 <div>
                                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                                       Request Section 80G Tax Exemption Certificate
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                       Eligible donation (₹{min80GThreshold}+). Official certificate will be issued.
                                    </span>
                                 </div>
                              </label>
                              <span className="shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                 80G Active
                              </span>
                           </div>

                           {is80GRequested && (
                              <div className="pt-2 border-t border-amber-500/10 space-y-1 animate-in fade-in duration-150">
                                 <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider ml-0.5 block">
                                    Permanent Account Number (PAN Card No) <span className="text-rose-500">*</span>
                                 </label>
                                 <input
                                    type="text"
                                    maxLength={10}
                                    value={panInput}
                                    onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                                    placeholder="e.g. ABCDE1234F"
                                    className="w-full px-3 py-2 bg-white border border-amber-500/30 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-xs"
                                 />
                                 <p className="text-[9.5px] text-slate-400">
                                    Your PAN will be saved to your profile and included on your 80G tax certificate.
                                 </p>
                              </div>
                           )}
                        </div>
                     ) : (
                        tenantInfo?.is80GEnabled !== false && (
                           <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[10.5px] text-slate-500 flex items-center gap-2">
                              <span className="font-bold text-amber-600 shrink-0">80G Info:</span>
                              <span>Donate ₹{min80GThreshold} or above to be eligible for Section 80G tax exemption certificate.</span>
                           </div>
                        )
                     )}

                     <div className="flex flex-col gap-2">
                        <button
                           disabled={isPaying || !paymentAmount}
                           onClick={handlePayment}
                           className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 sm:rounded-2xl sm:py-4 sm:text-sm"
                        >
                           {isPaying ? (
                              <>
                                 <Loader2 size={16} className="animate-spin" />
                                 <span>Processing Donation...</span>
                              </>
                           ) : (
                              <>
                                 <Heart size={16} />
                                 <span>Donate {formatMoney(paymentAmount || '0')} Securely</span>
                              </>
                           )}
                        </button>
                        <button onClick={() => setIsPaymentModalOpen(false)} className="py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                           Cancel Transfer
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
      {dialog}
      </>
   );
}
