'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackSearch } from '@/lib/analytics';
import { api, type Book } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import BookCard from '@/components/BookCard';
import { BookCoverImage } from '@/components/BookCoverFallback';
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
  { value: 'reviews', label: 'Paling banyak diulas' },
  { value: 'rating', label: 'Nilai tertinggi' },
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
          <h1 className="type-page-title text-ink mb-1">Katalog buku</h1>
          <p className="text-stone-600 text-sm">
            Cari judul, penulis, atau nomor ISBN dari koleksi BukuLapak dan arsip OpenLibrary.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="text-sm font-medium text-forest-700 underline underline-offset-4 hover:text-forest-900"
        >
          Lihat buku bekas di Marketplace
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
          className="flex-1 min-w-52 border border-input-border rounded-lg px-4 py-2.5 text-sm bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-forest-700 text-cream px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors disabled:opacity-50 cursor-pointer"
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
            className="border border-input-border bg-white text-ink px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-paper transition-colors cursor-pointer"
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
              className="border border-input-border rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="">Semua genre</option>
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
              className="border border-input-border rounded-lg px-3 py-1.5 text-sm bg-white"
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-forest-100 text-forest-900 text-xs font-medium hover:bg-forest-100/75 cursor-pointer"
            >
              <span>Genre: {urlGenre}</span>
              <span aria-hidden="true">✕</span>
            </button>
          )}
          {loaded && !loading && (
            <span className="text-xs text-stone-600 ml-auto tabular-nums">
              {total} buku di katalog
            </span>
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
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 mb-4 border-b border-warm-border">
              <h2 className="font-sans font-semibold text-sm text-ink">Di katalog BukuLapak</h2>
              <span className="text-xs text-stone-600 tabular-nums">
                {localBooks.length} judul tersedia dengan ulasan dan daftar penjual
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 mb-4 border-b border-warm-border pt-2">
            <h2 className="font-sans font-semibold text-sm text-ink">Dari OpenLibrary</h2>
            <span className="text-xs text-stone-600">
              Belum masuk katalog. Simpan dulu supaya bisa diulas atau dijual.
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
            className="px-4 py-2 rounded-lg border border-input-border bg-white text-sm text-ink disabled:opacity-40 hover:bg-paper cursor-pointer"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-stone-600 tabular-nums">
            Halaman {page} dari {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => pushParams({ page: page + 1 })}
            className="px-4 py-2 rounded-lg border border-input-border bg-white text-sm text-ink disabled:opacity-40 hover:bg-paper cursor-pointer"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ book }: { book: Book }) {
  const subtitle = book.authors?.length
    ? book.authors.join(', ')
    : book.isbn
      ? `ISBN ${book.isbn}`
      : undefined;

  return (
    <article className="bg-white border border-warm-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="w-full aspect-[2/3] overflow-hidden bg-paper">
        <BookCoverImage
          key={book.cover_url ?? 'none'}
          src={book.cover_url}
          alt={book.title}
          title={book.title}
          subtitle={subtitle}
          loading="lazy"
          imgClassName="w-full h-full object-cover"
        />
      </div>
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
        <span className="inline-block w-fit text-[11px] font-medium bg-paper text-stone-700 px-2 py-0.5 rounded-sm mb-2">
          OpenLibrary
        </span>
        <h3 className="type-card-title text-sm sm:text-base text-ink mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-stone-600 mb-3 line-clamp-1">
          {book.authors?.join(', ') || 'Penulis tidak tercatat'}
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
      showToast('Masuk terlebih dahulu untuk menyimpan buku ke katalog.', 'info');
      return;
    }
    setSaving(true);
    try {
      const res = await api.storeBook(book, token);
      setSavedId(res.data.book.id);
      showToast(`"${book.title}" ditambahkan ke katalog.`, 'success');
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
        className="block w-full text-center bg-forest-700 text-cream text-xs px-3 py-2 rounded-lg font-medium hover:bg-forest-900 transition-colors"
      >
        Buka halaman buku
      </Link>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login?next=/books"
        className="block w-full text-center border border-input-border text-ink text-xs px-3 py-2 rounded-lg font-medium hover:bg-paper transition-colors"
      >
        Masuk untuk menyimpan
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      className="w-full border border-forest-700 text-forest-900 text-xs font-medium px-4 py-2 rounded-lg hover:bg-forest-50 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {saving ? 'Menyimpan…' : 'Simpan ke katalog'}
    </button>
  );
}
