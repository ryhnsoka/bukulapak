'use client';

import { useState } from 'react';
import Link from 'next/link';
import Stars from './Stars';
import { ConfirmDialog, ReportDialog } from './Dialogs';
import { useToast } from './ToastProvider';
import { api, type Review } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ReviewCard({
  review,
  initialLiked = false,
  onDeleted,
}: {
  review: Review;
  initialLiked?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [likeOverride, setLikeOverride] = useState<{ liked: boolean; likes: number } | null>(null);
  const [liking, setLiking] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const liked = likeOverride ? likeOverride.liked : initialLiked;
  const likes = likeOverride ? likeOverride.likes : review.likes_count;

  async function toggleLike() {
    if (!token || liking) return;
    setLiking(true);
    const prev = likeOverride;
    setLikeOverride({
      liked: !liked,
      likes: liked ? Math.max(0, likes - 1) : likes + 1,
    });
    try {
      const res = await api.toggleReviewLike(review.id, token);
      setLikeOverride({ liked: res.data.liked, likes: res.data.likes_count });
    } catch {
      setLikeOverride(prev);
      showToast('Gagal memperbarui tanda suka.', 'error');
    } finally {
      setLiking(false);
    }
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    if (!token) return;
    try {
      await api.deleteReview(review.id, token);
      showToast('Ulasan dihapus.', 'success');
      onDeleted?.(review.id);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus ulasan.', 'error');
    }
  }

  async function handleSubmitReport(category: string, reason: string) {
    if (!token) return;
    try {
      const res = await api.reportContent(
        { reportable_type: 'review', reportable_id: review.id, category, reason },
        token
      );
      setReported(true);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim laporan.', 'error');
    }
  }

  return (
    <>
      <article className="bg-white rounded-lg border border-warm-border transition-colors duration-150 hover:border-stone-400 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-semibold shrink-0"
              aria-hidden="true"
            >
              {(review.user?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {review.user?.name ?? 'Pembaca'}
              </p>
              <p className="text-xs text-stone-600 tabular-nums">
                {new Date(review.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          <Stars value={review.rating} size="sm" />
        </div>

        {review.title && (
          <h3 className="type-card-title text-base text-ink mb-1.5">{review.title}</h3>
        )}

        <div className="flex gap-3 mb-4 flex-1">
          {review.book && (
            <Link href={`/books/${review.book.id}`} className="shrink-0">
              {review.book.cover_url ? (
                <img
                  src={review.book.cover_url}
                  alt={review.book.title}
                  className="w-14 h-20 object-cover rounded-sm border border-warm-border"
                />
              ) : (
                <div className="w-14 h-20 bg-paper border border-warm-border rounded-sm flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center">
                  {review.book.title}
                </div>
              )}
            </Link>
          )}

          {review.is_spoiler && !showSpoiler ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 flex-1">
              Ulasan ini memuat bocoran cerita.{' '}
              <button
                type="button"
                onClick={() => setShowSpoiler(true)}
                className="underline font-medium cursor-pointer"
              >
                Buka isi ulasan
              </button>
            </div>
          ) : (
            <p className="type-prose text-sm text-stone-700">{review.content}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs pt-3 border-t border-warm-border/75">
          {review.book && (
            <Link
              href={`/books/${review.book.id}`}
              className="text-forest-700 underline font-medium truncate"
            >
              {review.book.title}
            </Link>
          )}
          <span className="flex-1" />
          {user && user.id !== review.user_id && !reported && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-stone-600 hover:text-red-700 underline cursor-pointer"
            >
              Laporkan
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={toggleLike}
              disabled={liking}
              className={`px-3 py-1 rounded-md border tabular-nums transition-colors cursor-pointer ${
                liked
                  ? 'bg-forest-50 border-forest-700 text-forest-900 font-medium'
                  : 'border-warm-border text-stone-700 hover:bg-paper'
              }`}
            >
              ♥ {likes}
            </button>
          ) : (
            <span className="text-stone-600 tabular-nums">♥ {likes}</span>
          )}
          {user?.id === review.user_id && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-red-700 font-medium hover:underline cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus ulasan"
        message="Hapus ulasan ini secara permanen? Nilai rata-rata buku akan dihitung ulang."
        confirmLabel="Ya, hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <ReportDialog
        open={reportOpen}
        targetLabel={`Ulasan oleh ${review.user?.name ?? 'pembaca'}`}
        onSubmit={handleSubmitReport}
        onCancel={() => setReportOpen(false)}
      />
    </>
  );
}
