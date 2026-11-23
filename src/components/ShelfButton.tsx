'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackUpdateReadingShelf } from '@/lib/analytics';
import { api, type ShelfKey } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from './ToastProvider';

const SHELVES: { key: ShelfKey; label: string }[] = [
  { key: 'want_to_read', label: 'Ingin Dibaca' },
  { key: 'reading', label: 'Sedang Dibaca' },
  { key: 'finished', label: 'Sudah Dibaca' },
];

export default function ShelfButton({ bookId }: { bookId: string }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState<ShelfKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getBookShelf(bookId, token)
      .then((res) => {
        if (!cancelled) setCurrent(res.data.shelf?.shelf ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bookId, token]);

  const effectiveShelf = token ? current : null;

  async function handleSelect(value: string) {
    if (!token || saving) return;
    setSaving(true);
    try {
      if (value === '') {
        await api.removeShelf(bookId, token);
        trackUpdateReadingShelf({ bookId, shelf: 'removed' });
        setCurrent(null);
        showToast('Buku dihapus dari rak baca.', 'info');
      } else {
        const shelf = value as ShelfKey;
        await api.upsertShelf(bookId, shelf, token);
        trackUpdateReadingShelf({ bookId, shelf });
        setCurrent(shelf);
        const label = SHELVES.find((s) => s.key === shelf)?.label ?? shelf;
        showToast(`Disimpan ke rak "${label}".`, 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui rak baca.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/books/${bookId}`)}`}
        className="inline-flex items-center gap-1.5 border border-stone-300 bg-white text-stone-800 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition"
      >
        + Simpan ke Rak Baca
      </Link>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor={`shelf-${bookId}`} className="sr-only">
        Status rak baca
      </label>
      <select
        id={`shelf-${bookId}`}
        value={effectiveShelf ?? ''}
        disabled={saving}
        onChange={(e) => handleSelect(e.target.value)}
        className="border border-forest-700 text-forest-900 bg-white rounded-xl px-3.5 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        <option value="">+ Tambah ke Rak Baca</option>
        {SHELVES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
