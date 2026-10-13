'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ReviewForm({ bookId }: { bookId: number }) {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [hover, setHover] = useState(0);
  const [sending, setSending] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-stone-500 bg-stone-50 border rounded-xl p-4">
        <Link href="/login" className="underline font-semibold text-forest-700">Login</Link> untuk menulis review.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setError('');
    setSending(true);
    try {
      await api.createReview({ book_id: bookId, rating, title, content }, token!);
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Gagal menyimpan review');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">Review tersimpan. Refresh halaman untuk melihatnya.</p>;
  }

  return (
    <form onSubmit={submit} className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-bold">Tulis Review</h3>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            type="button"
            key={i}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            aria-label={`${i} bintang`}
            className={`text-2xl transition ${i <= (hover || rating) ? 'text-amber-500 scale-110' : 'text-stone-300'}`}
          >
            ★
          </button>
        ))}
        <span className="text-sm text-stone-500 ml-2">{hover || rating}/5</span>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul review (opsional)" className="border border-stone-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ceritakan pendapatmu tentang buku ini…" rows={4} required className="border border-stone-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={sending || content.trim() === ''} className="bg-forest-700 text-cream rounded-lg p-3 hover:bg-forest-900 transition disabled:opacity-50">
        {sending ? 'Mengirim…' : 'Kirim Review'}
      </button>
    </form>
  );
}


