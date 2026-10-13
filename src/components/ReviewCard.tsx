'use client';

import { useState } from 'react';
import Link from 'next/link';
import Stars from './Stars';
import { api, type Review } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ReviewCard({ review, onDeleted }: { review: Review; onDeleted?: (id: number) => void }) {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(review.likes_count);

  async function toggleLike() {
    if (!token) return;
    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!liked);
    setLikes((n) => (liked ? n - 1 : n + 1));
    try {
      const res = await api.toggleReviewLike(review.id, token);
      setLiked(res.data.liked);
      setLikes(res.data.likes_count);
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
    }
  }

  async function remove() {
    if (!token || !confirm('Hapus review ini? Rating buku akan dihitung ulang.')) return;
    try {
      await api.deleteReview(review.id, token);
      onDeleted?.(review.id);
    } catch {
      /* abaikan */
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-forest-500 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-forest-700 text-cream flex items-center justify-center font-bold">
            {(review.user?.name ?? '?').charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{review.user?.name ?? 'Pengguna'}</p>
            <p className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
        <Stars value={review.rating} size="sm" />
      </div>
      {review.title && <h3 className="font-serif font-bold text-forest-900 mb-1">{review.title}</h3>}
      <div className="flex gap-3 mb-4">
        {review.book && (
          <Link href={`/books/${review.book.id}`} className="shrink-0">
            {review.book.cover_url ? (
              <img
                src={review.book.cover_url}
                alt={review.book.title}
                className="w-14 h-20 object-cover rounded-lg shadow-sm hover:shadow transition"
              />
            ) : (
              <div className="w-14 h-20 bg-forest-900/5 rounded-lg flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center">
                {review.book.title}
              </div>
            )}
          </Link>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {review.book && (
          <Link href={`/books/${review.book.id}`} className="text-forest-700 underline font-medium">
            {review.book.title}
          </Link>
        )}
        <span className="flex-1" />
        {user ? (
          <button
            onClick={toggleLike}
            className={`px-3 py-1 rounded-full border transition ${liked ? 'bg-forest-700/5 border-forest-700 text-forest-700 font-semibold' : 'border-gray-200 text-gray-400 hover:bg-stone-100'}`}
          >
            ♥ {likes}
          </button>
        ) : (
          <span className="text-gray-400">♥ {likes}</span>
        )}
        {user?.id === review.user_id && (
          <button onClick={remove} className="text-red-600 text-xs underline">
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
