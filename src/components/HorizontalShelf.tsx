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
      <div className="flex items-baseline justify-between gap-3 pb-2.5 mb-5 border-b border-warm-border">
        <h2 className="type-section text-ink">{title}</h2>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-280)}
            aria-label={`Geser ${title} ke kiri`}
            className="hidden sm:inline-flex w-7 h-7 rounded-md bg-white border border-warm-border text-stone-700 hover:border-stone-400 hover:text-ink items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(280)}
            aria-label={`Geser ${title} ke kanan`}
            className="hidden sm:inline-flex w-7 h-7 rounded-md bg-white border border-warm-border text-stone-700 hover:border-stone-400 hover:text-ink items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <Link
            href={href}
            className="text-xs sm:text-sm font-medium text-forest-700 hover:text-forest-900 hover:underline underline-offset-4 ml-1"
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
