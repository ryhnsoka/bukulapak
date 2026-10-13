'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User } from './api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('bukulapak_token');
    const u = localStorage.getItem('bukulapak_user');
    if (t && u) {
      setToken(t);
      try {
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem('bukulapak_token');
        localStorage.removeItem('bukulapak_user');
      }
    }
    setReady(true);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    localStorage.setItem('bukulapak_token', res.data.token);
    localStorage.setItem('bukulapak_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.register(name, email, password);
    localStorage.setItem('bukulapak_token', res.data.token);
    localStorage.setItem('bukulapak_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    if (token) {
      try {
        await api.logout(token);
      } catch {
        /* abaikan */
      }
    }
    localStorage.removeItem('bukulapak_token');
    localStorage.removeItem('bukulapak_user');
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, token, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
