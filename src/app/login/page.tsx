'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function doLogin(e: string, p: string) {
    setError('');
    setLoading(true);
    try {
      await login(e, p);
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(email, password);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold font-serif mb-6 text-center text-green-950">Login</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-forest-700" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="bg-forest-700 text-cream rounded-lg p-3 hover:bg-forest-900 transition disabled:opacity-50">
            {loading ? 'Memproses…' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-stone-500 text-center mt-4">
          Belum punya akun? <Link href="/register" className="underline font-semibold text-forest-700">Daftar</Link>
        </p>
      </div>

      <div className="bg-forest-700/5 border border-forest-700/30 rounded-xl p-5 mt-6">
        <h2 className="font-bold text-sm mb-1">Akun contoh (sudah terdaftar)</h2>
        <p className="text-xs text-gray-500 mb-3">Klik untuk langsung login. Cocok untuk demo.</p>
        <div className="flex flex-col gap-2">
          {[
            { name: 'Andi Wijaya (penjual)', email: 'andi@bukulapak.id' },
            { name: 'Sari Putri (penjual)', email: 'sari@bukulapak.id' },
            { name: 'Budi Santoso', email: 'budi@bukulapak.id' },
            { name: 'Dewi Lestari (pembeli)', email: 'dewi@bukulapak.id' },
            { name: 'Rizky Pratama', email: 'rizky@bukulapak.id' },
          ].map((a) => (
            <button
              key={a.email}
              onClick={() => doLogin(a.email, 'password123')}
              disabled={loading}
              className="text-left bg-white border border-gray-200 rounded-lg px-4 py-2 hover:shadow hover:border-forest-500 transition disabled:opacity-50"
            >
              <span className="font-semibold text-sm">{a.name}</span>
              <span className="text-xs text-gray-500 ml-2">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


