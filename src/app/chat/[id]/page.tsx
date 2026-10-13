'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, type Message } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const [id, setId] = useState<number | null>(null);
  const [messages, setMessages] = useState<(Message & { pending?: boolean })[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setId(Number(p.id)));
  }, [params]);

  async function load() {
    if (!token || id === null) return;
    try {
      const res = await api.getMessages(id, token);
      setMessages([...res.data.data].reverse());
    } catch {
      /* abaikan */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [token, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !token || id === null || !user) return;
    const content = text.trim();
    setText('');
    const tempId = -Date.now();
    setMessages((v) => [
      ...v,
      {
        id: tempId,
        conversation_id: id,
        user_id: user.id,
        content,
        read_at: null,
        created_at: new Date().toISOString(),
        user,
        pending: true,
      },
    ]);
    try {
      await api.sendMessage(id, content, token);
      load();
    } catch {
      setMessages((v) => v.filter((m) => m.id !== tempId));
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Login untuk Chat</h1>
        <Link href="/login" className="inline-block bg-forest-700 text-white px-6 py-3 rounded-full hover:bg-forest-900 transition">Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col h-[80vh]">
      <Link href="/chat" className="text-sm text-stone-500 underline mb-4">← Semua chat</Link>
      <div className="flex-1 overflow-auto bg-white border rounded-xl p-4 flex flex-col gap-2 mb-3">
        {loading ? (
          <p className="text-stone-500 text-sm">Memuat…</p>
        ) : messages.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">Belum ada pesan. Kirim pesan pertama untuk bertanya tentang kondisi buku ini.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                m.user_id === user.id
                  ? 'self-end bg-forest-700 text-cream rounded-br-sm'
                  : 'self-start bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              } ${m.pending ? 'opacity-70' : ''}`}
            >
              <p>
                {m.content} {m.pending && <span className="text-xs">🕐</span>}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis pesan…" className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-forest-700" />
        <button className="bg-forest-700 text-white px-5 py-2 rounded-full hover:bg-forest-900 transition">Kirim</button>
      </form>
      <p className="text-xs text-stone-400 mt-2">Transaksi dilakukan manual (transfer/COD) di luar platform.</p>
    </div>
  );
}

