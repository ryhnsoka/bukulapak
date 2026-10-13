'use client';

import { useState } from 'react';
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.errors ? Object.values(err.errors).flat().join(' ') : (err.message ?? 'Registrasi gagal'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold font-serif mb-6 text-center text-green-950">Daftar</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input required placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
          <input type="password" required minLength={6} placeholder="Password (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="bg-forest-700 text-cream rounded-lg p-3 hover:bg-forest-900 transition disabled:opacity-50">
            {loading ? 'Memproses…' : 'Daftar'}
          </button>
        </form>
        <p className="text-sm text-stone-500 text-center mt-4">
          Sudah punya akun? <Link href="/login" className="underline font-semibold text-forest-700">Login</Link>
        </p>
      </div>
    </div>
  );
}


