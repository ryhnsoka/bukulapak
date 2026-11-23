'use client';

import { sendGAEvent } from '@next/third-parties/google';

const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? '';
const GA_ENABLED = /^G-[A-Z0-9]+$/i.test(RAW_GA_ID);

export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !GA_ENABLED || !eventName) return;
  try {
    sendGAEvent('event', eventName, params);
  } catch {
    /* Abaikan kegagalan analytics (mis. diblokir ad-blocker) agar UX tetap berjalan */
  }
}

export function trackSearch(searchTerm: string, scope: 'home' | 'books' | 'marketplace'): void {
  const clean = searchTerm.trim().slice(0, 100);
  if (!clean) return;
  trackEvent('search', {
    search_term: clean,
    search_scope: scope,
  });
}

export function trackViewBook(book: {
  id: string;
  title: string;
  categories?: string[] | null;
  min_price?: number | null;
}): void {
  const value = typeof book.min_price === 'number' && book.min_price >= 0 ? book.min_price : 0;
  trackEvent('view_item', {
    currency: 'IDR',
    value,
    item_type: 'book',
    items: [
      {
        item_id: book.id,
        item_name: book.title.slice(0, 120),
        item_category: book.categories?.[0] ?? 'Buku',
      },
    ],
  });
}

export function trackViewListing(listing: {
  id: string;
  book_id: string;
  title: string;
  price: number;
  condition: string;
}): void {
  const value = Number.isFinite(listing.price) && listing.price >= 0 ? listing.price : 0;
  trackEvent('view_item', {
    currency: 'IDR',
    value,
    item_type: 'listing',
    listing_condition: listing.condition,
    items: [
      {
        item_id: listing.id,
        item_name: listing.title.slice(0, 120),
        item_category: listing.condition,
        price: value,
        quantity: 1,
      },
    ],
  });
}

export function trackPublishListing(data: {
  listingId: string;
  price: number;
  condition: string;
  photosCount: number;
  isbnFormat?: string;
}): void {
  trackEvent('publish_listing', {
    currency: 'IDR',
    value: Number.isFinite(data.price) && data.price >= 0 ? data.price : 0,
    listing_id: data.listingId,
    condition: data.condition,
    photos_count: data.photosCount,
    ...(data.isbnFormat ? { isbn_format: data.isbnFormat } : {}),
  });
}

export function trackContactSeller(
  method: 'in_app_chat' | 'whatsapp',
  listingId: string
): void {
  trackEvent('contact_seller', {
    method,
    listing_id: listingId,
  });
}

export function trackBeginCheckout(data: {
  listingId: string;
  price: number;
  condition: string;
}): void {
  trackEvent('begin_checkout', {
    currency: 'IDR',
    value: Number.isFinite(data.price) && data.price >= 0 ? data.price : 0,
    listing_id: data.listingId,
    condition: data.condition,
  });
}

export function trackOrderStatusUpdated(status: string): void {
  trackEvent('order_status_updated', {
    order_status: status,
  });
}

export function trackSubmitReview(data: {
  bookId: string;
  rating: number;
  hasSpoiler: boolean;
}): void {
  trackEvent('submit_review', {
    book_id: data.bookId,
    rating: data.rating,
    has_spoiler: data.hasSpoiler,
  });
}

export function trackUpdateReadingShelf(data: { bookId: string; shelf: string }): void {
  trackEvent('update_reading_shelf', {
    book_id: data.bookId,
    shelf: data.shelf,
  });
}

export function trackJoinReadingClub(clubId: string): void {
  trackEvent('join_reading_club', {
    club_id: clubId,
  });
}

export function trackAuth(action: 'login' | 'sign_up', method: 'email' | 'demo'): void {
  trackEvent(action, { method });
}
