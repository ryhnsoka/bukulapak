'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { trackOrderStatusUpdated } from '@/lib/analytics';
import {
  api,
  type Book,
  type BookList,
  type Listing,
  type Order,
  type ReadingShelfItem,
  type Review,
  type ShelfKey,
  type ShelfStats,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BookCard from '@/components/BookCard';
import { ConfirmDialog } from '@/components/Dialogs';
import ErrorState from '@/components/ErrorState';
import ListingCard from '@/components/ListingCard';
import ReviewCard from '@/components/ReviewCard';
import { useToast } from '@/components/ToastProvider';

type ProfileTab = 'shelves' | 'transactions' | 'listings' | 'reviews';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-600',
};

const BUYER_NEXT_STEP: Record<string, string> = {
  pending: 'Menunggu penjual mengonfirmasi ketersediaan. Kamu masih bisa membatalkan pesanan.',
  confirmed: 'Penjual mengonfirmasi! Lanjutkan koordinasi serah-terima/pembayaran lewat Chat BukuLapak.',
  done: 'Transaksi selesai. Berikan feedback untuk penjual di bawah ini.',
  cancelled: 'Pesanan dibatalkan; listing kembali tersedia jika belum terjual.',
};

const SELLER_NEXT_STEP: Record<string, string> = {
  pending: 'Periksa ketersediaan buku lalu klik Konfirmasi, atau Batal jika stok tidak tersedia.',
  confirmed: 'Koordinasikan pengiriman/COD lewat Chat, lalu klik Tandai Selesai setelah buku diterima pembeli.',
  done: 'Transaksi selesai dan listing otomatis ditandai Terjual.',
  cancelled: 'Pesanan dibatalkan; listing kembali berstatus Tersedia.',
};

const SHELF_TABS: { key: ShelfKey; label: string }[] = [
  { key: 'want_to_read', label: 'Ingin Dibaca' },
  { key: 'reading', label: 'Sedang Dibaca' },
  { key: 'finished', label: 'Sudah Dibaca' },
];

export default function ProfilPage() {
  const { user, token, ready } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>('shelves');
  const [txSubTab, setTxSubTab] = useState<'orders' | 'sales'>('orders');

  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [shelves, setShelves] = useState<ReadingShelfItem[]>([]);
  const [shelfStats, setShelfStats] = useState<ShelfStats>({
    want_to_read: 0,
    reading: 0,
    finished: 0,
    total: 0,
  });
  const [activeShelf, setActiveShelf] = useState<ShelfKey>('want_to_read');
  const [lists, setLists] = useState<BookList[]>([]);
  const [recs, setRecs] = useState<{ basis_genres: string[]; books: Book[] }>({
    basis_genres: [],
    books: [],
  });
  const [listTitle, setListTitle] = useState('');
  const [listPublic, setListPublic] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [loadError, setLoadError] = useState('');

  const currentKey = token ? `${token}:${refreshTick}` : '';
  const loading = !ready || (Boolean(token) && loadedKey !== currentKey);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const listTitleId = useId();
  const listPublicId = useId();

  function retryLoadProfile() {
    setLoadError('');
    setRefreshTick((n) => n + 1);
  }

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;

    async function fetchProfile(authToken: string) {
      try {
        const [l, r, o, s, sh, bl, rec] = await Promise.all([
          api.myListings(authToken),
          api.myReviews(authToken),
          api.myOrders(authToken),
          api.mySales(authToken),
          api.myShelves(authToken).catch(() => null),
          api.myLists(authToken).catch(() => null),
          api.getRecommendations(authToken).catch(() => null),
        ]);
        if (cancelled) return;
        setListings(l.data.data);
        setReviews(r.data.data);
        setOrders(o.data.data);
        setSales(s.data.data);
        if (sh) {
          setShelves(sh.data.shelves);
          setShelfStats(sh.data.stats);
        }
        if (bl) setLists(bl.data.lists);
        if (rec) setRecs(rec.data);
        setLoadError('');
      } catch (err: unknown) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat data profil.');
      } finally {
        if (!cancelled) setLoadedKey(currentKey);
      }
    }

    fetchProfile(token);
    return () => {
      cancelled = true;
    };
  }, [token, ready, currentKey]);

  async function setOrderStatus(id: string, status: string) {
    if (!token) return;
    try {
      const res = await api.updateOrderStatus(id, status, token);
      trackOrderStatusUpdated(status);
      setSales((v) => v.map((o) => (o.id === id ? res.data.order : o)));
      const refreshedListings = await api.myListings(token);
      setListings(refreshedListings.data.data);
      showToast(
        `Status pesanan diperbarui menjadi "${res.data.order.status_label ?? status}".`,
        'success'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status pesanan.', 'error');
    }
  }

  function requestCancelOrder(order: Order) {
    setConfirmState({
      title: 'Batalkan Pesanan',
      message: `Batalkan pesanan ${order.code} untuk "${order.listing.book.title}"? Listing akan kembali berstatus Tersedia.`,
      confirmLabel: 'Ya, Batalkan',
      onConfirm: async () => {
        if (!token) return;
        try {
          await api.cancelOrder(order.id, token);
          setOrders((v) =>
            v.map((o) =>
              o.id === order.id ? { ...o, status: 'cancelled', status_label: 'Dibatalkan' } : o
            )
          );
          showToast('Pesanan berhasil dibatalkan.', 'success');
        } catch (err: unknown) {
          showToast(
            err instanceof Error ? err.message : 'Gagal membatalkan pesanan.',
            'error'
          );
        }
      },
    });
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !listTitle.trim()) return;
    try {
      const res = await api.createList({ title: listTitle.trim(), is_public: listPublic }, token);
      setLists((v) => [res.data.list, ...v]);
      setListTitle('');
      showToast('Daftar buku kustom dibuat.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat daftar buku.', 'error');
    }
  }

  function requestDeleteList(list: BookList) {
    setConfirmState({
      title: 'Hapus Daftar Buku',
      message: `Hapus daftar "${list.title}" secara permanen?`,
      confirmLabel: 'Ya, Hapus',
      onConfirm: async () => {
        if (!token) return;
        try {
          await api.deleteList(list.id, token);
          setLists((v) => v.filter((x) => x.id !== list.id));
          showToast('Daftar buku dihapus.', 'success');
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : 'Gagal menghapus daftar.', 'error');
        }
      },
    });
  }

  async function updateMyListingStatus(listingId: string, nextStatus: 'active' | 'sold' | 'hidden') {
    if (!token) return;
    try {
      const res = await api.updateListing(listingId, { status: nextStatus }, token);
      setListings((v) => v.map((l) => (l.id === listingId ? res.data.listing : l)));
      showToast(
        `Status listing diubah menjadi "${res.data.listing.status_label ?? nextStatus}".`,
        'success'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui listing.', 'error');
    }
  }

  function requestDeleteMyListing(listing: Listing) {
    setConfirmState({
      title: 'Hapus Listing',
      message: `Hapus listing "${listing.book.title}" secara permanen?`,
      confirmLabel: 'Ya, Hapus',
      onConfirm: async () => {
        if (!token) return;
        try {
          await api.deleteListing(listing.id, token);
          setListings((v) => v.filter((l) => l.id !== listing.id));
          showToast('Listing berhasil dihapus.', 'success');
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : 'Gagal menghapus listing.', 'error');
        }
      },
    });
  }

  if (!ready) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-stone-500">
        Memeriksa sesi…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold font-serif text-forest-900 mb-2">Login dulu</h1>
        <p className="text-sm text-stone-600 mb-6">
          Masuk untuk melihat rak buku, daftar bacaan, pesanan, dan listingmu.
        </p>
        <Link
          href="/login?next=/profil"
          className="inline-block bg-forest-700 text-cream px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition"
        >
          Login
        </Link>
      </div>
    );
  }

  const activeShelfItems = shelves.filter((s) => s.shelf === activeShelf);

  const mainTabs: { key: ProfileTab; label: string }[] = [
    { key: 'shelves', label: 'Rak & Daftar' },
    { key: 'transactions', label: `Transaksi (${orders.length + sales.length})` },
    { key: 'listings', label: `Listing Saya (${listings.length})` },
    { key: 'reviews', label: `Review Saya (${reviews.length})` },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-forest-700 text-cream flex items-center justify-center text-2xl font-bold shrink-0"
            aria-hidden="true"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold font-serif text-forest-900">{user.name}</h1>
            <p className="text-sm text-stone-600">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2.5 text-center">
          <div className="bg-white border border-warm-border rounded-xl px-4 py-2">
            <p className="text-lg font-bold text-forest-900">{shelfStats.want_to_read}</p>
            <p className="text-xs text-stone-500">Ingin Dibaca</p>
          </div>
          <div className="bg-white border border-warm-border rounded-xl px-4 py-2">
            <p className="text-lg font-bold text-forest-900">{shelfStats.reading}</p>
            <p className="text-xs text-stone-500">Sedang Dibaca</p>
          </div>
          <div className="bg-white border border-warm-border rounded-xl px-4 py-2">
            <p className="text-lg font-bold text-forest-900">{shelfStats.finished}</p>
            <p className="text-xs text-stone-500">Sudah Dibaca</p>
          </div>
        </div>
      </div>

      {loadError && (
        <ErrorState
          title="Gagal memuat aktivitas profil"
          message={loadError}
          onRetry={retryLoadProfile}
        />
      )}

      {/* Navigasi 4 Tab Utama */}
      <div
        role="tablist"
        aria-label="Bagian profil"
        className="flex flex-wrap gap-2 border-b border-warm-border pb-3 mb-8"
      >
        {mainTabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                selected
                  ? 'bg-forest-700 text-cream shadow-sm'
                  : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Memuat data profil…</p>
      ) : (
        <div role="tabpanel">
          {activeTab === 'shelves' && (
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-bold font-serif text-forest-900 mb-3">Rak Buku Saya</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SHELF_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveShelf(t.key)}
                      className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        activeShelf === t.key
                          ? 'bg-forest-700 text-cream'
                          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {t.label} ({shelves.filter((s) => s.shelf === t.key).length})
                    </button>
                  ))}
                </div>
                {activeShelfItems.length === 0 ? (
                  <p className="text-sm text-stone-600 bg-white border border-warm-border rounded-xl p-5">
                    Belum ada buku di rak ini.{' '}
                    <Link href="/books" className="underline font-semibold text-forest-700">
                      Jelajahi buku →
                    </Link>
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {activeShelfItems.map(
                      (item) => item.book && <BookCard key={item.id} book={item.book} />
                    )}
                  </div>
                )}
              </section>

              <section className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-warm-border rounded-xl p-5">
                  <h2 className="text-lg font-bold font-serif text-forest-900 mb-3">
                    Daftar Buku Kustom ({lists.length})
                  </h2>
                  <form onSubmit={handleCreateList} className="flex flex-col gap-2.5 mb-4">
                    <label htmlFor={listTitleId} className="sr-only">
                      Nama daftar buku baru
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={listTitleId}
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        placeholder="Nama daftar baru (cth: Bacaan Liburan)…"
                        className="flex-1 border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
                      />
                      <button
                        type="submit"
                        className="bg-forest-700 text-cream px-4 py-2 rounded-xl text-xs font-semibold hover:bg-forest-900 cursor-pointer"
                      >
                        Buat
                      </button>
                    </div>
                    <label
                      htmlFor={listPublicId}
                      className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer"
                    >
                      <input
                        id={listPublicId}
                        type="checkbox"
                        checked={listPublic}
                        onChange={(e) => setListPublic(e.target.checked)}
                      />
                      <span>Publik (dapat dilihat pembaca lain)</span>
                    </label>
                  </form>

                  {lists.length === 0 ? (
                    <p className="text-xs text-stone-500">Belum ada daftar kustom.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lists.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-center justify-between gap-2 border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
                        >
                          <div>
                            <span className="font-semibold text-stone-900">{l.title}</span>
                            <span className="text-xs text-stone-500 ml-2">
                              ({l.is_public ? 'Publik' : 'Privat'}) •{' '}
                              {l.books_count ?? l.books?.length ?? 0} buku
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => requestDeleteList(l)}
                            className="text-xs text-red-700 font-semibold hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white border border-warm-border rounded-xl p-5">
                  <h2 className="text-lg font-bold font-serif text-forest-900 mb-1">
                    Rekomendasi Untukmu
                  </h2>
                  <p className="text-xs text-stone-500 mb-3">
                    {recs.basis_genres.length > 0
                      ? `Berdasarkan genre dari rak bukumu: ${recs.basis_genres.join(', ')}.`
                      : 'Tambahkan buku ke rakmu untuk mendapatkan rekomendasi berdasarkan genre.'}
                  </p>
                  {recs.books.length === 0 ? (
                    <p className="text-xs text-stone-500">
                      Belum ada rekomendasi tambahan saat ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {recs.books.slice(0, 4).map((b) => (
                        <Link
                          key={b.id}
                          href={`/books/${b.id}`}
                          className="border border-stone-200 rounded-xl p-3 hover:border-forest-700 transition bg-stone-50/40"
                        >
                          <p className="font-semibold text-xs text-stone-900 line-clamp-2">
                            {b.title}
                          </p>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {b.authors?.join(', ')}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setTxSubTab('orders')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    txSubTab === 'orders'
                      ? 'bg-forest-700 text-cream'
                      : 'bg-white border border-stone-300 text-stone-700'
                  }`}
                >
                  Pesanan Saya ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTxSubTab('sales')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    txSubTab === 'sales'
                      ? 'bg-forest-700 text-cream'
                      : 'bg-white border border-stone-300 text-stone-700'
                  }`}
                >
                  Penjualan ({sales.length})
                </button>
              </div>

              {txSubTab === 'orders' ? (
                orders.length === 0 ? (
                  <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-xl p-5">
                    Belum ada pesanan pembelian.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-white border border-warm-border rounded-xl p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-48">
                            <p className="font-bold text-sm text-stone-900">
                              {o.code} • {o.listing.book.title}
                            </p>
                            <p className="text-xs text-stone-500">
                              {o.price === 0 ? 'Gratis' : `Rp ${o.price.toLocaleString('id-ID')}`}{' '}
                              • Penjual: {o.seller.name}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              STATUS_STYLE[o.status] ?? 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {o.status_label ?? o.status}
                          </span>
                          <Link
                            href="/chat"
                            className="text-xs border border-forest-700 text-forest-900 px-3 py-1.5 rounded-xl font-semibold hover:bg-forest-50"
                          >
                            Chat Penjual
                          </Link>
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => requestCancelOrder(o)}
                              className="text-xs text-red-700 font-semibold underline cursor-pointer"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 mt-2.5 bg-stone-50 rounded-xl px-3 py-2">
                          <strong>Langkah berikutnya:</strong> {BUYER_NEXT_STEP[o.status] ?? ''}
                        </p>
                        {o.status === 'done' && (
                          <TransactionFeedbackBox
                            order={o}
                            token={token!}
                            onSubmitted={(fb) =>
                              setOrders((v) =>
                                v.map((x) => (x.id === o.id ? { ...x, feedback: fb } : x))
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : sales.length === 0 ? (
                <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-xl p-5">
                  Belum ada pesanan masuk pada listingmu.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sales.map((o) => (
                    <div key={o.id} className="bg-white border border-warm-border rounded-xl p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-48">
                          <p className="font-bold text-sm text-stone-900">
                            {o.code} • {o.listing.book.title}
                          </p>
                          <p className="text-xs text-stone-500">
                            Pembeli: {o.buyer_name} •{' '}
                            {o.price === 0 ? 'Gratis' : `Rp ${o.price.toLocaleString('id-ID')}`}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            STATUS_STYLE[o.status] ?? 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {o.status_label ?? o.status}
                        </span>
                        {o.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setOrderStatus(o.id, 'confirmed')}
                            className="text-xs bg-forest-700 text-cream px-3 py-1.5 rounded-xl font-semibold hover:bg-forest-900 transition cursor-pointer"
                          >
                            Konfirmasi
                          </button>
                        )}
                        {o.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => setOrderStatus(o.id, 'done')}
                            className="text-xs bg-forest-700 text-cream px-3 py-1.5 rounded-xl font-semibold hover:bg-forest-900 transition cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {(o.status === 'pending' || o.status === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => setOrderStatus(o.id, 'cancelled')}
                            className="text-xs text-red-700 font-semibold underline cursor-pointer"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-2.5 bg-stone-50 rounded-xl px-3 py-2">
                        <strong>Langkah berikutnya:</strong> {SELLER_NEXT_STEP[o.status] ?? ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              {listings.length === 0 ? (
                <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-xl p-5">
                  Belum ada listing.{' '}
                  <Link href="/jual" className="underline font-semibold text-forest-700">
                    Jual buku →
                  </Link>
                </p>
              ) : (
                <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
                  {listings.map((l) => (
                    <div key={l.id} className="flex flex-col gap-2">
                      <ListingCard listing={l} />
                      <div className="flex flex-wrap gap-1.5 bg-white border border-warm-border rounded-xl p-2">
                        {l.status === 'active' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateMyListingStatus(l.id, 'sold')}
                              className="text-xs px-2.5 py-1 rounded-lg bg-forest-700 text-cream font-semibold hover:bg-forest-900 cursor-pointer"
                            >
                              Tandai Terjual
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMyListingStatus(l.id, 'hidden')}
                              className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                            >
                              Sembunyikan
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateMyListingStatus(l.id, 'active')}
                            className="text-xs px-2.5 py-1 rounded-lg border border-forest-700 text-forest-900 font-semibold hover:bg-forest-50 cursor-pointer"
                          >
                            Aktifkan Lagi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => requestDeleteMyListing(l)}
                          className="text-xs px-2.5 py-1 rounded-lg text-red-700 font-semibold hover:bg-red-50 ml-auto cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-xl p-5">
                  Belum ada review yang ditulis.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {reviews.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      onDeleted={(id) => setReviews((v) => v.filter((x) => x.id !== id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? 'Konfirmasi'}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Ya'}
        onConfirm={() => {
          const fn = confirmState?.onConfirm;
          setConfirmState(null);
          fn?.();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}

function TransactionFeedbackBox({
  order,
  token,
  onSubmitted,
}: {
  order: Order;
  token: string;
  onSubmitted: (fb: NonNullable<Order['feedback']>) => void;
}) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (order.feedback) {
    return (
      <p className="text-xs text-forest-700 font-medium mt-2">
        Feedback transaksi terkirim ({order.feedback.rating}/5★)
        {order.feedback.comment ? `: "${order.feedback.comment}"` : ''}
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api.submitOrderFeedback(
        order.id,
        { rating, comment: comment.trim() || undefined },
        token
      );
      onSubmitted(res.data.feedback);
      showToast('Feedback penjual berhasil dikirim.', 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim feedback');
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2"
    >
      <span className="text-xs font-semibold text-stone-700">Nilai Penjual &amp; Kondisi:</span>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        aria-label="Rating penjual"
        className="border border-stone-300 rounded-lg px-2 py-1 text-xs bg-white"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} ★
          </option>
        ))}
      </select>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Komentar transaksi (opsional)…"
        aria-label="Komentar transaksi"
        className="flex-1 min-w-44 border border-stone-300 rounded-lg px-2.5 py-1 text-xs bg-white"
      />
      <button
        type="submit"
        disabled={sending}
        className="bg-forest-700 text-cream text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer"
      >
        {sending ? 'Mengirim…' : 'Kirim Feedback'}
      </button>
      {error && <span className="text-xs text-red-700 w-full">{error}</span>}
    </form>
  );
}
