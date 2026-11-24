'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { trackContactSeller } from '@/lib/analytics';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from './ToastProvider';

export default function ChatButton({
  listingId,
  sellerId,
  compact = false,
}: {
  listingId: string;
  sellerId: string;
  compact?: boolean;
}) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
        className="block text-center bg-forest-700 text-cream px-5 py-3 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
      >
        Masuk untuk chat penjual
      </Link>
    );
  }

  if (user.id === sellerId) {
    if (compact) return null;
    return (
      <p className="text-sm text-stone-600 bg-paper border border-warm-border rounded-lg p-4">
        Ini buku yang sedang kamu jual.
      </p>
    );
  }

  async function start() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.createConversation(listingId, token);
      trackContactSeller('in_app_chat', listingId);
      router.push(`/chat/${res.data.conversation.id}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membuka obrolan.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading}
      className={
        compact
          ? 'inline-flex items-center justify-center gap-1.5 border border-forest-700 text-forest-900 bg-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-forest-50 transition-colors disabled:opacity-50 cursor-pointer'
          : 'w-full inline-flex items-center justify-center gap-2 border border-forest-700 text-forest-900 bg-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-forest-50 transition-colors disabled:opacity-50 cursor-pointer'
      }
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span>{loading ? 'Membuka obrolan…' : compact ? 'Chat' : 'Chat penjual'}</span>
    </button>
  );
}
