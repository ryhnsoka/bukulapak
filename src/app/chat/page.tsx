'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Conversation } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ChatListPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const loading = !ready || (Boolean(user) && loadedUid !== user?.id);

  useEffect(() => {
    if (!ready || !user) return;
    const uid = user.id;

    const unsub = api.subscribeConversations(
      uid,
      (list) => {
        setItems(list);
        setLoadedUid(uid);
      },
      () => {
        setLoadedUid(uid);
      }
    );
    return () => unsub();
  }, [user, ready]);

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
        <h1 className="type-page-title text-ink mb-2">Masuk untuk membuka chat</h1>
        <p className="text-sm text-stone-600 mb-6">
          Hubungi penjual untuk menanyakan kondisi fisik buku, foto tambahan, atau jadwal COD.
        </p>
        <Link
          href="/login?next=/chat"
          className="inline-block bg-forest-700 text-cream px-6 py-3 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
        >
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-baseline justify-between gap-3 mb-6">
        <div>
          <h1 className="type-page-title text-ink">Chat</h1>
          <p className="text-xs text-stone-600 mt-1">
            Percakapan langsung dengan pembeli dan penjual.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="text-xs font-medium text-forest-700 underline underline-offset-4 hover:text-forest-900"
        >
          Marketplace
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-warm-border rounded-lg p-4 h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-warm-border rounded-lg p-8 text-center">
          <p className="text-ink font-semibold mb-1">Belum ada percakapan</p>
          <p className="text-sm text-stone-600 mb-4">
            Buka salah satu buku di Marketplace lalu pilih &ldquo;Chat penjual&rdquo;.
          </p>
          <Link
            href="/marketplace"
            className="inline-block bg-forest-700 text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-900 transition-colors"
          >
            Cari buku bekas
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c) => {
            const thumb = c.listing.images?.[0] ?? c.listing.book.cover_url;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="bg-white border border-warm-border rounded-lg p-4 hover:border-stone-400 transition-colors flex items-center gap-3.5"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={c.listing.book.title}
                    className="w-12 h-16 object-cover rounded-sm border border-warm-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-paper border border-warm-border rounded-sm flex items-center justify-center text-forest-900 font-serif text-xs px-1 text-center shrink-0">
                    {c.listing.book.title}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-ink truncate">
                      {c.other_party.name}
                    </p>
                    {c.last_message_at && (
                      <span className="text-xs text-stone-600 tabular-nums shrink-0">
                        {new Date(c.last_message_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-forest-800 truncate tabular-nums">
                    {c.listing.book.title} •{' '}
                    {c.listing.price === 0
                      ? 'Gratis'
                      : `Rp\u00A0${c.listing.price.toLocaleString('id-ID')}`}
                  </p>
                  {c.last_message && (
                    <p className="text-xs text-stone-600 mt-1 line-clamp-1">
                      {c.last_message.content}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
