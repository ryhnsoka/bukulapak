import Link from 'next/link';
import Stars from './Stars';
import type { Book } from '@/lib/api';

const CARD =
  'bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-forest-500 overflow-hidden group flex flex-col h-full';

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className={CARD}>
      <div className="w-full aspect-[2/3] overflow-hidden bg-gray-100 relative">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-forest-900/5 flex items-center justify-center px-4 text-center">
            <p className="font-serif font-bold text-forest-900 line-clamp-3">{book.title}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-forest-900/70 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-2 p-4">
          <Link
            href={`/books/${book.id}#review`}
            className="bg-cream text-forest-900 text-sm font-semibold px-4 py-2 rounded-lg w-full text-center hover:bg-white transition"
          >
            💬 Lihat Review
          </Link>
          <Link
            href={`/books/${book.id}#jual`}
            className="border border-cream text-cream text-sm font-semibold px-4 py-2 rounded-lg w-full text-center hover:bg-cream hover:text-forest-900 transition"
          >
            🏷️ Beli Buku
          </Link>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/books/${book.id}`} className="font-serif font-bold text-forest-900 leading-tight mb-1 truncate hover:underline">
          {book.title}
        </Link>
        <p className="text-sm text-gray-500 mb-2">{book.authors?.join(', ')}</p>
        <div className="mt-auto flex items-center gap-1 text-sm">
          <Stars value={book.avg_rating} size="sm" />
          <span className="text-gray-400 text-xs ml-1">({book.ratings_count ?? 0} ulasan)</span>
        </div>
      </div>
    </div>
  );
}
