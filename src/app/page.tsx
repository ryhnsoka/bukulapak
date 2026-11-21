import type { Metadata } from 'next';
import Link from 'next/link';
import HomeClient from '@/components/HomeClient';
import HomeSearch from '@/components/HomeSearch';

export const metadata: Metadata = {
  title: 'BukuLapak — Review & Jual Beli Buku Bekas',
  description:
    'Temukan cerita, baca review jujur dari sesama pembaca, dan jual-beli buku bekas langsung antarperorangan.',
};

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <header className="text-center py-12 sm:py-16">
        <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-forest-100 text-forest-900 mb-3">
          Review &amp; Jual Beli Buku Bekas
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-forest-900 mb-4">
          Temukan Cerita, Bagikan Makna.
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto mb-6 leading-relaxed">
          Platform komunitas pecinta buku. Baca review jujur, simpan daftar bacaanmu,
          atau jual koleksi lama langsung ke sesama pembaca.
        </p>

        <HomeSearch />

        <div className="flex justify-center gap-3 flex-wrap mt-6">
          <Link
            href="/marketplace"
            className="bg-forest-700 text-cream px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-900 transition shadow-sm"
          >
            Jelajahi Marketplace
          </Link>
          <Link
            href="/jual"
            className="bg-white border border-forest-700/35 text-forest-900 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-50 hover:border-forest-700 transition"
          >
            Mulai Jual Buku
          </Link>
        </div>
      </header>

      <HomeClient />
    </div>
  );
}
