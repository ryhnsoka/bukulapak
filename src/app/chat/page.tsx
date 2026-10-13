'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Conversation } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ChatList() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.getConversations(token).then((res) => setItems(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Login untuk Chat</h1>
        <Link href="/login" className="inline-block bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-serif mb-6">Chat</h1>
      {loading ? (
        <p className="text-stone-500">Memuat…</p>
      ) : items.length === 0 ? (
        <p className="text-stone-500">Belum ada percakapan. Buka listing dan klik “Chat Penjual”.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} className="bg-white border rounded-xl p-4 hover:shadow transition">
              <p className="font-bold text-sm">{c.listing.book.title}</p>
              <p className="text-xs text-stone-500">dengan {c.other_party.name}</p>
              {c.last_message && <p className="text-sm text-stone-600 mt-1 line-clamp-1">{c.last_message.content}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


