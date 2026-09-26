'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  accentColor?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  accentColor = 'bg-slate-900' 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => 
    p === 1 || 
    p === totalPages || 
    (p >= currentPage - 1 && p <= currentPage + 1)
  );

  const renderPages = () => {
    const items = [];
    let lastPage = 0;

    for (const page of visiblePages) {
      if (lastPage !== 0 && page - lastPage > 1) {
        items.push(<span key={`ellipsis-${page}`} className="px-2 text-slate-400 font-bold">...</span>);
      }
      items.push(
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 flex items-center justify-center text-sm font-black transition-all border ${
            currentPage === page 
              ? `${accentColor} text-white border-transparent shadow-lg` 
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
          style={{ borderRadius: '4px' }}
        >
          {page}
        </button>
      );
      lastPage = page;
    }
    return items;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-slate-400 transition-all"
        style={{ borderRadius: '4px' }}
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-slate-400 transition-all"
        style={{ borderRadius: '4px' }}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center space-x-1">
        {renderPages()}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-slate-400 transition-all"
        style={{ borderRadius: '4px' }}
      >
        <ChevronRight size={16} />
      </button>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-slate-400 transition-all"
        style={{ borderRadius: '4px' }}
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}
