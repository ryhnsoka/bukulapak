'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';

const QUICK_SUGGESTIONS = ['Laut Bercerita', 'Bumi Manusia', 'Filosofi Teras', 'Laskar Pelangi'];

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const inputId = useId();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/books?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="max-w-xl mx-auto mt-6">
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Cari judul buku, penulis, atau ISBN
        </label>
        <input
          id={inputId}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ketik judul, penulis, atau ISBN… (cth: Laut Bercerita)"
          className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm sm:text-base shadow-sm"
        />
        <button
          type="submit"
          className="bg-forest-700 text-cream px-5 sm:px-6 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition shadow-sm cursor-pointer"
        >
          Cari Buku
        </button>
      </form>

      <div className="flex flex-wrap justify-center items-center gap-2 mt-3 text-xs">
        <span className="text-stone-500">Populer:</span>
        {QUICK_SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/books?q=${encodeURIComponent(term)}`)}
            className="px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 hover:border-forest-700 hover:text-forest-900 transition cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
