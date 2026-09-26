'use client';

import React from 'react';
import { Landmark, TrendingUp, User, Calendar, ShieldCheck } from 'lucide-react';

interface Transaction {
  id: string;
  amount: string | number;
  donorName: string;
  type: string;
  createdAt: string;
}

interface DonationAnalyticsHubProps {
  stats: {
    totalDonations: number;
    constructionDonations: number;
    financialAidDonations: number;
    recentTransactions: Transaction[];
  } | null;
}

export default function DonationAnalyticsHub({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-md shadow-sm min-h-[400px] flex items-center justify-center">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Analytics Ledger...</p>
      </div>
    );
  }

  const {
    totalDonations = 0,
    constructionDonations = 0,
    financialAidDonations = 0,
    recentTransactions = []
  } = stats;

  // Donut Chart Calculations
  const constructionAmt = Number(constructionDonations) || 0;
  const financialAidAmt = Number(financialAidDonations) || 0;
  const totalBreakdown = constructionAmt + financialAidAmt;
  const aidPercentage = totalBreakdown > 0 ? Math.round((financialAidAmt / totalBreakdown) * 100) : 0;
  const constPercentage = totalBreakdown > 0 ? Math.round((constructionAmt / totalBreakdown) * 100) : 0;

  // Circle circumference is 2 * PI * r
  // For r=40, circumference is ~251.3
  const r = 40;
  const circ = 2 * Math.PI * r;
  const aidStroke = circ * (aidPercentage / 100);
  const constStroke = circ * (constPercentage / 100);

  // Chronological order for line chart plotting (oldest to newest)
  const cronTransactions = [...recentTransactions].reverse();
  const amounts = cronTransactions.map(t => parseFloat(t.amount as string) || 0);

  // Plot coordinates for SVG Line/Area chart (width 320, height 80)
  const chartWidth = 320;
  const chartHeight = 80;
  const maxVal = Math.max(...amounts, 1000);
  const minVal = 0;

  const points = cronTransactions.map((t, index) => {
    const x = cronTransactions.length > 1 ? (index / (cronTransactions.length - 1)) * (chartWidth - 20) + 10 : 10;
    const val = parseFloat(t.amount as string) || 0;
    const y = maxVal > minVal
      ? chartHeight - 15 - ((val - minVal) / (maxVal - minVal)) * (chartHeight - 30)
      : chartHeight / 2;
    return { x, y, val, date: new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  });

  const linePath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - 5} L ${points[0].x} ${chartHeight - 5} Z`
    : '';

  return (
    <div className="bg-white p-5 lg:p-4 xl:p-6 rounded-md shadow-sm flex flex-col justify-between h-full lg:overflow-hidden min-h-0 space-y-4 lg:space-y-2 xl:space-y-4">
      <div className="flex items-center justify-between mb-4 lg:mb-2">
        <h4 className="text-lg font-bold text-slate-900 flex items-center">
          <Landmark size={20} className="mr-2 text-[#dac48b]" />
          Donation Analytics Hub
        </h4>
        <span className="text-[10px] font-bold bg-[#dac48b]/10 text-[#dac48b] px-2.5 py-1 rounded-full uppercase tracking-wider">
          Live Feed
        </span>
      </div>

      {/* Top Half: Donut and Line/Area Chart Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center border-b border-slate-200/40 pb-4 lg:pb-2">

        {/* Donut Chart */}
        <div className="flex items-center space-x-6 lg:space-x-4">
          <div className="relative w-24 h-24 lg:w-20 lg:h-20 xl:w-24 xl:h-24 flex items-center justify-center shrink-0">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="rgba(0,0,0,0.04)"
                strokeWidth="10"
              />

              {/* Financial Aid slice */}
              {aidPercentage > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#dac48b"
                  strokeWidth="10"
                  strokeDasharray={`${aidStroke} ${circ - aidStroke}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              )}

              {/* Construction slice */}
              {constPercentage > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#7c776e"
                  strokeWidth="10"
                  strokeDasharray={`${constStroke} ${circ - constStroke}`}
                  strokeDashoffset={-aidStroke}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Ratio</span>
              <span className="text-base font-black text-slate-900 mt-0.5">{aidPercentage}:{constPercentage}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fund Allocation</p>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#dac48b] rounded-full shrink-0" />
              <span className="text-xs text-slate-700 font-medium">Financial Aid ({aidPercentage}%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#7c776e] rounded-full shrink-0" />
              <span className="text-xs text-slate-700 font-medium">Construction ({constPercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Area/Line Chart */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Donation Trend (Last {recentTransactions.length} txs)</span>
            <TrendingUp size={12} className="text-[#dac48b]" />
          </p>
          {points.length > 0 ? (
            <div className="w-full">
              <svg width="100%" height={chartHeight} className="overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dac48b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#dac48b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path d={areaPath} fill="url(#chartGrad)" />

                {/* Stroke line */}
                <path d={linePath} fill="none" stroke="#dac48b" strokeWidth="2.5" strokeLinecap="round" />

                {/* Dots */}
                {points.map((p, i) => (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#dac48b" strokeWidth="2" />
                    <circle cx={p.x} cy={p.y} r="8" fill="#dac48b" fillOpacity="0" className="hover:fill-opacity-10 transition-all" />
                    {/* Custom visual tooltip fallback on hover */}
                    <title>{`₹${p.val.toLocaleString('en-IN')} (${p.date})`}</title>
                  </g>
                ))}
              </svg>
              {/* X Axis dates */}
              <div className="flex justify-between px-2 text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                <span>{points[0]?.date}</span>
                <span>{points[Math.floor(points.length / 2)]?.date}</span>
                <span>{points[points.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center border border-dashed border-slate-200/50 rounded">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Transaction Activity</span>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Half: Recent Contributions Feed */}
      <div className="pt-4 lg:pt-2 flex flex-col min-h-0 flex-1">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 lg:mb-1 flex items-center justify-between shrink-0">
          <span>Recent Contributions Ledger</span>
          <span className="text-[9px] font-bold text-slate-400 font-sans tracking-normal">showing up to 5</span>
        </p>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
          {recentTransactions.length > 0 ? (
            recentTransactions.slice(0, 5).map((t: Transaction, i: number) => {
              const amount = parseFloat(t.amount as string) || 0;
              return (
                <div key={t.id || i} className="flex items-center justify-between py-2 border-b border-slate-200/20 last:border-0 hover:bg-black/5 px-2 rounded-md transition-all duration-300">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs text-slate-700">
                      {t.donorName ? t.donorName[0].toUpperCase() : 'D'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center">
                        {t.donorName || 'Anonymous Donor'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center">
                        <Calendar size={10} className="mr-1 text-slate-300" />
                        {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{amount.toLocaleString('en-IN')}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${t.type === 'CONSTRUCTION' ? 'bg-[#7c776e]/10 text-[#7c776e]' : 'bg-[#dac48b]/10 text-[#dac48b]'}`}>
                      {t.type === 'CONSTRUCTION' ? 'Construction' : 'Financial Aid'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
              No recent contributions found
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
