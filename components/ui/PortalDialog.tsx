'use client';

import React, { useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type DialogVariant = 'info' | 'success' | 'danger';
type DialogMode = 'alert' | 'confirm';

interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface DialogState extends Required<Pick<DialogOptions, 'title' | 'confirmText' | 'cancelText' | 'variant'>> {
  mode: DialogMode;
  message?: string;
  resolve: (value: boolean) => void;
}

const variantStyles = {
  info: {
    iconWrap: 'bg-blue-50 text-blue-600 border-blue-100',
    button: 'bg-[#1A3D63] hover:bg-[#0A1931] text-white shadow-[#1A3D63]/20',
    icon: Info,
  },
  success: {
    iconWrap: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    icon: CheckCircle2,
  },
  danger: {
    iconWrap: 'bg-rose-50 text-rose-600 border-rose-100',
    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
    icon: AlertTriangle,
  },
};

export function usePortalDialog() {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const openDialog = useCallback((mode: DialogMode, options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        mode,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || (mode === 'confirm' ? 'Confirm' : 'Close'),
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'info',
        resolve,
      });
    });
  }, []);

  const confirmDialog = useCallback(
    (options: DialogOptions) => openDialog('confirm', options),
    [openDialog]
  );

  const showAlert = useCallback(
    (options: DialogOptions | string) => {
      const normalized = typeof options === 'string'
        ? { title: options, variant: 'info' as DialogVariant }
        : options;
      return openDialog('alert', normalized).then(() => undefined);
    },
    [openDialog]
  );

  const closeDialog = (value: boolean) => {
    const current = dialogState;
    setDialogState(null);
    current?.resolve(value);
  };

  const dialog = dialogState ? (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={() => closeDialog(false)}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>

          <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm ${variantStyles[dialogState.variant].iconWrap}`}>
            {React.createElement(variantStyles[dialogState.variant].icon, { size: 28, strokeWidth: 1.8 })}
          </div>

          <h3 className="pr-8 text-xl font-extrabold tracking-tight text-slate-950">{dialogState.title}</h3>
          {dialogState.message && (
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{dialogState.message}</p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {dialogState.mode === 'confirm' && (
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
              >
                {dialogState.cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={() => closeDialog(true)}
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wide shadow-lg transition active:scale-[0.98] ${variantStyles[dialogState.variant].button}`}
            >
              {dialogState.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return { dialog, confirmDialog, showAlert };
}
