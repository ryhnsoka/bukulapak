'use client';

import Link from 'next/link';
import { trackContactSeller } from '@/lib/analytics';
import type { Listing } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function BuyViaWA({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const { user } = useAuth();

  const msg = `Halo, saya tertarik dengan buku "${listing.book.title}" seharga ${
    listing.price === 0 ? 'Gratis' : `Rp ${listing.price.toLocaleString('id-ID')}`
  } di BukuLapak (listing #${listing.id}). Apakah masih tersedia?`;

  if (!listing.wa_number) {
    if (compact) return null;
    return (
      <p className="text-sm text-stone-600 bg-stone-100 rounded-xl p-4">
        Penjual belum mencantumkan nomor WA. Gunakan{' '}
        <Link href="/chat" className="underline font-semibold text-forest-700">
          chat BukuLapak
        </Link>{' '}
        untuk menghubunginya.
      </p>
    );
  }

  if (!user) {
    if (compact) return null;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`}
        className="block text-center bg-forest-700 text-cream px-6 py-3 rounded-xl font-semibold hover:bg-forest-900 transition shadow-sm"
      >
        Login untuk Membeli
      </Link>
    );
  }

  if (user.id === listing.user_id) {
    return null;
  }

  if (compact) {
    return (
      <a
        href={`https://wa.me/${listing.wa_number}?text=${encodeURIComponent(msg)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContactSeller('whatsapp', listing.id)}
        className="inline-flex items-center justify-center gap-1 border border-emerald-600 text-emerald-800 bg-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-emerald-50 transition"
      >
        WA
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`https://wa.me/${listing.wa_number}?text=${encodeURIComponent(msg)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContactSeller('whatsapp', listing.id)}
        className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
      >
        Beli via WhatsApp
      </a>
    </div>
  );
}
