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
        <h1 className="type-page-title text-ink mb-2">Buku tidak ditemukan</h1>
        <p className="text-sm text-stone-600 mb-6">
          Halaman buku ini tidak tersedia atau sudah dihapus.
        </p>
        <Link
          href="/books"
          className="inline-block bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
        >
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  if (fetchError || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/books" className="text-sm text-stone-600 underline mb-4 inline-block">
          Kembali ke katalog
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

  const hasColophon = Boolean(
    book.publisher ||
      book.published_date ||
      book.isbn ||
      book.language ||
      book.format ||
      book.edition_label ||
      book.page_count
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-600 mb-6 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="underline hover:text-ink">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/books" className="underline hover:text-ink">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink">{book.title}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div className="max-w-[230px] sm:max-w-[250px] mx-auto md:mx-0 w-full aspect-[2/3] rounded-sm overflow-hidden shadow-md ring-1 ring-black/10 bg-paper">
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
          <h1 className="type-book-title text-ink mb-1.5">{book.title}</h1>
          <p className="text-stone-600 text-base mb-3">
            {book.authors?.length
              ? book.authors.join(', ')
              : book.isbn
                ? `ISBN ${book.isbn}`
                : 'Penulis tidak tercatat'}
          </p>

          <div className="flex items-center gap-2 mb-4 tabular-nums">
            <Stars value={book.avg_rating} />
            <span className="text-sm font-medium text-ink">
              {book.avg_rating ? `${Number(book.avg_rating).toFixed(1)}/5` : 'Belum dinilai'}
            </span>
            <span className="text-sm text-stone-600">
              ({book.ratings_count ?? reviews.length} ulasan)
            </span>
          </div>

          {hasColophon && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 py-3.5 my-4 border-y border-warm-border text-xs">
              {book.publisher && (
                <div>
                  <dt className="text-stone-600">Penerbit</dt>
                  <dd className="font-medium text-ink">{book.publisher}</dd>
                </div>
              )}
              {book.published_date && (
                <div>
                  <dt className="text-stone-600">Terbit</dt>
                  <dd className="font-medium text-ink tabular-nums">{book.published_date}</dd>
                </div>
              )}
              {book.isbn && (
                <div>
                  <dt className="text-stone-600">ISBN</dt>
                  <dd className="font-mono font-medium text-ink tabular-nums">{book.isbn}</dd>
                </div>
              )}
              {book.language && (
                <div>
                  <dt className="text-stone-600">Bahasa</dt>
                  <dd className="font-medium text-ink">{book.language.toUpperCase()}</dd>
                </div>
              )}
              {book.format && (
                <div>
                  <dt className="text-stone-600">Format</dt>
                  <dd className="font-medium text-ink">{book.format}</dd>
                </div>
              )}
              {book.edition_label && (
                <div>
                  <dt className="text-stone-600">Edisi</dt>
                  <dd className="font-medium text-ink">{book.edition_label}</dd>
                </div>
              )}
              {book.page_count && (
                <div>
                  <dt className="text-stone-600">Halaman</dt>
                  <dd className="font-mono font-medium text-ink tabular-nums">{book.page_count}</dd>
                </div>
              )}
            </dl>
          )}

          {book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {book.categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat}
                  href={`/books?genre=${encodeURIComponent(cat)}`}
                  className="text-xs bg-forest-50 border border-forest-100 text-forest-900 px-2.5 py-0.5 rounded-sm font-medium hover:border-forest-500 transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {book.description && (
            <p className="type-prose text-stone-700 text-[0.95rem] mb-5">{book.description}</p>
          )}

          {editions.length > 0 && (
            <div className="mt-4 p-3.5 bg-white border border-warm-border rounded-lg mb-4">
              <p className="text-xs font-semibold text-stone-600 mb-2">Edisi dan format lain</p>
              <div className="flex flex-wrap gap-2">
                {editions.map((ed) => (
                  <Link
                    key={ed.id}
                    href={`/books/${ed.id}`}
                    className="text-xs border border-warm-border rounded-md px-3 py-1.5 hover:border-forest-700 hover:bg-forest-50 transition-colors"
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
              className="bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
            >
              Ulasan ({reviews.length})
            </a>
            <a
              href="#jual"
              className="bg-white border border-input-border text-ink px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-paper transition-colors"
            >
              Penjual bekas ({sellers.length})
            </a>
          </div>
        </div>
      </div>

      <section
        id="jual"
        className="bg-paper/75 border border-warm-border rounded-lg p-5 sm:p-6 mb-8 scroll-mt-24"
      >
        <h2 className="type-section text-ink mb-1">
          {sellers.length > 0 ? `Tersedia dari ${sellers.length} penjual` : 'Belum ada yang menjual'}
        </h2>
        <p className="text-sm text-stone-600 mb-4">
          Cek kondisi fisik, kota penjual, dan harga sebelum memesan.
        </p>

        {sellers.length === 0 ? (
          <p className="text-stone-600 text-sm">
            Belum ada yang menjual buku ini.{' '}
            <Link href="/jual" className="underline font-medium text-forest-700 hover:text-forest-900">
              Jual bukumu
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {sellers.map((l) => {
              const thumb = l.images?.[0] ?? l.book.cover_url;
              return (
                <div
                  key={l.id}
                  className="bg-white rounded-lg border border-warm-border p-4 flex flex-wrap items-center gap-4"
                >
                  <Link href={`/listings/${l.id}`} className="shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={l.book.title}
                        className="w-14 h-20 object-cover rounded-sm border border-warm-border"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-paper border border-warm-border rounded-sm flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center">
                        {l.book.title}
                      </div>
                    )}
                  </Link>

                  <span
                    className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-semibold shrink-0"
                    aria-hidden="true"
                  >
                    {l.user.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="flex-1 min-w-44">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-ink">{l.user.name}</p>
                      {typeof l.user.seller_rating_avg === 'number' && (
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 font-medium tabular-nums">
                          ★ {l.user.seller_rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {l.condition_label ?? l.condition} • {l.location_city}
                    </p>
                  </div>

                  <p className="font-semibold text-lg text-forest-800 tabular-nums">
                    {l.price === 0 ? 'Gratis' : `Rp\u00A0${l.price.toLocaleString('id-ID')}`}
                  </p>

                  {user ? (
                    <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
                      <Link
                        href={`/listings/${l.id}`}
                        className="text-center bg-forest-700 text-cream text-xs font-medium px-4 py-2 rounded-lg hover:bg-forest-900 transition-colors"
                      >
                        Pesan
                      </Link>
                      <ChatButton listingId={l.id} sellerId={l.user_id} compact />
                      <BuyViaWA listing={l} compact />
                    </div>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/listings/${l.id}`)}`}
                      className="w-full sm:w-auto text-center bg-forest-700 text-cream text-xs font-medium px-4 py-2 rounded-lg hover:bg-forest-900 transition-colors"
                    >
                      Masuk untuk pesan atau chat
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
        className="bg-paper/75 border border-warm-border rounded-lg p-5 sm:p-6 scroll-mt-24"
      >
        <h2 className="type-section text-ink mb-4">Ulasan ({reviews.length})</h2>
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
          <p className="text-stone-600 text-sm mt-4">Belum ada ulasan untuk buku ini.</p>
        )}
      </section>

      <BookDiscussions bookId={book.id} />
    </div>
  );
}
