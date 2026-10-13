'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, type Book } from '@/lib/api';
import BookCard from '@/components/BookCard';
import SkeletonCards, { EmptyState } from '@/components/Skeleton';

export default function BooksPage() {
  return (
    <Suspense fallback={<p className="max-w-6xl mx-auto px-4 py-10 text-gray-500">Memuat…</p>}>
      <BooksInner />
    </Suspense>
  );
}

function BooksInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('q')) {
      search();
    } else {
      browse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function browse() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBooks({});
      setResults(res.data.data);
      setSearched(true);
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat buku');
    } finally {
      setLoading(false);
    }
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.searchBooks(q.trim());
      setResults(res.data.books);
      setSearched(true);
    } catch (err: any) {
      setError(err.message ?? 'Pencarian gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-serif mb-2">Cari Buku</h1>
      <p className="text-stone-600 mb-6">Cari berdasarkan judul, penulis, atau ISBN.</p>
      <form onSubmit={search} className="flex gap-2 max-w-xl mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="cth: Laskar Pelangi / Andrea Hirata / ISBN…"
          className="flex-1 border border-stone-300 rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-forest-700"
        />
        <button className="bg-forest-700 text-white px-6 py-2.5 rounded-full hover:bg-forest-900 transition disabled:opacity-50" disabled={loading}>
          {loading ? 'Mencari…' : 'Cari'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <SkeletonCards />}
      {searched && results.length === 0 && !loading && (
        <EmptyState title="Tidak ditemukan" hint="Coba kata kunci lain: judul, penulis, atau ISBN." />
      )}
      <div className="grid gap-5 md:grid-cols-4">
        {results.filter((b) => b.id).map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-4 mt-5">
        {results.filter((b) => !b.id).map((b, i) => (
          <SearchResultCard key={b.open_library_id ?? i} book={b} />
        ))}
      </div>
    </div>
  );
}

function SearchResultCard({ book }: { book: Book }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full h-52 object-cover" />
      ) : (
        <div className="w-full h-52 bg-forest-700/5 flex items-center justify-center text-forest-700 font-serif px-4 text-center">
          {book.title}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold font-serif leading-snug mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-xs text-stone-500 mb-3">{book.authors?.join(', ')}</p>
        <SaveBookButton book={book} />
      </div>
    </div>
  );
}

function SaveBookButton({ book }: { book: Book }) {
  const [savedId, setSavedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(): Promise<number | null> {
    const token = localStorage.getItem('bukulapak_token');
    if (!token) {
      alert('Login dulu untuk melanjutkan.');
      return null;
    }
    setSaving(true);
    try {
      const res = await api.storeBook(book, token);
      setSavedId(res.data.book.id);
      return res.data.book.id;
    } catch (err: any) {
      alert(err.message ?? 'Gagal menyimpan');
      return null;
    } finally {
      setSaving(false);
    }
  }

  if (savedId) {
    return (
      <div className="flex gap-2">
        <Link href={`/books/${savedId}#review`} className="flex-1 text-center bg-forest-700 text-cream text-sm px-3 py-2 rounded-lg font-medium hover:bg-forest-900 transition">
          💬 Review
        </Link>
        <Link href={`/books/${savedId}#jual`} className="flex-1 text-center border border-forest-700 text-forest-900 text-sm px-3 py-2 rounded-lg font-medium hover:bg-forest-700 hover:text-cream transition">
          🏷️ Marketplace
        </Link>
      </div>
    );
  }
  return (
    <button onClick={save} disabled={saving} className="w-full border border-forest-700 text-forest-900 text-sm px-4 py-2 rounded-full hover:bg-forest-700/5 transition disabled:opacity-50">
      {saving ? 'Menyimpan…' : '+ Simpan ke BukuLapak'}
    </button>
  );
}



