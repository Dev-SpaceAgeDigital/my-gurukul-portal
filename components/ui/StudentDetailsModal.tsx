'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Save, 
  User, 
  BookOpen, 
  Phone, 
  Home, 
  CreditCard,
  Loader2
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Standard {
  id: string;
  standardName: string;
  division: string | null;
}

interface StudentDetailsModalProps {
  student: any;
  standards: Standard[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function StudentDetailsModal({ student, standards, onClose, onUpdate }: StudentDetailsModalProps) {
  const [formData, setFormData] = useState({ ...student });
  const [sponsorshipMode, setSponsorshipMode] = useState<string>('ZAKAT_LILLAH');
  const [saving, setSaving] = useState(false);
  const { dialog, showAlert } = usePortalDialog();

  const [history, setHistory] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'profile' | 'timeline'>('profile');
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
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

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/subadmin/students/${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: finalValue };
      
      // Enforce exclusivity between Needy and RTE
      if (name === 'isUnderRTE' && finalValue === true) {
        updated.isNeedy = false;
      } else if (name === 'isNeedy' && finalValue === true) {
        updated.isUnderRTE = false;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/subadmin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showAlert({
          title: 'Registry synchronized',
          message: 'Student record has been updated successfully.',
          variant: 'success',
        }).then(() => {
          onUpdate();
          onClose();
        });
      } else {
        const data = await res.json();
        showAlert({ title: 'Update failed', message: data.error || 'Student record could not be updated.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Communication failed', message: 'The student record could not be synchronized. Please try again.', variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: 'Identity & Selection',
      icon: <User size={18} />,
      fields: [
        { name: 'name', label: 'Full Name', type: 'text' },
        { name: 'studentCode', label: 'Student Code', type: 'text' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
        { name: 'age', label: 'Current Age', type: 'number' },
      ]
    },
    {
      title: 'Academic Details',
      icon: <BookOpen size={18} />,
      fields: [
        { name: 'standardId', label: 'Institutional Standard', type: 'select', options: standards },
        { name: 'admissionDate', label: 'Admission Date', type: 'date' },
        { name: 'admissionType', label: 'Admission Type', type: 'text' },
        { name: 'grSrNo', label: 'GR / SR No.', type: 'text' },
        { name: 'currentClass', label: 'Excel: Class', type: 'text' },
        { name: 'section', label: 'Excel: Section', type: 'text' },
      ]
    },
    {
      title: 'Contact & Documentation',
      icon: <Phone size={18} />,
      fields: [
        { name: 'contactNo', label: 'Primary Contact', type: 'text' },
        { name: 'aadharNo', label: 'Aadhar Card', type: 'text' },
        { name: 'panNo', label: 'PAN Card', type: 'text' },
        { name: 'apaarId', label: 'APAAR ID', type: 'text' },
      ]
    },
    {
      title: 'Family & Guardians',
      icon: <Home size={18} />,
      fields: [
        { name: 'fatherName', label: 'Father Name', type: 'text' },
        { name: 'fatherNumber', label: 'Father Number', type: 'text' },
        { name: 'motherName', label: 'Mother Name', type: 'text' },
        { name: 'motherNumber', label: 'Mother Number', type: 'text' },
        { name: 'address', label: 'Residence Address', type: 'textarea' },
        { name: 'city', label: 'City', type: 'text' },
        { name: 'state', label: 'State', type: 'text' },
        { name: 'country', label: 'Country', type: 'text' },
      ]
    },
    {
      title: 'Banking & Financial',
      icon: <CreditCard size={18} />,
      fields: [
        { name: 'accountHolderName', label: 'Account Holder', type: 'text' },
        { name: 'accountNumber', label: 'Account Number', type: 'text' },
        { name: 'bankName', label: 'Bank Name', type: 'text' },
        { name: 'ifscCode', label: 'IFSC Code', type: 'text' },
        { 
          name: 'sponsorshipType', 
          label: sponsorshipMode === 'DONATION' ? 'Sponsorship (Donation / General)' : 'Sponsorship (Zakat / Lillah / General)', 
          type: 'select', 
          options: sponsorshipMode === 'DONATION' ? ['DONATION', 'GENERAL'] : ['ZAKAT', 'LILLAH', 'GENERAL'] 
        },
        { name: 'isNeedy', label: 'Is Needy (Needs Sponsorship)?', type: 'checkbox' },
        { name: 'isUnderRTE', label: 'Under RTE Quota?', type: 'checkbox' },
      ]
    }
  ];

  const formatDateForInput = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      // If it is a Date object, extract local components
      if (dateStr instanceof Date) {
        const year = dateStr.getFullYear();
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const day = String(dateStr.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // Convert to string safely
      const str = String(dateStr).trim();

      // If it is already in YYYY-MM-DD format, return as-is (standard Postgres date column)
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      
      // If it is in DD-MM-YYYY format, convert to YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
        const [d, m, y] = str.split('-');
        return `${y}-${m}-${d}`;
      }

      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      
      // Local extraction to bypass timezone shift bugs
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-6xl h-[96dvh] max-h-[96dvh] md:h-[90vh] md:max-h-[90vh] overflow-hidden rounded-md shadow-2xl relative z-10 flex flex-col md:flex-row border border-slate-100 animate-in zoom-in-95 duration-300">
        
        {/* Left Panel: Profile Summary */}
        <div className="w-full md:w-80 bg-slate-50 p-4 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col md:items-center shrink-0 md:h-full md:min-h-0 md:overflow-y-auto custom-scrollbar">
           <div className="flex w-full items-center gap-3 md:flex-col md:gap-0">
           <div className="w-14 h-14 md:w-24 md:h-24 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[#dac48b] text-2xl md:text-4xl font-bold md:mb-6 shadow-sm shrink-0">
              {formData.name?.[0]}
           </div>
           <div className="min-w-0 md:text-center">
             <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight mb-1 truncate">{formData.name}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Registry</p>
           </div>
           </div>
           
           <div className="hidden md:block w-full space-y-3 mt-4">
              <div className="px-4 py-3 bg-white rounded-md border border-slate-200 shadow-sm">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Student code</p>
                 <p className="text-xs font-bold text-slate-700">{formData.studentCode || 'UNASSIGNED'}</p>
              </div>
              <div className="px-4 py-3 bg-white rounded-md border border-slate-200 shadow-sm">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Current grade</p>
                 <p className="text-xs font-bold text-slate-700">{formData.standardName || 'GENERAL'}</p>
              </div>
           </div>

           <div className="w-full grid grid-cols-2 gap-2 mt-4 md:mt-8 md:block md:space-y-2">
              <button
                type="button"
                onClick={() => setActiveView('profile')}
                className={`w-full py-2.5 px-3 md:px-4 rounded-md text-xs font-bold transition-all text-left flex items-center justify-center md:justify-start space-x-2.5 ${activeView === 'profile' ? 'bg-[#18181b] text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                 <User size={14} />
                 <span>Profile Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('timeline')}
                className={`w-full py-2.5 px-3 md:px-4 rounded-md text-xs font-bold transition-all text-left flex items-center justify-center md:justify-start space-x-2.5 ${activeView === 'timeline' ? 'bg-[#18181b] text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
              >
                 <BookOpen size={14} />
                 <span>Academic Timeline</span>
              </button>
           </div>

           <button 
             onClick={onClose}
             className="hidden md:flex mt-auto w-full py-3 bg-white text-slate-500 rounded-md font-bold text-xs hover:bg-slate-100 transition-all items-center justify-center border border-slate-200 shadow-sm"
           >
              <X size={14} className="mr-2" /> Cancel
           </button>
        </div>

        {/* Right Panel: Scrollable Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
           <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/30 shrink-0">
              <h4 className="min-w-0 text-sm md:text-base font-bold text-slate-900 tracking-tight leading-tight">
                 {activeView === 'profile' ? 'Modify Student Profile' : 'Academic Journey Timeline'}
              </h4>
              
              <div className="flex shrink-0 items-center gap-2">
              {activeView === 'profile' && (
                <button 
                  onClick={handleSubmit} 
                  className="px-3 md:px-6 py-2 bg-[#18181b] hover:bg-black text-white rounded-md font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center shrink-0"
                  disabled={saving}
                >
                   {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                   Save Changes
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm"
                aria-label="Close student details"
              >
                <X size={16} />
              </button>
              </div>
           </div>

           {activeView === 'profile' ? (
             <form className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-8 space-y-8 md:space-y-10 custom-scrollbar scroll-smooth">
                {sections.map((section, idx) => (
                  <div key={idx} className="space-y-5">
                     <div className="flex items-center space-x-3 py-1 border-b border-slate-100">
                        <div className="text-[#dac48b]">
                           {section.icon}
                        </div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</h5>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map((field) => (
                           <div key={field.name} className={`space-y-1 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-1">{field.label}</label>
                              
                              {field.type === 'select' ? (
                                 <select 
                                   name={field.name}
                                   value={formData[field.name] || ''}
                                   onChange={handleChange}
                                   className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm font-medium text-slate-700 transition-all outline-none"
                                 >
                                    <option value="">Select...</option>
                                    {field.options && Array.isArray(field.options) ? (
                                      field.options.map((opt: any) => {
                                        if (typeof opt === 'string') {
                                          return <option key={opt} value={opt}>{opt}</option>;
                                        } else {
                                          return <option key={opt.id} value={opt.id}>{opt.standardName} ({opt.division})</option>;
                                        }
                                      })
                                    ) : null}
                                 </select>
                              ) : field.type === 'textarea' ? (
                                 <textarea 
                                   name={field.name}
                                   value={formData[field.name] || ''}
                                   onChange={handleChange}
                                   rows={3}
                                   className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm font-medium text-slate-700 transition-all outline-none resize-none"
                                 />
                              ) : field.type === 'checkbox' ? (
                                 <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <input 
                                      type="checkbox"
                                      name={field.name}
                                      checked={formData[field.name] || false}
                                      onChange={handleChange}
                                      className="w-4 h-4 rounded border-slate-300 text-[#dac48b] focus:ring-[#dac48b]"
                                    />
                                    <span className="text-xs font-bold text-slate-600">Yes, verified</span>
                                 </div>
                              ) : (
                                 <input 
                                   type={field.type}
                                   name={field.name}
                                   value={field.type === 'date' ? formatDateForInput(formData[field.name]) : (formData[field.name] || '')}
                                   onChange={handleChange}
                                   className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#dac48b]/20 focus:bg-white text-sm font-medium text-slate-700 transition-all outline-none"
                                 />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                ))}
             </form>
           ) : (
             <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-8 space-y-6 custom-scrollbar scroll-smooth animate-in slide-in-from-right duration-300">
                {loadingHistory ? (
                   <div className="py-20 flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-[#dac48b] mb-4" size={32} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accessing Records...</p>
                   </div>
                ) : history.length === 0 ? (
                   <div className="py-20 text-center text-slate-400">
                      <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wide">No enrollment logs found.</p>
                   </div>
                ) : (
                   <div className="relative border-l border-slate-100 ml-4 pl-8 space-y-8">
                      {history.map((h) => (
                         <div key={h.id} className="relative">
                            {/* Pulse Timeline Point */}
                            <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#dac48b] flex items-center justify-center shadow-sm">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#dac48b]" />
                            </div>
                            
                            {/* Journey Card */}
                            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm hover:border-[#dac48b]/50 transition-all">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Academic Session</span>
                                     <h5 className="text-sm font-bold text-slate-900 mt-0.5">{h.academicYear}</h5>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                     <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                                        h.status === 'PROMOTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        h.status === 'ACTIVE' ? 'bg-amber-50 text-[#a98f4a] border-amber-100/50' :
                                        h.status === 'REPEATING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-rose-50 text-rose-600 border-rose-100'
                                     }`}>
                                        {h.status}
                                     </span>
                                  </div>
                               </div>
                               
                               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-50">
                                  <div>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Class / Grade</p>
                                     <p className="text-xs font-bold text-slate-700">{h.standardName || 'General'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Division</p>
                                     <p className="text-xs font-bold text-slate-700">{h.division || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Status Tag</p>
                                     <p className="text-xs font-bold text-slate-700">{h.status}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Registration Log</p>
                                     <p className="text-[10px] font-bold text-slate-500 font-mono">{new Date(h.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
           )}
        </div>

      </div>
      {dialog}
    </div>,
    document.body
  );
}
