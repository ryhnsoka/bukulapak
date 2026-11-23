import type { Metadata } from 'next';
import { Suspense } from 'react';
import ListingDetailClient from '@/components/ListingDetailClient';

export const metadata: Metadata = {
  title: 'Detail Listing',
  description: 'Lihat foto kondisi asli buku bekas, reputasi penjual, chat langsung, atau buat pesanan di BukuLapak.',
};

async function ListingDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetailClient listingId={decodeURIComponent(id)} />;
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-stone-500">
          Memuat detail listing…
        </div>
      }
    >
      <ListingDetailLoader params={params} />
    </Suspense>
  );
}
