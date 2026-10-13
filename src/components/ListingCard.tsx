import Link from 'next/link';
import type { Listing } from '@/lib/api';

const CONDITION_BADGE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-700',
  like_new: 'bg-forest-700/10 text-forest-700',
  good: 'bg-lime-100 text-lime-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
};

const CARD =
  'bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-forest-500 overflow-hidden group flex flex-col h-full';

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className={CARD}>
      {listing.book.cover_url ? (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={listing.book.cover_url}
            alt={listing.book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-forest-900/5 flex items-center justify-center text-forest-900 font-serif px-4 text-center">
          {listing.book.title}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif font-bold text-forest-900 leading-snug mb-1 line-clamp-2">{listing.book.title}</h3>
        <span className={`self-start text-xs px-2 py-0.5 rounded-full mb-2 ${CONDITION_BADGE[listing.condition] ?? 'bg-stone-100 text-stone-600'}`}>
          {listing.condition_label ?? listing.condition}
        </span>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-lg text-forest-900">
            {listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}
          </span>
          <span className="text-xs text-gray-500">{listing.location_city}</span>
        </div>
      </div>
    </Link>
  );
}
