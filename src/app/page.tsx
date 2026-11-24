import type { Metadata } from 'next';
import Link from 'next/link';
import HomeClient from '@/components/HomeClient';
import HomeSearch from '@/components/HomeSearch';

export const metadata: Metadata = {
  title: { absolute: 'BukuLapak' },
  description: 'Catatan pembaca dan jual-beli buku bekas langsung antarperorangan.',
};

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <header className="py-7 sm:py-10 border-b border-warm-border mb-8">
        <div className="grid lg:grid-cols-12 lg:items-end gap-6">
          <div className="lg:col-span-7">
            <h1 className="type-display text-ink mb-3">
              Ulasan pembaca dan rak buku bekas.
            </h1>
            <p className="type-prose text-stone-600 text-[0.95rem] sm:text-base">
              Lihat catatan pembaca sebelum membeli, rapikan daftar bacaan, atau lepas buku lama
              langsung ke sesama pembaca.
            </p>
          </div>

          <div className="lg:col-span-5">
            <HomeSearch />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-sm">
              <Link
                href="/marketplace"
                className="font-medium text-forest-700 hover:text-forest-900 underline decoration-forest-700/35 underline-offset-4 transition-colors"
              >
                Buka Marketplace
              </Link>
              <Link
                href="/jual"
                className="font-medium text-stone-700 hover:text-ink underline decoration-warm-border underline-offset-4 transition-colors"
              >
                Jual buku bekas
              </Link>
            </div>
          </div>
        </div>
      </header>

      <HomeClient />
    </div>
  );
}
