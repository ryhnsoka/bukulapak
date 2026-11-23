'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackViewBook } from '@/lib/analytics';
import { api, type ApiError, type Book, type Review } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BookDiscussions from './BookDiscussions';
import { BookCoverImage } from './BookCoverFallback';
import BuyViaWA from './BuyViaWA';
import ChatButton from './ChatButton';
import ErrorState from './ErrorState';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import ShelfButton from './ShelfButton';
import Stars from './Stars';

export default function BookDetailClient({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [editions, setEditions] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [notFoundErr, setNotFoundErr] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const trackedBookIdRef = useRef<string | null>(null);

  const currentKey = `${bookId}:${refreshTick}`;
  const loading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;
    api
      .getBook(bookId)
      .then((res) => {
        if (cancelled) return;
        setBook(res.data.book);
        setEditions(res.data.editions ?? []);
        setReviews(res.data.book.reviews ?? []);
        setNotFoundErr(false);
        setFetchError(null);
        setLoadedKey(currentKey);
        if (trackedBookIdRef.current !== res.data.book.id) {
          trackedBookIdRef.current = res.data.book.id;
          trackViewBook(res.data.book);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr?.status === 404) {
          setNotFoundErr(true);
          setFetchError(null);
        } else {
          setNotFoundErr(false);
          setFetchError(apiErr?.message ?? 'Gagal memuat detail buku.');
        }
        setLoadedKey(currentKey);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, currentKey]);

  useEffect(() => {
    if (!user || reviews.length === 0) return;
    let cancelled = false;
    api
      .getUserLikedReviewIds(
        reviews.map((r) => r.id),
        user.id
      )
      .then((ids) => {
        if (!cancelled) setLikedIds(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, reviews]);

  const effectiveLikedIds = user && reviews.length > 0 ? likedIds : new Set<string>();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 w-48 bg-stone-200 rounded mb-6" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="aspect-[2/3] bg-stone-200 rounded-2xl" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-9 w-2/3 bg-stone-200 rounded" />
            <div className="h-5 w-1/3 bg-stone-200 rounded" />
            <div className="h-28 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFoundErr) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-forest-900 mb-2">Buku Tidak Ditemukan</h1>
        <p className="text-sm text-stone-600 mb-6">Data buku tidak tersedia atau sudah dihapus.</p>
        <Link
          href="/books"
          className="inline-block bg-forest-700 text-cream px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          ← Kembali ke Pencarian
        </Link>
      </div>
    );
  }

  if (fetchError || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/books" className="text-sm text-stone-600 underline mb-4 inline-block">
          ← Kembali ke pencarian
        </Link>
        <ErrorState
          title="Gagal memuat detail buku"
          message={fetchError ?? undefined}
          onRetry={() => setRefreshTick((n) => n + 1)}
        />
      </div>
    );
  }

  const sellers = (book.listings ?? [])
    .filter((l) => l.status === 'active')
    .map((l) => ({ ...l, book }))
    .sort((a, b) => a.price - b.price);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-600 mb-6 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="underline hover:text-stone-900">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/books" className="underline hover:text-stone-900">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-stone-900">{book.title}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div className="max-w-[230px] sm:max-w-[250px] mx-auto md:mx-0 w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-stone-100">
          <BookCoverImage
            key={book.cover_url ?? 'none'}
            src={book.cover_url}
            alt={book.title}
            title={book.title}
            subtitle={
              book.authors?.length
                ? book.authors.join(', ')
                : book.isbn
                  ? `ISBN ${book.isbn}`
                  : undefined
            }
            imgClassName="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-forest-900 font-bold mb-1">
            {book.title}
          </h1>
          <p className="text-stone-600 text-base mb-3">
            {book.authors?.length
              ? book.authors.join(', ')
              : book.isbn
                ? `ISBN ${book.isbn}`
                : 'Penulis tidak diketahui'}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <Stars value={book.avg_rating} />
            <span className="text-sm font-semibold text-stone-700">
              {book.avg_rating ? `${Number(book.avg_rating).toFixed(1)}/5` : 'Belum ada rating'}
            </span>
            <span className="text-sm text-stone-500">
              ({book.ratings_count ?? reviews.length} review)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-stone-700 mb-4">
            {book.publisher && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Penerbit: <strong>{book.publisher}</strong>
              </span>
            )}
            {book.published_date && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Terbit: <strong>{book.published_date}</strong>
              </span>
            )}
            {book.isbn && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                ISBN: <strong>{book.isbn}</strong>
              </span>
            )}
            {book.language && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Bahasa: <strong>{book.language.toUpperCase()}</strong>
              </span>
            )}
            {book.format && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Format: <strong>{book.format}</strong>
              </span>
            )}
            {book.edition_label && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Edisi: <strong>{book.edition_label}</strong>
              </span>
            )}
            {book.page_count && (
              <span className="bg-white border border-warm-border px-2.5 py-1 rounded-lg">
                Halaman: <strong>{book.page_count}</strong>
              </span>
            )}
          </div>

          {book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {book.categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat}
                  href={`/books?genre=${encodeURIComponent(cat)}`}
                  className="text-xs bg-forest-100 text-forest-900 px-3 py-1 rounded-full font-medium hover:bg-forest-100/75 transition"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {book.description && (
            <p className="text-stone-700 leading-relaxed mb-4">{book.description}</p>
          )}

          {editions.length > 0 && (
            <div className="mt-4 p-3.5 bg-white border border-warm-border rounded-xl mb-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                Edisi / Format Lain
              </p>
              <div className="flex flex-wrap gap-2">
                {editions.map((ed) => (
                  <Link
                    key={ed.id}
                    href={`/books/${ed.id}`}
                    className="text-xs border border-stone-300 rounded-lg px-3 py-1.5 hover:border-forest-700 hover:bg-forest-50 transition"
                  >
                    {[ed.edition_label, ed.format, ed.language?.toUpperCase(), ed.publisher]
                      .filter(Boolean)
                      .join(' • ') || ed.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <ShelfButton bookId={book.id} />
            <a
              href="#review"
              className="bg-forest-700 text-cream px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-900 transition shadow-sm"
            >
              Lihat Review ({reviews.length})
            </a>
            <a
              href="#jual"
              className="bg-white border border-forest-700/35 text-forest-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-50 transition"
            >
              Beli Bekas ({sellers.length})
            </a>
          </div>
        </div>
      </div>

      <section
        id="jual"
        className="bg-paper border border-warm-border rounded-2xl p-6 mb-8 scroll-mt-24"
      >
        <h2 className="font-serif text-2xl font-bold text-forest-900 mb-1">
          Dijual oleh {sellers.length} penjual
        </h2>
        <p className="text-sm text-stone-600 mb-4">
          Bandingkan kondisi fisik, reputasi penjual, harga, dan kota sebelum memesan.
        </p>

        {sellers.length === 0 ? (
          <p className="text-stone-600 text-sm">
            Belum ada yang menjual buku ini.{' '}
            <Link href="/jual" className="underline font-semibold text-forest-700">
              Jual bukumu →
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {sellers.map((l) => {
              const thumb = l.images?.[0] ?? l.book.cover_url;
              return (
                <div
                  key={l.id}
                  className="bg-white rounded-xl border border-warm-border p-4 flex flex-wrap items-center gap-4"
                >
                  <Link href={`/listings/${l.id}`} className="shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={l.book.title}
                        className="w-14 h-20 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-forest-50 border border-warm-border rounded-lg flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center">
                        {l.book.title}
                      </div>
                    )}
                  </Link>

                  <span
                    className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {l.user.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="flex-1 min-w-44">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-stone-900">{l.user.name}</p>
                      {typeof l.user.seller_rating_avg === 'number' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                          ★ {l.user.seller_rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {l.condition_label ?? l.condition} • {l.location_city}
                    </p>
                  </div>

                  <p className="font-bold text-lg text-forest-900">
                    {l.price === 0 ? 'Gratis' : `Rp ${l.price.toLocaleString('id-ID')}`}
                  </p>

                  {user ? (
                    <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
                      <Link
                        href={`/listings/${l.id}`}
                        className="text-center bg-forest-700 text-cream text-xs font-semibold px-4 py-2 rounded-xl hover:bg-forest-900 transition shadow-sm"
                      >
                        Pesan
                      </Link>
                      <ChatButton listingId={l.id} sellerId={l.user_id} compact />
                      <BuyViaWA listing={l} compact />
                    </div>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/listings/${l.id}`)}`}
                      className="w-full sm:w-auto text-center bg-forest-700 text-cream text-xs font-semibold px-4 py-2 rounded-xl hover:bg-forest-900 transition shadow-sm"
                    >
                      Login untuk Pesan / Chat
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="review"
        className="bg-paper border border-warm-border rounded-2xl p-6 scroll-mt-24"
      >
        <h2 className="font-serif text-2xl font-bold text-forest-900 mb-4">
          Review ({reviews.length})
        </h2>
        <ReviewForm
          bookId={book.id}
          onSubmitted={() => {
            setRefreshTick((n) => n + 1);
          }}
        />
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={{ ...r, book }}
              initialLiked={effectiveLikedIds.has(r.id)}
              onDeleted={() => {
                setRefreshTick((n) => n + 1);
              }}
            />
          ))}
        </div>
        {reviews.length === 0 && (
          <p className="text-stone-600 text-sm mt-4">Belum ada review. Jadilah yang pertama!</p>
        )}
      </section>

      <BookDiscussions bookId={book.id} />
    </div>
  );
}
