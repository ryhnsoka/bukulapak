import Link from 'next/link';
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

  return (
    <Link href={`/listings/${listing.id}`} className={CARD}>
      <div className="relative w-full h-48 overflow-hidden bg-stone-100">
        {displayImg ? (
          <img
            src={displayImg}
            alt={hasRealPhoto ? `Foto asli ${listing.book.title}` : listing.book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-forest-50 flex items-center justify-center text-forest-900 font-serif font-bold px-4 text-center text-sm">
            {listing.book.title}
          </div>
        )}

        <span
          className={`absolute top-2 left-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            hasRealPhoto
              ? 'bg-stone-900/80 text-white'
              : 'bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          {hasRealPhoto ? '📷 Foto Asli' : 'Sampul Katalog'}
        </span>

        {listing.status !== 'active' && statusMeta && (
          <span
            className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </span>
        )}
      </div>

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
          <span className="font-bold text-base sm:text-lg text-forest-900">
            {listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}
          </span>
          <span className="text-xs text-stone-600 truncate">{listing.location_city}</span>
        </div>
      </div>
    </Link>
  );
}
