'use client';

import Link from 'next/link';
import { BookCoverImage } from './BookCoverFallback';
import type { Listing } from '@/lib/api';
import { LISTING_STATUS_META } from '@/lib/conditions';

const CONDITION_BADGE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800',
  like_new: 'bg-forest-100 text-forest-900',
  good: 'bg-lime-100 text-lime-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
};

const CARD =
  'bg-white rounded-xl shadow-sm border border-warm-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-forest-500 overflow-hidden group flex flex-col h-full';

export default function ListingCard({ listing }: { listing: Listing }) {
  const realPhoto = listing.images?.[0];
  const hasRealPhoto = Boolean(realPhoto && (listing.photos_count ?? 0) > 0);
  const displayImg = realPhoto ?? listing.book.cover_url;
  const statusMeta = LISTING_STATUS_META[listing.status];
  const subtitle = listing.book.authors?.length
    ? listing.book.authors.join(', ')
    : listing.book.isbn
      ? `ISBN ${listing.book.isbn}`
      : undefined;

  return (
    <Link href={`/listings/${listing.id}`} className={CARD}>
      {hasRealPhoto ? (
        <div className="relative w-full h-56 overflow-hidden bg-stone-100">
          <BookCoverImage
            key={displayImg ?? 'none'}
            src={displayImg}
            alt={`Foto asli ${listing.book.title}`}
            title={listing.book.title}
            subtitle={subtitle}
            loading="lazy"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />

          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-900/80 text-white">
            📷 Foto Asli
          </span>

          {listing.status !== 'active' && statusMeta && (
            <span
              className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-56 overflow-hidden bg-gradient-to-b from-stone-100 to-stone-200/70 flex flex-col p-2.5">
          <div className="flex items-center justify-between gap-1.5 shrink-0 mb-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
              Sampul Katalog
            </span>
            {listing.status !== 'active' && statusMeta && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <BookCoverImage
              key={displayImg ?? 'none'}
              src={displayImg}
              alt={listing.book.title}
              title={listing.book.title}
              subtitle={subtitle}
              loading="lazy"
              imgClassName="h-full w-auto max-w-full object-contain rounded shadow-md group-hover:scale-105 transition duration-300"
              fallbackClassName="h-full aspect-[2/3] rounded shadow-md"
            />
          </div>
        </div>
      )}

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <h3 className="font-serif font-bold text-sm sm:text-base text-forest-900 leading-snug mb-1.5 line-clamp-2">
          {listing.book.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              CONDITION_BADGE[listing.condition] ?? 'bg-stone-100 text-stone-700'
            }`}
          >
            {listing.condition_label ?? listing.condition}
          </span>
          {listing.user?.name && (
            <span className="text-xs text-stone-500 truncate">• {listing.user.name}</span>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <span className="font-bold text-sm sm:text-base text-forest-900 whitespace-nowrap shrink-0">
            {listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}
          </span>
          <span className="text-xs text-stone-600 min-w-0 truncate">{listing.location_city}</span>
        </div>
      </div>
    </Link>
  );
}
