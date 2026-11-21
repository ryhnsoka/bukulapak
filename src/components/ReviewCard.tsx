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
      showToast('Review berhasil dihapus.', 'success');
      onDeleted?.(review.id);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus review.', 'error');
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
      <article className="bg-white rounded-xl shadow-sm border border-warm-border transition-all duration-200 hover:shadow-md hover:border-forest-500 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-bold shrink-0"
              aria-hidden="true"
            >
              {(review.user?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {review.user?.name ?? 'Pengguna'}
              </p>
              <p className="text-xs text-stone-500">
                {new Date(review.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          <Stars value={review.rating} size="sm" />
        </div>

        {review.title && (
          <h3 className="font-serif font-bold text-forest-900 mb-1.5">{review.title}</h3>
        )}

        <div className="flex gap-3 mb-4 flex-1">
          {review.book && (
            <Link href={`/books/${review.book.id}`} className="shrink-0">
              {review.book.cover_url ? (
                <img
                  src={review.book.cover_url}
                  alt={review.book.title}
                  className="w-14 h-20 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-14 h-20 bg-forest-50 border border-warm-border rounded-lg flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center">
                  {review.book.title}
                </div>
              )}
            </Link>
          )}

          {review.is_spoiler && !showSpoiler ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex-1">
              Review ini ditandai mengandung spoiler.{' '}
              <button
                type="button"
                onClick={() => setShowSpoiler(true)}
                className="underline font-semibold cursor-pointer"
              >
                Tampilkan spoiler
              </button>
            </div>
          ) : (
            <p className="text-sm text-stone-700 leading-relaxed">{review.content}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs pt-3 border-t border-stone-100">
          {review.book && (
            <Link
              href={`/books/${review.book.id}`}
              className="text-forest-700 underline font-semibold truncate"
            >
              {review.book.title}
            </Link>
          )}
          <span className="flex-1" />
          {user && user.id !== review.user_id && !reported && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-stone-500 hover:text-red-700 underline cursor-pointer"
            >
              Laporkan
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={toggleLike}
              disabled={liking}
              className={`px-3 py-1 rounded-full border transition cursor-pointer ${
                liked
                  ? 'bg-forest-50 border-forest-700 text-forest-900 font-semibold'
                  : 'border-stone-300 text-stone-600 hover:bg-stone-100'
              }`}
            >
              ♥ {likes}
            </button>
          ) : (
            <span className="text-stone-500">♥ {likes}</span>
          )}
          {user?.id === review.user_id && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-red-700 font-semibold hover:underline cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Review"
        message="Hapus review ini secara permanen? Rating rata-rata buku akan dihitung ulang."
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <ReportDialog
        open={reportOpen}
        targetLabel={`Review oleh ${review.user?.name ?? 'pengguna'}`}
        onSubmit={handleSubmitReport}
        onCancel={() => setReportOpen(false)}
      />
    </>
  );
}
