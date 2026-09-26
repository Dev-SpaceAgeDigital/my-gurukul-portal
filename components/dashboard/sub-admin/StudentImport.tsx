'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  Table, 
  Loader2, 
  Save,
  Trash2
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

export interface Standard {
  id: string;
  standardName: string;
  division: string | null;
}

export default function StudentImport() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [sponsorshipMode, setSponsorshipMode] = useState<string>('ZAKAT_LILLAH');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchStandards();
    fetchSponsorshipMode();
  }, []);

  const fetchSponsorshipMode = async () => {
    try {
      const res = await fetch('/api/subadmin/analytics/needy');
      if (res.ok) {
        const data = await res.json();
        if (data.sponsorshipMode) {
          setSponsorshipMode(data.sponsorshipMode);
        }
      }
    } catch {
      // Keep default
    }
  };

  const fetchStandards = async () => {
    try {
      const res = await fetch('/api/subadmin/standards');
      if (res.ok) {
        const data = await res.json();
        setStandards(data);
      }
    } catch (err) {
      console.error('Failed to fetch standards');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!selectedStandardId) {
      showAlert({
        title: 'Select academic standard',
        message: 'Please select a target academic standard before analyzing the file.',
        variant: 'danger',
      });
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/subadmin/students/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setHeaders(data.headers);
        setPreviewData(data.students);
      } else {
        showAlert({ title: 'Analysis failed', message: data.error || 'The Excel file could not be analyzed.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Communication failed', message: 'Please check your network and try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (previewData.length === 0 || !selectedStandardId) return;
    setImporting(true);

    try {
      const res = await fetch('/api/subadmin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          students: previewData,
          standardId: selectedStandardId
        }),
      });

      if (res.ok) {
        setPreviewData([]);
        setFile(null);
        setSelectedStandardId('');
        showAlert({
          title: 'Sync complete',
          message: 'All records have been successfully synchronized with the institutional registry.',
          variant: 'success',
        });
      } else {
        const data = await res.json();
        showAlert({ title: 'Import failed', message: data.error || 'Student records could not be synchronized.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Database synchronization failed', message: 'Student records could not be saved. Please try again.', variant: 'danger' });
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveRow = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const updated = [...previewData];
    updated[rowIndex][header] = value;
    setPreviewData(updated);
  };

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Step 1: Upload Section */}
      {!previewData.length && (
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <div className="bg-[#FAF7F0] p-8 rounded-md border border-[#E6DFD3] shadow-sm text-center w-full max-w-lg">
             <div className="w-16 h-16 bg-[#dac48b]/10 text-[#dac48b] rounded-md flex items-center justify-center mx-auto mb-4">
                <FileUp size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-1">Import Students</h3>
             <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-4">Select a standard and upload the corresponding Excel template.</p>
             
             {/* Dynamic Sponsorship Mode Guidance Badge */}
             <div className="mb-6 p-3 bg-white rounded-md border border-[#E6DFD3] text-left">
                <div className="flex items-center justify-between gap-2">
                   <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Sponsorship Framework:</span>
                   {sponsorshipMode === 'DONATION' ? (
                     <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-sm border border-emerald-200">
                       🤝 DONATION MODE
                     </span>
                   ) : (
                     <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-sm border border-amber-200">
                       🕌 ZAKAT & LILLAH MODE
                     </span>
                   )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                   {sponsorshipMode === 'DONATION' ? (
                     <>In your Excel file, set column <b className="text-slate-800">Sponsorship Type</b> to <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">DONATION</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">GENERAL</code>.</>
                   ) : (
                     <>In your Excel file, set column <b className="text-slate-800">Sponsorship Type</b> to <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-bold">ZAKAT</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">LILLAH</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">GENERAL</code>.</>
                   )}
                </p>
             </div>
             
             <div className="space-y-4">
                <div className="text-left space-y-1 mb-4">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Target Academic Standard</label>
                   <select 
                     value={selectedStandardId} 
                     onChange={(e) => setSelectedStandardId(e.target.value)}
                     className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-[#dac48b]/20 text-sm transition-all appearance-none cursor-pointer"
                   >
                     <option value="">Select Standard...</option>
                     {standards.map(std => (
                       <option key={std.id} value={std.id}>{std.standardName} {std.division ? `(${std.division})` : ''}</option>
                     ))}
                   </select>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-6 border-2 border-dashed border-slate-200 rounded-md hover:border-[#dac48b] hover:bg-white transition-all flex flex-col items-center group"
                >
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#dac48b]">
                      {file ? file.name : 'Select Excel Document'}
                   </span>
                </button>
                
                {file && (
                   <button 
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full py-3 bg-[#18181b] text-white rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-black transition-all flex items-center justify-center space-x-2"
                   >
                     {loading ? <Loader2 className="animate-spin" size={16} /> : <><span>Analyze Registry</span><Table size={16}/></>}
                   </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Edit Section */}
      {previewData.length > 0 && (
        <div className="flex-1 flex flex-col gap-3 min-h-0 lg:overflow-hidden">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Registry Snapshot</h2>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Found {previewData.length} records in template</p>
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => setPreviewData([])} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-md font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all">Abort</button>
                 <button 
                  onClick={handleSave} 
                  disabled={importing}
                  className="px-6 py-2 bg-[#18181b] text-white rounded-md font-bold text-[10px] uppercase tracking-wider shadow-sm hover:bg-black transition-all flex items-center"
                 >
                    {importing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save className="mr-2" size={14} />}
                    Finalize Import
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="overflow-auto custom-scrollbar flex-1">
                 <table className="w-full text-left border-collapse text-[11px] min-w-[1000px]">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                       <tr>
                          <th className="px-4 py-3 text-[#dac48b] font-bold uppercase tracking-wider sticky left-0 bg-slate-50 z-20">Tools</th>
                          {headers.map((h, i) => (
                             <th key={i} className="px-4 py-3 text-[#dac48b] font-bold uppercase tracking-wider min-w-[150px]">{h}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {previewData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50/40 transition-colors group">
                             <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-100">
                                <button onClick={() => handleRemoveRow(rowIndex)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
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
    {dialog}
    </>
  );
}
