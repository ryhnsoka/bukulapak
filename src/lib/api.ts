const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export interface ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message ?? 'Request gagal') as ApiError;
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data as T;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Book {
  id: number;
  open_library_id: string | null;
  isbn: string | null;
  title: string;
  authors: string[] | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  cover_url: string | null;
  categories: string[] | null;
  page_count: number | null;
  avg_rating: number | null;
  ratings_count: number;
  reviews_count?: number;
  reviews?: Review[];
  listings?: Listing[];
}

export interface Review {
  id: number;
  user_id: number;
  book_id: number;
  rating: number;
  title: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  user: User;
  book?: Book;
}

export interface Listing {
  id: number;
  user_id: number;
  book_id: number;
  condition: string;
  condition_label?: string;
  price: number;
  location_city: string;
  wa_number: string | null;
  description: string | null;
  images: string[] | null;
  status: string;
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
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  last_message_at: string | null;
  listing: Listing;
  buyer: User;
  seller: User;
  other_party: User;
  last_message?: Message | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
  user: User;
}

export interface Order {
  id: number;
  code: string;
  buyer_id: number;
  listing_id: number;
  seller_id: number;
  price: number;
  payment_method: string;
  payment_label?: string;
  buyer_name: string;
  buyer_note: string | null;
  payment_proof: string | null;
  status: string;
  status_label?: string;
  created_at: string;
  listing: Listing;
  seller: User;
  buyer: User;
}

export const api = {
  health: () => request<{ status: string; app: string }>('/health'),
  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; message: string; data: { user: User; token: string } }>(
      '/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<{ success: boolean; message: string; data: { user: User; token: string } }>(
      '/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: (token: string) => request('/logout', { method: 'POST' }, token),
  me: (token: string) => request<{ success: boolean; data: { user: User } }>('/me', {}, token),

  searchBooks: (q: string) =>
    request<{ success: boolean; data: { books: Book[] } }>(`/books/search?q=${encodeURIComponent(q)}`),
  getBook: (id: number) =>
    request<{ success: boolean; data: { book: Book } }>(`/books/${id}`),
  popularBooks: (limit = 10) =>
    request<{ success: boolean; data: { books: Book[] } }>(`/books/popular?limit=${limit}`),
  getBooks: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: Paginated<Book> }>(`/books?${qs}`);
  },
  storeBook: (data: Partial<Book>, token: string) =>
    request<{ success: boolean; data: { book: Book } }>('/books', { method: 'POST', body: JSON.stringify(data) }, token),

  getReviews: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: Paginated<Review> }>(`/reviews?${qs}`);
  },
  createReview: (data: { book_id: number; rating: number; title?: string; content: string }, token: string) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteReview: (id: number, token: string) =>
    request(`/reviews/${id}`, { method: 'DELETE' }, token),
  toggleReviewLike: (id: number, token: string) =>
    request<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/reviews/${id}/like`, { method: 'POST' }, token),
  myReviews: (token: string) =>
    request<{ success: boolean; data: Paginated<Review> }>('/reviews/my', {}, token),

  getListings: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: Paginated<Listing> }>(`/listings?${qs}`);
  },
  getListing: (id: number) =>
    request<{ success: boolean; data: { listing: Listing } }>(`/listings/${id}`),
  createListing: (data: object, token: string) =>
    request('/listings', { method: 'POST', body: JSON.stringify(data) }, token),
  updateListing: (id: number, data: object, token: string) =>
    request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  uploadListingImages: async (id: number, files: File[], token: string) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos[]', f));
    const res = await fetch(`${API_BASE}/listings/${id}/images`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message ?? 'Upload gagal') as ApiError;
      err.status = res.status;
      err.errors = data.errors;
      throw err;
    }
    return data as { success: boolean; message: string; data: { listing: Listing } };
  },
  deleteListing: (id: number, token: string) =>
    request(`/listings/${id}`, { method: 'DELETE' }, token),
  myListings: (token: string) =>
    request<{ success: boolean; data: Paginated<Listing> }>('/listings/my', {}, token),

  toggleBookmark: (type: string, id: number, token: string) =>
    request('/bookmarks', { method: 'POST', body: JSON.stringify({ bookmarkable_type: type, bookmarkable_id: id }) }, token),
  myBookmarks: (token: string) =>
    request<{ success: boolean; data: Paginated<any> }>('/bookmarks/my', {}, token),

  getConversations: (token: string) =>
    request<{ success: boolean; data: Paginated<Conversation> }>('/conversations', {}, token),
  createConversation: (listingId: number, token: string) =>
    request<{ success: boolean; data: { conversation: Conversation } }>('/conversations', { method: 'POST', body: JSON.stringify({ listing_id: listingId }) }, token),
  getMessages: (id: number, token: string) =>
    request<{ success: boolean; data: Paginated<Message> }>(`/conversations/${id}/messages`, {}, token),
  sendMessage: (id: number, content: string, token: string) =>
    request(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  createOrder: (data: { listing_id: number; buyer_name: string; buyer_note?: string }, token: string) =>
    request<{ success: boolean; message: string; data: { order: Order } }>('/orders', { method: 'POST', body: JSON.stringify(data) }, token),
  myOrders: (token: string) =>
    request<{ success: boolean; data: Paginated<Order> }>('/orders/my', {}, token),
  mySales: (token: string) =>
    request<{ success: boolean; data: Paginated<Order> }>('/orders/sales', {}, token),
  updateOrderStatus: (id: number, status: string, token: string) =>
    request<{ success: boolean; message: string; data: { order: Order } }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),
  cancelOrder: (id: number, token: string) =>
    request<{ success: boolean; message: string }>(`/orders/${id}`, { method: 'DELETE' }, token),
};
