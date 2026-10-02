'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface TrustFormProps {
  initialData?: any;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export default function TrustForm({ initialData, onSubmitSuccess, onCancel, isEdit = false }: TrustFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  const [formData, setFormData] = useState({
    trustName: '',
    registrationNo: '',
    establishmentYear: '',
    presidentName: '',
    presidentNo: '',
    trusteesName: '',
    trusteesNo: '',
    is80GEnabled: false,
    taxExemptionNo: '',
    min80GAmount: '500',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        trustName: initialData.trustName || '',
        registrationNo: initialData.registrationNo || '',
        establishmentYear: initialData.establishmentYear?.toString() || '',
        presidentName: initialData.presidentName || '',
        presidentNo: initialData.presidentNo || '',
        trusteesName: Array.isArray(initialData.trusteesName)
          ? initialData.trusteesName.join(', ')
          : (initialData.trusteesName || ''),
        trusteesNo: Array.isArray(initialData.trusteesNo)
          ? initialData.trusteesNo.join(', ')
          : (initialData.trusteesNo || ''),
        is80GEnabled: Boolean(initialData.is80GEnabled),
        taxExemptionNo: initialData.taxExemptionNo || '',
        min80GAmount: initialData.min80GAmount !== undefined && initialData.min80GAmount !== null ? String(initialData.min80GAmount) : '500',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      id: initialData?.id,
      establishmentYear: formData.establishmentYear ? parseInt(formData.establishmentYear) : null,
      trusteesName: formData.trusteesName.split(',').map(s => s.trim()).filter(Boolean),
      trusteesNo: formData.trusteesNo.split(',').map(s => s.trim()).filter(Boolean),
      is80GEnabled: formData.is80GEnabled,
      taxExemptionNo: formData.taxExemptionNo || null,
      min80GAmount: formData.is80GEnabled ? (formData.min80GAmount ? parseFloat(formData.min80GAmount) : 500) : 500,
    };

    try {
      const res = await fetch('/api/admin/trusts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await showAlert({
          title: isEdit ? 'Trust updated' : 'Trust registered',
          message: 'Trust record has been synchronized successfully.',
          variant: 'success',
        });
        if (onSubmitSuccess) onSubmitSuccess();
        else router.push('/superadmin/trust');
      } else {
        const data = await res.json();
        showAlert({ title: 'Operation failed', message: data.error || 'Trust record could not be saved.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Network error', message: 'Trust record could not be saved.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="bg-white w-full max-w-4xl mx-auto rounded-2xl shadow-sm border border-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-semibold text-slate-900">{isEdit ? 'Update Trust Record' : 'Register New Trust'}</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Trust Name</label>
            <input 
              type="text" 
              required 
              value={formData.trustName} 
              onChange={e => setFormData({ ...formData, trustName: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm transition-all" 
              placeholder="Full name of the trust"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Registration No</label>
            <input 
              type="text" 
              required 
              value={formData.registrationNo} 
              onChange={e => setFormData({ ...formData, registrationNo: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm transition-all" 
              placeholder="e.g. E/8779/VADODARA"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Est. Year</label>
            <input 
              type="number" 
              value={formData.establishmentYear} 
              onChange={e => setFormData({ ...formData, establishmentYear: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm transition-all" 
              placeholder="YYYY"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">President Name</label>
            <input 
              type="text" 
              value={formData.presidentName} 
              onChange={e => setFormData({ ...formData, presidentName: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">President Contact</label>
            <input 
              type="text" 
              value={formData.presidentNo} 
              onChange={e => setFormData({ ...formData, presidentNo: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm transition-all" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Trustees Names (Comma separated)</label>
          <textarea 
            value={formData.trusteesName} 
            onChange={e => setFormData({ ...formData, trusteesName: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm resize-none h-24 transition-all" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Trustees Contacts (Comma separated)</label>
          <textarea 
            value={formData.trusteesNo} 
            onChange={e => setFormData({ ...formData, trusteesNo: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A3D63]/5 focus:border-[#1A3D63] text-sm resize-none h-24 transition-all" 
          />
        </div>

        {/* 80G Tax Exemption Settings */}
        <div className="p-5 bg-gradient-to-br from-amber-500/[0.04] to-emerald-500/[0.04] border border-amber-500/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">
                80G
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">80G Tax Exemption & Donor Receipts</h4>
                <p className="text-xs text-slate-500">Allow alumni & donors to request official 80G tax deduction receipts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is80GEnabled}
                onChange={e => setFormData({ ...formData, is80GEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {formData.is80GEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 tracking-wide ml-1">
                  80G Certificate / Registration No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={formData.is80GEnabled}
                  value={formData.taxExemptionNo}
                  onChange={e => setFormData({ ...formData, taxExemptionNo: e.target.value })}
                  placeholder="e.g. AABTM1234F21EE01"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono transition-all uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 tracking-wide ml-1">
                  Minimum Donation Amount for 80G (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.min80GAmount}
                  onChange={e => setFormData({ ...formData, min80GAmount: e.target.value })}
                  placeholder="500"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-semibold transition-all"
                />
                <p className="text-[10px] text-slate-400 ml-1">
                  Alumni donating this amount or above can request 80G tax receipt with their PAN.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-6">
          <button 
            type="button" 
            onClick={onCancel || (() => router.back())} 
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm tracking-tight hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-[2] py-4 bg-[#1A3D63] text-white rounded-xl font-semibold text-sm tracking-tight shadow-lg shadow-[#1A3D63]/10 hover:bg-[#0A1931] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : <span>{isEdit ? 'Save Changes' : 'Complete Registration'}</span>}
          </button>
        </div>
      </form>
    </div>
    {dialog}
    </>
  );
}
