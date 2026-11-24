'use client';

import Link from 'next/link';
import { BookCoverImage } from './BookCoverFallback';
import Stars from './Stars';
import type { Book } from '@/lib/api';

const CARD =
  'bg-white rounded-lg border border-warm-border transition-colors duration-150 hover:border-stone-400 overflow-hidden flex flex-col h-full group';

export default function BookCard({ book }: { book: Book }) {
  const sellersCount = book.active_listings_count ?? 0;
  const minPrice = book.min_price;
  const subtitle = book.authors?.length
    ? book.authors.join(', ')
    : book.isbn
      ? `ISBN ${book.isbn}`
      : undefined;

  return (
    <article className={CARD}>
      <Link
        href={`/books/${book.id}`}
        className="w-full aspect-[2/3] overflow-hidden bg-paper block"
      >
        <BookCoverImage
          key={book.cover_url ?? 'none'}
          src={book.cover_url}
          alt={book.title}
          title={book.title}
          subtitle={subtitle}
          loading="lazy"
          imgClassName="w-full h-full object-cover"
        />
      </Link>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <Link
          href={`/books/${book.id}`}
          className="type-card-title text-[0.95rem] sm:text-base text-ink mb-1 line-clamp-2 group-hover:text-forest-700 group-hover:underline decoration-forest-700/40 underline-offset-2"
        >
          {book.title}
        </Link>
        <p className="text-xs text-stone-600 mb-2.5 line-clamp-1">
          {book.authors?.length
            ? book.authors.join(', ')
            : book.isbn
              ? `ISBN ${book.isbn}`
              : 'Penulis tidak tercatat'}
        </p>

        <div className="mt-auto space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs tabular-nums">
            <Stars value={book.avg_rating} size="sm" />
            <span className="text-ink font-medium">
              {book.avg_rating ? Number(book.avg_rating).toFixed(1) : '-'}
            </span>
            <span className="text-stone-600">({book.ratings_count ?? 0})</span>
          </div>

          {sellersCount > 0 && (
            <div className="pt-2.5 border-t border-warm-border/75 flex items-baseline justify-between gap-2 text-xs tabular-nums">
              <span className="text-stone-600">{sellersCount} penjual</span>
              {typeof minPrice === 'number' && (
                <span className="font-semibold text-forest-800 whitespace-nowrap">
                  {minPrice === 0 ? 'Gratis' : `Rp\u00A0${minPrice.toLocaleString('id-ID')}`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
