'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { trackSubmitReview } from '@/lib/analytics';
import { api, type Review } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from './ToastProvider';

export default function ReviewForm({
  bookId,
  onSubmitted,
}: {
  bookId: string;
  onSubmitted?: (review: Review) => void;
}) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [hover, setHover] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const titleId = useId();
  const contentId = useId();
  const spoilerId = useId();

  if (!user) {
    return (
      <div className="bg-white border border-warm-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Masuk untuk menulis ulasan atau menyukai catatan pembaca lain.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/books/${bookId}#review`)}`}
          className="bg-forest-700 text-cream text-xs font-medium px-4 py-2 rounded-lg hover:bg-forest-900 transition-colors"
        >
          Masuk untuk mengulas
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending || !token) return;
    setError('');
    setSending(true);
    try {
      const res = await api.createReview(
        { book_id: bookId, rating, title: title.trim(), content: content.trim(), is_spoiler: isSpoiler },
        token
      );
      trackSubmitReview({ bookId, rating, hasSpoiler: isSpoiler });
      setTitle('');
      setContent('');
      setIsSpoiler(false);
      showToast('Ulasan tersimpan.', 'success');
      onSubmitted?.(res.data.review);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan ulasan');
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-warm-border rounded-lg p-5 flex flex-col gap-3"
    >
      <h3 className="font-sans font-semibold text-base text-ink">Tulis ulasan</h3>

      <div>
        <span className="block text-xs font-semibold text-stone-700 mb-1">Nilai buku</span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`${i} bintang`}
              className={`text-2xl leading-none px-0.5 transition cursor-pointer ${
                i <= (hover || rating) ? 'text-ochre' : 'text-stone-300'
              }`}
            >
              ★
            </button>
          ))}
          <span className="text-xs font-medium text-stone-600 ml-2 tabular-nums">
            {hover || rating}/5
          </span>
        </div>
      </div>

      <div>
        <label htmlFor={titleId} className="block text-xs font-semibold text-stone-700 mb-1">
          Judul ulasan (opsional)
        </label>
        <input
          id={titleId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Satu kalimat singkat soal buku ini…"
          className="w-full border border-input-border rounded-lg p-3 text-sm bg-white"
        />
      </div>

      <div>
        <label htmlFor={contentId} className="block text-xs font-semibold text-stone-700 mb-1">
          Isi ulasan
        </label>
        <textarea
          id={contentId}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis pendapatmu soal isi buku ini, bukan soal pengiriman atau penjual…"
          rows={4}
          required
          className="w-full border border-input-border rounded-lg p-3 text-sm bg-white"
        />
      </div>

      <label htmlFor={spoilerId} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
        <input
          id={spoilerId}
          type="checkbox"
          checked={isSpoiler}
          onChange={(e) => setIsSpoiler(e.target.checked)}
        />
        <span>Mengandung bocoran cerita (spoiler)</span>
      </label>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={sending || content.trim() === ''}
        className="bg-forest-700 text-cream rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-forest-900 transition-colors disabled:opacity-50 self-start cursor-pointer"
      >
        {sending ? 'Mengirim…' : 'Kirim ulasan'}
      </button>
    </form>
  );
}
