import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { getConditionSpec, LISTING_STATUS_META } from './conditions';
import { getDb, isFirebaseConfigured, requireDb } from './firebase';
import { normalizeIsbn } from './isbn';
import { getListingPhotos, uploadListingPhotos } from './storage';
import type { User } from './auth';

export type { User };

export interface ApiError extends Error {
  status: number;
  isNetworkError?: boolean;
  errors?: Record<string, string[]>;
}

export interface Book {
  id: string;
  open_library_id: string | null;
  isbn: string | null;
  title: string;
  authors: string[] | null;
  publisher: string | null;
  published_date: string | null;
  language?: string | null;
  format?: string | null;
  edition_label?: string | null;
  description: string | null;
  cover_url: string | null;
  categories: string[] | null;
  page_count: number | null;
  avg_rating: number | null;
  ratings_count: number;
  reviews_count?: number;
  active_listings_count?: number;
  min_price?: number | null;
  search_tokens?: string[];
  reviews?: Review[];
  listings?: Listing[];
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_spoiler?: boolean;
  is_hidden?: boolean;
  likes_count: number;
  created_at: string;
  user: User;
  book?: Book;
}

export type ShelfKey = 'want_to_read' | 'reading' | 'finished';

export interface ReadingShelfItem {
  id: string;
  user_id: string;
  book_id: string;
  shelf: ShelfKey;
  book?: Book;
}

export interface ShelfStats {
  want_to_read: number;
  reading: number;
  finished: number;
  total: number;
}

export interface BookList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  books_count?: number;
  books?: Book[];
}

export interface DiscussionReply {
  id: string;
  discussion_topic_id: string;
  user_id: string;
  body: string;
  is_spoiler: boolean;
  created_at: string;
  user: User;
}

export interface DiscussionTopic {
  id: string;
  book_id: string | null;
  reading_club_id: string | null;
  user_id: string;
  title: string;
  body: string;
  is_spoiler: boolean;
  replies_count?: number;
  created_at: string;
  user: User;
  book?: { id: string; title: string } | null;
  club?: { id: string; name: string } | null;
  replies?: DiscussionReply[];
}

export interface ReadingClub {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  current_book_id: string | null;
  schedule_note: string | null;
  members_count?: number;
  topics_count?: number;
  creator?: User;
  current_book?: Book | null;
  topics?: DiscussionTopic[];
}

export interface Listing {
  id: string;
  user_id: string;
  book_id: string;
  condition: string;
  condition_label?: string;
  price: number;
  location_city: string;
  wa_number: string | null;
  share_wa?: boolean;
  description: string | null;
  edition_note?: string | null;
  images: string[] | null;
  photos_count?: number;
  status: string;
  status_label?: string;
  created_at: string;
  user: User;
  book: Book;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  participants?: string[];
  last_message_at: string | null;
  listing: Listing;
  buyer: User;
  seller: User;
  other_party: User;
  last_message?: Message | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  user: User;
}

export interface SellerFeedback {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer?: User;
}

export interface OrderStatusStep {
  status: string;
  actor: string;
  at: string;
}

export interface Order {
  id: string;
  code: string;
  buyer_id: string;
  listing_id: string;
  seller_id: string;
  price: number;
  payment_method: string;
  payment_label?: string;
  buyer_name: string;
  buyer_note: string | null;
  payment_proof: string | null;
  status: string;
  status_label?: string;
  status_history?: OrderStatusStep[] | null;
  feedback?: SellerFeedback | null;
  created_at: string;
  listing: Listing;
  seller: User;
  buyer: User;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
};

function makeApiError(message: string, status = 400): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
}

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val) return val;
  if (val instanceof Date) return val.toISOString();
  return new Date().toISOString();
}

export function buildSearchTokens(
  title: string,
  authors: string[] | null | undefined,
  isbn?: string | null
): string[] {
  const tokens = new Set<string>();
  const raw = [title, ...(authors ?? []), isbn ?? ''].join(' ').toLowerCase();
  const words = raw.split(/[^a-z0-9]+/i).filter((w) => w.length >= 2);
  for (const word of words) {
    tokens.add(word);
    const maxPrefix = Math.min(word.length, 8);
    for (let i = 2; i <= maxPrefix; i++) {
      tokens.add(word.slice(0, i));
    }
    if (tokens.size >= 45) break;
  }
  return Array.from(tokens).slice(0, 45);
}

function mapBook(id: string, d: Record<string, unknown>): Book {
  return {
    id,
    open_library_id: (d.open_library_id as string | null) ?? null,
    isbn: (d.isbn as string | null) ?? null,
    title: String(d.title ?? 'Tanpa Judul'),
    authors: Array.isArray(d.authors) ? (d.authors as string[]) : null,
    publisher: (d.publisher as string | null) ?? null,
    published_date: (d.published_date as string | null) ?? null,
    language: (d.language as string | null) ?? null,
    format: (d.format as string | null) ?? null,
    edition_label: (d.edition_label as string | null) ?? null,
    description: (d.description as string | null) ?? null,
    cover_url: (d.cover_url as string | null) ?? null,
    categories: Array.isArray(d.categories) ? (d.categories as string[]) : null,
    page_count: typeof d.page_count === 'number' ? d.page_count : null,
    avg_rating: typeof d.avg_rating === 'number' ? d.avg_rating : null,
    ratings_count: typeof d.ratings_count === 'number' ? d.ratings_count : 0,
    reviews_count: typeof d.reviews_count === 'number' ? d.reviews_count : 0,
    active_listings_count:
      typeof d.active_listings_count === 'number' ? d.active_listings_count : 0,
    min_price: typeof d.min_price === 'number' ? d.min_price : null,
  };
}

function mapUserSnapshot(uid: string, snap?: Record<string, unknown> | null): User {
  return {
    id: uid,
    name: String(snap?.name ?? 'Pengguna BukuLapak'),
    email: '',
    listings_count: typeof snap?.listings_count === 'number' ? snap.listings_count : undefined,
    seller_rating_avg:
      typeof snap?.seller_rating_avg === 'number' ? snap.seller_rating_avg : null,
    seller_rating_count:
      typeof snap?.seller_rating_count === 'number' ? snap.seller_rating_count : 0,
  };
}

function mapListing(id: string, d: Record<string, unknown>): Listing {
  const cond = String(d.condition ?? 'good');
  const status = String(d.status ?? 'active');
  const bookSnap = (d.book_snapshot as Record<string, unknown> | undefined) ?? {};
  const sellerSnap = (d.seller_snapshot as Record<string, unknown> | undefined) ?? {};
  const bookId = String(d.book_id ?? '');
  const userId = String(d.user_id ?? '');

  return {
    id,
    user_id: userId,
    book_id: bookId,
    condition: cond,
    condition_label: getConditionSpec(cond)?.label ?? cond,
    price: typeof d.price === 'number' ? d.price : Number(d.price ?? 0),
    location_city: String(d.location_city ?? ''),
    wa_number: (d.wa_number as string | null) ?? null,
    share_wa: Boolean(d.share_wa),
    description: (d.description as string | null) ?? null,
    edition_note: (d.edition_note as string | null) ?? null,
    images: Array.isArray(d.images) ? (d.images as string[]) : null,
    photos_count: typeof d.photos_count === 'number' ? d.photos_count : 0,
    status,
    status_label: LISTING_STATUS_META[status]?.label ?? status,
    created_at: toIso(d.created_at),
    user: mapUserSnapshot(userId, sellerSnap),
    book: mapBook(bookId, bookSnap),
  };
}

function mapReview(id: string, d: Record<string, unknown>): Review {
  const bookId = String(d.book_id ?? '');
  const userId = String(d.user_id ?? '');
  const bookSnap = d.book_snapshot as Record<string, unknown> | undefined;
  return {
    id,
    user_id: userId,
    book_id: bookId,
    rating: Number(d.rating ?? 5),
    title: (d.title as string | null) ?? null,
    content: String(d.content ?? ''),
    is_spoiler: Boolean(d.is_spoiler),
    is_hidden: Boolean(d.is_hidden),
    likes_count: typeof d.likes_count === 'number' ? d.likes_count : 0,
    created_at: toIso(d.created_at),
    user: {
      id: userId,
      name: String(d.user_name ?? 'Pembaca'),
      email: '',
    },
    book: bookSnap ? mapBook(bookId, bookSnap) : undefined,
  };
}

function mapOrder(id: string, d: Record<string, unknown>): Order {
  const listingId = String(d.listing_id ?? '');
  const sellerId = String(d.seller_id ?? '');
  const buyerId = String(d.buyer_id ?? '');
  const bookId = String(d.book_id ?? '');
  const bookSnap = (d.book_snapshot as Record<string, unknown> | undefined) ?? {};
  const status = String(d.status ?? 'pending');

  const listing: Listing = {
    id: listingId,
    user_id: sellerId,
    book_id: bookId,
    condition: String(d.listing_condition ?? 'good'),
    condition_label: getConditionSpec(String(d.listing_condition ?? 'good'))?.label,
    price: typeof d.price === 'number' ? d.price : 0,
    location_city: String(d.location_city ?? ''),
    wa_number: (d.wa_number as string | null) ?? null,
    description: null,
    images: Array.isArray(d.listing_images) ? (d.listing_images as string[]) : null,
    status: 'reserved',
    created_at: toIso(d.created_at),
    user: { id: sellerId, name: String(d.seller_name ?? 'Penjual'), email: '' },
    book: mapBook(bookId, bookSnap),
  };

  return {
    id,
    code: String(d.code ?? id),
    buyer_id: buyerId,
    listing_id: listingId,
    seller_id: sellerId,
    price: typeof d.price === 'number' ? d.price : 0,
    payment_method: String(d.payment_method ?? 'manual'),
    payment_label: String(d.payment_label ?? 'Transfer / COD Manual'),
    buyer_name: String(d.buyer_name ?? ''),
    buyer_note: (d.buyer_note as string | null) ?? null,
    payment_proof: null,
    status,
    status_label: ORDER_STATUS_LABELS[status] ?? status,
    status_history: Array.isArray(d.status_history) ? (d.status_history as OrderStatusStep[]) : null,
    feedback: (d.feedback as SellerFeedback | null) ?? null,
    created_at: toIso(d.created_at),
    listing,
    seller: { id: sellerId, name: String(d.seller_name ?? 'Penjual'), email: '' },
    buyer: { id: buyerId, name: String(d.buyer_name ?? 'Pembeli'), email: '' },
  };
}

function mapConversation(id: string, d: Record<string, unknown>, currentUid: string): Conversation {
  const listingId = String(d.listing_id ?? '');
  const buyerId = String(d.buyer_id ?? '');
  const sellerId = String(d.seller_id ?? '');
  const snap = (d.listing_snapshot as Record<string, unknown> | undefined) ?? {};
  const buyer: User = { id: buyerId, name: String(d.buyer_name ?? 'Pembeli'), email: '' };
  const seller: User = { id: sellerId, name: String(d.seller_name ?? 'Penjual'), email: '' };
  const other = currentUid === buyerId ? seller : buyer;
  const lastRaw = d.last_message as Record<string, unknown> | undefined;

  const listing: Listing = {
    id: listingId,
    user_id: sellerId,
    book_id: String(snap.book_id ?? ''),
    condition: String(snap.condition ?? 'good'),
    condition_label: getConditionSpec(String(snap.condition ?? 'good'))?.label,
    price: typeof snap.price === 'number' ? snap.price : 0,
    location_city: String(snap.location_city ?? ''),
    wa_number: null,
    description: null,
    images: Array.isArray(snap.images) ? (snap.images as string[]) : null,
    status: String(snap.status ?? 'active'),
    status_label: LISTING_STATUS_META[String(snap.status ?? 'active')]?.label,
    created_at: toIso(d.created_at),
    user: seller,
    book: mapBook(String(snap.book_id ?? ''), {
      title: snap.book_title ?? 'Buku',
      authors: snap.book_authors ?? [],
      cover_url: snap.book_cover_url ?? null,
    }),
  };

  return {
    id,
    listing_id: listingId,
    buyer_id: buyerId,
    seller_id: sellerId,
    participants: Array.isArray(d.participants) ? (d.participants as string[]) : [buyerId, sellerId],
    last_message_at: d.last_message_at ? toIso(d.last_message_at) : null,
    listing,
    buyer,
    seller,
    other_party: other,
    last_message: lastRaw
      ? {
          id: 'last',
          conversation_id: id,
          user_id: String(lastRaw.user_id ?? ''),
          content: String(lastRaw.content ?? ''),
          read_at: null,
          created_at: toIso(lastRaw.created_at),
          user: String(lastRaw.user_id ?? '') === buyerId ? buyer : seller,
        }
      : null,
  };
}

function paginate<T>(items: T[], page = 1, perPage = 16): Paginated<T> {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), lastPage);
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    current_page: safePage,
    last_page: lastPage,
    total,
  };
}

async function getPublicProfile(uid: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'public_profiles', uid));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}

async function recomputeBookRating(bookId: string): Promise<void> {
  const db = requireDb();
  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('book_id', '==', bookId),
      where('is_hidden', '==', false)
    )
  );
  const count = snap.size;
  const sum = snap.docs.reduce((acc, docSnap) => acc + Number(docSnap.data().rating ?? 0), 0);
  const avg = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
  await updateDoc(doc(db, 'books', bookId), {
    avg_rating: avg,
    ratings_count: count,
    reviews_count: count,
  });
}

async function syncBookListingStats(bookId: string): Promise<void> {
  const db = requireDb();
  const snap = await getDocs(
    query(
      collection(db, 'listings'),
      where('book_id', '==', bookId),
      where('status', '==', 'active')
    )
  );
  const count = snap.size;
  let minPrice: number | null = null;
  snap.docs.forEach((d) => {
    const p = Number(d.data().price ?? 0);
    if (minPrice === null || p < minPrice) minPrice = p;
  });
  await updateDoc(doc(db, 'books', bookId), {
    active_listings_count: count,
    min_price: minPrice,
  });
}

export const api = {
  isConfigured: () => isFirebaseConfigured,

  health: async () => ({
    status: isFirebaseConfigured ? 'ok' : 'unconfigured',
    app: 'BukuLapak',
  }),

  // ---------- BOOKS ----------
  popularBooks: async (limitCount = 10) => {
    const db = getDb();
    if (!db) return { success: true, data: { books: [] as Book[] } };
    const snap = await getDocs(
      query(collection(db, 'books'), orderBy('reviews_count', 'desc'), limit(Math.min(limitCount, 50)))
    );
    const books = snap.docs.map((d) => mapBook(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: { books } };
  },

  getBooks: async (params: Record<string, string> = {}) => {
    const db = getDb();
    if (!db) return { success: true, data: paginate<Book>([], 1, 24) };

    const genre = (params.genre ?? '').trim();
    const sort = params.sort ?? 'reviews';
    const page = Math.max(1, Number(params.page ?? '1') || 1);
    const qTerm = (params.q ?? '').trim().toLowerCase();

    const constraints: QueryConstraint[] = [];
    if (genre) {
      constraints.push(where('categories', 'array-contains', genre));
    }

    if (sort === 'rating') {
      constraints.push(orderBy('avg_rating', 'desc'));
    } else if (sort === 'newest') {
      constraints.push(orderBy('created_at', 'desc'));
    } else if (sort === 'title' && !genre) {
      constraints.push(orderBy('title', 'asc'));
    } else if (sort !== 'title') {
      constraints.push(orderBy('reviews_count', 'desc'));
    }
    constraints.push(limit(96));

    const snap = await getDocs(query(collection(db, 'books'), ...constraints));
    let books = snap.docs.map((d) => mapBook(d.id, d.data() as Record<string, unknown>));

    if (genre && sort === 'title') {
      books.sort((a, b) => a.title.localeCompare(b.title, 'id'));
    }

    if (qTerm) {
      books = books.filter((b) => {
        const hay = `${b.title} ${(b.authors ?? []).join(' ')} ${b.isbn ?? ''}`.toLowerCase();
        return hay.includes(qTerm);
      });
    }

    return { success: true, data: paginate(books, page, 24) };
  },

  searchBooks: async (rawQuery: string) => {
    const term = rawQuery.trim();
    const db = getDb();

    const localPromise = (async (): Promise<Book[]> => {
      if (!db || !term) return [];
      const cleanWords = term
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((w) => w.length >= 2);
      const primaryToken = cleanWords[0];

      let docs;
      if (primaryToken) {
        const snap = await getDocs(
          query(
            collection(db, 'books'),
            where('search_tokens', 'array-contains', primaryToken.slice(0, 8)),
            limit(36)
          )
        );
        docs = snap.docs;
      } else {
        const snap = await getDocs(
          query(collection(db, 'books'), orderBy('reviews_count', 'desc'), limit(40))
        );
        docs = snap.docs;
      }

      return docs
        .map((d) => mapBook(d.id, d.data() as Record<string, unknown>))
        .filter((b) => {
          const hay = `${b.title} ${(b.authors ?? []).join(' ')} ${b.isbn ?? ''}`.toLowerCase();
          return cleanWords.length > 0
            ? cleanWords.every((w) => hay.includes(w))
            : hay.includes(term.toLowerCase());
        })
        .sort((a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0))
        .slice(0, 12);
    })();

    const isLikelyIsbn = /^[0-9-]{10,17}$/.test(term);
    const searchUrl = isLikelyIsbn
      ? `/api/books/search?isbn=${encodeURIComponent(term.replace(/-/g, ''))}`
      : `/api/books/search?q=${encodeURIComponent(term)}`;

    const externalPromise = fetch(searchUrl)
      .then((r) => (r.ok ? r.json() : { data: { external: [] } }))
      .then((json) => (json?.data?.external ?? []) as Book[])
      .catch(() => [] as Book[]);

    const [local, externalRaw] = await Promise.all([localPromise, externalPromise]);

    const localKeys = new Set(local.map((b) => b.open_library_id).filter(Boolean));
    const localIsbns = new Set(local.map((b) => b.isbn).filter(Boolean));
    const external = externalRaw.filter((ext) => {
      if (ext.open_library_id && localKeys.has(ext.open_library_id)) return false;
      if (ext.isbn && localIsbns.has(ext.isbn)) return false;
      return true;
    });

    return {
      success: true,
      data: {
        local,
        external,
        books: [...local, ...external],
      },
    };
  },

  getBook: async (id: string) => {
    const db = requireDb();
    const bookSnap = await getDoc(doc(db, 'books', id));
    if (!bookSnap.exists()) {
      throw makeApiError('Buku tidak ditemukan.', 404);
    }

    const book = mapBook(bookSnap.id, bookSnap.data() as Record<string, unknown>);

    const [reviewsSnap, listingsSnap, editionsSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'reviews'),
          where('book_id', '==', id),
          where('is_hidden', '==', false),
          orderBy('created_at', 'desc'),
          limit(40)
        )
      ),
      getDocs(
        query(
          collection(db, 'listings'),
          where('book_id', '==', id),
          where('status', '==', 'active'),
          orderBy('price', 'asc'),
          limit(30)
        )
      ),
      book.open_library_id
        ? getDocs(
            query(collection(db, 'books'), where('open_library_id', '==', book.open_library_id))
          )
        : Promise.resolve(null),
    ]);

    const reviews = reviewsSnap.docs.map((d) => mapReview(d.id, d.data() as Record<string, unknown>));
    const rawListings = listingsSnap.docs.map((d) =>
      mapListing(d.id, d.data() as Record<string, unknown>)
    );

    // Enrich seller ratings from public_profiles
    const uniqueSellerIds = Array.from(new Set(rawListings.map((l) => l.user_id)));
    const profilesMap = new Map<string, Record<string, unknown>>();
    await Promise.all(
      uniqueSellerIds.map(async (uid) => {
        const prof = await getPublicProfile(uid);
        if (prof) profilesMap.set(uid, prof);
      })
    );

    const listings = rawListings.map((l) => {
      const prof = profilesMap.get(l.user_id);
      if (!prof) return l;
      return {
        ...l,
        user: mapUserSnapshot(l.user_id, prof),
      };
    });

    const editions = editionsSnap
      ? editionsSnap.docs
          .filter((d) => d.id !== id)
          .map((d) => mapBook(d.id, d.data() as Record<string, unknown>))
      : [];

    return {
      success: true,
      data: {
        book: { ...book, reviews, listings },
        editions,
      },
    };
  },

  storeBook: async (data: Partial<Book>, uid: string) => {
    if (!uid) throw makeApiError('Harus login untuk menyimpan buku.', 401);
    const db = requireDb();

    const normalizedIsbn = data.isbn ? normalizeIsbn(data.isbn) : null;

    if (normalizedIsbn) {
      const byIsbn = await getDocs(
        query(collection(db, 'books'), where('isbn', '==', normalizedIsbn), limit(1))
      );
      if (!byIsbn.empty) {
        const existing = byIsbn.docs[0];
        return {
          success: true,
          data: { book: mapBook(existing.id, existing.data() as Record<string, unknown>) },
        };
      }
    }

    if (data.open_library_id) {
      const byOl = await getDocs(
        query(
          collection(db, 'books'),
          where('open_library_id', '==', data.open_library_id),
          limit(5)
        )
      );
      const match = byOl.docs.find((d) => {
        const docData = d.data();
        if (data.format && docData.format && docData.format !== data.format) return false;
        if (data.language && docData.language && docData.language !== data.language) return false;
        return true;
      });
      if (match) {
        return {
          success: true,
          data: { book: mapBook(match.id, match.data() as Record<string, unknown>) },
        };
      }
    }

    const title = String(data.title ?? 'Tanpa Judul').trim();
    const authors = Array.isArray(data.authors) ? data.authors : [];
    const payload = {
      open_library_id: data.open_library_id ?? null,
      isbn: normalizedIsbn,
      title,
      authors,
      publisher: data.publisher ?? null,
      published_date: data.published_date ?? null,
      language: data.language ?? null,
      format: data.format ?? null,
      edition_label: data.edition_label ?? null,
      description: data.description ?? null,
      cover_url: data.cover_url ?? null,
      categories: Array.isArray(data.categories) ? data.categories : [],
      page_count: typeof data.page_count === 'number' ? data.page_count : null,
      avg_rating: null,
      ratings_count: 0,
      reviews_count: 0,
      active_listings_count: 0,
      min_price: null,
      search_tokens: buildSearchTokens(title, authors, normalizedIsbn),
      created_at: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'books'), payload);
    return {
      success: true,
      data: {
        book: mapBook(ref.id, payload as unknown as Record<string, unknown>),
      },
    };
  },

  // ---------- REVIEWS ----------
  getReviews: async (params: Record<string, string> = {}) => {
    const db = getDb();
    if (!db) return { success: true, data: paginate<Review>([], 1, 15) };

    const constraints: QueryConstraint[] = [];
    if (params.book_id) constraints.push(where('book_id', '==', params.book_id));
    constraints.push(where('is_hidden', '==', false));
    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(50));

    const snap = await getDocs(query(collection(db, 'reviews'), ...constraints));
    const items = snap.docs.map((d) => mapReview(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: paginate(items, 1, 15) };
  },

  createReview: async (
    data: { book_id: string; rating: number; title?: string; content: string; is_spoiler?: boolean },
    uid: string
  ) => {
    const db = requireDb();
    const reviewId = `${data.book_id}_${uid}`;
    const reviewRef = doc(db, 'reviews', reviewId);
    const [existingSnap, bookSnap, profile] = await Promise.all([
      getDoc(reviewRef),
      getDoc(doc(db, 'books', data.book_id)),
      getPublicProfile(uid),
    ]);

    if (!bookSnap.exists()) {
      throw makeApiError('Buku tidak ditemukan.', 404);
    }

    const bData = bookSnap.data();
    const userName = String(profile?.name ?? 'Pembaca');
    const prevLikes = existingSnap.exists() ? Number(existingSnap.data().likes_count ?? 0) : 0;

    const docData = {
      book_id: data.book_id,
      user_id: uid,
      user_name: userName,
      book_snapshot: {
        title: bData.title ?? '',
        authors: bData.authors ?? [],
        cover_url: bData.cover_url ?? null,
      },
      rating: data.rating,
      title: data.title?.trim() || null,
      content: data.content.trim(),
      is_spoiler: Boolean(data.is_spoiler),
      is_hidden: false,
      likes_count: prevLikes,
      created_at: existingSnap.exists() ? existingSnap.data().created_at : serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(reviewRef, docData);
    await recomputeBookRating(data.book_id);

    const saved = mapReview(reviewId, {
      ...docData,
      created_at: existingSnap.exists() ? toIso(existingSnap.data().created_at) : new Date().toISOString(),
    });
    return { success: true, data: { review: saved } };
  },

  deleteReview: async (id: string, uid: string) => {
    if (!uid) throw makeApiError('Harus login untuk menghapus review.', 401);
    const db = requireDb();
    const ref = doc(db, 'reviews', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: true };
    const bookId = String(snap.data().book_id ?? '');
    await deleteDoc(ref);
    if (bookId) await recomputeBookRating(bookId);
    return { success: true, message: 'Review berhasil dihapus.' };
  },

  toggleReviewLike: async (reviewId: string, uid: string) => {
    const db = requireDb();
    const reviewRef = doc(db, 'reviews', reviewId);
    const likeRef = doc(db, 'reviews', reviewId, 'likes', uid);

    return runTransaction(db, async (tx) => {
      const [reviewSnap, likeSnap] = await Promise.all([tx.get(reviewRef), tx.get(likeRef)]);
      if (!reviewSnap.exists()) throw makeApiError('Review tidak ditemukan.', 404);
      const currentLikes = Number(reviewSnap.data().likes_count ?? 0);

      if (likeSnap.exists()) {
        tx.delete(likeRef);
        const nextCount = Math.max(0, currentLikes - 1);
        tx.update(reviewRef, { likes_count: increment(-1) });
        return { success: true, data: { liked: false, likes_count: nextCount } };
      }
      tx.set(likeRef, { user_id: uid, created_at: serverTimestamp() });
      const nextCount = currentLikes + 1;
      tx.update(reviewRef, { likes_count: increment(1) });
      return { success: true, data: { liked: true, likes_count: nextCount } };
    });
  },

  getUserLikedReviewIds: async (reviewIds: string[], uid: string): Promise<Set<string>> => {
    const db = getDb();
    if (!db || !uid || reviewIds.length === 0) return new Set();
    const snaps = await Promise.all(
      reviewIds.map((rid) => getDoc(doc(db, 'reviews', rid, 'likes', uid)).catch(() => null))
    );
    const set = new Set<string>();
    snaps.forEach((s, idx) => {
      if (s && s.exists()) set.add(reviewIds[idx]);
    });
    return set;
  },

  myReviews: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'reviews'),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(30)
      )
    );
    const items = snap.docs.map((d) => mapReview(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: paginate(items, 1, 30) };
  },

  // ---------- LISTINGS ----------
  getListings: async (params: Record<string, string> = {}) => {
    const db = getDb();
    if (!db) return { success: true, data: paginate<Listing>([], 1, 16) };

    const status = params.status === 'reserved' ? 'reserved' : 'active';
    const condition = (params.condition ?? '').trim();
    const sort = params.sort ?? 'newest';
    const page = Math.max(1, Number(params.page ?? '1') || 1);

    const constraints: QueryConstraint[] = [where('status', '==', status)];
    if (condition) constraints.push(where('condition', '==', condition));

    if (sort === 'price_asc') constraints.push(orderBy('price', 'asc'));
    else if (sort === 'price_desc') constraints.push(orderBy('price', 'desc'));
    else constraints.push(orderBy('created_at', 'desc'));

    constraints.push(limit(64));

    const snap = await getDocs(query(collection(db, 'listings'), ...constraints));
    let items = snap.docs.map((d) => mapListing(d.id, d.data() as Record<string, unknown>));

    const qTerm = (params.q ?? '').trim().toLowerCase();
    const cityTerm = (params.location_city ?? '').trim().toLowerCase();
    const minP = params.min_price !== undefined && params.min_price !== '' ? Number(params.min_price) : null;
    const maxP = params.max_price !== undefined && params.max_price !== '' ? Number(params.max_price) : null;
    const bookId = (params.book_id ?? '').trim();

    items = items.filter((l) => {
      if (bookId && l.book_id !== bookId) return false;
      if (qTerm) {
        const hay = `${l.book.title} ${(l.book.authors ?? []).join(' ')} ${l.book.isbn ?? ''} ${l.user.name}`.toLowerCase();
        if (!hay.includes(qTerm)) return false;
      }
      if (cityTerm && !l.location_city.toLowerCase().includes(cityTerm)) return false;
      if (minP !== null && Number.isFinite(minP) && l.price < minP) return false;
      if (maxP !== null && Number.isFinite(maxP) && l.price > maxP) return false;
      return true;
    });

    return { success: true, data: paginate(items, page, 16) };
  },

  getListing: async (id: string) => {
    const db = requireDb();
    const snap = await getDoc(doc(db, 'listings', id));
    if (!snap.exists()) {
      throw makeApiError('Listing tidak ditemukan.', 404);
    }

    const base = mapListing(snap.id, snap.data() as Record<string, unknown>);
    const [photos, sellerProfile, feedbackRes] = await Promise.all([
      getListingPhotos(id),
      getPublicProfile(base.user_id),
      api.getSellerFeedback(base.user_id).catch(() => null),
    ]);

    const mergedUser = sellerProfile ? mapUserSnapshot(base.user_id, sellerProfile) : base.user;
    if (feedbackRes?.data) {
      mergedUser.seller_rating_avg = feedbackRes.data.avg_rating;
      mergedUser.seller_rating_count = feedbackRes.data.count;
    }

    return {
      success: true,
      data: {
        listing: {
          ...base,
          user: mergedUser,
          images: photos.length > 0 ? photos : base.images,
        },
      },
    };
  },

  createListing: async (
    data: {
      book_id: string;
      condition: string;
      price: number;
      location_city: string;
      share_wa: boolean;
      wa_number: string | null;
      edition_note: string | null;
      description: string | null;
    },
    uid: string
  ) => {
    const db = requireDb();
    const [bookSnap, sellerProfile] = await Promise.all([
      getDoc(doc(db, 'books', data.book_id)),
      getPublicProfile(uid),
    ]);
    if (!bookSnap.exists()) throw makeApiError('Buku tidak ditemukan.', 404);
    const bData = bookSnap.data();

    const payload = {
      user_id: uid,
      book_id: data.book_id,
      seller_snapshot: {
        name: String(sellerProfile?.name ?? 'Penjual'),
        listings_count: Number(sellerProfile?.listings_count ?? 0) + 1,
        seller_rating_avg: sellerProfile?.seller_rating_avg ?? null,
        seller_rating_count: sellerProfile?.seller_rating_count ?? 0,
      },
      book_snapshot: {
        title: bData.title ?? '',
        authors: bData.authors ?? [],
        isbn: bData.isbn ?? null,
        cover_url: bData.cover_url ?? null,
        publisher: bData.publisher ?? null,
      },
      condition: data.condition,
      price: Number(data.price),
      location_city: data.location_city.trim(),
      location_city_lower: data.location_city.trim().toLowerCase(),
      share_wa: Boolean(data.share_wa),
      wa_number: data.share_wa ? data.wa_number : null,
      edition_note: data.edition_note ?? null,
      description: data.description ?? null,
      images: [] as string[],
      photos_count: 0,
      status: 'active',
      created_at: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'listings'), payload);
    await Promise.all([
      updateDoc(doc(db, 'public_profiles', uid), { listings_count: increment(1) }).catch(() => {}),
      syncBookListingStats(data.book_id).catch(() => {}),
    ]);

    return {
      success: true,
      message: 'Listing buku berhasil dibuat.',
      data: {
        listing: mapListing(ref.id, { ...payload, created_at: new Date().toISOString() }),
      },
    };
  },

  uploadListingImages: async (id: string, files: File[], uid: string) => {
    const db = requireDb();
    const { thumbUrl } = await uploadListingPhotos(id, uid, files);
    const snap = await getDoc(doc(db, 'listings', id));
    const listing = snap.exists()
      ? mapListing(snap.id, snap.data() as Record<string, unknown>)
      : ({ id, images: [thumbUrl] } as Listing);
    return {
      success: true,
      message: 'Foto berhasil diunggah.',
      data: { listing },
    };
  },

  updateListing: async (
    id: string,
    data: Partial<Pick<Listing, 'status' | 'price' | 'condition' | 'location_city' | 'description' | 'edition_note'>>,
    uid: string
  ) => {
    if (!uid) throw makeApiError('Harus login untuk mengubah listing.', 401);
    const db = requireDb();
    const ref = doc(db, 'listings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw makeApiError('Listing tidak ditemukan.', 404);
    const bookId = String(snap.data().book_id ?? '');

    await updateDoc(ref, {
      ...data,
      ...(data.location_city ? { location_city_lower: data.location_city.trim().toLowerCase() } : {}),
    });

    if (bookId && (data.status !== undefined || data.price !== undefined)) {
      await syncBookListingStats(bookId).catch(() => {});
    }
    const updated = await getDoc(ref);
    return {
      success: true,
      message: 'Listing berhasil diperbarui.',
      data: { listing: mapListing(updated.id, updated.data() as Record<string, unknown>) },
    };
  },

  deleteListing: async (id: string, uid: string) => {
    const db = requireDb();
    const ref = doc(db, 'listings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: true };
    const bookId = String(snap.data().book_id ?? '');

    const photosSnap = await getDocs(collection(db, 'listings', id, 'photos'));
    const batch = writeBatch(db);
    photosSnap.docs.forEach((p) => batch.delete(p.ref));
    batch.delete(ref);
    await batch.commit();

    await Promise.all([
      updateDoc(doc(db, 'public_profiles', uid), { listings_count: increment(-1) }).catch(() => {}),
      bookId ? syncBookListingStats(bookId).catch(() => {}) : Promise.resolve(),
    ]);

    return { success: true, message: 'Listing berhasil dihapus.' };
  },

  myListings: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'listings'),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(30)
      )
    );
    const items = snap.docs.map((d) => mapListing(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: paginate(items, 1, 30) };
  },

  // ---------- ORDERS (Atomik via runTransaction) ----------
  createOrder: async (
    data: { listing_id: string; buyer_name: string; buyer_note?: string },
    buyerUid: string
  ) => {
    const db = requireDb();
    const listingRef = doc(db, 'listings', data.listing_id);
    const orderRef = doc(collection(db, 'orders'));

    const created = await runTransaction(db, async (tx) => {
      const listingSnap = await tx.get(listingRef);
      if (!listingSnap.exists()) throw makeApiError('Listing tidak ditemukan.', 404);
      const l = listingSnap.data();

      if (l.status !== 'active') {
        throw makeApiError('Listing sudah tidak tersedia atau sedang dipesan.', 422);
      }
      if (l.user_id === buyerUid) {
        throw makeApiError('Tidak bisa membeli listing sendiri.', 422);
      }

      const nowIso = new Date().toISOString();
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const code = `BL-${nowIso.slice(0, 10).replace(/-/g, '')}-${rand}`;
      const sellerSnap = (l.seller_snapshot as Record<string, unknown> | undefined) ?? {};

      const orderDoc = {
        code,
        buyer_id: buyerUid,
        seller_id: String(l.user_id),
        listing_id: data.listing_id,
        book_id: String(l.book_id ?? ''),
        book_snapshot: l.book_snapshot ?? {},
        listing_condition: l.condition ?? 'good',
        listing_images: l.images ?? [],
        location_city: l.location_city ?? '',
        wa_number: l.wa_number ?? null,
        seller_name: String(sellerSnap.name ?? 'Penjual'),
        buyer_name: data.buyer_name.trim(),
        buyer_note: data.buyer_note?.trim() || null,
        price: Number(l.price ?? 0),
        payment_method: 'manual',
        payment_label: 'Transfer / COD Manual',
        status: 'pending',
        status_history: [{ status: 'pending', actor: 'buyer', at: nowIso }],
        feedback: null,
        created_at: serverTimestamp(),
      };

      tx.set(orderRef, orderDoc);
      tx.update(listingRef, { status: 'reserved' });

      return mapOrder(orderRef.id, { ...orderDoc, created_at: nowIso });
    });

    if (created.listing.book_id) {
      await syncBookListingStats(created.listing.book_id).catch(() => {});
    }

    return {
      success: true,
      message: 'Pesanan dibuat dan buku ditandai dipesan.',
      data: { order: created },
    };
  },

  myOrders: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'orders'),
        where('buyer_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(30)
      )
    );
    const items = snap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: paginate(items, 1, 30) };
  },

  mySales: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'orders'),
        where('seller_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(30)
      )
    );
    const items = snap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));
    return { success: true, data: paginate(items, 1, 30) };
  },

  updateOrderStatus: async (orderId: string, nextStatus: string, sellerUid: string) => {
    const db = requireDb();
    const orderRef = doc(db, 'orders', orderId);
    const allowed: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['done', 'cancelled'],
    };

    const updatedOrder = await runTransaction(db, async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw makeApiError('Pesanan tidak ditemukan.', 404);
      const o = orderSnap.data();

      if (o.seller_id !== sellerUid) {
        throw makeApiError('Tidak diizinkan mengubah pesanan ini.', 403);
      }

      const currentStatus = String(o.status ?? 'pending');
      if (!(allowed[currentStatus] ?? []).includes(nextStatus)) {
        throw makeApiError(
          `Transisi status dari '${currentStatus}' ke '${nextStatus}' tidak diizinkan.`,
          422
        );
      }

      const listingRef = doc(db, 'listings', String(o.listing_id));
      const listingSnap = await tx.get(listingRef);

      const history = Array.isArray(o.status_history) ? [...o.status_history] : [];
      history.push({ status: nextStatus, actor: 'seller', at: new Date().toISOString() });

      tx.update(orderRef, { status: nextStatus, status_history: history });

      if (listingSnap.exists()) {
        if (nextStatus === 'done') {
          tx.update(listingRef, { status: 'sold' });
        } else if (nextStatus === 'cancelled' && listingSnap.data().status === 'reserved') {
          tx.update(listingRef, { status: 'active' });
        }
      }

      return mapOrder(orderId, { ...o, status: nextStatus, status_history: history });
    });

    if (updatedOrder.listing.book_id && nextStatus === 'cancelled') {
      await syncBookListingStats(updatedOrder.listing.book_id).catch(() => {});
    }

    return {
      success: true,
      message: `Status pesanan diperbarui.`,
      data: { order: updatedOrder },
    };
  },

  cancelOrder: async (orderId: string, buyerUid: string) => {
    const db = requireDb();
    const orderRef = doc(db, 'orders', orderId);

    const bookId = await runTransaction(db, async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw makeApiError('Pesanan tidak ditemukan.', 404);
      const o = orderSnap.data();

      if (o.buyer_id !== buyerUid) {
        throw makeApiError('Tidak diizinkan membatalkan pesanan ini.', 403);
      }
      if (o.status !== 'pending') {
        throw makeApiError('Hanya pesanan menunggu konfirmasi yang dapat dibatalkan.', 422);
      }

      const listingRef = doc(db, 'listings', String(o.listing_id));
      const listingSnap = await tx.get(listingRef);

      const history = Array.isArray(o.status_history) ? [...o.status_history] : [];
      history.push({ status: 'cancelled', actor: 'buyer', at: new Date().toISOString() });

      tx.update(orderRef, { status: 'cancelled', status_history: history });
      if (listingSnap.exists() && listingSnap.data().status === 'reserved') {
        tx.update(listingRef, { status: 'active' });
      }
      return String(o.book_id ?? '');
    });

    if (bookId) await syncBookListingStats(bookId).catch(() => {});
    return { success: true, message: 'Pesanan dibatalkan dan listing kembali tersedia.' };
  },

  submitOrderFeedback: async (
    orderId: string,
    data: { rating: number; comment?: string },
    buyerUid: string
  ) => {
    const db = requireDb();
    const orderRef = doc(db, 'orders', orderId);
    const fbRef = doc(db, 'seller_feedback', orderId);

    const { feedback, sellerId } = await runTransaction(db, async (tx) => {
      const [orderSnap, fbSnap] = await Promise.all([tx.get(orderRef), tx.get(fbRef)]);
      if (!orderSnap.exists()) throw makeApiError('Pesanan tidak ditemukan.', 404);
      const o = orderSnap.data();

      if (o.buyer_id !== buyerUid) throw makeApiError('Tidak diizinkan.', 403);
      if (o.status !== 'done') {
        throw makeApiError('Feedback hanya dapat dikirim setelah pesanan selesai.', 422);
      }
      if (fbSnap.exists() || o.feedback) {
        throw makeApiError('Feedback untuk pesanan ini sudah dikirim.', 422);
      }

      const sellerUid = String(o.seller_id);
      const sellerProfRef = doc(db, 'public_profiles', sellerUid);
      const sellerProfSnap = await tx.get(sellerProfRef);

      const fbPayload = {
        order_id: orderId,
        buyer_id: buyerUid,
        buyer_name: String(o.buyer_name ?? 'Pembeli'),
        seller_id: sellerUid,
        rating: data.rating,
        comment: data.comment?.trim() || null,
        created_at: serverTimestamp(),
      };

      const prevCount = sellerProfSnap.exists()
        ? Number(sellerProfSnap.data().seller_rating_count ?? 0)
        : 0;
      const prevAvg = sellerProfSnap.exists()
        ? Number(sellerProfSnap.data().seller_rating_avg ?? 0)
        : 0;
      const nextCount = prevCount + 1;
      const nextAvg = Math.round(((prevAvg * prevCount + data.rating) / nextCount) * 100) / 100;

      tx.set(fbRef, fbPayload);
      tx.update(orderRef, {
        feedback: {
          id: orderId,
          order_id: orderId,
          buyer_id: buyerUid,
          seller_id: sellerUid,
          rating: data.rating,
          comment: data.comment?.trim() || null,
          created_at: new Date().toISOString(),
        },
      });
      if (sellerProfSnap.exists()) {
        tx.update(sellerProfRef, {
          seller_rating_avg: nextAvg,
          seller_rating_count: nextCount,
        });
      }

      return {
        sellerId: sellerUid,
        feedback: {
          id: orderId,
          order_id: orderId,
          buyer_id: buyerUid,
          seller_id: sellerUid,
          rating: data.rating,
          comment: data.comment?.trim() || null,
          created_at: new Date().toISOString(),
        } as SellerFeedback,
      };
    });

    void sellerId;
    return {
      success: true,
      message: 'Feedback transaksi berhasil disimpan.',
      data: { feedback },
    };
  },

  getSellerFeedback: async (sellerId: string) => {
    const db = getDb();
    if (!db) {
      return { success: true, data: { avg_rating: null, count: 0, feedbacks: [] as SellerFeedback[] } };
    }

    const snap = await getDocs(
      query(
        collection(db, 'seller_feedback'),
        where('seller_id', '==', sellerId),
        orderBy('created_at', 'desc'),
        limit(20)
      )
    );
    const feedbacks: SellerFeedback[] = snap.docs.map((d) => {
      const f = d.data();
      return {
        id: d.id,
        order_id: String(f.order_id ?? d.id),
        buyer_id: String(f.buyer_id ?? ''),
        seller_id: String(f.seller_id ?? sellerId),
        rating: Number(f.rating ?? 5),
        comment: (f.comment as string | null) ?? null,
        created_at: toIso(f.created_at),
        buyer: { id: String(f.buyer_id ?? ''), name: String(f.buyer_name ?? 'Pembeli'), email: '' },
      };
    });
    const count = feedbacks.length;
    const avg_rating =
      count > 0
        ? Math.round((feedbacks.reduce((s, f) => s + f.rating, 0) / count) * 100) / 100
        : null;

    return { success: true, data: { avg_rating, count, feedbacks } };
  },

  // ---------- REAL-TIME CHAT ----------
  getConversations: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', uid),
        orderBy('last_message_at', 'desc'),
        limit(30)
      )
    );
    const items = snap.docs.map((d) => mapConversation(d.id, d.data() as Record<string, unknown>, uid));
    return { success: true, data: paginate(items, 1, 30) };
  },

  subscribeConversations: (
    uid: string,
    onData: (items: Conversation[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe => {
    const db = getDb();
    if (!db) return () => {};
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('last_message_at', 'desc'),
      limit(30)
    );
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => mapConversation(d.id, d.data() as Record<string, unknown>, uid)));
      },
      (err) => onError?.(err)
    );
  },

  createConversation: async (listingId: string, buyerUid: string) => {
    const db = requireDb();
    const convId = `${listingId}_${buyerUid}`;
    const convRef = doc(db, 'conversations', convId);
    const existing = await getDoc(convRef);
    if (existing.exists()) {
      return {
        success: true,
        data: {
          conversation: mapConversation(
            existing.id,
            existing.data() as Record<string, unknown>,
            buyerUid
          ),
        },
      };
    }

    const [listingSnap, buyerProf] = await Promise.all([
      getDoc(doc(db, 'listings', listingId)),
      getPublicProfile(buyerUid),
    ]);
    if (!listingSnap.exists()) throw makeApiError('Listing tidak ditemukan.', 404);
    const l = listingSnap.data();

    if (l.user_id === buyerUid) {
      throw makeApiError('Tidak bisa chat dengan listing sendiri.', 422);
    }

    const sellerUid = String(l.user_id);
    const sellerSnap = (l.seller_snapshot as Record<string, unknown> | undefined) ?? {};
    const bookSnap = (l.book_snapshot as Record<string, unknown> | undefined) ?? {};

    const payload = {
      listing_id: listingId,
      buyer_id: buyerUid,
      seller_id: sellerUid,
      participants: [buyerUid, sellerUid],
      buyer_name: String(buyerProf?.name ?? 'Pembeli'),
      seller_name: String(sellerSnap.name ?? 'Penjual'),
      listing_snapshot: {
        book_id: String(l.book_id ?? ''),
        book_title: String(bookSnap.title ?? 'Buku'),
        book_authors: Array.isArray(bookSnap.authors) ? bookSnap.authors : [],
        book_cover_url: bookSnap.cover_url ?? null,
        condition: l.condition ?? 'good',
        price: Number(l.price ?? 0),
        location_city: l.location_city ?? '',
        images: Array.isArray(l.images) ? l.images : [],
        status: l.status ?? 'active',
      },
      last_message: null,
      last_message_at: serverTimestamp(),
      created_at: serverTimestamp(),
    };

    await setDoc(convRef, payload);
    return {
      success: true,
      data: {
        conversation: mapConversation(
          convId,
          { ...payload, last_message_at: new Date().toISOString(), created_at: new Date().toISOString() },
          buyerUid
        ),
      },
    };
  },

  getConversation: async (convId: string, currentUid: string) => {
    const db = requireDb();
    const snap = await getDoc(doc(db, 'conversations', convId));
    if (!snap.exists()) throw makeApiError('Percakapan tidak ditemukan.', 404);
    return {
      success: true,
      data: {
        conversation: mapConversation(snap.id, snap.data() as Record<string, unknown>, currentUid),
      },
    };
  },

  getMessages: async (convId: string, uid: string) => {
    if (!uid) throw makeApiError('Harus login untuk membaca pesan.', 401);
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'conversations', convId, 'messages'),
        orderBy('created_at', 'desc'),
        limit(60)
      )
    );
    const items: Message[] = snap.docs.map((d) => {
      const m = d.data();
      return {
        id: d.id,
        conversation_id: convId,
        user_id: String(m.user_id ?? ''),
        content: String(m.content ?? ''),
        read_at: m.read_at ? toIso(m.read_at) : null,
        created_at: toIso(m.created_at),
        user: { id: String(m.user_id ?? ''), name: String(m.user_name ?? ''), email: '' },
      };
    });
    return { success: true, data: paginate(items, 1, 60) };
  },

  subscribeMessages: (
    convId: string,
    currentUid: string,
    onData: (messages: Message[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe => {
    const db = getDb();
    if (!db) return () => {};
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('created_at', 'asc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: Message[] = [];
        const unreadRefs: typeof snap.docs[number]['ref'][] = [];

        snap.docs.forEach((d) => {
          const m = d.data();
          if (m.user_id !== currentUid && !m.read_at) {
            unreadRefs.push(d.ref);
          }
          list.push({
            id: d.id,
            conversation_id: convId,
            user_id: String(m.user_id ?? ''),
            content: String(m.content ?? ''),
            read_at: m.read_at ? toIso(m.read_at) : null,
            created_at: toIso(m.created_at),
            user: { id: String(m.user_id ?? ''), name: String(m.user_name ?? ''), email: '' },
          });
        });

        onData(list);

        if (unreadRefs.length > 0) {
          const batch = writeBatch(db);
          unreadRefs.slice(0, 20).forEach((ref) => batch.update(ref, { read_at: serverTimestamp() }));
          batch.commit().catch(() => {});
        }
      },
      (err) => onError?.(err)
    );
  },

  sendMessage: async (convId: string, content: string, uid: string) => {
    const db = requireDb();
    const prof = await getPublicProfile(uid);
    const clean = content.trim();
    const msgRef = await addDoc(collection(db, 'conversations', convId, 'messages'), {
      conversation_id: convId,
      user_id: uid,
      user_name: String(prof?.name ?? 'Pengguna'),
      content: clean,
      read_at: null,
      created_at: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', convId), {
      last_message: {
        user_id: uid,
        content: clean,
        created_at: new Date().toISOString(),
      },
      last_message_at: serverTimestamp(),
    });
    return { success: true, data: { id: msgRef.id } };
  },

  // ---------- SHELVES, LISTS & RECOMMENDATIONS ----------
  myShelves: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(collection(db, 'users', uid, 'shelves'));
    const shelves: ReadingShelfItem[] = snap.docs.map((d) => {
      const s = d.data();
      const bSnap = s.book_snapshot as Record<string, unknown> | undefined;
      return {
        id: d.id,
        user_id: uid,
        book_id: String(s.book_id ?? d.id),
        shelf: (s.shelf as ShelfKey) ?? 'want_to_read',
        book: bSnap ? mapBook(String(s.book_id ?? d.id), bSnap) : undefined,
      };
    });

    const stats: ShelfStats = {
      want_to_read: shelves.filter((s) => s.shelf === 'want_to_read').length,
      reading: shelves.filter((s) => s.shelf === 'reading').length,
      finished: shelves.filter((s) => s.shelf === 'finished').length,
      total: shelves.length,
    };

    return { success: true, data: { shelves, stats } };
  },

  getBookShelf: async (bookId: string, uid: string) => {
    const db = requireDb();
    const snap = await getDoc(doc(db, 'users', uid, 'shelves', bookId));
    if (!snap.exists()) return { success: true, data: { shelf: null } };
    const s = snap.data();
    return {
      success: true,
      data: {
        shelf: {
          id: snap.id,
          user_id: uid,
          book_id: bookId,
          shelf: s.shelf as ShelfKey,
        } as ReadingShelfItem,
      },
    };
  },

  upsertShelf: async (bookId: string, shelf: ShelfKey, uid: string) => {
    const db = requireDb();
    const bookSnap = await getDoc(doc(db, 'books', bookId));
    const bData = bookSnap.exists() ? (bookSnap.data() as Record<string, unknown>) : {};
    const ref = doc(db, 'users', uid, 'shelves', bookId);

    await setDoc(ref, {
      user_id: uid,
      book_id: bookId,
      shelf,
      book_snapshot: {
        title: bData.title ?? '',
        authors: bData.authors ?? [],
        cover_url: bData.cover_url ?? null,
        categories: bData.categories ?? [],
        avg_rating: bData.avg_rating ?? null,
        ratings_count: bData.ratings_count ?? 0,
        active_listings_count: bData.active_listings_count ?? 0,
        min_price: bData.min_price ?? null,
      },
      updated_at: serverTimestamp(),
    });

    return {
      success: true,
      data: { shelf: { id: bookId, user_id: uid, book_id: bookId, shelf } as ReadingShelfItem },
    };
  },

  removeShelf: async (bookId: string, uid: string) => {
    const db = requireDb();
    await deleteDoc(doc(db, 'users', uid, 'shelves', bookId));
    return { success: true };
  },

  getRecommendations: async (uid: string) => {
    const db = requireDb();
    const shelvesRes = await api.myShelves(uid);
    const shelvedIds = new Set(shelvesRes.data.shelves.map((s) => s.book_id));
    const genreCounts = new Map<string, number>();

    shelvesRes.data.shelves.forEach((item) => {
      (item.book?.categories ?? []).forEach((cat) => {
        genreCounts.set(cat, (genreCounts.get(cat) ?? 0) + 1);
      });
    });

    const basis_genres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g);

    let candidateBooks: Book[] = [];
    if (basis_genres.length > 0) {
      const snap = await getDocs(
        query(
          collection(db, 'books'),
          where('categories', 'array-contains-any', basis_genres),
          limit(24)
        )
      );
      candidateBooks = snap.docs.map((d) => mapBook(d.id, d.data() as Record<string, unknown>));
    } else {
      const pop = await api.popularBooks(12);
      candidateBooks = pop.data.books;
    }

    const books = candidateBooks
      .filter((b) => !shelvedIds.has(b.id))
      .sort((a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0))
      .slice(0, 8);

    return { success: true, data: { basis_genres, books } };
  },

  myLists: async (uid: string) => {
    const db = requireDb();
    const snap = await getDocs(
      query(
        collection(db, 'book_lists'),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(20)
      )
    );
    const lists: BookList[] = snap.docs.map((d) => {
      const l = d.data();
      return {
        id: d.id,
        user_id: uid,
        title: String(l.title ?? ''),
        description: (l.description as string | null) ?? null,
        is_public: Boolean(l.is_public),
        books_count: typeof l.books_count === 'number' ? l.books_count : 0,
      };
    });
    return { success: true, data: { lists } };
  },

  createList: async (
    data: { title: string; description?: string; is_public?: boolean },
    uid: string
  ) => {
    const db = requireDb();
    const payload = {
      user_id: uid,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      is_public: data.is_public ?? true,
      book_ids: [] as string[],
      books_count: 0,
      created_at: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'book_lists'), payload);
    return {
      success: true,
      data: {
        list: {
          id: ref.id,
          user_id: uid,
          title: payload.title,
          description: payload.description,
          is_public: payload.is_public,
          books_count: 0,
        } as BookList,
      },
    };
  },

  deleteList: async (id: string, uid: string) => {
    if (!uid) throw makeApiError('Harus login untuk menghapus daftar.', 401);
    const db = requireDb();
    await deleteDoc(doc(db, 'book_lists', id));
    return { success: true };
  },

  // ---------- KOMUNITAS, KLUB BACA & MODERASI ----------
  getClubs: async () => {
    const db = getDb();
    if (!db) return { success: true, data: paginate<ReadingClub>([], 1, 20) };
    const snap = await getDocs(
      query(collection(db, 'reading_clubs'), orderBy('created_at', 'desc'), limit(30))
    );
    const items: ReadingClub[] = snap.docs.map((d) => {
      const c = d.data();
      return {
        id: d.id,
        creator_id: String(c.creator_id ?? ''),
        name: String(c.name ?? ''),
        description: (c.description as string | null) ?? null,
        current_book_id: (c.current_book_id as string | null) ?? null,
        schedule_note: (c.schedule_note as string | null) ?? null,
        members_count: typeof c.members_count === 'number' ? c.members_count : 1,
        topics_count: typeof c.topics_count === 'number' ? c.topics_count : 0,
      };
    });
    return { success: true, data: paginate(items, 1, 30) };
  },

  getUserJoinedClubIds: async (clubIds: string[], uid: string): Promise<Set<string>> => {
    const db = getDb();
    if (!db || !uid || clubIds.length === 0) return new Set();
    const snaps = await Promise.all(
      clubIds.map((cid) => getDoc(doc(db, 'reading_clubs', cid, 'members', uid)).catch(() => null))
    );
    const joined = new Set<string>();
    snaps.forEach((s, i) => {
      if (s && s.exists()) joined.add(clubIds[i]);
    });
    return joined;
  },

  createClub: async (
    data: { name: string; description?: string; schedule_note?: string },
    uid: string
  ) => {
    const db = requireDb();
    const payload = {
      creator_id: uid,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      current_book_id: null,
      schedule_note: data.schedule_note?.trim() || null,
      members_count: 1,
      topics_count: 0,
      created_at: serverTimestamp(),
    };
    const clubRef = await addDoc(collection(db, 'reading_clubs'), payload);
    await setDoc(doc(db, 'reading_clubs', clubRef.id, 'members', uid), {
      user_id: uid,
      joined_at: serverTimestamp(),
    });
    return {
      success: true,
      data: {
        club: {
          id: clubRef.id,
          creator_id: uid,
          name: payload.name,
          description: payload.description,
          current_book_id: null,
          schedule_note: payload.schedule_note,
          members_count: 1,
          topics_count: 0,
        } as ReadingClub,
      },
    };
  },

  joinClub: async (clubId: string, uid: string) => {
    const db = requireDb();
    const clubRef = doc(db, 'reading_clubs', clubId);
    const memberRef = doc(db, 'reading_clubs', clubId, 'members', uid);

    const already = await runTransaction(db, async (tx) => {
      const [clubSnap, memberSnap] = await Promise.all([tx.get(clubRef), tx.get(memberRef)]);
      if (!clubSnap.exists()) throw makeApiError('Klub baca tidak ditemukan.', 404);
      if (memberSnap.exists()) return true;
      tx.set(memberRef, { user_id: uid, joined_at: serverTimestamp() });
      tx.update(clubRef, { members_count: increment(1) });
      return false;
    });

    return {
      success: true,
      alreadyJoined: already,
      message: already ? 'Kamu sudah menjadi anggota klub ini.' : 'Berhasil bergabung ke klub baca.',
    };
  },

  getDiscussions: async (params: Record<string, string> = {}) => {
    const db = getDb();
    if (!db) return { success: true, data: paginate<DiscussionTopic>([], 1, 20) };

    const constraints: QueryConstraint[] = [];
    if (params.book_id) constraints.push(where('book_id', '==', params.book_id));
    else if (params.reading_club_id)
      constraints.push(where('reading_club_id', '==', params.reading_club_id));
    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(25));

    const snap = await getDocs(query(collection(db, 'discussions'), ...constraints));
    const items: DiscussionTopic[] = snap.docs.map((d) => {
      const t = d.data();
      return {
        id: d.id,
        book_id: (t.book_id as string | null) ?? null,
        reading_club_id: (t.reading_club_id as string | null) ?? null,
        user_id: String(t.user_id ?? ''),
        title: String(t.title ?? ''),
        body: String(t.body ?? ''),
        is_spoiler: Boolean(t.is_spoiler),
        replies_count: typeof t.replies_count === 'number' ? t.replies_count : 0,
        created_at: toIso(t.created_at),
        user: { id: String(t.user_id ?? ''), name: String(t.user_name ?? 'Pembaca'), email: '' },
        book: t.book_id && t.book_title ? { id: String(t.book_id), title: String(t.book_title) } : null,
        club:
          t.reading_club_id && t.club_name
            ? { id: String(t.reading_club_id), name: String(t.club_name) }
            : null,
      };
    });

    return { success: true, data: paginate(items, 1, 25) };
  },

  getDiscussion: async (id: string) => {
    const db = requireDb();
    const [topicSnap, repliesSnap] = await Promise.all([
      getDoc(doc(db, 'discussions', id)),
      getDocs(
        query(collection(db, 'discussions', id, 'replies'), orderBy('created_at', 'asc'), limit(100))
      ),
    ]);
    if (!topicSnap.exists()) throw makeApiError('Topik diskusi tidak ditemukan.', 404);
    const t = topicSnap.data();

    const replies: DiscussionReply[] = repliesSnap.docs.map((r) => {
      const rd = r.data();
      return {
        id: r.id,
        discussion_topic_id: id,
        user_id: String(rd.user_id ?? ''),
        body: String(rd.body ?? ''),
        is_spoiler: Boolean(rd.is_spoiler),
        created_at: toIso(rd.created_at),
        user: { id: String(rd.user_id ?? ''), name: String(rd.user_name ?? 'Pembaca'), email: '' },
      };
    });

    const topic: DiscussionTopic = {
      id: topicSnap.id,
      book_id: (t.book_id as string | null) ?? null,
      reading_club_id: (t.reading_club_id as string | null) ?? null,
      user_id: String(t.user_id ?? ''),
      title: String(t.title ?? ''),
      body: String(t.body ?? ''),
      is_spoiler: Boolean(t.is_spoiler),
      replies_count: replies.length,
      created_at: toIso(t.created_at),
      user: { id: String(t.user_id ?? ''), name: String(t.user_name ?? 'Pembaca'), email: '' },
      book: t.book_id && t.book_title ? { id: String(t.book_id), title: String(t.book_title) } : null,
      replies,
    };

    return { success: true, data: { topic } };
  },

  createDiscussion: async (
    data: { book_id?: string; reading_club_id?: string; title: string; body: string; is_spoiler?: boolean },
    uid: string
  ) => {
    const db = requireDb();
    const [prof, bookSnap] = await Promise.all([
      getPublicProfile(uid),
      data.book_id ? getDoc(doc(db, 'books', data.book_id)) : Promise.resolve(null),
    ]);

    const payload = {
      book_id: data.book_id ?? null,
      book_title: bookSnap && bookSnap.exists() ? String(bookSnap.data().title ?? '') : null,
      reading_club_id: data.reading_club_id ?? null,
      club_name: null,
      user_id: uid,
      user_name: String(prof?.name ?? 'Pembaca'),
      title: data.title.trim(),
      body: data.body.trim(),
      is_spoiler: Boolean(data.is_spoiler),
      replies_count: 0,
      created_at: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'discussions'), payload);
    return {
      success: true,
      data: {
        topic: {
          id: ref.id,
          book_id: payload.book_id,
          reading_club_id: payload.reading_club_id,
          user_id: uid,
          title: payload.title,
          body: payload.body,
          is_spoiler: payload.is_spoiler,
          replies_count: 0,
          created_at: new Date().toISOString(),
          user: { id: uid, name: payload.user_name, email: '' },
        } as DiscussionTopic,
      },
    };
  },

  replyDiscussion: async (
    topicId: string,
    data: { body: string; is_spoiler?: boolean },
    uid: string
  ) => {
    const db = requireDb();
    const prof = await getPublicProfile(uid);
    const replyPayload = {
      discussion_topic_id: topicId,
      user_id: uid,
      user_name: String(prof?.name ?? 'Pembaca'),
      body: data.body.trim(),
      is_spoiler: Boolean(data.is_spoiler),
      created_at: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'discussions', topicId, 'replies'), replyPayload);
    await updateDoc(doc(db, 'discussions', topicId), {
      replies_count: increment(1),
    }).catch(() => {});

    return {
      success: true,
      data: {
        reply: {
          id: ref.id,
          discussion_topic_id: topicId,
          user_id: uid,
          body: replyPayload.body,
          is_spoiler: replyPayload.is_spoiler,
          created_at: new Date().toISOString(),
          user: { id: uid, name: replyPayload.user_name, email: '' },
        } as DiscussionReply,
      },
    };
  },

  reportContent: async (
    data: {
      reportable_type: 'review' | 'discussion_topic' | 'discussion_reply' | 'listing';
      reportable_id: string;
      category?: string;
      reason: string;
    },
    uid: string
  ) => {
    const db = requireDb();
    await addDoc(collection(db, 'reports'), {
      reporter_id: uid,
      reportable_type: data.reportable_type,
      reportable_id: data.reportable_id,
      category: data.category ?? 'lainnya',
      reason: data.reason.trim(),
      status: 'open',
      created_at: serverTimestamp(),
    });
    return {
      success: true,
      message: 'Laporan telah dikirim ke tim moderasi BukuLapak.',
    };
  },
};
