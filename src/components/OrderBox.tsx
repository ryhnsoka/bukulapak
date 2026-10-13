'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, type Listing, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function OrderBox({ listing }: { listing: Listing }) {
  const { user, token } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [note, setNote] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <Link
        href="/login"
        className="block text-center bg-forest-700 text-cream px-6 py-3 rounded-lg font-medium hover:bg-forest-900 transition shadow"
      >
        Login untuk Membeli
      </Link>
    );
  }

  if (user.id === listing.user_id) {
    return <p className="text-sm text-gray-500 bg-stone-100 rounded-xl p-4">Ini listing milikmu.</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.createOrder(
        { listing_id: listing.id, buyer_name: name.trim(), buyer_note: note.trim() || undefined },
        token!
      );
      setOrder(res.data.order);
    } catch (err: any) {
      setError(err.message ?? 'Gagal membuat pesanan');
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
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-forest-900 mb-1">Pesanan {order.code} dibuat!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Status: {order.status_label ?? order.status}. Lanjutkan chat via WhatsApp penjual untuk deal (transfer/COD manual).
        </p>
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-semibold hover:brightness-95 transition shadow"
          >
            Chat Penjual via WhatsApp
          </a>
        ) : (
          <p className="text-sm text-gray-500">
            Penjual belum mencantumkan WA — hubungi via{' '}
            <Link href="/chat" className="underline text-forest-700">chat BukuLapak</Link>.
          </p>
        )}
        <Link href="/profil" className="block text-center text-sm underline text-gray-500 mt-3">
          Lihat di Pesanan Saya
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-bold">Beli Langsung</h3>
      <p className="text-sm text-gray-500">
        Isi form order, pesanan tercatat, lalu chat penjual via WhatsApp.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Nama pembeli"
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Catatan (opsional): jadwal COD, metode transfer…"
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading || !name.trim()}
        className="bg-forest-700 text-cream px-6 py-3 rounded-lg font-semibold hover:bg-forest-900 transition shadow disabled:opacity-50"
      >
        {loading ? 'Memproses…' : `Pesan Sekarang • ${listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}`}
      </button>
    </form>
  );
}
