'use client';

import { Suspense, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackAuth } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { display: 'Andi Wijaya (penjual)', name: 'Andi Wijaya', email: 'andi@bukulapak.id' },
  { display: 'Sari Putri (penjual)', name: 'Sari Putri', email: 'sari@bukulapak.id' },
  { display: 'Budi Santoso', name: 'Budi Santoso', email: 'budi@bukulapak.id' },
  { display: 'Dewi Lestari (pembeli)', name: 'Dewi Lestari', email: 'dewi@bukulapak.id' },
  { display: 'Rizky Pratama', name: 'Rizky Pratama', email: 'rizky@bukulapak.id' },
];

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="max-w-md mx-auto px-4 py-16 text-center text-stone-500">Memuat…</p>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { login, loginDemo } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const safeNext =
    nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailId = useId();
  const passwordId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      trackAuth('login', 'email');
      router.push(safeNext);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setError('');
    setLoading(true);
    try {
      await loginDemo(acc.name, acc.email, 'password123');
      trackAuth('login', 'demo');
      router.push(safeNext);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login demo gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white border border-warm-border rounded-lg p-7 sm:p-8">
        <h1 className="type-page-title text-ink mb-6 text-center">Masuk</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={emailId} className="block text-xs font-semibold text-stone-700 mb-1">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input-border rounded-lg p-3 text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-xs font-semibold text-stone-700 mb-1">
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              required
              autoComplete="current-password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input-border rounded-lg p-3 text-sm bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-forest-700 text-cream rounded-lg p-3 text-sm font-medium hover:bg-forest-900 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="text-sm text-stone-600 text-center mt-4">
          Belum punya akun?{' '}
          <Link href="/register" className="underline font-medium text-forest-700">
            Daftar
          </Link>
        </p>
      </div>

      <div className="bg-paper/80 border border-warm-border rounded-lg p-5 mt-6">
        <h2 className="font-sans font-semibold text-sm text-ink mb-1">Coba pakai akun contoh</h2>
        <p className="text-xs text-stone-600 mb-3 leading-relaxed">
          Pilih salah satu akun di bawah jika hanya ingin mencoba fitur BukuLapak.
        </p>
        <div className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => handleDemo(a)}
              disabled={loading}
              className="text-left bg-white border border-warm-border rounded-lg px-4 py-2.5 hover:border-stone-400 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className="font-medium text-sm text-ink">{a.display}</span>
              <span className="text-xs text-stone-600 ml-2 font-mono">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
