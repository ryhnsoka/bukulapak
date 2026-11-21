'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { api, type Listing, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from './ToastProvider';

export default function OrderBox({
  listing,
  onOrdered,
}: {
  listing: Listing;
  onOrdered?: (order: Order) => void;
}) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameId = useId();
  const noteId = useId();
  const name = nameDraft ?? user?.name ?? '';

  if (!user) {
    return null;
  }

  if (user.id === listing.user_id) {
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !token) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.createOrder(
        { listing_id: listing.id, buyer_name: name.trim(), buyer_note: note.trim() || undefined },
        token
      );
      setOrder(res.data.order);
      showToast(`Pesanan ${res.data.order.code} dibuat!`, 'success');
      onOrdered?.(res.data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    const wa = listing.wa_number;
    const msg = `Halo ${listing.user.name}, saya ${order.buyer_name} baru saja memesan "${listing.book.title}" (${order.code}, ${
      order.price === 0 ? 'Gratis' : `Rp ${order.price.toLocaleString('id-ID')}`
    }) di BukuLapak. Apakah masih tersedia?`;

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="font-bold text-forest-900 mb-1">✅ Pesanan {order.code} dibuat!</p>
        <p className="text-sm text-stone-700 mb-4">
          Status: {order.status_label ?? order.status}. Lanjutkan koordinasi pembayaran/COD
          lewat Chat BukuLapak{wa ? ' atau WhatsApp penjual' : ''}.
        </p>
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm mb-3"
          >
            Chat Penjual via WhatsApp
          </a>
        )}
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/chat" className="text-forest-700 underline">
            Buka Chat BukuLapak
          </Link>
          <Link href="/profil" className="text-stone-700 underline">
            Lihat di Pesanan Saya
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-warm-border rounded-xl p-5 flex flex-col gap-3"
    >
      <div>
        <h2 className="font-bold text-stone-900">Beli Langsung</h2>
        <p className="text-xs text-stone-600 mt-0.5">
          Pesanan tercatat dan buku otomatis di-reserve agar tidak dipesan orang lain.
        </p>
      </div>

      <div>
        <label htmlFor={nameId} className="block text-xs font-semibold text-stone-700 mb-1">
          Nama pembeli
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(e) => setNameDraft(e.target.value)}
          required
          autoComplete="name"
          placeholder="Nama lengkap"
          className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
        />
      </div>

      <div>
        <label htmlFor={noteId} className="block text-xs font-semibold text-stone-700 mb-1">
          Catatan untuk penjual (opsional)
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Jadwal COD, area pertemuan, atau ekspedisi…"
          className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
        />
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-forest-700 text-cream px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {loading
          ? 'Memproses…'
          : `Pesan Sekarang • ${listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}`}
      </button>
    </form>
  );
}
