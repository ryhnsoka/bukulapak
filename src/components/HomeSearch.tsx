'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/books?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={submit} className="flex justify-center gap-2 mt-6 max-w-xl mx-auto">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ketik judul, penulis, atau ISBN…"
        className="flex-1 border border-gray-300 rounded-lg px-5 py-3 focus:outline-none focus:ring-2 focus:ring-forest-700 shadow-sm"
      />
      <button className="bg-forest-700 text-cream px-6 py-3 rounded-lg font-medium hover:bg-forest-900 transition shadow">
        Cari
      </button>
    </form>
  );
}
