'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  School as SchoolIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Hash, 
  Calendar, 
  Layers,
  X,
  Loader2,
  ShieldCheck,
  Save,
  ChevronLeft,
  UploadCloud,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Trust {
  id: string;
  trustName: string;
}

interface SchoolFormProps {
  schoolId?: string;
  isEdit?: boolean;
  onSubmitSuccess?: () => void;
}

export default function SchoolForm({ schoolId, isEdit = false, onSubmitSuccess }: SchoolFormProps) {
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const { dialog, showAlert } = usePortalDialog();

  const [formData, setFormData] = useState({
    schoolName: '',
    currentStudentsNo: '',
    address: '',
    phoneNo: '',
    email: '',
    medium: 'English',
    schoolDiseNo: '',
    isHaveRTE: false,
    sscIndexNo: '',
    hscIndexNo: '',
    establishYear: '',
    totalStandards: '',
    trustId: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string>('');
  const [isImageDeleted, setIsImageDeleted] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const trustsRes = await fetch('/api/admin/trusts');
      const trustsData = await trustsRes.json();
      if (trustsRes.ok) {
        setTrusts(trustsData);
        if (!isEdit && trustsData.length > 0) {
          setFormData(prev => ({ ...prev, trustId: trustsData[0].id }));
        }
      }

      if (isEdit && schoolId) {
        const schoolRes = await fetch(`/api/admin/schools?id=${schoolId}`);
        const schoolData = await schoolRes.json();
        const school = Array.isArray(schoolData) ? schoolData.find((s: any) => s.id === schoolId) : schoolData;
        
        if (schoolRes.ok && school) {
          setFormData({
            schoolName: school.schoolName || '',
            currentStudentsNo: (school.currentStudentsNo || 0).toString(),
            address: school.address || '',
            phoneNo: school.phoneNo || '',
            email: school.email || '',
            medium: school.medium || 'English',
            schoolDiseNo: school.schoolDiseNo || '',
            isHaveRTE: !!school.isHaveRTE,
            sscIndexNo: school.sscIndexNo || '',
            hscIndexNo: school.hscIndexNo || '',
            establishYear: (school.establishYear || '').toString(),
            totalStandards: (school.totalStandards || '').toString(),
            trustId: school.trustId || '',
          });
          
          if (school.imageUrls && school.imageUrls[0]) {
            setExistingImage(school.imageUrls[0]);
          }
        }
      }
    } catch (err) {
      showAlert({ title: 'Load failed', message: 'Failed to fetch school data.', variant: 'danger' });
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setIsImageDeleted(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (isEdit && existingImage) {
      setIsImageDeleted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('schoolName', formData.schoolName);
    form.append('trustId', formData.trustId);
    form.append('currentStudentsNo', formData.currentStudentsNo);
    form.append('address', formData.address);
    form.append('phoneNo', formData.phoneNo);
    form.append('email', formData.email);
    form.append('medium', formData.medium);
    form.append('schoolDiseNo', formData.schoolDiseNo);
    form.append('isHaveRTE', formData.isHaveRTE.toString());
    form.append('sscIndexNo', formData.sscIndexNo);
    form.append('hscIndexNo', formData.hscIndexNo);
    form.append('establishYear', formData.establishYear);
    form.append('totalStandards', formData.totalStandards);
    
    if (isEdit && schoolId) {
      form.append('id', schoolId);
    }

    // Pass the single image file as image1
    if (imageFile) {
      form.append('image1', imageFile);
    }

    // Pass deletion flag as image1_deleted
    if (isEdit && isImageDeleted) {
      form.append('image1_deleted', 'true');
    }

    try {
      const res = await fetch('/api/admin/schools', {
        method: isEdit ? 'PUT' : 'POST',
        body: form,
      });

      if (res.ok) {
        await showAlert({
          title: isEdit ? 'School updated' : 'School registered',
          message: 'School profile has been synchronized successfully.',
          variant: 'success',
        });
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        const data = await res.json();
        showAlert({ title: 'Action failed', message: data.error || 'School profile could not be saved.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Sync failed', message: 'School profile could not be saved.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={40} />
        <p className="text-slate-500 font-medium">Retrieving institutional profile...</p>
      </div>
    );
  }

  const previewUrl = imageFile 
    ? URL.createObjectURL(imageFile) 
    : (existingImage && !isImageDeleted) 
      ? existingImage 
      : null;

  return (
    <>
    <div className="bg-white w-full max-w-4xl mx-auto rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
            {isEdit ? 'Update Institutional Record' : 'Register New School'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Institutional Profile & Academic Parameters</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-[#1A3D63]">
          <SchoolIcon size={24} strokeWidth={1.5} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Governing Trust</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <select 
                required 
                value={formData.trustId} 
                onChange={e => setFormData({ ...formData, trustId: e.target.value })} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold text-[#1A3D63] focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white transition-all appearance-none"
              >
                <option value="">Select Command Trust</option>
                {trusts.map(t => <option key={t.id} value={t.id}>{t.trustName}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">School Name</label>
            <div className="relative">
              <SchoolIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                required 
                value={formData.schoolName} 
                onChange={e => setFormData({ ...formData, schoolName: e.target.value })} 
                placeholder="Institutional name..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1A3D63]/10 focus:bg-white text-sm font-semibold transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">DISE Identifier</label>
            <input 
              type="text" 
              value={formData.schoolDiseNo} 
              onChange={e => setFormData({ ...formData, schoolDiseNo: e.target.value })} 
              placeholder="Official DISE no..."
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Instruction Medium</label>
            <select 
              value={formData.medium} 
              onChange={e => setFormData({ ...formData, medium: e.target.value })} 
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Urdu">Urdu</option>
              <option value="Marathi">Marathi</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Establishment Year</label>
            <input 
              type="number" 
              value={formData.establishYear} 
              onChange={e => setFormData({ ...formData, establishYear: e.target.value })} 
              placeholder="YYYY"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-[#1A3D63]/5 rounded-3xl border border-[#1A3D63]/10">
           <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[#1A3D63] uppercase tracking-widest ml-1">SSC Index No</label>
              <input 
                type="text" 
                value={formData.sscIndexNo} 
                onChange={e => setFormData({ ...formData, sscIndexNo: e.target.value })} 
                placeholder="Secondary index..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#1A3D63]/20 transition-all" 
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[#1A3D63] uppercase tracking-widest ml-1">HSC Index No</label>
              <input 
                type="text" 
                value={formData.hscIndexNo} 
                onChange={e => setFormData({ ...formData, hscIndexNo: e.target.value })} 
                placeholder="Higher secondary index..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#1A3D63]/20 transition-all" 
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Student Strength</label>
            <input 
              type="number" 
              value={formData.currentStudentsNo} 
              onChange={e => setFormData({ ...formData, currentStudentsNo: e.target.value })} 
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#1A3D63] outline-none focus:bg-white transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Academic Standards</label>
            <input 
              type="number" 
              value={formData.totalStandards} 
              onChange={e => setFormData({ ...formData, totalStandards: e.target.value })} 
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" 
            />
          </div>
          <div className="flex items-center pt-8 px-2">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isHaveRTE ? 'bg-[#1A3D63] border-[#1A3D63]' : 'bg-white border-slate-200 group-hover:border-[#1A3D63]/30'}`}>
                <input 
                  type="checkbox" 
                  checked={formData.isHaveRTE} 
                  onChange={e => setFormData({ ...formData, isHaveRTE: e.target.checked })} 
                  className="hidden" 
                />
                {formData.isHaveRTE && <ShieldCheck size={14} className="text-white" />}
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">RTE Active Unit</span>
            </label>
          </div>
        </div>

        {/* Centered Premium Single Image Showcase Slot */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institutional Profile Showcase Image</label>
            <p className="text-[11px] text-slate-500 font-medium ml-1 mt-0.5">Upload a high-fidelity image representing the school unit.</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="relative group aspect-[16/10] rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg">
              {previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="School Showcase Preview" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-bold flex items-center text-[10px] tracking-wider"
                    >
                      <Trash2 size={16} className="mr-1.5" /> REMOVE IMAGE
                    </button>
                  </div>
                  <span className="absolute bottom-3 left-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-[9px] font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <ImageIcon size={10} className="text-[#3b82f6]" />
                    <span>Showcase Cover</span>
                  </span>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center p-8 cursor-pointer border-2 border-dashed border-slate-200 hover:border-[#1A3D63]/30 rounded-[2rem] transition-all duration-300 bg-white">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleImageChange(files[0]);
                      }
                    }}
                    className="hidden" 
                  />
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#1A3D63] group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-4">Select School Cover Photo</span>
                  <span className="text-[9px] font-semibold text-slate-400 mt-1.5">JPEG, PNG or WebP accepted (Optimized automatically)</span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institutional Address</label>
            <textarea 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold resize-none h-24 outline-none focus:bg-white transition-all" 
              placeholder="Full location details..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Terminal (Phone)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                value={formData.phoneNo} 
                onChange={e => setFormData({ ...formData, phoneNo: e.target.value })} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Official Email Gateway</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" 
              />
            </div>
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
             {isEdit ? 'APPLY CHANGES' : 'COMPLETE REGISTRATION'}
           </button>
        </div>
      </form>
    </div>
    {dialog}
    </>
  );
}
