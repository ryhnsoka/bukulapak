'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackSearch } from '@/lib/analytics';
import { api, type Book } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import BookCard from '@/components/BookCard';
import SkeletonCards, { EmptyState } from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';

const GENRES = [
  'Fiksi Indonesia',
  'Fiction',
  'Fantasy',
  'History',
  'Science',
  'Biography',
  'Self-Help',
  'Philosophy',
  'Mystery',
];

const SORTS = [
  { value: 'reviews', label: 'Paling Banyak Direview' },
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'title', label: 'Judul (A-Z)' },
];

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-10"><SkeletonCards count={8} /></div>}>
      <BooksContent />
    </Suspense>
  );
}

function BooksContent() {
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlGenre = searchParams.get('genre') ?? '';
  const urlSort = searchParams.get('sort') ?? 'reviews';
  const urlPage = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const paramKey = `${urlQ}|${urlGenre}|${urlSort}|${urlPage}`;

  return (
    <BooksInner
      key={paramKey}
      paramKey={paramKey}
      urlQ={urlQ}
      urlGenre={urlGenre}
      urlSort={urlSort}
      urlPage={urlPage}
    />
  );
}

interface BooksInnerProps {
  paramKey: string;
  urlQ: string;
  urlGenre: string;
  urlSort: string;
  urlPage: number;
}

function BooksInner({ paramKey, urlQ, urlGenre, urlSort, urlPage }: BooksInnerProps) {
  const router = useRouter();

  const [q, setQ] = useState(urlQ);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [externalBooks, setExternalBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(urlPage);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');

  const currentKey = `${paramKey}|${refreshTick}`;
  const loading = loadedKey !== currentKey;
  const loaded = loadedKey === currentKey && !error;

  function retryCatalog() {
    setError('');
    setRefreshTick((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;
    const term = urlQ.trim();

    async function fetchCatalog() {
      try {
        if (term) {
          const res = await api.searchBooks(term);
          if (cancelled) return;
          const local = res.data.local ?? res.data.books.filter((b) => !!b.id);
          const external = res.data.external ?? res.data.books.filter((b) => !b.id);
          setLocalBooks(local);
          setExternalBooks(external);
          setLastPage(1);
          setTotal(local.length + external.length);
        } else {
          const params: Record<string, string> = { sort: urlSort, page: String(urlPage) };
          if (urlGenre) params.genre = urlGenre;
          const res = await api.getBooks(params);
          if (cancelled) return;
          setLocalBooks(res.data.data);
          setExternalBooks([]);
          setPage(res.data.current_page);
          setLastPage(res.data.last_page);
          setTotal(res.data.total);
        }
        setError('');
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : term
              ? 'Pencarian gagal.'
              : 'Gagal memuat katalog buku.'
        );
      } finally {
        if (!cancelled) setLoadedKey(currentKey);
      }
    }

    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [urlQ, urlGenre, urlSort, urlPage, currentKey]);

  function pushParams(next: { q?: string; genre?: string; sort?: string; page?: number }) {
    const params = new URLSearchParams();
    const nq = next.q !== undefined ? next.q : urlQ;
    const ng = next.genre !== undefined ? next.genre : urlGenre;
    const ns = next.sort !== undefined ? next.sort : urlSort;
    const np = next.page !== undefined ? next.page : 1;
    if (nq.trim()) params.set('q', nq.trim());
    if (!nq.trim() && ng) params.set('genre', ng);
    if (!nq.trim() && ns && ns !== 'reviews') params.set('sort', ns);
    if (!nq.trim() && np > 1) params.set('page', String(np));
    const qs = params.toString();
    router.replace(qs ? `/books?${qs}` : '/books');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) trackSearch(term, 'books');
    pushParams({ q: term, page: 1 });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-forest-900 mb-1">
            Jelajahi &amp; Cari Buku
          </h1>
          <p className="text-stone-600 text-sm">
            Cari berdasarkan judul, penulis, atau ISBN di katalog BukuLapak maupun OpenLibrary.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="text-sm font-semibold text-forest-700 underline hover:text-forest-900"
        >
          Lihat semua buku bekas di Marketplace →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap sm:flex-nowrap gap-2 max-w-2xl mb-5">
        <label htmlFor="book-search-input" className="sr-only">
          Kata kunci judul, penulis, atau ISBN
        </label>
        <input
          id="book-search-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="cth: Laut Bercerita / Andrea Hirata / 978..."
          className="flex-1 min-w-52 border border-stone-300 rounded-xl px-4 py-2.5 text-sm bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-forest-700 text-cream px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-900 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Mencari…' : 'Cari'}
        </button>
        {urlQ && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              pushParams({ q: '', page: 1 });
            }}
            className="border border-stone-300 bg-white text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </form>

      {!urlQ && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="genre-filter" className="text-xs font-semibold text-stone-700">
              Genre:
            </label>
            <select
              id="genre-filter"
              value={urlGenre}
              onChange={(e) => pushParams({ genre: e.target.value, page: 1 })}
              className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm bg-white"
            >
              <option value="">Semua Genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-filter" className="text-xs font-semibold text-stone-700">
              Urutkan:
            </label>
            <select
              id="sort-filter"
              value={urlSort}
              onChange={(e) => pushParams({ sort: e.target.value, page: 1 })}
              className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm bg-white"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {urlGenre && (
            <button
              type="button"
              onClick={() => pushParams({ genre: '', page: 1 })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold hover:bg-forest-100/75 cursor-pointer"
            >
              <span>Genre: {urlGenre}</span>
              <span aria-hidden="true">✕</span>
            </button>
          )}
          {loaded && !loading && (
            <span className="text-xs text-stone-500 ml-auto">{total} buku di katalog</span>
          )}
        </div>
      )}

      {error && (
        <ErrorState
          title="Gagal memuat buku"
          message={error}
          onRetry={retryCatalog}
        />
      )}

      {loading && <SkeletonCards count={8} />}

      {loaded && !loading && !error && localBooks.length === 0 && externalBooks.length === 0 && (
        <EmptyState
          title="Buku tidak ditemukan"
          hint="Coba kata kunci lain: judul, penulis, atau nomor ISBN."
        />
      )}

      {!loading && !error && localBooks.length > 0 && (
        <section className="mb-10">
          {urlQ && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-forest-700 text-cream px-2.5 py-1 rounded-full">
                Katalog BukuLapak
              </span>
              <span className="text-sm text-stone-600">
                {localBooks.length} buku sudah terdaftar (bisa langsung lihat review &amp; penjual)
              </span>
            </div>
          )}
          <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
            {localBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && externalBooks.length > 0 && (
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-4 border-t border-warm-border pt-6">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
              Hasil Eksternal (OpenLibrary)
            </span>
            <span className="text-sm text-stone-600">
              Belum tersimpan di BukuLapak. Simpan untuk membuka halaman buku, menulis review, atau menjualnya.
            </span>
          </div>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
            {externalBooks.map((b, i) => (
              <SearchResultCard key={b.open_library_id ?? i} book={b} />
            ))}
          </div>
        </section>
      )}

      {!urlQ && !loading && lastPage > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => pushParams({ page: page - 1 })}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-sm disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-stone-600">
            Halaman {page} dari {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => pushParams({ page: page + 1 })}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-sm disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ book }: { book: Book }) {
  return (
    <article className="bg-white border border-warm-border rounded-xl overflow-hidden flex flex-col">
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} loading="lazy" className="w-full h-52 object-cover" />
      ) : (
        <div className="w-full h-52 bg-forest-50 flex items-center justify-center text-forest-900 font-serif font-bold px-4 text-center">
          {book.title}
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <span className="inline-block w-fit text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full mb-2">
          Eksternal
        </span>
        <h3 className="font-bold font-serif text-forest-900 leading-snug mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-stone-600 mb-3">
          {book.authors?.join(', ') || 'Penulis tidak diketahui'}
        </p>
        <div className="mt-auto">
          <SaveBookButton book={book} />
        </div>
      </div>
    </article>
  );
}

function SaveBookButton({ book }: { book: Book }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || !token) {
      showToast('Login terlebih dahulu untuk menyimpan buku ke katalog.', 'info');
      return;
    }
    setSaving(true);
    try {
      const res = await api.storeBook(book, token);
      setSavedId(res.data.book.id);
      showToast(`"${book.title}" tersimpan ke katalog BukuLapak.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan buku.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (savedId) {
    return (
      <Link
        href={`/books/${savedId}`}
        className="block w-full text-center bg-forest-700 text-cream text-xs px-3 py-2 rounded-xl font-semibold hover:bg-forest-900 transition"
      >
        Buka Halaman Buku →
      </Link>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login?next=/books"
        className="block w-full text-center border border-stone-300 text-stone-700 text-xs px-3 py-2 rounded-xl font-semibold hover:bg-stone-50 transition"
      >
        Login untuk Simpan
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      className="w-full border border-forest-700 text-forest-900 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-forest-50 transition disabled:opacity-50 cursor-pointer"
    >
      {saving ? 'Menyimpan…' : '+ Simpan ke BukuLapak'}
    </button>
  );
}
