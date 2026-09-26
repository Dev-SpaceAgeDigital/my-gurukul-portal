'use client';

import React, { useState, useEffect } from 'react';
import { Download, PieChart, Receipt, Heart, Calendar, CreditCard, Sparkles, Building2, ChevronDown } from 'lucide-react';

function MyImpactSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-3.5 pb-28 animate-pulse sm:space-y-5 sm:pb-16">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-white/70 bg-white/50 p-3.5 shadow-xl shadow-slate-900/5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-full bg-slate-200/80" />
            <div className="h-3 w-56 max-w-full rounded-full bg-slate-200/60" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-200/70" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 h-24 sm:h-28 rounded-2xl sm:rounded-3xl bg-blue-200/70" />
        <div className="h-24 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/70 border border-white/80" />
        <div className="h-24 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/70 border border-white/80" />
        <div className="h-24 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/70 border border-white/80" />
        <div className="h-24 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/70 border border-white/80" />
      </div>

      {/* List / Table Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/70 bg-white/60 p-4 sm:p-6 shadow-xl shadow-slate-900/5 space-y-3">
        <div className="h-4 w-44 rounded-full bg-slate-200/80 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl sm:rounded-2xl bg-slate-100/80" />
        ))}
      </div>
    </div>
  );
}

export default function AlumniDonationHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFy, setSelectedFy] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/alumni/donations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
        const fys = new Set<string>();
        data.forEach((t: any) => fys.add(getFinancialYear(t.createdAt)));
        const fyArray = Array.from(fys).sort().reverse();
        if (fyArray.length > 0) setSelectedFy(fyArray[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFinancialYear = (dateString: string) => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  const filteredTx = transactions.filter(t => getFinancialYear(t.createdAt) === selectedFy);

  const totalAmount = filteredTx.reduce((acc, t) => acc + Number(t.amount), 0);
  const zakat = filteredTx.filter(t => t.type === 'ZAKAT').reduce((acc, t) => acc + Number(t.amount), 0);
  const sadka = filteredTx.filter(t => t.type === 'SADKA').reduce((acc, t) => acc + Number(t.amount), 0);
  const lillah = filteredTx.filter(t => t.type === 'LILLAH').reduce((acc, t) => acc + Number(t.amount), 0);
  const projects = filteredTx.filter(t => ['CONSTRUCTION', 'EVENT'].includes(t.type)).reduce((acc, t) => acc + Number(t.amount), 0);

  const fyOptions = Array.from(new Set(transactions.map(t => getFinancialYear(t.createdAt)))).sort().reverse();

  if (loading) return <MyImpactSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-3.5 pb-28 animate-in fade-in duration-300 sm:space-y-5 sm:pb-16">
      
      {/* ─── Header Card ─── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/50 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/10 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 sm:text-[11px]">
              <Sparkles size={11} className="animate-pulse" />
              Contributions & Receipts
            </span>
            <h2 className="flex items-center text-base font-extrabold tracking-tight text-slate-900 sm:text-2xl mt-1">
              <PieChart className="mr-2 text-blue-600 shrink-0" size={18} />
              My Impact
            </h2>
            <p className="max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-600 sm:text-xs">
              Track your contributions, institutional aid, and download official 80G tax receipts.
            </p>
          </div>

          {fyOptions.length > 0 && (
            <div className="relative min-w-0 sm:w-auto">
              <select
                value={selectedFy}
                onChange={(e) => setSelectedFy(e.target.value)}
                className="h-10 sm:h-11 w-full appearance-none rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white/95 py-2 pl-3.5 pr-8 text-xs sm:text-sm font-bold text-slate-700 shadow-xs outline-none transition-all hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer truncate"
              >
                {fyOptions.map(fy => (
                  <option key={fy} value={fy} className="bg-white text-slate-800 font-medium py-2">
                    FY {fy}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </section>

      {transactions.length === 0 ? (
        /* ─── Empty State (Mobile Optimized) ─── */
        <section className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl sm:p-12">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs border border-blue-100/60 mb-3 sm:mb-4">
            <Heart size={28} className="animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 sm:text-xl">No Contributions Yet</h3>
          <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
            Your impact history and tax receipts will appear here once you make your first contribution.
          </p>
        </section>
      ) : (
        <>
          {/* ─── Impact Stat Cards Grid ─── */}
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
            
            {/* Total Donated Card */}
            <div className="col-span-2 sm:col-span-1 relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600 to-indigo-600 p-3.5 sm:p-4 text-white shadow-md shadow-blue-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-[25px] rounded-full pointer-events-none" />
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-blue-100 sm:text-[10px]">Total Donated</p>
              <h3 className="text-lg sm:text-xl font-black mt-1 tracking-tight">₹{totalAmount.toLocaleString()}</h3>
            </div>

            {/* Zakat */}
            <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Zakat</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 tracking-tight">₹{zakat.toLocaleString()}</h3>
            </div>

            {/* Sadka */}
            <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Sadka</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 tracking-tight">₹{sadka.toLocaleString()}</h3>
            </div>

            {/* Lillah */}
            <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Lillah</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 tracking-tight">₹{lillah.toLocaleString()}</h3>
            </div>

            {/* Projects */}
            <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">Projects</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 tracking-tight">₹{projects.toLocaleString()}</h3>
            </div>
          </section>

          {/* ─── Contribution History List / Table ─── */}
          <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:rounded-3xl">
            <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight flex items-center">
                <Receipt className="mr-2 text-blue-600" size={16} />
                Contribution History ({selectedFy})
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredTx.length} records
              </span>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100/80">
              {filteredTx.map((tx: any) => (
                <article key={tx.id} className="p-3.5 space-y-2.5 transition-colors hover:bg-white/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center text-xs font-semibold text-slate-700">
                      <Calendar size={13} className="mr-1.5 text-slate-400" />
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                      {tx.type}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{tx.referenceName || 'General Donation'}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="text-slate-400" />
                        {tx.schoolName || 'Madni Education Trust'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-900">₹{Number(tx.amount).toLocaleString()}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {tx.status || 'Success'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10.5px]">
                    <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">
                      <CreditCard size={11} className="text-slate-400" />
                      {tx.paymentMode || 'Online'}
                    </span>

                    <a
                      href={`/api/public/download-receipt?id=${tx.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      <Download size={12} />
                      <span>Receipt PDF</span>
                    </a>
                  </div>
                </article>
              ))}

              {filteredTx.length === 0 && (
                <div className="p-6 text-center text-xs font-semibold text-slate-500">
                  No contributions found for this financial year.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">School & Details</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-6">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 text-xs">
                  {filteredTx.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 pl-6 whitespace-nowrap">
                        <div className="flex items-center font-semibold text-slate-700">
                          <Calendar size={13} className="mr-2 text-slate-400" />
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-800 whitespace-nowrap">
                        ₹{Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md w-fit uppercase tracking-wider">
                          <CreditCard size={11} className="mr-1 text-slate-400" />
                          {tx.paymentMode || 'Online'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{tx.referenceName || 'General Donation'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{tx.schoolName || 'Madni Education Trust'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center font-bold text-emerald-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          {tx.status || 'Success'}
                        </div>
                      </td>
                      <td className="p-3.5 pr-6">
                        <a
                          href={`/api/public/download-receipt?id=${tx.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white shadow-xs"
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredTx.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-500">
                        No contributions found for this financial year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

