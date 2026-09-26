'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  Volleyball,
  Wrench,
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface Standard {
  id: string;
  standardName: string;
  division?: string | null;
  stream?: string | null;
  fees?: string | number | null;
  batchYear?: string | null;
}

interface SchoolInfo {
  id: string;
  schoolName: string;
  medium?: string | null;
  email?: string | null;
  phoneNo?: string | null;
  currentStudentsNo?: number | null;
  schoolDiseNo?: string | null;
  sscIndexNo?: string | null;
  hscIndexNo?: string | null;
  establishYear?: number | null;
  trustName?: string | null;
}

interface CurriculumRow {
  id: string;
  standardLabel: string;
  languages: string;
  mathematics: string;
  science: string;
  socialScience: string;
  additional: string;
}

interface AcademicProgram {
  id: string;
  category: string;
  description?: string;
  standardIds: string[];
  streams: string[];
  subjects: string[];
  curriculumRows: CurriculumRow[];
}

interface Facility {
  id: string;
  icon: string;
  name: string;
  detail: string;
  imageUrl?: string;
  imageFileId?: string;
}

interface ActivityCategory {
  id: string;
  icon: string;
  category: string;
  items: Array<{ name: string; desc: string }>;
}

interface Teacher {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  experience: string;
  subjects: string[];
  subject?: string;
  standardIds: string[];
}

interface SchoolPageContent {
  tagline: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutHighlights: string[];
  academicPrograms: AcademicProgram[];
  facilities: Facility[];
  activityCategories: ActivityCategory[];
  teachers: Teacher[];
}

const defaultContent: SchoolPageContent = {
  tagline: '',
  aboutTitle: '',
  aboutDescription: '',
  aboutHighlights: [],
  academicPrograms: [],
  facilities: [],
  activityCategories: [],
  teachers: [],
};

const defaultCurriculumRows: CurriculumRow[] = [
  { id: 'curr-pre-primary', standardLabel: 'Pre-Primary-Std. 2', languages: 'Gujarati, Hindi, English', mathematics: 'Counting, Shapes', science: 'EVS Basics', socialScience: 'Basic Awareness', additional: 'Drawing, Activity' },
  { id: 'curr-3-5', standardLabel: 'Std. 3-5', languages: 'Gujarati, Hindi, English', mathematics: 'Arithmetic, Tables', science: 'Science', socialScience: 'History, Geography', additional: 'Art, Moral Sc.' },
  { id: 'curr-6-8', standardLabel: 'Std. 6-8', languages: 'Gujarati, Hindi, English', mathematics: 'Algebra, Geometry', science: 'Science', socialScience: 'SST', additional: 'Computer Basics' },
  { id: 'curr-9-10', standardLabel: 'Std. 9-10 (SSC)', languages: 'Gujarati / English, Hindi', mathematics: 'Mathematics', science: 'Science & Tech', socialScience: 'Social Science', additional: 'Computer / Yoga' },
  { id: 'curr-11-12', standardLabel: 'Std. 11-12 (HSC)', languages: 'As per stream', mathematics: 'Statistics (Commerce)', science: 'Stream subjects', socialScience: 'As per stream', additional: 'Project Work' },
];

const iconOptions = ['book', 'science', 'computer', 'sports', 'arts', 'health', 'language', 'mosque', 'building', 'award', 'calendar'];
const programCategories = ['Pre Primary', 'Primary', 'Secondary', 'Higher Secondary'];

const tabs = [
  { id: 'about', label: 'About', icon: Building2 },
  { id: 'programs', label: 'Academic Programs', icon: BookOpen },
  { id: 'facilities', label: 'Facilities', icon: Wrench },
  { id: 'activities', label: 'Life Beyond Class', icon: Volleyball },
  { id: 'teachers', label: 'Teachers', icon: Users },
] as const;

type TabId = typeof tabs[number]['id'];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toList(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function listToText(value?: string[]) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function standardLabel(standard: Standard) {
  return `${standard.standardName}${standard.division ? ` - ${standard.division}` : ''}${standard.stream ? ` (${standard.stream})` : ''}`;
}

function normalizeContent(value: any): SchoolPageContent {
  const merged = { ...defaultContent, ...(value || {}) };
  return {
    ...merged,
    aboutHighlights: Array.isArray(merged.aboutHighlights) ? merged.aboutHighlights : [],
    academicPrograms: Array.isArray(merged.academicPrograms) ? merged.academicPrograms.map((program: any) => ({
      id: program.id || newId('program'),
      category: program.category || 'Primary',
      description: program.description || '',
      standardIds: Array.isArray(program.standardIds) ? program.standardIds : [],
      streams: Array.isArray(program.streams) ? program.streams : [],
      subjects: Array.isArray(program.subjects) ? program.subjects : [],
      curriculumRows: Array.isArray(program.curriculumRows) ? program.curriculumRows : [],
    })) : [],
    facilities: Array.isArray(merged.facilities) ? merged.facilities.map((facility: any) => ({
      id: facility.id || newId('facility'),
      icon: facility.icon || 'book',
      name: facility.name || '',
      detail: facility.detail || '',
      imageUrl: facility.imageUrl || '',
      imageFileId: facility.imageFileId || '',
    })) : [],
    activityCategories: Array.isArray(merged.activityCategories) ? merged.activityCategories.map((category: any) => ({
      id: category.id || newId('activity'),
      icon: category.icon || 'sports',
      category: category.category || '',
      items: Array.isArray(category.items) ? category.items.map((item: any) => ({
        name: item?.name || '',
        desc: item?.desc || '',
      })) : [],
    })) : [],
    teachers: Array.isArray(merged.teachers) ? merged.teachers.map((teacher: any) => ({
      ...teacher,
      id: teacher.id || newId('teacher'),
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects : toList(teacher.subject || ''),
      standardIds: Array.isArray(teacher.standardIds) ? teacher.standardIds : [],
    })) : [],
  };
}

function StandardPicker({ standards, selected, onChange }: { standards: Standard[]; selected: string[]; onChange: (next: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
      {standards.map((standard) => (
        <button
          key={standard.id}
          type="button"
          onClick={() => toggle(standard.id)}
          className={`px-3 py-2 rounded-md border text-[11px] font-bold text-left transition-all ${selected.includes(standard.id) ? 'bg-[#18181b] text-white border-[#18181b]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
        >
          {standardLabel(standard)}
        </button>
      ))}
    </div>
  );
}

export default function SchoolPageManager() {
  const [activeTab, setActiveTab] = useState<TabId>('about');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [content, setContent] = useState<SchoolPageContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState('');
  const { dialog, showAlert } = usePortalDialog();

  useEffect(() => {
    fetchData();
  }, []);

  const standardLabels = useMemo(() => {
    const map = new Map<string, string>();
    standards.forEach((standard) => map.set(standard.id, standardLabel(standard)));
    return map;
  }, [standards]);

  const subjectBank = useMemo(() => {
    return Array.from(new Set(content.academicPrograms.flatMap((program) => program.subjects || []))).sort();
  }, [content.academicPrograms]);

  const streamOptions = useMemo(() => {
    return Array.from(new Set(standards.map((standard) => standard.stream).filter(Boolean))) as string[];
  }, [standards]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subadmin/school-page');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load school page content');
      setStandards(Array.isArray(data.standards) ? data.standards : []);
      setSchool(data.school || null);
      setContent(normalizeContent(data.content));
    } catch (error: any) {
      showAlert({ title: 'Load failed', message: error.message || 'Failed to load school page content.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/subadmin/school-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save school page content');
      setContent(normalizeContent(data));
      showAlert({ title: 'School page saved', message: 'School page content saved successfully.', variant: 'success' });
    } catch (error: any) {
      showAlert({ title: 'Save failed', message: error.message || 'Failed to save school page content.', variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const uploadFacilityImage = async (facilityId: string, file?: File) => {
    if (!file) return;
    setUploadingId(facilityId);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/subadmin/school-page/media', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      update('facilities', content.facilities.map((facility) => (
        facility.id === facilityId ? { ...facility, imageUrl: data.url, imageFileId: data.fileId } : facility
      )));
    } catch (error: any) {
      showAlert({ title: 'Upload failed', message: error.message || 'Failed to upload image.', variant: 'danger' });
    } finally {
      setUploadingId('');
    }
  };

  const update = <K extends keyof SchoolPageContent>(key: K, value: SchoolPageContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="h-full bg-white rounded-md border border-slate-200 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <>
    <div className="lg:h-full lg:overflow-hidden flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">School Page Content</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{school?.schoolName || 'Your School'}</p>
        </div>
	        <div className="flex flex-wrap items-center gap-2">
	          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#18181b] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">
	            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
	            Save
          </button>
        </div>
      </div>

	      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 overflow-hidden">
	        <aside className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
	          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
	            <h3 className="text-sm font-bold text-slate-900">Public page sections</h3>
	            <p className="text-xs text-slate-500 font-medium mt-0.5">Choose one section to edit.</p>
	          </div>
	          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-2">
	            {tabs.map((tab) => {
	              const Icon = tab.icon;
	              const isActive = activeTab === tab.id;
	              return (
	                <button
	                  key={tab.id}
	                  type="button"
	                  onClick={() => setActiveTab(tab.id)}
	                  className={`w-full text-left rounded-md border px-3 py-3 transition-all ${isActive ? 'bg-[#18181b] text-white border-[#18181b] shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-[#EFECE5] hover:text-slate-950'}`}
	                >
	                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
	                    <Icon size={14} /> {tab.label}
	                  </span>
	                  <span className={`mt-1 block text-[11px] leading-relaxed ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
	                    {tab.id === 'about' && 'Tagline, profile text, board details, and highlights.'}
	                    {tab.id === 'programs' && 'Classes, streams, subjects, and curriculum rows.'}
	                    {tab.id === 'facilities' && 'Campus facilities with icons, details, and images.'}
	                    {tab.id === 'activities' && 'Sports, clubs, cultural life, and activities.'}
	                    {tab.id === 'teachers' && 'Faculty names, roles, subjects, and standards.'}
	                  </span>
	                </button>
	              );
	            })}
	          </div>
	        </aside>

	      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar p-5 min-h-0">
        {activeTab === 'about' && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              {[
                ['DISE Code', school?.schoolDiseNo || 'Not set in superadmin'],
                ['SSC Index No', school?.sscIndexNo || 'Not set in superadmin'],
                ['HSC Index No', school?.hscIndexNo || 'Not set in superadmin'],
                ['Board', 'GSEB'],
                ['Operated By', school?.trustName || 'Madni Education Trust'],
                ['Year Founded', school?.establishYear ? `Est. ${school.establishYear}` : 'Not set in superadmin'],
              ].map(([label, value]) => (
	                <div key={`info-card-${label}`} className="rounded-md bg-white border border-slate-200 px-3 py-2">
	                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
	                  <p className="text-sm font-bold text-slate-800 mt-1">{value}</p>
		      </div>
	              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="School tagline" value={content.tagline || ''} onChange={(value) => update('tagline', value)} />
              <Field label="About section title" value={content.aboutTitle || ''} onChange={(value) => update('aboutTitle', value)} placeholder="Where Every Child Finds Their Potential" />
              <label className="md:col-span-2 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">About the school description</span>
                <textarea rows={7} value={content.aboutDescription || ''} onChange={(e) => update('aboutDescription', e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none" />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Highlight chips, one per line</span>
                <textarea rows={4} value={listToText(content.aboutHighlights)} onChange={(e) => update('aboutHighlights', toList(e.target.value))} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none" />
              </label>
            </div>
          </div>
        )}

        {/* ── ACADEMIC PROGRAMS TAB ── */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Academic Programs & Curriculum</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Define academic categories, streams, subjects, and curriculum tables</p>
              </div>
              <button
                onClick={() => update('academicPrograms', [...content.academicPrograms, { id: newId('program'), category: 'Primary', description: '', standardIds: [], streams: [], subjects: [], curriculumRows: [...defaultCurriculumRows] }])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              >
                <Plus size={15} /> Add Program Category
              </button>
            </div>

            {content.academicPrograms.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <BookOpen size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No academic programs added yet</p>
                <button
                  onClick={() => update('academicPrograms', [{ id: newId('program'), category: 'Primary', description: '', standardIds: [], streams: [], subjects: [], curriculumRows: [...defaultCurriculumRows] }])}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                >
                  + Add First Program
                </button>
              </div>
            ) : (
              content.academicPrograms.map((program, index) => (
                <div key={`program-${program.id || index}-${index}`} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Program #{index + 1} — {program.category}
                    </span>
                    <button
                      onClick={() => update('academicPrograms', content.academicPrograms.filter((item) => item.id !== program.id))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-all"
                    >
                      <Trash2 size={13} /> Remove Program
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Program Category</span>
                      <select
                        value={program.category}
                        onChange={(e) => {
                          const next = [...content.academicPrograms];
                          next[index] = { ...program, category: e.target.value };
                          update('academicPrograms', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        {[program.category, ...programCategories].filter(Boolean).filter((item, itemIndex, arr) => arr.indexOf(item) === itemIndex).map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Category Summary / Overview</span>
                      <input
                        type="text"
                        placeholder="e.g. Foundational learning and core skills development"
                        value={program.description || ''}
                        onChange={(e) => {
                          const next = [...content.academicPrograms];
                          next[index] = { ...program, description: e.target.value };
                          update('academicPrograms', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Standards Included in Category</p>
                    <StandardPicker
                      standards={standards}
                      selected={program.standardIds || []}
                      onChange={(standardIds) => {
                        const next = [...content.academicPrograms];
                        next[index] = { ...program, standardIds };
                        update('academicPrograms', next);
                      }}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Available Streams (comma separated)</span>
                      <input
                        type="text"
                        placeholder={streamOptions.join(', ') || 'e.g. Science, Commerce, General'}
                        value={(program.streams || []).join(', ')}
                        onChange={(e) => {
                          const next = [...content.academicPrograms];
                          next[index] = { ...program, streams: toList(e.target.value) };
                          update('academicPrograms', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Subjects Offered (comma separated)</span>
                      <textarea
                        rows={2}
                        placeholder="e.g. Mathematics, Physics, Chemistry, English, Computer"
                        value={(program.subjects || []).join(', ')}
                        onChange={(e) => {
                          const next = [...content.academicPrograms];
                          next[index] = { ...program, subjects: toList(e.target.value) };
                          update('academicPrograms', next);
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                      />
                    </label>
                  </div>

                  <CurriculumEditor
                    rows={program.curriculumRows || []}
                    onChange={(rows) => {
                      const next = [...content.academicPrograms];
                      next[index] = { ...program, curriculumRows: rows };
                      update('academicPrograms', next);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* ── FACILITIES TAB ── */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">School Infrastructure & Facilities</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage campus facilities, laboratories, libraries, and sports amenities</p>
              </div>
              <button
                onClick={() => update('facilities', [...content.facilities, { id: newId('facility'), icon: 'book', name: '', detail: '', imageUrl: '' }])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              >
                <Plus size={15} /> Add Facility
              </button>
            </div>

            {content.facilities.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Wrench size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No facilities added yet</p>
                <button
                  onClick={() => update('facilities', [{ id: newId('facility'), icon: 'book', name: '', detail: '', imageUrl: '' }])}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                >
                  + Add First Facility
                </button>
              </div>
            ) : (
              content.facilities.map((facility, index) => (
                <div key={`facility-${facility.id || index}-${index}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Facility #{index + 1} {facility.name ? `— ${facility.name}` : ''}
                    </span>
                    <button
                      onClick={() => update('facilities', content.facilities.filter((entry) => entry.id !== facility.id))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-all"
                    >
                      <Trash2 size={13} /> Remove Facility
                    </button>
                  </div>

                  <div className="grid lg:grid-cols-[140px_1fr] gap-5 items-start">
                    {/* Facility Image Thumbnail */}
                    <div className="h-28 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center relative group">
                      {facility.imageUrl ? (
                        <img src={facility.imageUrl} alt={facility.name || 'Facility'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon size={24} className="mx-auto text-slate-300 mb-1" />
                          <span className="text-[10px] font-bold text-slate-400">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <label className="space-y-1 block">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Facility Icon</span>
                          <select
                            value={facility.icon}
                            onChange={(e) => {
                              const next = [...content.facilities];
                              next[index] = { ...facility, icon: e.target.value };
                              update('facilities', next);
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                          >
                            {iconOptions.map((icon) => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 block md:col-span-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Facility Title</span>
                          <input
                            type="text"
                            placeholder="e.g. Science & Physics Lab"
                            value={facility.name || ''}
                            onChange={(e) => {
                              const next = [...content.facilities];
                              next[index] = { ...facility, name: e.target.value };
                              update('facilities', next);
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </label>
                      </div>

                      <label className="space-y-1 block">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Facility Details & Equipment</span>
                        <input
                          type="text"
                          placeholder="e.g. Equipped for Physics, Chemistry & Biology experiments with 20+ computer systems"
                          value={facility.detail || ''}
                          onChange={(e) => {
                            const next = [...content.facilities];
                            next[index] = { ...facility, detail: e.target.value };
                            update('facilities', next);
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3.5 py-2 rounded-xl cursor-pointer transition-all">
                        <Upload size={14} />
                        {uploadingId === facility.id ? 'Uploading image...' : 'Upload Facility Photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadFacilityImage(facility.id, e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── LIFE BEYOND CLASS (ACTIVITIES) TAB ── */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Life Beyond Class & Co-Curriculars</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage sports, cultural activities, academic clubs, and community initiatives</p>
              </div>
              <button
                onClick={() => update('activityCategories', [...content.activityCategories, { id: newId('activity'), icon: 'sports', category: '', items: [{ name: '', desc: '' }] }])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              >
                <Plus size={15} /> Add Activity Category
              </button>
            </div>

            {content.activityCategories.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Volleyball size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No activity categories added yet</p>
                <button
                  onClick={() => update('activityCategories', [{ id: newId('activity'), icon: 'sports', category: '', items: [{ name: '', desc: '' }] }])}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                >
                  + Add First Category
                </button>
              </div>
            ) : (
              content.activityCategories.map((cat, index) => (
                <div key={`activity-${cat.id || index}-${index}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Activity Group #{index + 1} {cat.category ? `— ${cat.category}` : ''}
                    </span>
                    <button
                      onClick={() => update('activityCategories', content.activityCategories.filter((item) => item.id !== cat.id))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-all"
                    >
                      <Trash2 size={13} /> Remove Category
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Category Icon</span>
                      <select
                        value={cat.icon}
                        onChange={(e) => {
                          const next = [...content.activityCategories];
                          next[index] = { ...cat, icon: e.target.value };
                          update('activityCategories', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 block md:col-span-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Category Title</span>
                      <input
                        type="text"
                        placeholder="e.g. Sports & Athletics / Cultural Clubs"
                        value={cat.category}
                        onChange={(e) => {
                          const next = [...content.activityCategories];
                          next[index] = { ...cat, category: e.target.value };
                          update('activityCategories', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>
                  </div>

                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Activities Included in {cat.category || 'Group'}</p>
                    {cat.items.map((item, itemIndex) => (
                      <div key={`act-${cat.id || index}-${itemIndex}`} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-center">
                        <label className="space-y-1 block">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Name</span>
                          <input
                            type="text"
                            placeholder="e.g. Inter-School Cricket"
                            value={item.name}
                            onChange={(e) => {
                              const next = [...content.activityCategories];
                              const items = [...cat.items];
                              items[itemIndex] = { ...item, name: e.target.value };
                              next[index] = { ...cat, items };
                              update('activityCategories', next);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                          />
                        </label>

                        <label className="space-y-1 block">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Details</span>
                          <input
                            type="text"
                            placeholder="e.g. Annual track & field tournament with regular coaching"
                            value={item.desc}
                            onChange={(e) => {
                              const next = [...content.activityCategories];
                              const items = [...cat.items];
                              items[itemIndex] = { ...item, desc: e.target.value };
                              next[index] = { ...cat, items };
                              update('activityCategories', next);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const next = [...content.activityCategories];
                            next[index] = { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) };
                            update('activityCategories', next);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all mt-4"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const next = [...content.activityCategories];
                        next[index] = { ...cat, items: [...cat.items, { name: '', desc: '' }] };
                        update('activityCategories', next);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                    >
                      + Add Activity to {cat.category || 'Category'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">School Faculty & Staff Register</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage teachers displayed on the public school page</p>
              </div>
              <button
                onClick={() => update('teachers', [...content.teachers, { id: newId('teacher'), name: '', designation: '', qualification: '', experience: '', subjects: [], standardIds: [] }])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              >
                <Plus size={15} /> Add Teacher
              </button>
            </div>

            {content.teachers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Users size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No teachers added yet</p>
                <button
                  onClick={() => update('teachers', [{ id: newId('teacher'), name: '', designation: '', qualification: '', experience: '', subjects: [], standardIds: [] }])}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                >
                  + Add First Teacher
                </button>
              </div>
            ) : (
              content.teachers.map((teacher, index) => (
                <div key={`teacher-${teacher.id || index}-${index}`} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Teacher #{index + 1} {teacher.name ? `— ${teacher.name}` : ''}
                    </span>
                    <button
                      onClick={() => update('teachers', content.teachers.filter((item) => item.id !== teacher.id))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-all"
                    >
                      <Trash2 size={13} /> Remove Teacher
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Teacher Full Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Ayesha Shaikh"
                        value={teacher.name || ''}
                        onChange={(e) => {
                          const next = [...content.teachers];
                          next[index] = { ...teacher, name: e.target.value };
                          update('teachers', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Designation / Role</span>
                      <input
                        type="text"
                        placeholder="e.g. Senior Science Teacher"
                        value={teacher.designation || ''}
                        onChange={(e) => {
                          const next = [...content.teachers];
                          next[index] = { ...teacher, designation: e.target.value };
                          update('teachers', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Qualification</span>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc (Physics), B.Ed"
                        value={teacher.qualification || ''}
                        onChange={(e) => {
                          const next = [...content.teachers];
                          next[index] = { ...teacher, qualification: e.target.value };
                          update('teachers', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Experience</span>
                      <input
                        type="text"
                        placeholder="e.g. 8+ Years Experience"
                        value={teacher.experience || ''}
                        onChange={(e) => {
                          const next = [...content.teachers];
                          next[index] = { ...teacher, experience: e.target.value };
                          update('teachers', next);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Subjects Taught (comma separated)</span>
                    <input
                      list="subject-bank"
                      placeholder="e.g. Physics, Chemistry, Science"
                      value={(teacher.subjects || []).join(', ')}
                      onChange={(e) => {
                        const next = [...content.teachers];
                        next[index] = { ...teacher, subjects: toList(e.target.value) };
                        update('teachers', next);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </label>

                  <datalist id="subject-bank">
                    {subjectBank.map((subject) => (
                      <option key={subject} value={subject} />
                    ))}
                  </datalist>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Standards Taught</p>
                    <StandardPicker
                      standards={standards}
                      selected={teacher.standardIds || []}
                      onChange={(standardIds) => {
                        const next = [...content.teachers];
                        next[index] = { ...teacher, standardIds };
                        update('teachers', next);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

	      </div>
	    </div>
	    </div>
	    {dialog}
	    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none" />
    </label>
  );
}

function CurriculumEditor({ rows, onChange }: { rows: CurriculumRow[]; onChange: (rows: CurriculumRow[]) => void }) {
  const currentRows = rows.length ? rows : defaultCurriculumRows;
  const updateRow = (index: number, field: keyof CurriculumRow, value: string) => {
    const next = [...currentRows];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Curriculum table rows</p>
        <button type="button" onClick={() => onChange([...currentRows, { id: newId('curr'), standardLabel: '', languages: '', mathematics: '', science: '', socialScience: '', additional: '' }])} className="text-xs font-bold text-slate-700">
          Add row
        </button>
      </div>
      <div className="space-y-3">
        {currentRows.map((row, index) => (
          <div key={`curr-row-${row.id || index}-${index}`} className="grid md:grid-cols-6 gap-2 rounded-md border border-slate-100 bg-slate-50 p-3">
            {([
              ['standardLabel', 'Standard'],
              ['languages', 'Languages'],
              ['mathematics', 'Mathematics'],
              ['science', 'Science'],
              ['socialScience', 'Social Science'],
              ['additional', 'Additional'],
            ] as Array<[keyof CurriculumRow, string]>).map(([field, label]) => (
              <input key={field} placeholder={label} value={row[field] || ''} onChange={(e) => updateRow(index, field, e.target.value)} className="px-2 py-2 rounded-md border border-slate-200 text-xs outline-none" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
