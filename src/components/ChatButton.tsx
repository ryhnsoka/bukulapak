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
        className="block text-center bg-forest-700 text-cream px-5 py-3 rounded-xl text-sm font-semibold hover:bg-forest-900 transition"
      >
        Login untuk Chat Penjual
      </Link>
    );
  }

  if (user.id === sellerId) {
    if (compact) return null;
    return (
      <p className="text-sm text-stone-600 bg-stone-100 border border-stone-200 rounded-xl p-4">
        Ini listing milikmu.
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
      showToast(err instanceof Error ? err.message : 'Gagal memulai chat.', 'error');
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
          ? 'border border-forest-700 text-forest-900 bg-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-forest-50 transition disabled:opacity-50 cursor-pointer'
          : 'w-full border border-forest-700 text-forest-900 bg-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-forest-50 transition disabled:opacity-50 cursor-pointer'
      }
    >
      {loading ? 'Membuka chat…' : compact ? '💬 Chat' : '💬 Chat Penjual'}
    </button>
  );
}
