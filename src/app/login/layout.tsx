import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke akun BukuLapak untuk menulis review, mengelola rak baca, dan transaksi buku bekas.',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
