'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  IndianRupee, 
  Users, 
  ShieldCheck, 
  Loader2, 
  TrendingUp,
  HelpCircle,
  School
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface AnalyticsData {
  id: string;
  standardName: string;
  division: string | null;
  fees: string | number;
  total_needy: string | number;
  zakat_count: string | number;
  lillah_count: string | number;
  donation_count?: string | number;
  rte_count: string | number;
  zakat_amount: number;
  lillah_amount: number;
  donation_amount?: number;
  zakat_paid: string | number;
  lillah_paid: string | number;
  total_paid?: string | number;
  total_needy_amount: number;
  sponsorshipMode?: string;
}

export default function NeedyAnalytics() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [sponsorshipMode, setSponsorshipMode] = useState<string>('ZAKAT_LILLAH');
  const [loading, setLoading] = useState(true);
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subadmin/analytics/needy');
      if (res.ok) {
        const result = await res.json();
        if (result && Array.isArray(result.records)) {
          setData(result.records);
          setSponsorshipMode(result.sponsorshipMode || 'ZAKAT_LILLAH');
        } else if (Array.isArray(result)) {
          setData(result);
          setSponsorshipMode(result[0]?.sponsorshipMode || 'ZAKAT_LILLAH');
        }
      } else {
        showAlert({ title: 'Analysis failed', message: 'Failed to load financial aid analytics.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network synchronization error', message: 'Failed to load financial aid analytics.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const isDonationMode = sponsorshipMode === 'DONATION';

  const totals = data.reduce((acc, curr) => ({
    needy: acc.needy + Number(curr.total_needy),
    zakat: acc.zakat + Number(curr.zakat_count),
    lillah: acc.lillah + Number(curr.lillah_count),
    donation: acc.donation + Number(curr.donation_count || curr.total_needy),
    rte: acc.rte + Number(curr.rte_count),
    amount: acc.amount + curr.total_needy_amount
  }), { needy: 0, zakat: 0, lillah: 0, donation: 0, rte: 0, amount: 0 });

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Global Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
         {[
           { label: 'Total Needy Students', value: totals.needy, icon: <Heart size={14} />, color: 'text-rose-500', bg: 'bg-rose-50' },
           { label: 'RTE Students', value: totals.rte, icon: <ShieldCheck size={14} />, color: 'text-slate-600', bg: 'bg-slate-100' },
           { 
             label: isDonationMode ? 'Donation Sponsored' : 'Total Sponsored', 
             value: isDonationMode ? totals.donation : (totals.zakat + totals.lillah), 
             icon: <Users size={14} />, 
             color: 'text-[#dac48b]', 
             bg: 'bg-amber-50' 
           },
           { label: 'Aid Budget Needed', value: `₹${(totals.amount / 100000).toFixed(2)}L`, icon: <TrendingUp size={14} />, color: 'text-slate-900', bg: 'bg-slate-100' },
         ].map((stat, i) => (
           <div key={i} className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition-all group">
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-md group-hover:scale-110 transition-transform shrink-0`}>{stat.icon}</div>
              <div className="min-w-0">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1 truncate">{stat.label}</p>
                 <p className="text-sm font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white rounded-md border border-slate-100 shadow-sm">
           <Loader2 className="animate-spin text-[#dac48b]" size={36} />
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Analyzing Student Data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-md border border-dashed border-slate-200">
           <HelpCircle size={40} className="text-slate-200 mb-4" />
           <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active standards for analysis.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
           <div className="overflow-auto w-full custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse text-[11px] min-w-[1000px]">
                 <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider sticky left-0 z-30 bg-slate-50 border-r border-slate-200">Grade Level</th>
                       <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right">Annual Fee</th>

                       {isDonationMode ? (
                         /* Secular / Donation Mode Header */
                         <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider border-l border-slate-200 bg-emerald-50/40 text-center" colSpan={3}>
                           Donation & Scholarship Aid Focus
                         </th>
                       ) : (
                         /* Faith-Based Zakat & Lillah Headers */
                         <>
                           <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider border-l border-slate-200 bg-amber-50/30 text-center" colSpan={3}>Zakat Fund Focus</th>
                           <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider border-l border-slate-200 bg-slate-100/30 text-center" colSpan={3}>Lillah Fund Focus</th>
                         </>
                       )}

                       <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider border-l border-slate-200 text-center">Metrics</th>
                       <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider border-l border-slate-200 text-right bg-white">Total Aid Needed</th>
                    </tr>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                       <th className="px-6 py-2 sticky left-0 z-30 bg-slate-50/80 border-r border-slate-200"></th>
                       <th className="px-6 py-2"></th>
                       
                       {isDonationMode ? (
                         <>
                           <th className="px-4 py-2 border-l border-slate-200 bg-emerald-50/40 text-center">Needy Students</th>
                           <th className="px-4 py-2 text-emerald-600 bg-emerald-50/40 text-right">Collected</th>
                           <th className="px-4 py-2 text-rose-500 bg-emerald-50/40 text-right">Remaining</th>
                         </>
                       ) : (
                         <>
                           <th className="px-4 py-2 border-l border-slate-200 bg-amber-50/30 text-center">Recipients</th>
                           <th className="px-4 py-2 text-emerald-600 bg-amber-50/30 text-right">Collected</th>
                           <th className="px-4 py-2 text-rose-500 bg-amber-50/30 text-right">Remaining</th>
                           
                           <th className="px-4 py-2 border-l border-slate-200 bg-slate-100/30 text-center">Recipients</th>
                           <th className="px-4 py-2 text-emerald-600 bg-slate-100/30 text-right">Collected</th>
                           <th className="px-4 py-2 text-rose-500 bg-slate-100/30 text-right">Remaining</th>
                         </>
                       )}
                       
                       <th className="px-6 py-2 border-l border-slate-200"></th>
                       <th className="px-6 py-2 border-l border-slate-200 bg-white"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data.map((std) => {
                       const fees = parseFloat(std.fees as string) || 0;
                       const zakatPaid = parseFloat(std.zakat_paid as string) || 0;
                       const lillahPaid = parseFloat(std.lillah_paid as string) || 0;
                       const totalPaid = parseFloat(std.total_paid as string) || (zakatPaid + lillahPaid);
                       return (
                         <tr key={std.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-100">
                               <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-md bg-slate-100 text-[#dac48b] flex items-center justify-center shrink-0">
                                     <School size={15} />
                                  </div>
                                  <div className="whitespace-nowrap">
                                     <p className="text-sm font-bold text-slate-900">{std.standardName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{std.division || 'MAIN'} DIVISION</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <p className="text-sm font-bold text-slate-700 tabular-nums">₹{fees.toLocaleString('en-IN')}</p>
                            </td>
                            
                            {isDonationMode ? (
                              /* Secular / Donation Row */
                              <>
                                <td className="px-4 py-4 text-center border-l border-slate-100 bg-emerald-50/10">
                                   <span className="text-sm font-bold text-slate-700">{std.total_needy}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-emerald-50/10">
                                   <span className="text-xs font-bold text-emerald-600 tabular-nums">₹{totalPaid.toLocaleString('en-IN')}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-emerald-50/10">
                                   <span className="text-sm font-bold text-rose-500 tabular-nums">₹{std.total_needy_amount.toLocaleString('en-IN')}</span>
                                </td>
                              </>
                            ) : (
                              /* Zakat & Lillah Row */
                              <>
                                <td className="px-4 py-4 text-center border-l border-slate-100 bg-amber-50/10">
                                   <span className="text-sm font-bold text-slate-600">{std.zakat_count}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-amber-50/10">
                                   <span className="text-xs font-bold text-emerald-600 tabular-nums">₹{zakatPaid.toLocaleString('en-IN')}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-amber-50/10">
                                   <span className="text-sm font-bold text-rose-500 tabular-nums">₹{std.zakat_amount.toLocaleString('en-IN')}</span>
                                </td>

                                <td className="px-4 py-4 text-center border-l border-slate-100 bg-slate-50/10">
                                   <span className="text-sm font-bold text-slate-600">{std.lillah_count}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-slate-50/10">
                                   <span className="text-xs font-bold text-emerald-600 tabular-nums">₹{lillahPaid.toLocaleString('en-IN')}</span>
                                </td>
                                <td className="px-4 py-4 text-right bg-slate-50/10">
                                   <span className="text-sm font-bold text-rose-500 tabular-nums">₹{std.lillah_amount.toLocaleString('en-IN')}</span>
                                </td>
                              </>
                            )}

                            {/* Metrics */}
                            <td className="px-6 py-4 border-l border-slate-100 text-center">
                               <div className="flex items-center justify-center space-x-4">
                                  <div className="flex flex-col items-center" title="Total Needy Profiles">
                                     <Heart size={14} className="text-rose-400 mb-0.5" />
                                     <span className="text-[10px] font-bold text-slate-600">{std.total_needy}</span>
                                  </div>
                                  <div className="flex flex-col items-center" title="RTE Profiles">
                                     <ShieldCheck size={14} className="text-slate-400 mb-0.5" />
                                     <span className="text-[10px] font-bold text-slate-600">{std.rte_count}</span>
                                  </div>
                               </div>
                            </td>

                            {/* Standard Budget Required */}
                            <td className="px-6 py-4 border-l border-slate-200 text-right bg-white relative overflow-hidden group-hover:bg-slate-50 transition-colors">
                               <span className="relative z-10 text-sm font-black text-slate-900 tabular-nums">₹{std.total_needy_amount.toLocaleString('en-IN')}</span>
                            </td>
                         </tr>
                       );
                    })}
                 </tbody>
                 {/* Aggregates Footer */}
                 <tfoot className="bg-slate-50 border-t-2 border-slate-200 sticky bottom-0 z-20">
                    <tr>
                       <td className="px-6 py-3 font-bold text-slate-900 sticky left-0 z-30 bg-slate-50 border-r border-slate-200 uppercase tracking-wide text-[10px]">Total Aggregates</td>
                       <td className="px-6 py-3"></td>

                       {isDonationMode ? (
                         <>
                           <td className="px-4 py-3 text-center font-bold text-slate-700 bg-emerald-50/30 border-l border-slate-100">{totals.needy}</td>
                           <td className="px-4 py-3 text-right text-emerald-600 font-bold bg-emerald-50/30 tabular-nums">₹{data.reduce((acc, curr) => acc + (parseFloat(curr.total_paid as string) || (parseFloat(curr.zakat_paid as string)||0) + (parseFloat(curr.lillah_paid as string)||0)), 0).toLocaleString('en-IN')}</td>
                           <td className="px-4 py-3 text-right text-rose-600 font-bold bg-emerald-50/30 tabular-nums">₹{totals.amount.toLocaleString('en-IN')}</td>
                         </>
                       ) : (
                         <>
                           <td className="px-4 py-3 text-center font-bold text-slate-700 bg-amber-50/30 border-l border-slate-100">{totals.zakat}</td>
                           <td className="px-4 py-3 text-right text-emerald-600 font-bold bg-amber-50/30 tabular-nums">₹{data.reduce((acc, curr) => acc + (parseFloat(curr.zakat_paid as string)||0), 0).toLocaleString('en-IN')}</td>
                           <td className="px-4 py-3 text-right text-rose-600 font-bold bg-amber-50/30 tabular-nums">₹{data.reduce((acc, curr) => acc + curr.zakat_amount, 0).toLocaleString('en-IN')}</td>
                           
                           <td className="px-4 py-3 text-center font-bold text-slate-700 border-l border-slate-100 bg-slate-100/30">{totals.lillah}</td>
                           <td className="px-4 py-3 text-right text-emerald-600 font-bold bg-slate-100/30 tabular-nums">₹{data.reduce((acc, curr) => acc + (parseFloat(curr.lillah_paid as string)||0), 0).toLocaleString('en-IN')}</td>
                           <td className="px-4 py-3 text-right text-rose-600 font-bold bg-slate-100/30 tabular-nums">₹{data.reduce((acc, curr) => acc + curr.lillah_amount, 0).toLocaleString('en-IN')}</td>
                         </>
                       )}
                       
                       <td className="px-6 py-3 text-center font-bold text-slate-500 border-l border-slate-100 text-[10px]">
                          <span className="mr-3">N: <b className="text-slate-800">{totals.needy}</b></span>
                          <span>RTE: <b className="text-slate-800">{totals.rte}</b></span>
                       </td>
                       <td className="px-6 py-3 text-right border-l border-slate-200 bg-white">
                          <span className="text-base font-black text-slate-900 tabular-nums">₹{totals.amount.toLocaleString('en-IN')}</span>
                       </td>
                    </tr>
                 </tfoot>
              </table>
           </div>
        </div>
      )}

    </div>
    {dialog}
    </>
  );
}
