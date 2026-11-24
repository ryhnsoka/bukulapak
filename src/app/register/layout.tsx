import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Daftar',
  description:
    'Buat akun BukuLapak untuk menyimpan daftar bacaan, menulis ulasan, atau menjual buku bekas.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
