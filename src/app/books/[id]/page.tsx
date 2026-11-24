import type { Metadata } from 'next';
import { Suspense } from 'react';
import BookDetailClient from '@/components/BookDetailClient';

export const metadata: Metadata = {
  title: 'Detail Buku',
  description:
    'Baca ulasan pembaca, lihat daftar penjual buku bekas, dan ikuti diskusi buku ini di BukuLapak.',
};

async function BookDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookDetailClient bookId={decodeURIComponent(id)} />;
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-stone-500">
          Memuat detail buku…
        </div>
      }
    >
      <BookDetailLoader params={params} />
    </Suspense>
  );
}
