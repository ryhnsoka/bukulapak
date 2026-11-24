import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Masuk ke akun BukuLapak untuk mengulas buku, mengelola rak baca, atau bertransaksi.',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
