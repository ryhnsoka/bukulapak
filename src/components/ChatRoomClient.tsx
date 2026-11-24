'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { api, type Conversation, type Message } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from './ToastProvider';

export default function ChatRoomClient({ conversationId }: { conversationId: string }) {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<(Message & { pending?: boolean })[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const currentKey = user ? `${conversationId}:${user.id}` : '';
  const loading = !ready || (Boolean(user) && loadedKey !== currentKey);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;

    api
      .getConversation(conversationId, user.id)
      .then((res) => {
        if (active) {
          setConversation(res.data.conversation);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat percakapan.');
        }
      });

    const unsub = api.subscribeMessages(
      conversationId,
      user.id,
      (list) => {
        if (!active) return;
        setMessages(list);
        setLoadedKey(currentKey);
      },
      (err) => {
        if (!active) return;
        setError(err.message || 'Gagal menyambungkan chat real-time.');
        setLoadedKey(currentKey);
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, [conversationId, user, ready, currentKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');

    const tempId = `temp_${Date.now()}`;
    setMessages((v) => [
      ...v,
      {
        id: tempId,
        conversation_id: conversationId,
        user_id: user.id,
        content,
        read_at: null,
        created_at: new Date().toISOString(),
        user,
        pending: true,
      },
    ]);

    try {
      await api.sendMessage(conversationId, content, user.id);
    } catch (err: unknown) {
      setMessages((v) => v.filter((m) => m.id !== tempId));
      showToast(err instanceof Error ? err.message : 'Gagal mengirim pesan.', 'error');
    }
  }

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-stone-600">
        Memeriksa sesi…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="type-page-title text-ink mb-2">Masuk untuk chat</h1>
        <Link
          href={`/login?next=${encodeURIComponent(`/chat/${conversationId}`)}`}
          className="inline-block bg-forest-700 text-cream px-6 py-3 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors mt-2"
        >
          Masuk
        </Link>
      </div>
    );
  }

  const listingThumb = conversation?.listing.images?.[0] ?? conversation?.listing.book.cover_url;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100dvh-6rem)] min-h-[460px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link href="/chat" className="text-xs font-medium text-stone-600 underline hover:text-ink">
          Semua chat
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-forest-800 font-medium">
          <span className="w-2 h-2 rounded-full bg-forest-500" aria-hidden="true" />
          <span>Tersambung</span>
        </span>
      </div>

      {conversation && (
        <div className="bg-paper border border-warm-border rounded-t-lg px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {listingThumb ? (
              <img
                src={listingThumb}
                alt={conversation.listing.book.title}
                className="w-10 h-14 object-cover rounded-sm border border-warm-border shrink-0"
              />
            ) : (
              <div className="w-10 h-14 bg-white border border-warm-border rounded-sm shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink truncate">
                {conversation.other_party.name} • {conversation.listing.book.title}
              </p>
              <p className="text-xs text-stone-600 tabular-nums">
                {conversation.listing.price === 0
                  ? 'Gratis'
                  : `Rp\u00A0${conversation.listing.price.toLocaleString('id-ID')}`}{' '}
                •{' '}
                <span className="font-medium text-forest-800">
                  {conversation.listing.status_label ?? conversation.listing.status}
                </span>
              </p>
            </div>
          </div>

          <Link
            href={`/listings/${conversation.listing_id}`}
            className="shrink-0 bg-white border border-input-border text-ink px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-paper transition-colors"
          >
            Lihat buku
          </Link>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto bg-white border border-warm-border p-4 flex flex-col gap-2.5 ${
          conversation ? 'border-t-0' : 'rounded-t-lg'
        }`}
      >
        {loading ? (
          <p className="text-stone-600 text-sm">Memuat percakapan…</p>
        ) : error ? (
          <p className="text-red-700 text-sm">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-stone-600 text-sm text-center py-8">
            Belum ada pesan. Kirim pesan pertama untuk bertanya tentang kondisi buku ini.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === user.id;
            return (
              <div
                key={m.id}
                className={`max-w-[82%] rounded-lg px-4 py-2.5 text-sm ${
                  isMe
                    ? 'self-end bg-forest-700 text-cream rounded-br-xs'
                    : 'self-start bg-paper border border-warm-border text-ink rounded-bl-xs'
                } ${m.pending ? 'opacity-70' : ''}`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                <p
                  className={`text-xs mt-1 tabular-nums ${
                    isMe ? 'text-cream/80 text-right' : 'text-stone-600'
                  }`}
                >
                  {m.pending
                    ? 'Mengirim…'
                    : new Date(m.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="bg-white border border-t-0 border-warm-border rounded-b-lg p-3 flex gap-2"
      >
        <label htmlFor={inputId} className="sr-only">
          Tulis pesan ke lawan bicara
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan tentang kondisi buku atau jadwal COD…"
          className="flex-1 border border-input-border rounded-lg px-4 py-2.5 text-sm bg-white"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Kirim
        </button>
      </form>

      <p className="text-xs text-stone-600 mt-2">
        Pembayaran dilakukan langsung antar pembeli dan penjual (transfer atau COD) di luar platform.
      </p>
    </div>
  );
}
