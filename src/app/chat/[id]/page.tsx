import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatRoomClient from '@/components/ChatRoomClient';

export const metadata: Metadata = {
  title: 'Ruang Chat',
  description: 'Percakapan real-time transaksi buku bekas di BukuLapak.',
};

async function ChatRoomLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatRoomClient conversationId={decodeURIComponent(id)} />;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-stone-500">
          Memuat ruang chat…
        </div>
      }
    >
      <ChatRoomLoader params={params} />
    </Suspense>
  );
}
