'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Upload, X } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface EditProjectFormProps {
  projectId: string;
}

export default function EditProjectForm({ projectId }: EditProjectFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dialog, showAlert } = usePortalDialog();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentMediaUrls, setCurrentMediaUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'CONSTRUCTION' as 'CONSTRUCTION' | 'EVENT',
    startDate: '',
    estimatedCost: '',
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subadmin/costs?id=${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load project.');

      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type === 'EVENT' ? 'EVENT' : 'CONSTRUCTION',
        startDate: data.startDate ? String(data.startDate).split('T')[0] : '',
        estimatedCost: data.estimatedCost ? String(data.estimatedCost) : '',
      });
      setCurrentMediaUrls(Array.isArray(data.mediaUrls) ? data.mediaUrls : data.mediaUrl ? [data.mediaUrl] : []);
    } catch (error: any) {
      showAlert({ title: 'Load failed', message: error.message || 'Failed to load project.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      showAlert({ title: 'Only photos allowed', message: 'Project media supports photos only.', variant: 'danger' });
    }

    const nextFiles = [...selectedFiles, ...imageFiles].slice(0, 5);
    if (selectedFiles.length + imageFiles.length > 5) {
      showAlert({ title: 'Photo limit reached', message: 'You can upload maximum 5 photos for one project.', variant: 'danger' });
    }

    setSelectedFiles(nextFiles);
    readPreviews(nextFiles);
    event.target.value = '';
  };

  const readPreviews = (files: File[]) => {
    Promise.all(files.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }))).then(setPreviews);
  };

  const removePhoto = (index: number) => {
    const nextFiles = selectedFiles.filter((_, itemIndex) => itemIndex !== index);
    setSelectedFiles(nextFiles);
    readPreviews(nextFiles);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const form = new FormData();
    form.append('id', projectId);
    form.append('title', formData.title);
    form.append('description', formData.description);
    form.append('type', formData.type);
    form.append('startDate', formData.startDate);
    form.append('estimatedCost', formData.estimatedCost);
    selectedFiles.forEach((file) => form.append('media', file));

    try {
      const res = await fetch('/api/subadmin/costs', {
        method: 'PUT',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project.');

      await showAlert({ title: 'Project updated', message: 'Project details have been saved successfully.', variant: 'success' });
      router.push('/subadmin/accounts?tab=projects');
    } catch (error: any) {
      showAlert({ title: 'Update failed', message: error.message || 'Failed to update project.', variant: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-96 items-center justify-center rounded-md border border-slate-100 bg-white">
        <Loader2 className="animate-spin text-[#dac48b]" size={32} />
        {dialog}
      </div>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="mx-auto flex w-full flex-col gap-4 py-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link href="/subadmin/accounts?tab=projects" className="inline-flex w-fit items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={15} />
            Back to Accounts
          </Link>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-6 py-5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Project</h2>
              <p className="text-xs font-medium text-slate-500">Update project title, budget, timeline, description, and media.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Project title" required>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
                  />
                </Field>

                <Field label="Project type" required>
                  <select
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value as any })}
                    className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
                  >
                    <option value="CONSTRUCTION">Construction</option>
                    <option value="EVENT">Event/Function</option>
                  </select>
                </Field>

                <Field label="Start date">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                    className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
                  />
                </Field>

                <Field label="Estimated cost (Rs.)" required>
                  <input
                    required
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(event) => setFormData({ ...formData, estimatedCost: event.target.value })}
                    className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Project photos">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-[#dac48b] hover:bg-[#EFECE5]/50"
                    >
                      {previews.length > 0 ? (
                        <div className="grid w-full grid-cols-2 gap-3 p-3 md:grid-cols-5">
                          {previews.map((preview, index) => (
                            <div key={`project-new-photo-${index}`} className="group relative aspect-video overflow-hidden rounded-md border border-slate-200 bg-white">
                              <img src={preview} alt={`New project photo ${index + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removePhoto(index);
                                }}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          {previews.length < 5 && (
                            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-[11px] font-bold text-slate-400">
                              Add more
                            </div>
                          )}
                        </div>
                      ) : currentMediaUrls.length > 0 ? (
                        <div className="grid w-full grid-cols-2 gap-3 p-3 md:grid-cols-5">
                          {currentMediaUrls.map((url, index) => (
                            <div key={`project-current-photo-${url}-${index}`} className="relative aspect-video overflow-hidden rounded-md border border-slate-200 bg-white">
                              <img src={url} alt={`Current project photo ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                          <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-center text-[11px] font-bold text-slate-400">
                            Replace photos
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Upload size={28} />
                          <span className="text-xs font-bold">Select up to 5 photos</span>
                          <span className="text-[11px] font-medium text-slate-400">Photos only</span>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                    </div>
                    {selectedFiles.length > 0 && (
                      <p className="ml-1 text-[11px] font-semibold text-slate-400">{selectedFiles.length}/5 photos selected. Saving will replace current project photos.</p>
                    )}
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Project description">
                    <textarea
                      rows={5}
                      value={formData.description}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      className="w-full resize-none rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#dac48b] focus:ring-2 focus:ring-[#dac48b]/20"
                    />
                  </Field>
                </div>
              </div>

              <button
                disabled={submitting}
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#18181b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-black disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Project
              </button>
            </form>
          </div>
        </div>
      </div>
      {dialog}
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="ml-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
