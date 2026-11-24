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
  'bg-white rounded-lg border border-warm-border transition-colors duration-150 hover:border-stone-400 overflow-hidden group flex flex-col h-full';

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
        <div className="relative w-full aspect-[4/4.2] overflow-hidden bg-paper">
          <BookCoverImage
            key={displayImg ?? 'none'}
            src={displayImg}
            alt={`Foto asli ${listing.book.title}`}
            title={listing.book.title}
            subtitle={subtitle}
            loading="lazy"
            imgClassName="w-full h-full object-cover"
          />

          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm bg-stone-900/85 text-cream">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M3 9a2 2 0 012-2h2l1.5-2h7L17 7h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <circle cx="12" cy="13" r="3" strokeWidth="1.75" />
            </svg>
            <span>Foto asli</span>
          </span>

          {listing.status !== 'active' && statusMeta && (
            <span
              className={`absolute top-2 right-2 text-[11px] font-medium px-2 py-0.5 rounded-sm ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          )}
        </div>
      ) : (
        <div className="w-full bg-paper flex flex-col">
          <div className="flex items-center justify-between gap-1.5 px-2.5 pt-2">
            <span className="text-[11px] font-medium text-stone-600">Sampul katalog</span>
            {listing.status !== 'active' && statusMeta && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
            )}
          </div>
          <div className="w-full aspect-[5/4] p-2.5 flex items-center justify-center">
            <BookCoverImage
              key={displayImg ?? 'none'}
              src={displayImg}
              alt={listing.book.title}
              title={listing.book.title}
              subtitle={subtitle}
              loading="lazy"
              imgClassName="h-full w-auto max-w-full object-contain rounded-[2px] shadow-sm"
              fallbackClassName="h-full aspect-[2/3] rounded-[2px] shadow-sm"
            />
          </div>
        </div>
      )}

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <h3 className="type-card-title text-[0.95rem] sm:text-base text-ink mb-1.5 line-clamp-2 group-hover:text-forest-700 group-hover:underline decoration-forest-700/40 underline-offset-2">
          {listing.book.title}
        </h3>

        <div className="mb-2.5">
          <span
            className={`inline-block w-fit text-[11px] font-medium px-2 py-0.5 rounded-sm ${
              CONDITION_BADGE[listing.condition] ?? 'bg-stone-100 text-stone-700'
            }`}
          >
            {listing.condition_label ?? listing.condition}
          </span>
          {listing.user?.name && (
            <p className="text-xs text-stone-600 truncate mt-1">{listing.user.name}</p>
          )}
        </div>

        <div className="mt-auto pt-2.5 border-t border-warm-border/75 flex items-baseline justify-between gap-2">
          <span className="font-sans font-semibold text-sm sm:text-[0.95rem] text-forest-800 tabular-nums whitespace-nowrap shrink-0">
            {listing.price === 0 ? 'Gratis' : `Rp\u00A0${listing.price.toLocaleString('id-ID')}`}
          </span>
          <span className="text-xs text-stone-600 min-w-0 truncate">{listing.location_city}</span>
        </div>
      </div>
    </Link>
  );
}
