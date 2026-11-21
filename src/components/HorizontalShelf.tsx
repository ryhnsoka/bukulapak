'use client';

import Link from 'next/link';
import { useRef, type ReactNode } from 'react';

export default function HorizontalShelf({
  title,
  href,
  hrefLabel = 'Lihat semua',
  children,
}: {
  title: string;
  href: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-forest-700 rounded-full" aria-hidden="true" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">{title}</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-280)}
            aria-label={`Geser ${title} ke kiri`}
            className="hidden sm:inline-flex w-8 h-8 rounded-full bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 items-center justify-center text-sm cursor-pointer transition"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollBy(280)}
            aria-label={`Geser ${title} ke kanan`}
            className="hidden sm:inline-flex w-8 h-8 rounded-full bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 items-center justify-center text-sm cursor-pointer transition"
          >
            →
          </button>
          <Link
            href={href}
            className="text-xs sm:text-sm font-semibold underline text-forest-700 hover:text-forest-900 ml-1"
          >
            {hrefLabel}
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="shelf-scroll flex gap-5 overflow-x-auto pb-4 snap-x scroll-smooth"
        >
          {children}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-4 w-10 bg-gradient-to-l from-cream to-transparent"
        />
      </div>
    </section>
  );
}
