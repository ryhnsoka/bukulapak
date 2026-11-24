'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type Book, type Listing } from '@/lib/api';
import { genreFilterCategory, groupByGenre } from '@/lib/genre';
import BookCard from './BookCard';
import ErrorState from './ErrorState';
import HorizontalShelf from './HorizontalShelf';
import ListingCard from './ListingCard';
import SkeletonCards from './Skeleton';

export default function HomeClient() {
  const configured = api.isConfigured();
  const [books, setBooks] = useState<Book[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedTick, setLoadedTick] = useState<number>(configured ? -1 : 0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const loading = configured && loadedTick !== refreshTick;

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    Promise.allSettled([api.popularBooks(48), api.getListings({})]).then(
      ([popularRes, listingsRes]) => {
        if (cancelled) return;
        if (popularRes.status === 'fulfilled') {
          setBooks(popularRes.value.data.books);
          setBooksError(null);
        } else {
          setBooks([]);
          setBooksError(
            popularRes.reason instanceof Error
              ? popularRes.reason.message
              : 'Gagal memuat katalog buku.'
          );
        }

        if (listingsRes.status === 'fulfilled') {
          setListings(listingsRes.value.data.data.slice(0, 4));
          setListingsError(null);
        } else {
          setListings([]);
          setListingsError(
            listingsRes.reason instanceof Error
              ? listingsRes.reason.message
              : 'Gagal memuat listing terbaru.'
          );
        }

        setLoadedTick(refreshTick);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [configured, refreshTick]);

  function retry() {
    setRefreshTick((n) => n + 1);
  }

  const hangat = [...books]
    .sort((a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0))
    .slice(0, 10);
  const groups = groupByGenre(
    books.filter((b) => (b.reviews_count ?? 0) > 0 || (b.ratings_count ?? 0) > 0)
  );

  return (
    <div className="py-4">
      {!configured && (
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Backend Firebase belum dikonfigurasi di .env.local</p>
          <p className="text-xs text-amber-800">
            Pencarian OpenLibrary lewat Katalog sudah siap, sedangkan koleksi dan transaksi
            Firestore akan aktif setelah variabel <code>NEXT_PUBLIC_FIREBASE_*</code> diisi.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-10">
          <div>
            <div className="h-7 w-52 bg-paper rounded mb-5 animate-pulse" />
            <SkeletonCards count={4} />
          </div>
          <div>
            <div className="h-7 w-48 bg-paper rounded mb-5 animate-pulse" />
            <SkeletonCards count={4} />
          </div>
        </div>
      ) : (
        <>
          {booksError ? (
            <ErrorState title="Gagal memuat katalog buku" message={booksError} onRetry={retry} />
          ) : hangat.length === 0 ? (
            <section className="mb-12">
              <div className="pb-2.5 mb-5 border-b border-warm-border">
                <h2 className="type-section text-ink">Banyak diulas</h2>
              </div>
              <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-lg p-5">
                Belum ada buku di katalog.{' '}
                <Link href="/books" className="underline font-medium text-forest-700 hover:text-forest-900">
                  Cari judul lewat OpenLibrary
                </Link>
              </p>
            </section>
          ) : (
            <HorizontalShelf title="Banyak diulas" href="/books">
              {hangat.map((b) => (
                <div key={b.id} className="w-44 md:w-52 shrink-0 snap-start">
                  <BookCard book={b} />
                </div>
              ))}
            </HorizontalShelf>
          )}

          {groups.map(({ genre, books: items }) => {
            const categoryParam = genreFilterCategory(genre);
            const href = categoryParam
              ? `/books?genre=${encodeURIComponent(categoryParam)}`
              : '/books';
            return (
              <HorizontalShelf key={genre} title={genre} href={href}>
                {items.map((b) => (
                  <div key={b.id} className="w-44 md:w-52 shrink-0 snap-start">
                    <BookCard book={b} />
                  </div>
                ))}
              </HorizontalShelf>
            );
          })}

          <section className="pb-6">
            <div className="flex items-baseline justify-between gap-3 pb-2.5 mb-5 border-b border-warm-border">
              <h2 className="type-section text-ink">Baru masuk di lapak</h2>
              <Link
                href="/marketplace"
                className="text-xs sm:text-sm font-medium text-forest-700 hover:text-forest-900 hover:underline underline-offset-4"
              >
                Lihat semua
              </Link>
            </div>

            {listingsError ? (
              <ErrorState
                title="Gagal memuat daftar buku bekas"
                message={listingsError}
                onRetry={retry}
              />
            ) : listings.length === 0 ? (
              <p className="text-stone-600 text-sm bg-white border border-warm-border rounded-lg p-5">
                Belum ada buku bekas yang dijual saat ini.{' '}
                <Link href="/jual" className="underline font-medium text-forest-700 hover:text-forest-900">
                  Pasang bukumu
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
