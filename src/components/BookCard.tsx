import Link from 'next/link';
import Stars from './Stars';
import type { Book } from '@/lib/api';

const CARD =
  'bg-white rounded-xl shadow-sm border border-warm-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-forest-500 overflow-hidden flex flex-col h-full';

export default function BookCard({ book }: { book: Book }) {
  const sellersCount = book.active_listings_count ?? 0;
  const minPrice = book.min_price;

  return (
    <article className={CARD}>
      <Link
        href={`/books/${book.id}`}
        className="w-full aspect-[2/3] overflow-hidden bg-stone-100 block group"
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-forest-50 flex flex-col items-center justify-center px-4 text-center border-b border-warm-border">
            <span className="text-xs uppercase tracking-wider text-forest-700 font-semibold mb-1.5">
              BukuLapak
            </span>
            <p className="font-serif font-bold text-forest-900 line-clamp-3 text-sm sm:text-base">
              {book.title}
            </p>
          </div>
        )}
      </Link>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <Link
          href={`/books/${book.id}`}
          className="font-serif font-bold text-sm sm:text-base text-forest-900 leading-snug mb-1 line-clamp-2 hover:underline"
        >
          {book.title}
        </Link>
        <p className="text-xs text-stone-600 mb-2 line-clamp-1">
          {book.authors?.length
            ? book.authors.join(', ')
            : book.isbn
              ? `ISBN ${book.isbn}`
              : 'Penulis tidak diketahui'}
        </p>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-1 text-xs">
            <Stars value={book.avg_rating} size="sm" />
            <span className="text-stone-700 font-medium">
              {book.avg_rating ? Number(book.avg_rating).toFixed(1) : '—'}
            </span>
            <span className="text-stone-500">({book.ratings_count ?? 0})</span>
          </div>

          {sellersCount > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-50 text-forest-900">
                {sellersCount} penjual
                {typeof minPrice === 'number'
                  ? ` • ${minPrice === 0 ? 'Gratis' : `mulai Rp ${minPrice.toLocaleString('id-ID')}`}`
                  : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
