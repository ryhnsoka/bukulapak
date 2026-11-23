import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Jual Buku',
  description: 'Pasang listing buku bekasmu lengkap dengan foto kondisi asli dan deskripsi di BukuLapak.',
};

export default function JualLayout({ children }: { children: ReactNode }) {
  return children;
}
