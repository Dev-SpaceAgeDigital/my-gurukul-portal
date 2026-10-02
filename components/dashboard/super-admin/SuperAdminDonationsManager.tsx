'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  IndianRupee,
  Building2,
  Calendar,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  X,
  PieChart
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Transaction {
  id: string;
  amount: string;
  donorName: string;
  donorEmail: string | null;
  razorpayPaymentId: string | null;
  type: string;
  targetType: string;
  targetLabel: string;
  schoolName?: string;
  schoolId: string;
  year?: number;
  createdAt: string;
}

interface Project {
  id: string;
  schoolId: string;
  schoolName?: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string | null;
  estimatedCost: string | number;
  paidAmount: string | number;
  createdAt: string;
}

interface School {
  id: string;
  schoolName: string;
}

export default function SuperAdminDonationsManager() {
  const [activeTab, setActiveTab] = useState<'donations' | 'projects'>('donations');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Project Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    schoolId: '',
    title: '',
    type: 'CONSTRUCTION',
    estimatedCost: '',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { dialog, confirmDialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchData();
  }, [selectedSchool, selectedYear, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSchool !== 'ALL') params.append('schoolId', selectedSchool);
      if (selectedYear !== 'ALL') params.append('year', selectedYear);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/superadmin/donations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setProjects(data.projects || []);
        setSchools(data.schools || []);
        setYears(data.years || []);

        if (!newProject.schoolId && data.schools?.length > 0) {
          setNewProject((prev) => ({ ...prev, schoolId: data.schools[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch donations data:', err);
      showAlert({ title: 'Load Error', message: 'Failed to load donations and project records.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.schoolId || !newProject.title.trim()) {
      showAlert({ title: 'Required Fields', message: 'Please select a school and enter project title.', variant: 'danger' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      const data = await res.json();
      if (res.ok) {
        await showAlert({ title: 'Project Created', message: 'New project costing has been added successfully.', variant: 'success' });
        setIsAddModalOpen(false);
        setNewProject({
          schoolId: schools[0]?.id || '',
          title: '',
          type: 'CONSTRUCTION',
          estimatedCost: '',
          startDate: new Date().toISOString().split('T')[0],
          description: '',
        });
        fetchData();
        setActiveTab('projects');
      } else {
        showAlert({ title: 'Create Failed', message: data.error || 'Failed to add project.', variant: 'danger' });
      }
    } catch (err: any) {
      showAlert({ title: 'Error', message: err?.message || 'Something went wrong.', variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!(await confirmDialog({
      title: 'Delete Project?',
      message: `Are you sure you want to remove "${title}"? This will delete the project costing record.`,
      confirmText: 'Delete Project',
      variant: 'danger',
    }))) return;

    try {
      const res = await fetch(`/api/superadmin/costs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert({ title: 'Project Removed', message: 'Project costing removed successfully.', variant: 'success' });
        fetchData();
      } else {
        showAlert({ title: 'Delete Failed', message: 'Failed to delete project.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Error', message: 'Unable to remove project.', variant: 'danger' });
    }
  };

  // Client-side search filtering
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.donorName?.toLowerCase().includes(term) ||
        t.donorEmail?.toLowerCase().includes(term) ||
        t.targetLabel?.toLowerCase().includes(term) ||
        t.schoolName?.toLowerCase().includes(term) ||
        t.razorpayPaymentId?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.schoolName?.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  // Aggregate Stats
  const totalDonations = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalEstimatedCost = projects.reduce((sum, p) => sum + (parseFloat(p.estimatedCost as string) || 0), 0);
  const fundingGap = Math.max(0, totalEstimatedCost - totalDonations);
  const avgDonation = transactions.length > 0 ? Math.round(totalDonations / transactions.length) : 0;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
        {/* Top Header & Summary */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-[#3f72af]/10 text-[#3f72af] text-[11px] font-bold uppercase tracking-wider">
                  Trust Governance Hub
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Multi-School Financial Audit</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Wallet className="text-[#3f72af]" size={26} />
                Donations & Institutional Projects
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Track all incoming community & alumni donations, review institutional project budgets, and manage project costings across schools.
              </p>
            </div>

            {/* Actions: Tab Toggle + Add Project Costing Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('donations')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'donations' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Donations ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'projects' ? 'bg-white text-[#3f72af] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Projects & Costing ({filteredProjects.length})
                </button>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3f72af] to-[#1b4a50] hover:from-[#325d91] hover:to-[#143d43] text-white text-xs font-black shadow-md shadow-[#3f72af]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>Add Project Costing</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 p-4">
              <div className="flex items-center justify-between text-emerald-700 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Total Donations</span>
                <IndianRupee size={16} />
              </div>
              <div className="text-2xl font-black text-emerald-950">
                ₹{totalDonations.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700/80 mt-1 flex items-center gap-1">
                <Users size={12} /> {transactions.length} total contributions
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 p-4">
              <div className="flex items-center justify-between text-[#3f72af] mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Project Budgets</span>
                <Layers size={16} />
              </div>
              <div className="text-2xl font-black text-slate-900">
                ₹{totalEstimatedCost.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> {projects.length} recorded projects
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 p-4">
              <div className="flex items-center justify-between text-amber-700 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Funding Gap</span>
                <PieChart size={16} />
              </div>
              <div className="text-2xl font-black text-amber-950">
                ₹{fundingGap.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-semibold text-amber-700/80 mt-1">
                {totalEstimatedCost > 0 ? `${Math.round((totalDonations / totalEstimatedCost) * 100)}% funded` : '100% funded'}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/40 border border-indigo-200/80 p-4">
              <div className="flex items-center justify-between text-indigo-700 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Contribution</span>
                <ArrowUpRight size={16} />
              </div>
              <div className="text-2xl font-black text-indigo-950">
                ₹{avgDonation.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-semibold text-indigo-700/80 mt-1">
                Per verified transaction
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'donations' ? 'Search donor, email, ref...' : 'Search project, school...'}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af] focus:ring-2 focus:ring-[#3f72af]/10"
              />
            </div>

            {/* School Filter */}
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af] bg-white cursor-pointer"
              >
                <option value="ALL">All Schools in Trust</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af] bg-white cursor-pointer"
              >
                <option value="ALL">All Financial Years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3f72af] bg-white cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="CONSTRUCTION">Infrastructure & Construction</option>
                <option value="EVENT">Events & Campus Life</option>
                <option value="FINANCIAL_AID">Financial Aid & Scholarship</option>
                <option value="ZAKAT">Zakat Fund</option>
                <option value="LILLAH">Lillah / Sadka</option>
                <option value="GENERAL">General Institutional Fund</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#3f72af] bg-white rounded-3xl border border-slate-200">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-xs font-bold text-slate-500">Loading audit records...</p>
          </div>
        ) : activeTab === 'donations' ? (
          /* TAB 1: DONATIONS LIST */
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Donation & Contribution Ledger</h3>
                <p className="text-xs text-slate-500 font-medium">Showing {filteredTransactions.length} contributions</p>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Wallet className="mx-auto mb-2 text-slate-300" size={36} />
                <p className="text-sm font-bold text-slate-600">No donations found</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the filters above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-black">
                    <tr>
                      <th className="px-6 py-4">Donor Details</th>
                      <th className="px-6 py-4">School</th>
                      <th className="px-6 py-4">Fund / Project Target</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Payment Ref</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{tx.donorName || 'Anonymous Donor'}</div>
                          {tx.donorEmail && <div className="text-[11px] text-slate-500 font-medium">{tx.donorEmail}</div>}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {tx.schoolName || 'Main Trust'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {tx.targetLabel}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-emerald-600 text-sm">
                            ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                          {tx.razorpayPaymentId || tx.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: PROJECTS & COSTING LIST */
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Institutional Project Costings & Budgets</h3>
                <p className="text-xs text-slate-500 font-medium">Showing {filteredProjects.length} projects across schools</p>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Layers className="mx-auto mb-2 text-slate-300" size={36} />
                <p className="text-sm font-bold text-slate-600">No project costings recorded</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add Project Costing" above to record a new project.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-black">
                    <tr>
                      <th className="px-6 py-4">Project Title</th>
                      <th className="px-6 py-4">School</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Estimated Budget</th>
                      <th className="px-6 py-4">Paid / Settled</th>
                      <th className="px-6 py-4">Start Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map((project) => {
                      const estimated = parseFloat(project.estimatedCost as string || '0');
                      const paid = parseFloat(project.paidAmount as string || '0');
                      const progress = estimated > 0 ? Math.min(100, Math.round((paid / estimated) * 100)) : 0;

                      return (
                        <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900 text-sm">{project.title}</div>
                            {project.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{project.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {project.schoolName || 'School'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              {project.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 text-sm">
                            ₹{estimated.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-emerald-600">₹{paid.toLocaleString('en-IN')}</div>
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {project.startDate
                              ? new Date(project.startDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Ongoing'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteProject(project.id, project.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Project Cost"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Project Costing Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Plus size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Add Project Costing</h3>
                  <p className="text-[11px] text-slate-300">Approve & record an institutional development project</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Target School <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newProject.schoolId}
                  onChange={(e) => setNewProject({ ...newProject, schoolId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Science Lab Renovation / Sports Complex Construction"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Category Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                  >
                    <option value="CONSTRUCTION">Infrastructure & Construction</option>
                    <option value="EVENT">Campus Event / Annual Function</option>
                    <option value="ACADEMIC">Academic Equipment / Technology</option>
                    <option value="GENERAL">General Institution Project</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Estimated Budget (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={newProject.estimatedCost}
                    onChange={(e) => setNewProject({ ...newProject, estimatedCost: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Start / Target Date
                </label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Project Description & Goals
                </label>
                <textarea
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Provide details on project scope, beneficiary students, and funding timeline..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#3f72af]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3f72af] to-[#1b4a50] text-white text-xs font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="stroke-[3]" />}
                  <span>Save Project Costing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog}
    </>
  );
}
