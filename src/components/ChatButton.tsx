'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ChatButton({ listingId, sellerId, compact = false }: { listingId: number; sellerId: number; compact?: boolean }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    if (compact) {
      return (
        <Link
          href="/login"
          className="flex-1 text-center border border-forest-700 text-forest-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-700 hover:text-cream transition"
        >
          Login
        </Link>
      );
    }
    return (
      <Link href="/login" className="block text-center bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">
        Login untuk Chat Penjual
      </Link>
    );
  }
  if (user.id === sellerId) {
    return <p className="text-sm text-stone-500 bg-stone-100 rounded-xl p-4">Ini listing milikmu.</p>;
  }

  async function start() {
    setLoading(true);
    try {
      const res = await api.createConversation(listingId, token!);
      router.push(`/chat/${res.data.conversation.id}`);
    } catch (err: any) {
      alert(err.message ?? 'Gagal memulai chat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className={
        compact
          ? 'flex-1 border border-forest-700 text-forest-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-700 hover:text-cream transition disabled:opacity-50'
          : 'w-full bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition disabled:opacity-50'
      }
    >
      {loading ? 'Membuka chat…' : compact ? '💬 Chat' : 'Chat Penjual'}
    </button>
  );
}


