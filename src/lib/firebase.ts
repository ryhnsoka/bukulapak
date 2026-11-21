import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let emulatorConnected = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !emulatorConnected
  ) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch {
      /* abaikan jika sudah terhubung */
    }
  }
  cachedAuth = auth;
  return auth;
}

export function getDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;

  let db: Firestore;
  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !emulatorConnected
  ) {
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      emulatorConnected = true;
    } catch {
      /* abaikan jika sudah terhubung */
    }
  }

  cachedDb = db;
  return db;
}

export function requireDb(): Firestore {
  const db = getDb();
  if (!db) {
    throw new Error(
      'Konfigurasi Firebase belum aktif. Lengkapi variabel NEXT_PUBLIC_FIREBASE_* di .env.local terlebih dahulu.'
    );
  }
  return db;
}

export function requireAuth(): Auth {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      'Autentikasi Firebase belum aktif. Lengkapi variabel NEXT_PUBLIC_FIREBASE_* di .env.local terlebih dahulu.'
    );
  }
  return auth;
}
