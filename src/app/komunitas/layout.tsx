import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Komunitas',
  description: 'Ruang klub baca dan diskusi isi buku antar pembaca di BukuLapak.',
};

export default function KomunitasLayout({ children }: { children: ReactNode }) {
  return children;
}
