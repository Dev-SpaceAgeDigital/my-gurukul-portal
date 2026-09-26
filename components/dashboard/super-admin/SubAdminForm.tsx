'use client';

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  School as SchoolIcon, 
  Phone, 
  Mail, 
  MapPin, 
  Lock,
  X,
  Loader2,
  Save,
  ChevronLeft,
  Briefcase
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface School {
  id: string;
  schoolName: string;
}

interface SubAdminFormProps {
  subAdminId?: string;
  isEdit?: boolean;
  onSubmitSuccess?: () => void;
}

export default function SubAdminForm({ subAdminId, isEdit = false, onSubmitSuccess }: SubAdminFormProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const { dialog, showAlert } = usePortalDialog();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNo: '',
    address: '',
    relation: '',
    schoolId: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [subAdminId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const schoolsRes = await fetch('/api/admin/schools');
      const schoolsData = await schoolsRes.json();
      if (schoolsRes.ok) {
        setSchools(schoolsData);
      }

      if (isEdit && subAdminId) {
        const subRes = await fetch(`/api/admin/subadmins?id=${subAdminId}`);
        const subData = await subRes.json();
        // Handle array or object response
        const sub = Array.isArray(subData) ? subData.find((s: any) => s.id === subAdminId) : subData;

        if (subRes.ok && sub) {
          setFormData({
            name: sub.name || '',
            email: sub.email || '',
            password: '', // Don't show password
            phoneNo: sub.phoneNo || '',
            address: sub.address || '',
            relation: sub.relation || '',
            schoolId: sub.schoolId || '',
          });
        }
      }
    } catch (err) {
      showAlert({ title: 'Load failed', message: 'Failed to fetch officer data.', variant: 'danger' });
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/subadmins', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: subAdminId
        }),
      });

      if (res.ok) {
        await showAlert({
          title: isEdit ? 'Officer updated' : 'Officer provisioned',
          message: 'Administrative officer profile has been synchronized successfully.',
          variant: 'success',
        });
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        const data = await res.json();
        showAlert({ title: 'Action failed', message: data.error || 'Officer profile could not be saved.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Sync failed', message: 'Officer profile could not be saved.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={40} />
        <p className="text-slate-500 font-medium">Retrieving officer profile...</p>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white w-full max-w-4xl mx-auto rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
            {isEdit ? 'Update Officer Credentials' : 'Provision New Officer'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Administrative Access & Personal Details</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-[#1A3D63]">
          <UserIcon size={24} strokeWidth={1.5} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Officer Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Full name..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white text-sm font-semibold transition-all" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="email@domain.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white text-sm font-semibold transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
              {isEdit ? 'New Password Key (Optional)' : 'Password Key'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                required={!isEdit} 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white text-sm font-semibold transition-all" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                value={formData.phoneNo} 
                onChange={e => setFormData({ ...formData, phoneNo: e.target.value })} 
                placeholder="+91..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white text-sm font-bold transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-[#1A3D63]/5 rounded-3xl border border-[#1A3D63]/10">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#1A3D63] uppercase tracking-widest ml-1">Command Unit (School)</label>
            <div className="relative">
              <SchoolIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A3D63]/40" size={18} />
              <select 
                required 
                value={formData.schoolId} 
                onChange={e => setFormData({ ...formData, schoolId: e.target.value })} 
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#1A3D63]/20 rounded-xl text-xs font-bold text-[#1A3D63] outline-none shadow-sm focus:ring-2 focus:ring-[#1A3D63]/20 transition-all appearance-none"
              >
                <option value="">Select Command School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.schoolName}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#1A3D63] uppercase tracking-widest ml-1">Official Designation</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A3D63]/40" size={18} />
              <input 
                type="text" 
                value={formData.relation} 
                onChange={e => setFormData({ ...formData, relation: e.target.value })} 
                placeholder="Principal / Trustee"
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#1A3D63]/20 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#1A3D63]/20 transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Residential/Office Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-5 text-slate-300" size={18} />
              <textarea 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold resize-none h-24 outline-none focus:bg-white transition-all" 
                placeholder="Full address details..."
              />
            </div>
        </div>

        <div className="flex items-center space-x-4 pt-6">
           <button 
             type="button" 
             onClick={() => window.history.back()} 
             className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center"
           >
             <ChevronLeft size={16} className="mr-1.5" /> Cancel
           </button>
           <button 
             type="submit" 
             disabled={loading} 
             className="flex-[2] py-4 bg-[#1A3D63] text-white rounded-2xl font-bold text-xs tracking-widest shadow-xl shadow-[#1A3D63]/20 hover:bg-[#0A1931] transition-all flex items-center justify-center disabled:opacity-50"
           >
             {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
             {isEdit ? 'APPLY CREDENTIALS' : 'PROVISION OFFICER'}
           </button>
        </div>
      </form>
    </div>
    {dialog}
    </>
  );
}
