'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Maximize2, 
  X, 
  Play, 
  Video as VideoIcon, 
  Image as ImageIcon 
} from 'lucide-react';

interface AlumniMediaGalleryProps {
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'PDF' | string | null;
  title?: string;
  className?: string;
}

export default function AlumniMediaGallery({
  mediaUrl,
  mediaType,
  title = 'Media',
  className = '',
}: AlumniMediaGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  if (!mediaUrl || !mediaUrl.trim()) return null;

  // Split multiple URLs (e.g. "url1,url2" or JSON array)
  const parseUrls = (raw: string): string[] => {
    try {
      if (raw.startsWith('[') && raw.endsWith(']')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
    } catch (_) {}
    return raw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
  };

  const urls = parseUrls(mediaUrl);
  if (urls.length === 0) return null;

  // Detect type if not explicitly given
  const firstUrl = urls[0].toLowerCase();
  const inferredType =
    mediaType ||
    (firstUrl.endsWith('.pdf')
      ? 'PDF'
      : firstUrl.includes('youtube.com') ||
        firstUrl.includes('youtu.be') ||
        firstUrl.endsWith('.mp4') ||
        firstUrl.endsWith('.webm') ||
        firstUrl.endsWith('.mov')
      ? 'VIDEO'
      : 'IMAGE');

  // 1. PDF / Certificate Document
  if (inferredType === 'PDF' || firstUrl.endsWith('.pdf')) {
    const fileName = urls[0].split('/').pop() || 'Certificate-Document.pdf';
    return (
      <div className={`my-3 overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 p-4 shadow-sm ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {title || 'Certificate / Official Proof Document'}
              </h5>
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="uppercase text-red-600 font-bold">PDF Document</span>
                <span>•</span>
                <span className="truncate max-w-[180px] sm:max-w-xs">{fileName}</span>
              </p>
            </div>
          </div>

          <a
            href={urls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 shrink-0"
          >
            <span>View PDF</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    );
  }

  // 2. Video (YouTube or Direct Video File)
  if (inferredType === 'VIDEO' || firstUrl.includes('youtube') || firstUrl.endsWith('.mp4') || firstUrl.endsWith('.webm')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urls[0].match(regExp);
    const youtubeId = match && match[2].length === 11 ? match[2] : null;

    if (youtubeId) {
      return (
        <div className={`my-3 overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-black ${className}`}>
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    // Direct video upload
    return (
      <div className={`my-3 overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-black ${className}`}>
        <video
          controls
          preload="metadata"
          className="w-full aspect-video object-contain max-h-[420px]"
          src={urls[0]}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // 3. Images (1 or 2 images)
  const isMultiple = urls.length > 1;

  return (
    <>
      <div className={`my-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 ${className}`}>
        {isMultiple ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-slate-900/5">
            {urls.slice(0, 2).map((url, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className="relative aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group bg-slate-200"
              >
                <img
                  src={url}
                  alt={`${title} - image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-2 rounded-xl backdrop-blur-sm shadow-md">
                    <Maximize2 size={16} />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {idx + 1} / {Math.min(urls.length, 2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => setActiveImageIndex(0)}
            className="relative aspect-video max-h-[420px] w-full cursor-pointer group bg-slate-200 overflow-hidden"
          >
            <img
              src={urls[0]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-2.5 rounded-xl backdrop-blur-sm shadow-md">
                <Maximize2 size={18} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox modal for enlarged image preview */}
      {activeImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
          <div
            className="max-w-5xl max-h-[90vh] relative overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={urls[activeImageIndex]}
              alt={title}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            {isMultiple && (
              <div className="flex justify-center gap-2 mt-3">
                {urls.slice(0, 2).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${activeImageIndex === idx ? 'w-8 bg-blue-500' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
