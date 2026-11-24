'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackSearch } from '@/lib/analytics';

const QUICK_SUGGESTIONS = ['Laut Bercerita', 'Bumi Manusia', 'Filosofi Teras', 'Laskar Pelangi'];

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const inputId = useId();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    trackSearch(term, 'home');
    router.push(`/books?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Cari judul buku, penulis, atau ISBN
        </label>
        <input
          id={inputId}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari judul, penulis, atau ISBN…"
          className="flex-1 min-w-0 bg-white border border-input-border rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-stone-500"
        />
        <button
          type="submit"
          className="bg-forest-700 text-cream px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors cursor-pointer shrink-0"
        >
          Cari
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-stone-600">
        <span>Sering dicari:</span>
        {QUICK_SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              trackSearch(term, 'home');
              router.push(`/books?q=${encodeURIComponent(term)}`);
            }}
            className="hover:text-forest-800 underline decoration-warm-border hover:decoration-forest-700 underline-offset-4 transition-colors cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
