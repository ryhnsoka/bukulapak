'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-10 bg-forest-700 text-cream shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-serif tracking-wide">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          BukuLapak
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/books" className="hover:text-white text-cream/90 transition">Cari Buku</Link>
          <Link href="/jual" className="hover:text-white text-cream/90 transition">Jual Buku</Link>
          <Link href="/about" className="hover:text-white text-cream/90 transition">About</Link>
          {ready && user ? (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-cream text-forest-700 rounded-full pl-1 pr-3 py-1 hover:bg-white transition shadow"
              >
                <span className="w-7 h-7 rounded-full bg-forest-700 text-cream flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold">{user.name.split(' ')[0]}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-stone-700 border rounded-xl shadow-lg p-2">
                  <Link href="/profil" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-stone-100 text-sm">
                    Profil Saya
                  </Link>
                  <Link href="/chat" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-stone-100 text-sm">
                    Chat
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : ready ? (
            <>
              <Link href="/login" className="hover:text-white text-cream/90 transition">Login</Link>
              <Link href="/register" className="bg-cream text-forest-700 px-4 py-1.5 rounded-lg font-medium hover:bg-white transition shadow">
                Daftar
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
