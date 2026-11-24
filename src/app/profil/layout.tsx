import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Profil',
  description:
    'Kelola rak baca, riwayat pesanan, lapak jualan, dan ulasan pribadimu di BukuLapak.',
};

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return children;
}
