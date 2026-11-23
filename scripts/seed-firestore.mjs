import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(envPath);

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

if (!config.apiKey || !config.projectId || !config.appId) {
  console.error('Variabel NEXT_PUBLIC_FIREBASE_* di .env.local belum lengkap.');
  process.exit(1);
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

function buildSearchTokens(title, authors, isbn) {
  const tokens = new Set();
  const raw = [title, ...(authors ?? []), isbn ?? ''].join(' ').toLowerCase();
  const words = raw.split(/[^a-z0-9]+/i).filter((w) => w.length >= 2);
  for (const word of words) {
    tokens.add(word);
    const maxLen = Math.min(word.length, 8);
    for (let i = 2; i <= maxLen; i++) {
      tokens.add(word.slice(0, i));
    }
    if (tokens.size >= 45) break;
  }
  return Array.from(tokens).slice(0, 45);
}

async function ensureDemoUser(name, email, password) {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch {
    cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
  }

  const uid = cred.user.uid;
  const userRef = doc(db, 'users', uid);
  const pubRef = doc(db, 'public_profiles', uid);
  if (!(await getDoc(userRef)).exists()) {
    await setDoc(userRef, { name, email, created_at: serverTimestamp() });
  }
  if (!(await getDoc(pubRef)).exists()) {
    await setDoc(pubRef, {
      name,
      listings_count: 0,
      seller_rating_avg: null,
      seller_rating_count: 0,
      created_at: serverTimestamp(),
    });
  }
  return { uid, name, email };
}

const DEMO_USERS = [
  { key: 'andi', name: 'Andi Wijaya', email: 'andi@bukulapak.id' },
  { key: 'sari', name: 'Sari Putri', email: 'sari@bukulapak.id' },
  { key: 'budi', name: 'Budi Santoso', email: 'budi@bukulapak.id' },
  { key: 'dewi', name: 'Dewi Lestari', email: 'dewi@bukulapak.id' },
  { key: 'rizky', name: 'Rizky Pratama', email: 'rizky@bukulapak.id' },
];

const DEMO_BOOKS = [
  {
    id: 'laut-bercerita',
    open_library_id: '/works/OL20685662W',
    isbn: '9786024246945',
    title: 'Laut Bercerita',
    authors: ['Leila S. Chudori'],
    publisher: 'Kepustakaan Populer Gramedia',
    published_date: '2017-10-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Cetakan Reguler',
    description:
      'Kisah Biru Laut dan kawan-kawan aktivis mahasiswa 1998, serta penantian panjang keluarga yang kehilangan.',
    cover_url: 'https://covers.openlibrary.org/b/id/10648285-L.jpg',
    categories: ['Fiction', 'Fiksi Indonesia', 'History'],
    page_count: 379,
  },
  {
    id: 'laskar-pelangi',
    open_library_id: '/works/OL262758W',
    isbn: '9789793062792',
    title: 'Laskar Pelangi',
    authors: ['Andrea Hirata'],
    publisher: 'Bentang Pustaka',
    published_date: '2005-01-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Edisi Pertama',
    description:
      'Kisah inspiratif sepuluh anak Belitung di SD Muhammadiyah yang berjuang meraih mimpi.',
    cover_url: 'https://covers.openlibrary.org/b/id/7079796-L.jpg',
    categories: ['Fiction', 'Fiksi Indonesia'],
    page_count: 529,
  },
  {
    id: 'bumi-manusia',
    open_library_id: '/works/OL1158302W',
    isbn: '9789799731234',
    title: 'Bumi Manusia',
    authors: ['Pramoedya Ananta Toer'],
    publisher: 'Lentera Dipantara',
    published_date: '2005-01-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Tetralogi Buru #1',
    description:
      'Roman sejarah tentang Minke, pemuda pribumi yang menghadapi kolonialisme dengan pena dan hukum.',
    cover_url: 'https://covers.openlibrary.org/b/id/6643692-L.jpg',
    categories: ['Fiction', 'Fiksi Indonesia', 'History'],
    page_count: 535,
  },
  {
    id: 'filosofi-teras',
    open_library_id: '/works/OL24385012W',
    isbn: '9786024125189',
    title: 'Filosofi Teras',
    authors: ['Henry Manampiring'],
    publisher: 'Penerbit Buku Kompas',
    published_date: '2018-11-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Cetakan Kompas',
    description:
      'Pengantar praktis filsafat Stoisisme Yunani-Romawi kuno untuk menghadapi kecemasan modern.',
    cover_url: 'https://covers.openlibrary.org/b/id/15255806-L.jpg',
    categories: ['Self-Help', 'Philosophy'],
    page_count: 320,
  },
  {
    id: 'cantik-itu-luka',
    open_library_id: '/works/OL16327418W',
    isbn: '9786020366517',
    title: 'Cantik Itu Luka',
    authors: ['Eka Kurniawan'],
    publisher: 'Gramedia Pustaka Utama',
    published_date: '2002-01-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Edisi GPU',
    description:
      'Epik keluarga Dewi Ayu dengan balutan realisme magis dari masa kolonial hingga kemerdekaan.',
    cover_url: 'https://covers.openlibrary.org/b/id/13903116-L.jpg',
    categories: ['Fiction', 'Fiksi Indonesia'],
    page_count: 478,
  },
  {
    id: 'pulang-tere-liye',
    open_library_id: '/works/OL20091844W',
    isbn: '9786020822129',
    title: 'Pulang',
    authors: ['Tere Liye'],
    publisher: 'Republika Penerbit',
    published_date: '2015-09-01',
    language: 'id',
    format: 'Softcover',
    edition_label: 'Reguler',
    description:
      'Perjalanan Bujang menembus ekonomi bayangan hingga menemukan arti keluarga dan pulang.',
    cover_url: 'https://covers.openlibrary.org/b/id/12905869-L.jpg',
    categories: ['Fiction', 'Fiksi Indonesia', 'Mystery'],
    page_count: 400,
  },
  {
    id: 'atomic-habits',
    open_library_id: '/works/OL14906239W',
    isbn: '9780735211292',
    title: 'Atomic Habits',
    authors: ['James Clear'],
    publisher: 'Avery',
    published_date: '2018-10-16',
    language: 'en',
    format: 'Paperback',
    edition_label: 'International Edition',
    description:
      'Panduan membangun kebiasaan baik melalui perubahan kecil yang berdampak majemuk.',
    cover_url: 'https://covers.openlibrary.org/b/id/12539702-L.jpg',
    categories: ['Self-Help'],
    page_count: 320,
  },
  {
    id: 'harry-potter-1',
    open_library_id: '/works/OL82563W',
    isbn: '9780747532699',
    title: "Harry Potter and the Philosopher's Stone",
    authors: ['J. K. Rowling'],
    publisher: 'Bloomsbury',
    published_date: '1997-06-26',
    language: 'en',
    format: 'Paperback',
    edition_label: 'UK Paperback',
    description: 'Petualangan pertama Harry Potter di Sekolah Sihir Hogwarts.',
    cover_url: 'https://covers.openlibrary.org/b/id/15155833-L.jpg',
    categories: ['Fantasy', 'Fiction'],
    page_count: 223,
  },
];

async function run() {
  const userMap = {};
  for (const u of DEMO_USERS) {
    userMap[u.key] = await ensureDemoUser(u.name, u.email, 'password123');
    console.log(`Akun siap: ${u.email} (${userMap[u.key].uid})`);
  }

  // Login sebagai Andi untuk menulis katalog, listing awal, dan klub
  await signInWithEmailAndPassword(auth, 'andi@bukulapak.id', 'password123');

  for (const b of DEMO_BOOKS) {
    const { id: bookId, ...bookFields } = b;
    const bookRef = doc(db, 'books', bookId);
    const listingPrice =
      bookId === 'laskar-pelangi' ? 38000 : bookId === 'filosofi-teras' ? 42000 : 55000;

    if (!(await getDoc(bookRef)).exists()) {
      await setDoc(bookRef, {
        ...bookFields,
        avg_rating: null,
        ratings_count: 0,
        reviews_count: 0,
        active_listings_count: 0,
        min_price: null,
        search_tokens: buildSearchTokens(b.title, b.authors, b.isbn),
        created_at: serverTimestamp(),
      });
    }
    await updateDoc(bookRef, {
      avg_rating: 4.5,
      ratings_count: 2,
      reviews_count: 2,
      active_listings_count: 1,
      min_price: listingPrice,
    });

    // Review dari Andi
    const andiReviewRef = doc(db, 'reviews', `${bookId}_${userMap.andi.uid}`);
    if (!(await getDoc(andiReviewRef)).exists()) {
      await setDoc(andiReviewRef, {
        book_id: bookId,
        user_id: userMap.andi.uid,
        user_name: userMap.andi.name,
        book_snapshot: { title: b.title, authors: b.authors, cover_url: b.cover_url },
        rating: 5,
        title: 'Sangat membekas dan layak dibaca ulang',
        content: 'Alurnya rapi, penokohannya kuat, dan bahasanya enak diikuti sampai halaman terakhir.',
        is_spoiler: false,
        is_hidden: false,
        likes_count: 0,
        created_at: serverTimestamp(),
      });
    }

    // Listing dari Andi
    const listingId = `seed_${bookId}_andi`;
    const listingRef = doc(db, 'listings', listingId);
    if (!(await getDoc(listingRef)).exists()) {
      await setDoc(listingRef, {
        user_id: userMap.andi.uid,
        book_id: bookId,
        seller_snapshot: {
          name: userMap.andi.name,
          listings_count: DEMO_BOOKS.length,
          seller_rating_avg: null,
          seller_rating_count: 0,
        },
        book_snapshot: {
          title: b.title,
          authors: b.authors,
          isbn: b.isbn,
          cover_url: b.cover_url,
          publisher: b.publisher,
        },
        condition: bookId === 'laskar-pelangi' ? 'good' : 'like_new',
        price: listingPrice,
        location_city: bookId === 'bumi-manusia' ? 'Yogyakarta' : 'Bandung',
        location_city_lower: bookId === 'bumi-manusia' ? 'yogyakarta' : 'bandung',
        share_wa: false,
        wa_number: null,
        edition_note: b.edition_label,
        description: 'Kondisi terawat, halaman bersih bebas coretan, siap COD atau kirim.',
        images: b.cover_url ? [b.cover_url] : [],
        photos_count: 0,
        status: 'active',
        created_at: serverTimestamp(),
      });
    }
  }

  await updateDoc(doc(db, 'public_profiles', userMap.andi.uid), {
    listings_count: DEMO_BOOKS.length,
  });

  // Klub baca & topik diskusi contoh
  const clubRef = doc(db, 'reading_clubs', 'klub-fiksi-nusantara');
  if (!(await getDoc(clubRef)).exists()) {
    await setDoc(clubRef, {
      creator_id: userMap.andi.uid,
      name: 'Klub Fiksi Nusantara',
      description: 'Membaca dan membedah novel Indonesia klasik maupun kontemporer setiap akhir pekan.',
      current_book_id: 'laut-bercerita',
      schedule_note: 'Diskusi tiap Minggu pukul 19.30 WIB',
      members_count: 1,
      topics_count: 0,
      created_at: serverTimestamp(),
    });
  }
  const andiMemberRef = doc(db, 'reading_clubs', 'klub-fiksi-nusantara', 'members', userMap.andi.uid);
  if (!(await getDoc(andiMemberRef)).exists()) {
    await setDoc(andiMemberRef, {
      user_id: userMap.andi.uid,
      joined_at: serverTimestamp(),
    });
  }

  const discRef = doc(db, 'discussions', 'diskusi-laut-bercerita');
  if (!(await getDoc(discRef)).exists()) {
    await setDoc(discRef, {
      book_id: 'laut-bercerita',
      book_title: 'Laut Bercerita',
      reading_club_id: 'klub-fiksi-nusantara',
      club_name: 'Klub Fiksi Nusantara',
      user_id: userMap.andi.uid,
      user_name: userMap.andi.name,
      title: 'Sudut pandang Biru Laut vs Asmara Jati — mana yang paling membekas?',
      body: 'Menurutku transisi ke sudut pandang Asmara di bagian kedua membuat kehilangan terasa jauh lebih nyata. Bagaimana menurut kalian?',
      is_spoiler: false,
      replies_count: 0,
      created_at: serverTimestamp(),
    });
  }

  // Login sebagai Sari untuk menambah review ke-2, gabung klub, & like review
  await signInWithEmailAndPassword(auth, 'sari@bukulapak.id', 'password123');
  for (const b of DEMO_BOOKS) {
    const sariReviewRef = doc(db, 'reviews', `${b.id}_${userMap.sari.uid}`);
    if (!(await getDoc(sariReviewRef)).exists()) {
      await setDoc(sariReviewRef, {
        book_id: b.id,
        user_id: userMap.sari.uid,
        user_name: userMap.sari.name,
        book_snapshot: { title: b.title, authors: b.authors, cover_url: b.cover_url },
        rating: 4,
        title: 'Bacaan yang solid',
        content: 'Menikmati tiap babnya. Cocok dibaca santai di akhir pekan.',
        is_spoiler: false,
        is_hidden: false,
        likes_count: 0,
        created_at: serverTimestamp(),
      });
    }
  }

  const sariMemberRef = doc(db, 'reading_clubs', 'klub-fiksi-nusantara', 'members', userMap.sari.uid);
  if (!(await getDoc(sariMemberRef)).exists()) {
    await runTransaction(db, async (tx) => {
      const cSnap = await tx.get(clubRef);
      const mSnap = await tx.get(sariMemberRef);
      if (!cSnap.exists() || mSnap.exists()) return;
      const prevCount = Number(cSnap.data().members_count ?? 1);
      tx.set(sariMemberRef, {
        user_id: userMap.sari.uid,
        joined_at: serverTimestamp(),
      });
      tx.update(clubRef, { members_count: prevCount + 1 });
    });
  }

  const lautAndiReviewRef = doc(db, 'reviews', `laut-bercerita_${userMap.andi.uid}`);
  const sariLikeRef = doc(db, 'reviews', `laut-bercerita_${userMap.andi.uid}`, 'likes', userMap.sari.uid);
  if (!(await getDoc(sariLikeRef)).exists()) {
    await runTransaction(db, async (tx) => {
      const rSnap = await tx.get(lautAndiReviewRef);
      const lSnap = await tx.get(sariLikeRef);
      if (!rSnap.exists() || lSnap.exists()) return;
      const prevLikes = Number(rSnap.data().likes_count ?? 0);
      tx.set(sariLikeRef, {
        user_id: userMap.sari.uid,
        created_at: serverTimestamp(),
      });
      tx.update(lautAndiReviewRef, { likes_count: prevLikes + 1 });
    });
  }

  await signOut(auth);
  console.log('Seed Firestore BukuLapak selesai!');
}

run().catch((err) => {
  console.error('Gagal melakukan seed Firestore:', err);
  process.exit(1);
});
