'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackAuth } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      trackAuth('sign_up', 'email');
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white border border-warm-border rounded-lg p-7 sm:p-8">
        <h1 className="type-page-title text-ink mb-6 text-center">Daftar</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={nameId} className="block text-xs font-semibold text-stone-700 mb-1">
              Nama lengkap
            </label>
            <input
              id={nameId}
              required
              autoComplete="name"
              placeholder="Nama lengkapmu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-input-border rounded-lg p-3 text-sm bg-white"
            />
          </div>

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
              Password (minimal 6 karakter)
            </label>
            <input
              id={passwordId}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
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
            {loading ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="text-sm text-stone-600 text-center mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="underline font-medium text-forest-700">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
