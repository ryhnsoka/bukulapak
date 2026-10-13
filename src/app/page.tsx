import Link from 'next/link';
import { api } from '@/lib/api';
import { groupByGenre } from '@/lib/genre';
import BookCard from '@/components/BookCard';
import ListingCard from '@/components/ListingCard';
import HomeSearch from '@/components/HomeSearch';

export const instant = false;

async function getHomeData() {
  try {
    const [popular, listings] = await Promise.all([
      api.popularBooks(50).catch(() => null),
      api.getListings({}).catch(() => null),
    ]);
    return {
      books: popular?.data.books ?? [],
      listings: listings?.data.data.slice(0, 4) ?? [],
    };
  } catch {
    return { books: [], listings: [] };
  }
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-forest-700 rounded-full" />
        <h2 className="font-serif text-2xl font-bold text-forest-900">{title}</h2>
      </div>
      <Link href={href} className="text-sm underline text-gray-500 hover:text-forest-700">
        Lihat semua
      </Link>
    </div>
  );
}

export default async function Home() {
  const { books, listings } = await getHomeData();
  const hangat = [...books].sort((a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0)).slice(0, 10);
  const groups = groupByGenre(books.filter((b) => (b.reviews_count ?? 0) > 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="text-center py-16">
        <p className="text-sm uppercase tracking-widest text-forest-700 mb-3 font-semibold">
          Review & Jual Beli Buku Bekas
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-forest-900 mb-4">
          Temukan Cerita, Bagikan Makna.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Platform komunitas pecinta buku. Baca review jujur, temukan buku incaranmu,
          atau jual koleksi lama ke sesama pembaca.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/books" className="bg-forest-700 text-cream px-6 py-3 rounded-lg font-medium hover:bg-forest-900 transition shadow">
            Cari Buku
          </Link>
          <Link href="/jual" className="border border-forest-700 text-forest-900 px-6 py-3 rounded-lg font-medium hover:bg-forest-700 hover:text-cream transition">
            Jual Bukumu
          </Link>
        </div>
        <HomeSearch />
      </header>

      <main className="py-8">
        <SectionHeader title="Sedang Hangat Diperbincangkan" href="/books" />
        {hangat.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada data buku.</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 mb-12 snap-x">
            {hangat.map((b) => (
              <div key={b.id} className="w-44 md:w-52 shrink-0 snap-start">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        )}

        {groups.map(({ genre, books: items }) => (
          <section key={genre} className="mb-12">
            <SectionHeader title={genre} href="/books" />
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
              {items.map((b) => (
                <div key={b.id} className="w-44 md:w-52 shrink-0 snap-start">
                  <BookCard book={b} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <SectionHeader title="Listing Terbaru" href="/books" />
        {listings.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada listing.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
    </div>
  );
}

