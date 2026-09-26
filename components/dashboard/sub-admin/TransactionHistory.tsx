'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Loader2, 
  Calendar, 
  User, 
  Mail, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

interface Transaction {
  id: string;
  amount: string;
  donorName: string;
  donorEmail: string | null;
  razorpayPaymentId: string | null;
  type: string;
  targetType?: 'PROJECT' | 'STANDARD' | 'GENERAL';
  targetId?: string | null;
  targetLabel?: string | null;
  year?: number;
  createdAt: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    construction: 0,
    aid: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, targetFilter, yearFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subadmin/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
        
        const construction = data
          .filter((t: Transaction) => t.type === 'CONSTRUCTION')
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
          
        const aid = data
          .filter((t: Transaction) => ['FINANCIAL_AID', 'ZAKAT', 'LILLAH', 'SADKA'].includes(t.type))
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
          
        setStats({
          total: data.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0),
          count: data.length,
          construction,
          aid
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((transaction) => transaction.type).filter(Boolean))).sort();
  }, [transactions]);

  const yearOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((transaction) => transaction.year || new Date(transaction.createdAt).getFullYear()))).sort((a, b) => b - a);
  }, [transactions]);

  const targetOptions = useMemo(() => {
    const scoped = transactions.filter((transaction) => {
      const transactionYear = transaction.year || new Date(transaction.createdAt).getFullYear();
      return (categoryFilter === 'ALL' || transaction.type === categoryFilter)
        && (yearFilter === 'ALL' || String(transactionYear) === yearFilter);
    });
    const map = new Map<string, string>();
    scoped.forEach((transaction) => {
      const id = transaction.targetId || transaction.targetLabel || 'GENERAL';
      map.set(id, transaction.targetLabel || 'General donation');
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions, categoryFilter, yearFilter]);

  const filteredTransactions = transactions.filter((transaction) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      transaction.donorName.toLowerCase().includes(term) ||
      (transaction.donorEmail?.toLowerCase() || '').includes(term) ||
      (transaction.razorpayPaymentId?.toLowerCase() || '').includes(term) ||
      transaction.type.toLowerCase().includes(term) ||
      (transaction.targetLabel?.toLowerCase() || '').includes(term);
    const matchesCategory = categoryFilter === 'ALL' || transaction.type === categoryFilter;
    const matchesTarget = targetFilter === 'ALL' || (transaction.targetId || transaction.targetLabel || 'GENERAL') === targetFilter;
    const transactionYear = transaction.year || new Date(transaction.createdAt).getFullYear();
    const matchesYear = yearFilter === 'ALL' || String(transactionYear) === yearFilter;

    return matchesSearch && matchesCategory && matchesTarget && matchesYear;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Donations Ledger</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Verified Audit Trail & Ledger</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/50">
          <History size={13} className="text-[#dac48b]" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Financial Registry Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
         <div className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-50 rounded-md flex items-center justify-center text-[#dac48b] shrink-0">
               <History size={18} />
            </div>
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Financial Ledger</p>
                <p className="text-[10px] text-slate-400 font-medium italic">Verified audit trail</p>
             </div>
         </div>

         <div className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3 group relative overflow-hidden">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center text-white shrink-0">
               <ArrowUpRight size={18} />
            </div>
            <div className="min-w-0">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Total Contributions</p>
               <p className="text-sm font-bold text-slate-900 tracking-tight">₹{stats.total.toLocaleString('en-IN')}</p>
            </div>
         </div>

         <div className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 shrink-0">
               <ArrowUpRight size={18} />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Construction Funds</p>
               <p className="text-sm font-bold text-slate-900 tracking-tight">₹{stats.construction.toLocaleString('en-IN')}</p>
            </div>
         </div>

         <div className="bg-white px-4 py-3 rounded-md border border-slate-100 shadow-sm flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#dac48b]/10 rounded-md flex items-center justify-center text-[#dac48b] shrink-0">
               <ArrowUpRight size={18} />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Financial Aid Funds</p>
               <p className="text-sm font-bold text-slate-900 tracking-tight">₹{stats.aid.toLocaleString('en-IN')}</p>
            </div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
         <div className="relative group w-full sm:w-80">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b] transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by alumni, type, or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-xs transition-all"
            />
         </div>
         <button onClick={fetchTransactions} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-md border border-slate-200 transition-all shrink-0">
            <Loader2 className={loading ? 'animate-spin' : ''} size={14} />
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <FilterSelect
          label="Category"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            setTargetFilter('ALL');
          }}
          options={[{ value: 'ALL', label: 'All categories' }, ...categoryOptions.map((category) => ({ value: category, label: formatType(category) }))]}
        />
        <FilterSelect
          label={categoryFilter === 'ALL' ? 'Standard / Project' : ['CONSTRUCTION', 'EVENT'].includes(categoryFilter) ? 'Project' : 'Standard'}
          value={targetFilter}
          onChange={setTargetFilter}
          options={[{ value: 'ALL', label: 'All records' }, ...targetOptions.map((target) => ({ value: target.id, label: target.label }))]}
        />
        <FilterSelect
          label="Year"
          value={yearFilter}
          onChange={(value) => {
            setYearFilter(value);
            setTargetFilter('ALL');
          }}
          options={[{ value: 'ALL', label: 'All years' }, ...yearOptions.map((year) => ({ value: String(year), label: String(year) }))]}
        />
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
         <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse text-[11px] min-w-[1100px]">
               <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Transaction</th>
                     <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-center">Category</th>
                     <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Standard / Project</th>
                     <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider">Donor</th>
                     <th className="px-6 py-4 text-[#dac48b] font-bold uppercase tracking-wider text-right pr-8">Payment</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-[#dac48b] mx-auto" size={32} /></td></tr>
                  ) : paginatedTransactions.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic text-sm">No contributions match the selected filters.</td></tr>
                  ) : (
                    paginatedTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/40 transition-all group align-middle">
                        <td className="px-6 py-4">
                           <p className="text-[13px] font-bold text-slate-700 tracking-tight">{t.razorpayPaymentId}</p>
                           <p className="text-[10px] text-slate-400 mt-0.5 flex items-center font-medium italic">
                              <Calendar size={12} className="mr-1.5 text-slate-300" />
                              {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                           </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${t.type === 'CONSTRUCTION' ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50' : 'bg-amber-50 text-[#a98f4a] border-amber-100/50'}`}>
                              {formatType(t.type)}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-[12px] font-bold text-slate-700 truncate">{t.targetLabel || 'General donation'}</p>
                           <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">{t.targetType || 'GENERAL'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="space-y-0.5">
                              <p className="text-[13px] font-bold text-slate-700 flex items-center group-hover:text-black transition-colors">
                                 <User size={14} className="mr-2 text-slate-300" />
                                 {t.donorName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium italic flex items-center ml-5 truncate">
                                 <Mail size={12} className="mr-1.5 text-slate-300" />
                                 {t.donorEmail}
                              </p>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right pr-8">
                           <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-900 tracking-tight tabular-nums">₹{Math.round(parseFloat(t.amount)).toLocaleString('en-IN')}</p>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">Settled</span>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination Container */}
      <div className="shrink-0">
         <Pagination 
           currentPage={currentPage} 
           totalPages={totalPages} 
           onPageChange={setCurrentPage} 
           accentColor="bg-[#18181b]"
         />
      </div>
    </div>
  );
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="ml-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Filter size={11} className="text-[#dac48b]" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none transition-all hover:border-slate-400 focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
