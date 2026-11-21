'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white border border-warm-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold font-serif mb-6 text-center text-forest-900">Daftar</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={nameId} className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id={nameId}
              required
              autoComplete="name"
              placeholder="Nama lengkapmu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
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
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
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
              className="w-full border border-stone-300 rounded-xl p-3 text-sm bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-forest-700 text-cream rounded-xl p-3 text-sm font-semibold hover:bg-forest-900 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="text-sm text-stone-600 text-center mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="underline font-semibold text-forest-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
