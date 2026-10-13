'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Listing, type Order, type Review } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ListingCard from '@/components/ListingCard';
import ReviewCard from '@/components/ReviewCard';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-stone-200 text-stone-500',
};

export default function ProfilPage() {
  const { user, token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([api.myListings(token), api.myReviews(token), api.myOrders(token), api.mySales(token)])
      .then(([l, r, o, s]) => {
        setListings(l.data.data);
        setReviews(r.data.data);
        setOrders(o.data.data);
        setSales(s.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function setStatus(id: number, status: string) {
    if (!token || !confirm(`Ubah status pesanan menjadi "${status}"?`)) return;
    try {
      await api.updateOrderStatus(id, status, token);
      setSales((v) => v.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err: any) {
      alert(err.message ?? 'Gagal mengubah status');
    }
  }

  async function cancel(id: number) {
    if (!token || !confirm('Batalkan pesanan ini?')) return;
    try {
      await api.cancelOrder(id, token);
      setOrders((v) => v.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)));
    } catch (err: any) {
      alert(err.message ?? 'Gagal membatalkan');
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Login dulu</h1>
        <Link href="/login" className="inline-block bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <span className="w-16 h-16 rounded-full bg-forest-700 text-white flex items-center justify-center text-2xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold font-serif">{user.name}</h1>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold font-serif mb-4">Pesanan Saya ({orders.length})</h2>
      {loading ? (
        <p className="text-stone-500">Memuat…</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-500 text-sm mb-8">Belum ada pesanan.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-10">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48">
                <p className="font-bold text-sm">{o.code} • {o.listing.book.title}</p>
                <p className="text-xs text-gray-500">
                  {o.price === 0 ? 'Gratis' : `Rp ${o.price.toLocaleString('id-ID')}`} • Penjual: {o.seller.name}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE[o.status] ?? 'bg-stone-100 text-stone-600'}`}>{o.status_label ?? o.status}</span>
              {o.status === 'pending' && (
                <button onClick={() => cancel(o.id)} className="text-xs text-red-600 underline">
                  Batalkan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold font-serif mb-4">Penjualan ({sales.length})</h2>
      {sales.length === 0 ? (
        <p className="text-stone-500 text-sm mb-8">Belum ada penjualan.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-10">
          {sales.map((o) => (
            <div key={o.id} className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48">
                <p className="font-bold text-sm">{o.code} • {o.listing.book.title}</p>
                <p className="text-xs text-gray-500">
                  Pembeli: {o.buyer_name} • {o.price === 0 ? 'Gratis' : `Rp ${o.price.toLocaleString('id-ID')}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE[o.status] ?? 'bg-stone-100 text-stone-600'}`}>{o.status_label ?? o.status}</span>
              {o.status === 'pending' && (
                <button onClick={() => setStatus(o.id, 'confirmed')} className="text-xs bg-forest-700 text-cream px-3 py-1.5 rounded-full hover:bg-forest-900 transition">
                  Konfirmasi
                </button>
              )}
              {o.status === 'confirmed' && (
                <button onClick={() => setStatus(o.id, 'done')} className="text-xs bg-forest-700 text-cream px-3 py-1.5 rounded-full hover:bg-forest-900 transition">
                  Selesai
                </button>
              )}
              {(o.status === 'pending' || o.status === 'confirmed') && (
                <button onClick={() => setStatus(o.id, 'cancelled')} className="text-xs text-red-600 underline">
                  Batal
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold font-serif mb-4">Listing Saya ({listings.length})</h2>
      {loading ? (
        <p className="text-stone-500">Memuat…</p>
      ) : listings.length === 0 ? (
        <p className="text-stone-500 text-sm mb-8">Belum ada listing. <Link href="/jual" className="underline">Jual buku →</Link></p>
      ) : (
        <div className="grid gap-5 md:grid-cols-4 mb-10">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      <h2 className="text-xl font-bold font-serif mb-4">Review Saya ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="text-stone-500 text-sm">Belum ada review.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} onDeleted={(id) => setReviews((v) => v.filter((x) => x.id !== id))} />)}
        </div>
      )}
    </div>
  );
}



