'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackViewListing } from '@/lib/analytics';
import { api, type ApiError, type Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getConditionSpec, LISTING_STATUS_META } from '@/lib/conditions';
import BuyViaWA from './BuyViaWA';
import ChatButton from './ChatButton';
import ErrorState from './ErrorState';
import OrderBox from './OrderBox';
import PhotoGallery from './PhotoGallery';

export default function ListingDetailClient({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [listing, setListing] = useState<Listing | null>(null);
  const [notFoundErr, setNotFoundErr] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const trackedListingIdRef = useRef<string | null>(null);

  const currentKey = `${listingId}:${refreshTick}`;
  const loading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;
    api
      .getListing(listingId)
      .then((res) => {
        if (cancelled) return;
        setListing(res.data.listing);
        setNotFoundErr(false);
        setFetchError(null);
        setLoadedKey(currentKey);
        if (trackedListingIdRef.current !== res.data.listing.id) {
          trackedListingIdRef.current = res.data.listing.id;
          trackViewListing({
            id: res.data.listing.id,
            book_id: res.data.listing.book_id,
            title: res.data.listing.book.title,
            price: res.data.listing.price,
            condition: res.data.listing.condition,
          });
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
          setFetchError(apiErr?.message ?? 'Gagal memuat detail listing.');
        }
        setLoadedKey(currentKey);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, currentKey]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 w-48 bg-stone-200 rounded mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-stone-200 rounded" />
            <div className="h-10 w-1/2 bg-stone-200 rounded" />
            <div className="h-32 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFoundErr) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="type-page-title text-ink mb-2">Halaman lapak tidak ditemukan</h1>
        <p className="text-sm text-stone-600 mb-6">
          Buku ini mungkin sudah terjual, disembunyikan, atau dihapus penjual.
        </p>
        <Link
          href="/marketplace"
          className="inline-block bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
        >
          Kembali ke Marketplace
        </Link>
      </div>
    );
  }

  if (fetchError || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/marketplace" className="text-sm text-stone-600 underline mb-4 inline-block">
          Kembali ke Marketplace
        </Link>
        <ErrorState
          title="Gagal memuat detail lapak"
          message={fetchError ?? undefined}
          onRetry={() => setRefreshTick((n) => n + 1)}
        />
      </div>
    );
  }

  const condSpec = getConditionSpec(listing.condition);
  const statusMeta = LISTING_STATUS_META[listing.status] ?? {
    label: listing.status_label ?? listing.status,
    badgeClass: 'bg-stone-100 text-stone-700',
  };
  const realImages = (listing.photos_count ?? 0) > 0 && listing.images ? listing.images : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-stone-600 mb-5 flex flex-wrap items-center gap-1.5"
      >
        <Link href="/marketplace" className="underline hover:text-ink">
          Marketplace
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/books/${listing.book_id}`} className="underline hover:text-ink">
          {listing.book.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink">Lapak</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <PhotoGallery
            images={realImages}
            fallbackCover={listing.book.cover_url ?? listing.images?.[0] ?? null}
            title={listing.book.title}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-sm ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>
            {listing.edition_note && (
              <span className="text-xs bg-white border border-warm-border text-stone-700 px-2.5 py-0.5 rounded-sm">
                {listing.edition_note}
              </span>
            )}
          </div>

          <h1 className="type-book-title text-ink mb-1">{listing.book.title}</h1>
          <p className="text-stone-600 text-sm mb-3">
            {listing.book.authors?.length ? listing.book.authors.join(', ') : 'Buku bekas pembaca'}
            {listing.book.isbn ? (
              <>
                {' • '}
                <span className="font-mono text-xs tabular-nums">ISBN {listing.book.isbn}</span>
              </>
            ) : null}
          </p>

          <p className="text-2xl font-semibold text-forest-700 tabular-nums mb-5">
            {listing.price === 0 ? 'Gratis' : `Rp\u00A0${listing.price.toLocaleString('id-ID')}`}
          </p>

          <div className="bg-white border border-warm-border rounded-lg divide-y divide-warm-border mb-5">
            <div className="p-4 flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-semibold shrink-0"
                aria-hidden="true"
              >
                {listing.user.name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{listing.user.name}</p>
                <p className="text-xs text-stone-600 tabular-nums">
                  {typeof listing.user.seller_rating_avg === 'number' ? (
                    <>
                      <span className="font-semibold text-amber-800">
                        ★ {listing.user.seller_rating_avg.toFixed(1)}
                      </span>{' '}
                      ({listing.user.seller_rating_count ?? 0} ulasan transaksi) •{' '}
                    </>
                  ) : (
                    'Penjual baru • '
                  )}
                  {listing.user.listings_count ?? 1} buku di lapak
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-sm bg-paper text-stone-700 font-medium">
                {listing.location_city}
              </span>
            </div>

            <dl className="p-4 text-sm flex flex-col gap-2">
              <div className="flex gap-2">
                <dt className="text-stone-600 w-24 shrink-0">Kondisi</dt>
                <dd className="font-medium text-ink">
                  {listing.condition_label ?? listing.condition}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-stone-600 w-24 shrink-0">Lokasi</dt>
                <dd className="font-medium text-ink">{listing.location_city}</dd>
              </div>
              {listing.book.isbn && (
                <div className="flex gap-2">
                  <dt className="text-stone-600 w-24 shrink-0">ISBN</dt>
                  <dd className="font-mono text-xs pt-0.5 text-ink tabular-nums">
                    {listing.book.isbn}
                  </dd>
                </div>
              )}
            </dl>

            {condSpec && (
              <details className="p-3.5 text-xs text-stone-700">
                <summary className="cursor-pointer font-medium text-ink">
                  Panduan kondisi &ldquo;{condSpec.label}&rdquo;: {condSpec.summary}
                </summary>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {condSpec.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {listing.description && (
            <div className="mb-5">
              <h2 className="text-xs font-semibold text-stone-600 mb-1.5">Catatan penjual</h2>
              <p className="type-prose text-stone-700 text-sm">{listing.description}</p>
            </div>
          )}

          {listing.status !== 'active' ? (
            <div className="bg-paper border border-warm-border rounded-lg p-4 text-sm text-stone-700">
              Buku ini berstatus <strong>{statusMeta.label}</strong> dan sedang tidak bisa dipesan.{' '}
              <Link
                href={`/books/${listing.book_id}#jual`}
                className="underline text-forest-700 font-medium"
              >
                Cek penjual lain
              </Link>
            </div>
          ) : !user ? (
            <div className="bg-white border border-warm-border rounded-lg p-5">
              <p className="font-semibold text-sm text-ink mb-1">
                Ingin bertanya soal kondisi atau langsung pesan?
              </p>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Masuk dulu untuk mengirim pesan ke penjual atau membuat pesanan.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`}
                className="block w-full text-center bg-forest-700 text-cream py-3 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
              >
                Masuk untuk chat dan pesan
              </Link>
            </div>
          ) : user.id === listing.user_id ? (
            <div className="bg-paper border border-warm-border rounded-lg p-4 text-sm text-stone-700">
              Ini buku yang sedang kamu jual. Kelola statusnya di{' '}
              <Link href="/profil" className="underline font-medium text-forest-700">
                Profil
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2.5">
                <div className="flex-1">
                  <ChatButton listingId={listing.id} sellerId={listing.user_id} />
                </div>
                {listing.wa_number && <BuyViaWA listing={listing} />}
              </div>
              <OrderBox
                listing={listing}
                onOrdered={() => {
                  setListing((prev) =>
                    prev ? { ...prev, status: 'reserved', status_label: 'Dipesan' } : prev
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
