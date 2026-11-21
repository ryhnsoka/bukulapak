'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  getDb,
  getFirebaseAuth,
  isFirebaseConfigured,
  requireAuth,
} from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  listings_count?: number;
  seller_rating_avg?: number | null;
  seller_rating_count?: number;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  ready: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginDemo: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function mapFirebaseAuthError(err: unknown): Error {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code?: unknown }).code)
    : '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/wrong-password': 'Email atau password salah.',
    'auth/user-not-found': 'Akun dengan email ini belum terdaftar.',
    'auth/email-already-in-use': 'Email sudah terdaftar. Silakan login.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/too-many-requests': 'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.',
    'auth/network-request-failed': 'Koneksi gagal. Periksa internetmu lalu coba lagi.',
  };
  if (code && map[code]) {
    return new Error(map[code]);
  }
  return err instanceof Error ? err : new Error('Autentikasi gagal.');
}

async function ensureUserDocuments(fbUser: FirebaseUser, fallbackName?: string): Promise<User> {
  const name =
    fbUser.displayName?.trim() ||
    fallbackName?.trim() ||
    fbUser.email?.split('@')[0] ||
    'Pembaca BukuLapak';
  const email = fbUser.email ?? '';

  const db = getDb();
  if (db) {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name,
          email,
          created_at: serverTimestamp(),
        });
      }

      const pubRef = doc(db, 'public_profiles', fbUser.uid);
      const pubSnap = await getDoc(pubRef);
      if (!pubSnap.exists()) {
        await setDoc(pubRef, {
          name,
          listings_count: 0,
          seller_rating_avg: null,
          seller_rating_count: 0,
          created_at: serverTimestamp(),
        });
      }
      const pubData = pubSnap.exists() ? pubSnap.data() : undefined;
      const userData = userSnap.exists() ? userSnap.data() : undefined;
      return {
        id: fbUser.uid,
        name: String(userData?.name ?? pubData?.name ?? name),
        email: String(userData?.email ?? email),
        listings_count: typeof pubData?.listings_count === 'number' ? pubData.listings_count : 0,
        seller_rating_avg:
          typeof pubData?.seller_rating_avg === 'number' ? pubData.seller_rating_avg : null,
        seller_rating_count:
          typeof pubData?.seller_rating_count === 'number' ? pubData.seller_rating_count : 0,
      };
    } catch {
      /* fallback ke profil Firebase Auth bila Firestore sementara offline */
    }
  }

  return { id: fbUser.uid, name, email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !getFirebaseAuth());

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setReady(true);
        return;
      }
      const profile = await ensureUserDocuments(fbUser);
      setUser(profile);
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const auth = requireAuth();
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await ensureUserDocuments(cred.user);
      setUser(profile);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }
  }

  async function register(name: string, email: string, password: string) {
    const auth = requireAuth();
    const cleanName = name.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      const profile = await ensureUserDocuments(cred.user, cleanName);
      setUser(profile);
    } catch (err) {
      throw mapFirebaseAuthError(err);
    }
  }

  async function loginDemo(name: string, email: string, password: string) {
    const auth = requireAuth();
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await ensureUserDocuments(cred.user, name);
      setUser(profile);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          await updateProfile(cred.user, { displayName: name });
          const profile = await ensureUserDocuments(cred.user, name);
          setUser(profile);
          return;
        } catch (regErr) {
          throw mapFirebaseAuthError(regErr);
        }
      }
      throw mapFirebaseAuthError(err);
    }
  }

  async function logout() {
    const auth = getFirebaseAuth();
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        token: user?.id ?? null,
        ready,
        isConfigured: isFirebaseConfigured,
        login,
        register,
        loginDemo,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
