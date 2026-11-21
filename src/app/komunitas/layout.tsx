import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Komunitas & Klub Baca',
  description: 'Diskusi isi buku, klub baca terjadwal, dan topik pembaca di BukuLapak.',
};

export default function KomunitasLayout({ children }: { children: ReactNode }) {
  return children;
}
