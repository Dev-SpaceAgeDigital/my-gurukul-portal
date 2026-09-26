'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Heart } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface NeedyData {
  id: string;
  standardName: string;
  fees: string | number;
  total_needy: string | number;
  zakat_count: string | number;
  lillah_count: string | number;
  zakat_paid: string | number;
  lillah_paid: string | number;
  zakat_amount: number; // remaining zakat deficit
  lillah_amount: number; // remaining lillah deficit
  total_needy_amount: number; // remaining needy deficit
}

export default function FinancialAidCoverage() {
  const [data, setData] = useState<NeedyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    async function fetchNeedyAnalytics() {
      try {
        const res = await fetch('/api/subadmin/analytics/needy');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          showAlert({ title: 'Load failed', message: 'Failed to load coverage statistics.', variant: 'danger' });
        }
      } catch (err) {
        showAlert({ title: 'Connection failed', message: 'Failed to connect to server.', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    }
    fetchNeedyAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-10 rounded-md shadow-sm min-h-[340px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#dac48b]" size={36} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Analyzing Coverage...</p>
      </div>
    );
  }

  // Calculate Aggregates
  let totalNeedyStudents = 0;
  let totalRequired = 0;
  let totalPaid = 0;

  let zakatCount = 0;
  let zakatRequired = 0;
  let zakatPaid = 0;

  let lillahCount = 0;
  let lillahRequired = 0;
  let lillahPaid = 0;

  data.forEach((row) => {
    const fees = parseFloat(row.fees as string) || 0;
    const rowNeedy = parseInt(row.total_needy as string) || 0;
    const rowZakatCount = parseInt(row.zakat_count as string) || 0;
    const rowLillahCount = parseInt(row.lillah_count as string) || 0;

    const rowZakatPaid = parseFloat(row.zakat_paid as string) || 0;
    const rowLillahPaid = parseFloat(row.lillah_paid as string) || 0;

    totalNeedyStudents += rowNeedy;
    totalRequired += rowNeedy * fees;
    totalPaid += rowZakatPaid + rowLillahPaid;

    zakatCount += rowZakatZCount(rowZakatCount);
    zakatRequired += rowZakatCount * fees;
    zakatPaid += rowZakatPaid;

    lillahCount += rowLillahCount;
    lillahRequired += rowLillahCount * fees;
    lillahPaid += rowLillahPaid;
  });

  function rowZakatZCount(val: number) {
    return val;
  }

  const remainingDeficit = Math.max(0, totalRequired - totalPaid);
  const coverageRate = totalRequired > 0 ? Math.round((totalPaid / totalRequired) * 100) : 0;

  const zakatCoverageRate = zakatRequired > 0 ? Math.round((zakatPaid / zakatRequired) * 100) : 0;
  const lillahCoverageRate = lillahRequired > 0 ? Math.round((lillahPaid / lillahRequired) * 100) : 0;

  return (
    <>
    <div className="bg-white p-4 rounded-md shadow-sm flex flex-col gap-3 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-bold text-slate-900 flex items-center leading-tight min-w-0">
          <Heart size={18} className="mr-2 text-[#dac48b] shrink-0" />
          <span className="truncate">Sponsorship & Financial Aid Coverage</span>
        </h4>
        <span className="shrink-0 text-xs font-semibold bg-amber-50 text-[#a98f4a] px-3 py-1 rounded-lg tracking-wide">
          {totalNeedyStudents} Needy Students
        </span>
      </div>

      {/* Coverage Percentage Gauge */}
      <div className="space-y-2">
        <div className="flex justify-between items-end gap-3">
          <div className="min-w-0">
            <p className="text-lg font-normal text-slate-900 tracking-tight">{coverageRate}% Funded</p>
            <p className="text-xs text-slate-500 font-medium">School support progress</p>
          </div>
          <div className="text-right shrink-0 tabular-nums">
            <p className="text-sm font-bold text-[#dac48b] leading-tight">₹{totalPaid.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 font-medium">of ₹{totalRequired.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="relative w-full h-2.5 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-[#dac48b]"
            style={{ width: `${coverageRate}%` }}
          />
        </div>
      </div>

      {/* Breakdown Splits */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/40">
        {/* Zakat Split */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Zakat Fund</span>
            <span className="text-sm font-semibold text-slate-700 tabular-nums">{zakatCoverageRate}%</span>
          </div>
          <div className="relative w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#dac48b]/80" style={{ width: `${zakatCoverageRate}%` }} />
          </div>
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>{zakatCount} Sponsored</span>
            <span>₹{zakatPaid.toLocaleString('en-IN')} Paid</span>
          </div>
        </div>

        {/* Lillah Split */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Lillah Fund</span>
            <span className="text-sm font-semibold text-slate-700 tabular-nums">{lillahCoverageRate}%</span>
          </div>
          <div className="relative w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#dac48b]/80" style={{ width: `${lillahCoverageRate}%` }} />
          </div>
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>{lillahCount} Sponsored</span>
            <span>₹{lillahPaid.toLocaleString('en-IN')} Paid</span>
          </div>
        </div>
      </div>

      {/* Deficit Footer */}
      <div className="pt-3 border-t border-slate-200/40 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount Still Needed</p>
          <p className="text-lg font-black text-rose-500 tracking-tight">₹{remainingDeficit.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
    {dialog}
    </>
  );
}
