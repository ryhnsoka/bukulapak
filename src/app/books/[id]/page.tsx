import Link from 'next/link';
import { notFound } from 'next/navigation';
import Stars from '@/components/Stars';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import BuyViaWA from '@/components/BuyViaWA';
import ChatButton from '@/components/ChatButton';
import { api } from '@/lib/api';

export const instant = false;

export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let book;
  try {
    const res = await api.getBook(Number(id));
    book = res.data.book;
  } catch {
    notFound();
  }

  const reviews = book.reviews ?? [];
  const sellers = (book.listings ?? [])
    .filter((l) => l.status === 'active')
    .map((l) => ({ ...l, book }))
    .sort((a, b) => a.price - b.price);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/books" className="text-sm text-gray-500 underline mb-6 inline-block">
        ← Kembali ke pencarian
      </Link>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div>
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full rounded-xl shadow-lg" />
          ) : (
            <div className="w-full aspect-[2/3] bg-forest-900/5 rounded-xl flex items-center justify-center text-forest-900 font-serif text-xl px-6 text-center">
              {book.title}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <h1 className="font-serif text-4xl text-forest-900 font-bold mb-1">{book.title}</h1>
          <p className="text-gray-600 mb-2">{book.authors?.join(', ')}</p>
          <div className="flex items-center gap-2 mb-4">
            <Stars value={book.avg_rating} />
            <span className="text-sm text-gray-500">
              {book.avg_rating ? `${Number(book.avg_rating).toFixed(1)}/5` : 'Belum ada rating'} ({book.ratings_count ?? 0} review)
            </span>
          </div>
          {book.publisher && <p className="text-sm text-gray-500">Penerbit: {book.publisher}</p>}
          {book.published_date && <p className="text-sm text-gray-500 mb-3">Terbit: {book.published_date}</p>}
          {book.description && <p className="text-gray-700 leading-relaxed">{book.description}</p>}
          <div className="flex gap-3 mt-5">
            <a href="#review" className="bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition shadow">
              💬 Lihat Review
            </a>
            <a href="#jual" className="border border-forest-700 text-forest-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-700 hover:text-cream transition">
              🏷️ Beli Buku ({sellers.length})
            </a>
          </div>
        </div>
      </div>

      <section id="jual" className="bg-[#f4efe0] rounded-2xl p-6 mb-8 scroll-mt-24">
        <h2 className="font-serif text-2xl font-bold text-forest-900 mb-1">
          Dijual oleh {sellers.length} penjual
        </h2>
        <p className="text-sm text-gray-500 mb-4">Bandingkan harga & kondisi, lalu hubungi via WhatsApp.</p>
        {sellers.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada yang menjual buku ini. <Link href="/jual" className="underline text-forest-700">Jual bukumu →</Link></p>
        ) : (
          <div className="flex flex-col gap-3">
            {sellers.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center gap-4">
                {(l.images?.[0] ?? l.book.cover_url) ? (
                  <img
                    src={l.images?.[0] ?? l.book.cover_url ?? ''}
                    alt={l.book.title}
                    className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-20 bg-forest-900/5 rounded-lg flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center shrink-0">
                    {l.book.title}
                  </div>
                )}
                <span className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-bold shrink-0">
                  {l.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-40">
                  <p className="font-semibold text-sm">{l.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {l.condition_label ?? l.condition} • {l.location_city}
                  </p>
                </div>
                <p className="font-bold text-lg text-forest-900">
                  {l.price === 0 ? 'Gratis' : `Rp ${l.price.toLocaleString('id-ID')}`}
                </p>
                <div className="w-full sm:w-auto flex sm:flex-col gap-2">
                  <Link
                    href={`/listings/${l.id}`}
                    className="flex-1 text-center bg-forest-700 text-cream text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-900 transition shadow"
                  >
                    Pesan
                  </Link>
                  <div className="flex-1 flex gap-2">
                    <ChatButton listingId={l.id} sellerId={l.user_id} compact />
                    <BuyViaWA listing={l} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="review" className="bg-[#f4efe0] rounded-2xl p-6 scroll-mt-24">
        <h2 className="font-serif text-2xl font-bold text-forest-900 mb-4">Review ({reviews.length})</h2>
        <ReviewForm bookId={book.id} />
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {reviews.map((r) => <ReviewCard key={r.id} review={{ ...r, book }} />)}
        </div>
        {reviews.length === 0 && <p className="text-gray-500 text-sm mt-4">Belum ada review. Jadilah yang pertama!</p>}
      </section>
    </div>
  );
}
