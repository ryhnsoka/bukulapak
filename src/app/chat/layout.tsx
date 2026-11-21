import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Chat Transaksi',
  description: 'Percakapan langsung antar pembeli dan penjual buku bekas di BukuLapak.',
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return children;
}
