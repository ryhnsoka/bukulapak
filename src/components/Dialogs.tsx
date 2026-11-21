'use client';

import { useEffect, useId, useRef, useState } from 'react';

function useLightDismissFallback(
  dialogRef: React.RefObject<HTMLDialogElement | null>,
  open: boolean,
  onClose: () => void
) {
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg || !open) return;
    if ('closedBy' in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dlg.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dlg.close('');
        onClose();
      }
    };
    dlg.addEventListener('pointerdown', onDown);
    dlg.addEventListener('pointerup', onUp);
    return () => {
      dlg.removeEventListener('pointerdown', onDown);
      dlg.removeEventListener('pointerup', onUp);
    };
  }, [dialogRef, open, onClose]);
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close('');
    }
  }, [open]);

  function handleClose() {
    const dlg = ref.current;
    if (!dlg) return;
    const val = dlg.returnValue;
    dlg.returnValue = '';
    if (val === 'confirm') {
      onConfirm();
    } else {
      onCancel();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      className="rounded-2xl border border-stone-200 bg-white text-stone-900 p-0 max-w-md w-[calc(100%-2rem)] shadow-2xl m-auto"
    >
      <form method="dialog" className="p-6">
        <h2 id={titleId} className="font-serif text-xl font-bold text-stone-900 mb-2">
          {title}
        </h2>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            type="submit"
            value="cancel"
            autoFocus
            className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            value="confirm"
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-forest-700 hover:bg-forest-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function ReportDialog({
  open,
  targetLabel,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  targetLabel: string;
  onSubmit: (category: string, reason: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const categoryId = useId();
  const reasonId = useId();
  const [category, setCategory] = useState('spam');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setCategory('spam');
      setReason('');
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close('');
    }
  }, [open]);

  function handleClose() {
    const dlg = ref.current;
    if (dlg) dlg.returnValue = '';
    onCancel();
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 5 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(category, reason.trim());
      ref.current?.close('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      className="rounded-2xl border border-stone-200 bg-white text-stone-900 p-0 max-w-md w-[calc(100%-2rem)] shadow-2xl m-auto"
    >
      <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
        <div>
          <h2 id={titleId} className="font-serif text-xl font-bold text-stone-900 mb-1">
            Laporkan Konten
          </h2>
          <p className="text-xs text-stone-500">Target: {targetLabel}</p>
        </div>

        <div>
          <label htmlFor={categoryId} className="block text-xs font-semibold text-stone-700 mb-1">
            Kategori Pelanggaran
          </label>
          <select
            id={categoryId}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="spoiler">Spoiler tidak ditandai</option>
            <option value="spam">Spam atau promosi melenceng</option>
            <option value="kasar">Bahasa kasar / pelecehan</option>
            <option value="penipuan">Indikasi penipuan / info palsu</option>
          </select>
        </div>

        <div>
          <label htmlFor={reasonId} className="block text-xs font-semibold text-stone-700 mb-1">
            Alasan Laporan
          </label>
          <textarea
            id={reasonId}
            rows={3}
            required
            minLength={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan singkat alasan laporan (min. 5 karakter)…"
            className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => ref.current?.close('')}
            className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || reason.trim().length < 5}
            className="px-4 py-2 rounded-xl bg-forest-700 text-cream text-sm font-semibold hover:bg-forest-900 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Mengirim…' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function PhotoLightbox({
  open,
  images,
  title,
  initialIndex = 0,
  onClose,
}: {
  open: boolean;
  images: string[];
  title: string;
  initialIndex?: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close('');
    }
  }, [open]);

  useLightDismissFallback(ref, open, onClose);

  function handleClose() {
    const dlg = ref.current;
    if (dlg) dlg.returnValue = '';
    onClose();
  }

  const safeIdx = images.length > 0 ? ((index % images.length) + images.length) % images.length : 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="rounded-2xl border border-stone-200 bg-white text-stone-900 p-0 max-w-2xl w-[calc(100%-2rem)] shadow-2xl m-auto"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 id={titleId} className="font-serif text-lg font-bold text-stone-900">
              {title}
            </h2>
            {images.length > 0 && (
              <p className="text-xs text-stone-500">
                Foto {safeIdx + 1} dari {images.length}
              </p>
            )}
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => ref.current?.close('')}
            aria-label="Tutup galeri foto"
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Tutup (Esc)
          </button>
        </div>

        <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center max-h-[65dvh]">
          {images[safeIdx] && (
            <img
              src={images[safeIdx]}
              alt={`Foto ${safeIdx + 1} ${title}`}
              className="max-h-[62dvh] w-auto object-contain"
            />
          )}
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
