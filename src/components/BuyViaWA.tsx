'use client';

import Link from 'next/link';
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
      <p className="text-sm text-gray-500 bg-stone-100 rounded-xl p-4">
        Penjual belum mencantumkan nomor WA. Gunakan{' '}
        <Link href="/chat" className="underline font-semibold text-forest-700">
          chat BukuLapak
        </Link>{' '}
        untuk menghubunginya.
      </p>
    );
  }

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
      <Link
        href="/login"
        className="block text-center bg-forest-700 text-cream px-6 py-3 rounded-lg font-medium hover:bg-forest-900 transition shadow"
      >
        Login untuk Membeli
      </Link>
    );
  }

  if (user.id === listing.user_id) {
    return <p className="text-sm text-gray-500 bg-stone-100 rounded-xl p-4">Ini listing milikmu.</p>;
  }

  if (compact) {
    return (
      <a
        href={`https://wa.me/${listing.wa_number}?text=${encodeURIComponent(msg)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat via WhatsApp"
        className="flex-1 flex items-center justify-center gap-1 border border-[#25D366] text-[#128C4B] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#25D366] hover:text-white transition"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
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
        className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-semibold hover:brightness-95 transition shadow"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
        Beli via WhatsApp
      </a>
      <p className="text-xs text-gray-500 text-center">
        Chat penjual langsung — deal transfer/COD manual. Atau{' '}
        <Link href="/chat" className="underline text-forest-700">
          chat di BukuLapak
        </Link>
        .
      </p>
    </div>
  );
}
