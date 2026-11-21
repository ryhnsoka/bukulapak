import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Daftar Akun',
  description: 'Buat akun BukuLapak untuk menyimpan rak baca, memberi review, dan menjual buku bekas.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
