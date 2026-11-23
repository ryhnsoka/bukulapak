import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Kelola rak baca, daftar buku kustom, transaksi pesanan, listing jualan, dan review di BukuLapak.',
};

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return children;
}
