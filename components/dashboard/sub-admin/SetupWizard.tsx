'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  FileUp,
  CheckCircle2,
  Loader2,
  ArrowRight,
  IndianRupee,
  Table,
  Save,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [createdStandardId, setCreatedStandardId] = useState('');
  const { dialog, showAlert } = usePortalDialog();

  // ---------- Step 1 State ----------
  const [formData, setFormData] = useState({ standardName: '', division: '', stream: '', fees: '', batchYear: '' });
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading1, setLoading1] = useState(false);

  // ---------- Step 2 State ----------
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/subadmin/academic-years');
      if (res.ok) {
        setAcademicYears(await res.json());
      }
    } catch { }
  };

  // ---------- Step 1 Handlers ----------
  const handleCreateStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.standardName || !formData.batchYear || !formData.fees) {
      showAlert({ title: 'Missing details', message: 'Please fill all required fields before proceeding.', variant: 'danger' });
      return;
    }
    setLoading1(true);

    try {
      const res = await fetch('/api/subadmin/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setCreatedStandardId(data.id);
        setStep(2);
      } else {
        showAlert({ title: 'Class setup failed', message: data.error || 'Failed to create standard.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network error', message: 'Network error occurred while saving the configuration.', variant: 'danger' });
    } finally {
      setLoading1(false);
    }
  };

  // ---------- Step 2 Handlers ----------
  const handleUpload = async () => {
    if (!file) return;
    setLoading2(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/subadmin/students/import', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();

      if (res.ok) {
        setHeaders(data.headers);
        setPreviewData(data.students);
      } else {
        showAlert({ title: 'Analysis failed', message: data.error || 'The roster file could not be analyzed.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Communication failed', message: 'Check your network and try again.', variant: 'danger' });
    } finally {
      setLoading2(false);
    }
  };

  const handleSaveStudents = async () => {
    if (previewData.length === 0 || !createdStandardId) return;
    setImporting(true);

    try {
      const res = await fetch('/api/subadmin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: previewData,
          standardId: createdStandardId
        }),
      });

      if (res.ok) {
        showAlert({ title: 'Setup finalized', message: 'Class and student registry have been synchronized successfully.', variant: 'success' });
        setStep(3);
      } else {
        const data = await res.json();
        showAlert({ title: 'Import failed', message: data.error || 'Failed to save students.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Import failed', message: 'Failed to save students.', variant: 'danger' });
    } finally {
      setImporting(false);
    }
  };

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const updated = [...previewData];
    updated[rowIndex][header] = value;
    setPreviewData(updated);
  };

  // ---------- Render Helpers ----------
  const resetWizard = () => {
    setFormData({ standardName: '', division: '', stream: '', fees: '', batchYear: '' });
    setCreatedStandardId('');
    setFile(null);
    setPreviewData([]);
    setStep(1);
  };

  return (
    <>
    <div className="py-4 lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Premium Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Class Setup
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Create new classes and add students</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/50">
          <Sparkles size={13} className="text-[#dac48b]" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Setup Guide Active</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 lg:overflow-hidden">
        {/* Progress Tracker Card */}
        <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm shrink-0">
          <div className="relative max-w-2xl mx-auto">
            {/* Connecting Line Background */}
            <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-slate-100 -translate-y-1/2 rounded-full"></div>
            
            {/* Connecting Line Active */}
            <div 
              className="absolute top-5 left-[10%] h-[2px] bg-[#dac48b] -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out" 
              style={{ width: step === 1 ? '0%' : step === 2 ? '40%' : '80%' }}
            ></div>

            <div className="relative z-10 flex justify-between">
              {[
                { id: 1, title: 'Add Standard', icon: <Layers size={18} /> },
                { id: 2, title: 'Upload Data', icon: <FileUp size={18} /> },
                { id: 3, title: 'Finalization', icon: <CheckCircle2 size={18} /> }
              ].map((s) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                const isPending = step < s.id;

                return (
                  <div key={s.id} className="flex flex-col items-center w-24">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-500 shadow-sm z-10 relative
                        ${isActive ? 'bg-[#18181b] text-white ring-4 ring-slate-100 scale-110' : ''}
                        ${isCompleted ? 'bg-[#dac48b] text-white scale-100' : ''}
                        ${isPending ? 'bg-white text-slate-300 border-2 border-slate-100 scale-100' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle2 size={18} /> : s.icon}
                    </div>
                    <p 
                      className={`mt-4 text-[10px] font-black uppercase tracking-widest text-center transition-colors duration-300
                        ${isActive ? 'text-slate-900' : ''}
                        ${isCompleted ? 'text-[#dac48b]' : ''}
                        ${isPending ? 'text-slate-400' : ''}
                      `}
                    >
                      {s.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Wizard Container */}
        <div className="bg-white rounded-md border border-slate-100 shadow-sm p-6 md:p-8 flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar relative">

        {/* Step 1: Create Standard */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-500 space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">Set Class Details</h2>
              <p className="text-slate-500 mt-1 text-sm font-medium">Fill in the details for this new class before adding students.</p>
            </div>

            <form onSubmit={handleCreateStandard} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Standard (e.g., 10th)</label>
                  <input type="text" required value={formData.standardName} onChange={e => setFormData({ ...formData, standardName: e.target.value })} className="w-full px-4 py-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Divisions (Optional)</label>
                  <input type="text" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className="w-full px-4 py-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm transition-all" />
                </div>

                {(formData.standardName.trim().toLowerCase() === '11th' || formData.standardName.trim().toLowerCase() === '12th') && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Stream</label>
                    <select
                      value={formData.stream}
                      onChange={e => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm transition-all"
                      required
                    >
                      <option value="">Select Stream</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Academic Year</label>
                  <select
                    value={formData.batchYear}
                    onChange={e => setFormData({ ...formData, batchYear: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm transition-all"
                    required
                  >
                    <option value="">Select an Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.label}>
                        {year.label} {year.statusTag ? `(${year.statusTag})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Annual Fees</label>
                  <div className="relative group">
                    <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#dac48b] transition-colors" />
                    <input type="number" required value={formData.fees} onChange={e => setFormData({ ...formData, fees: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm transition-all" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading1} className="w-full mt-4 py-3 bg-[#18181b] text-white rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all flex items-center justify-center group active:scale-[0.98]">
                {loading1 ? <Loader2 className="animate-spin" size={18} /> : (
                  <>Proceed to Import Roster <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Roster Import */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
            {!previewData.length ? (
              <div className="text-center max-w-xl mx-auto py-4">
                <div className="w-16 h-16 bg-[#dac48b]/10 text-[#dac48b] rounded-md flex items-center justify-center mx-auto mb-4">
                  <FileUp size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Upload Student Roster</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium mb-8">You are uploading exactly into: <strong className="text-slate-800">{formData.standardName} {formData.stream ? `(${formData.stream})` : ''} {formData.division && `- ${formData.division}`} - {formData.batchYear}</strong></p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => { if (e.target.files) setFile(e.target.files[0]); }}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-md hover:border-[#dac48b] hover:bg-[#dac48b]/5 transition-all flex flex-col items-center group"
                >
                  <span className="text-xs font-bold text-slate-400 group-hover:text-[#dac48b] uppercase tracking-widest">
                    {file ? file.name : 'Select Excel Document (.xlsx)'}
                  </span>
                </button>

                {file && (
                  <button
                    onClick={handleUpload}
                    disabled={loading2}
                    className="w-full mt-4 py-3 bg-[#18181b] text-white rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all flex items-center justify-center"
                  >
                    {loading2 ? <Loader2 className="animate-spin" size={18} /> : <><span>Analyze Registry Data</span><Table size={16} className="ml-2" /></>}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900">Preview Layout</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{previewData.length} Valid Records Detected</p>
                  </div>
                  <div className="flex space-x-2 mt-3 md:mt-0">
                    <button onClick={() => { setPreviewData([]); setFile(null); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Select Different File</button>
                    <button
                      onClick={handleSaveStudents}
                      disabled={importing}
                      className="px-4 py-2 bg-[#18181b] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-black transition-all flex items-center"
                    >
                      {importing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save size={14} className="mr-2" />} Synchronize Registry
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
                  <div className="max-h-[400px] overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-[#dac48b] font-bold uppercase tracking-wider sticky left-0 bg-slate-50 z-30">Tools</th>
                          {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 text-[#dac48b] font-bold uppercase tracking-wider min-w-[150px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 sticky left-0 bg-white border-r border-slate-100 z-10 w-12 text-center">
                              <button onClick={() => setPreviewData(prev => prev.filter((_, i) => i !== rowIndex))} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                            </td>
                            {headers.map((h, i) => (
                              <td key={i} className="px-4 py-1.5">
                                <input
                                  type="text"
                                  value={row[h] || ''}
                                  onChange={(e) => handleCellChange(rowIndex, h, e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#dac48b]/30 rounded-md py-1 px-2 font-medium text-slate-800 outline-none hover:bg-slate-50 transition-all"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && (
          <div className="text-center py-12 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-[#dac48b]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
              <div className="absolute inset-0 bg-[#dac48b]/20 rounded-full animate-ping opacity-20"></div>
              <CheckCircle2 size={48} className="text-[#dac48b] relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Setup Finalized</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-lg mx-auto leading-relaxed text-sm">
              Grade <strong className="text-slate-800">{formData.standardName} {formData.stream ? `(${formData.stream})` : ''} {formData.division && `- ${formData.division}`}</strong> has been registered with its accompanying students seamlessly synchronised.
            </p>

            <button onClick={resetWizard} className="px-6 py-3 bg-[#18181b] text-white rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all flex items-center mx-auto">
              <RefreshCcw size={14} className="mr-3" /> Initialize Another Class
            </button>
          </div>
        )}

      </div>
    </div>
  </div>
  {dialog}
  </>
  );
}
