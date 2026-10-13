import Link from 'next/link';
import { notFound } from 'next/navigation';
import OrderBox from '@/components/OrderBox';
import { api } from '@/lib/api';

export const instant = false;

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let listing;
  try {
    const res = await api.getListing(Number(id));
    listing = res.data.listing;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href={`/books/${listing.book_id}#jual`} className="text-sm text-stone-500 underline mb-4 inline-block">
        ← Kembali ke penjual lain
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {listing.images && listing.images.length > 0 ? (
            <div>
              <img src={listing.images[0]} alt={listing.book.title} className="w-full rounded-xl shadow mb-3" />
              {listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1).map((src, i) => (
                    <img key={i} src={src} alt={`Foto ${i + 2}`} className="w-full aspect-square object-cover rounded-lg border" />
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">📷 Foto asli dari penjual</p>
            </div>
          ) : listing.book.cover_url ? (
            <img src={listing.book.cover_url} alt={listing.book.title} className="w-full rounded-xl shadow" />
          ) : (
            <div className="w-full aspect-[2/3] bg-forest-700/5 rounded-xl flex items-center justify-center text-forest-700 font-serif text-xl px-6 text-center">
              {listing.book.title}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold font-serif mb-1">{listing.book.title}</h1>
          <p className="text-stone-600 mb-4">{listing.book.authors?.join(', ')}</p>
          <p className="text-3xl font-bold text-forest-900 mb-4">
            {listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`}
          </p>
          <dl className="text-sm flex flex-col gap-2 mb-6">
            <div className="flex gap-2"><dt className="text-stone-500 w-24">Kondisi</dt><dd className="font-semibold">{listing.condition_label ?? listing.condition}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-24">Lokasi</dt><dd className="font-semibold">{listing.location_city}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-24">Penjual</dt><dd className="font-semibold">{listing.user.name}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-24">Status</dt><dd className="font-semibold">{listing.status === 'active' ? 'Tersedia' : listing.status}</dd></div>
          </dl>
          {listing.description && <p className="text-stone-700 mb-6">{listing.description}</p>}
          <OrderBox listing={listing} />
        </div>
      </div>
    </div>
  );
}

