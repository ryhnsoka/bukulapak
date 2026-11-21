'use client';

import Link from 'next/link';
import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/books', label: 'Jelajahi Buku' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/komunitas', label: 'Komunitas' },
  { href: '/jual', label: 'Jual Buku' },
];

function isRouteActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <div className="hidden md:flex items-center gap-2 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = isRouteActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-lg transition ${
              active
                ? 'bg-forest-900 text-white font-bold shadow-[inset_0_-2px_0_#fef9e7]'
                : 'text-cream/90 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = isRouteActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={`px-3 py-2 rounded-lg transition ${
              active
                ? 'bg-forest-900 text-white font-bold border-l-4 border-cream'
                : 'text-cream/90 hover:bg-forest-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const { user, ready, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const mobileDrawerId = useId();
  const router = useRouter();

  useEffect(() => {
    const pop = popoverRef.current;
    const btn = triggerRef.current;
    if (!pop || !btn) return;

    const placePopover = () => {
      const r = btn.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top = `${Math.round(r.bottom + 8)}px`;
      pop.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
      pop.style.left = 'auto';
    };

    const onToggle = (e: Event) => {
      const open = (e as ToggleEvent).newState === 'open';
      setMenuExpanded(open);
      if (open) placePopover();
    };

    pop.addEventListener('toggle', onToggle);
    return () => pop.removeEventListener('toggle', onToggle);
  }, [user]);

  function toggleMenuFallback() {
    const pop = popoverRef.current;
    const btn = triggerRef.current;
    if (!pop || !btn) return;
    if (Object.hasOwn(HTMLElement.prototype, 'popover')) return;
    const next = pop.classList.toggle(':popover-open');
    setMenuExpanded(next);
    if (next) {
      const r = btn.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top = `${Math.round(r.bottom + 8)}px`;
      pop.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
    }
  }

  function closeUserMenu() {
    const pop = popoverRef.current;
    if (!pop) return;
    if (Object.hasOwn(HTMLElement.prototype, 'popover')) {
      try {
        if (pop.matches(':popover-open')) pop.hidePopover();
      } catch {
        /* abaikan */
      }
    } else {
      pop.classList.remove(':popover-open');
    }
    setMenuExpanded(false);
  }

  async function handleLogout() {
    closeUserMenu();
    setMobileOpen(false);
    await logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-20 bg-forest-700 text-cream shadow-md">
      <nav aria-label="Utama">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold font-serif tracking-wide shrink-0"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>BukuLapak</span>
          </Link>

          <Suspense fallback={<div className="hidden md:flex items-center gap-4 text-sm" />}>
            <DesktopNavLinks />
          </Suspense>

          <div className="flex items-center gap-3 text-sm">
            {ready && user ? (
              <div>
                <button
                  ref={triggerRef}
                  type="button"
                  aria-expanded={menuExpanded}
                  aria-controls={popoverId}
                  onClick={toggleMenuFallback}
                  popoverTarget={popoverId}
                  className="flex items-center gap-2 bg-cream text-forest-700 rounded-full pl-1 pr-3 py-1 hover:bg-white transition shadow-sm cursor-pointer"
                >
                  <span
                    className="w-7 h-7 rounded-full bg-forest-700 text-cream flex items-center justify-center text-xs font-bold"
                    aria-hidden="true"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold">{user.name.split(' ')[0]}</span>
                </button>

                <div
                  ref={popoverRef}
                  id={popoverId}
                  popover="auto"
                  className="w-52 bg-white text-stone-800 border border-stone-200 rounded-xl shadow-xl p-2 m-0"
                >
                  <Link
                    href="/profil"
                    onClick={closeUserMenu}
                    className="block px-3 py-2 rounded-lg hover:bg-stone-100 text-sm font-medium"
                  >
                    Profil Saya
                  </Link>
                  <Link
                    href="/chat"
                    onClick={closeUserMenu}
                    className="block px-3 py-2 rounded-lg hover:bg-stone-100 text-sm font-medium"
                  >
                    Chat Transaksi
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 text-sm font-medium cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : ready ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="hover:text-white text-cream/95 transition">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-cream text-forest-700 px-4 py-1.5 rounded-lg font-semibold hover:bg-white transition shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileOpen}
              aria-controls={mobileDrawerId}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-forest-900 transition cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            id={mobileDrawerId}
            className="md:hidden border-t border-forest-900 bg-forest-800 px-4 py-3 flex flex-col gap-2 text-sm"
          >
            <Suspense fallback={null}>
              <MobileNavLinks onNavigate={() => setMobileOpen(false)} />
            </Suspense>

            {ready && user ? (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-forest-900">
                <Link
                  href="/profil"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-forest-900"
                >
                  Profil Saya ({user.name.split(' ')[0]})
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-forest-900"
                >
                  Chat Transaksi
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left px-3 py-2 rounded-lg text-red-200 hover:bg-red-900/40 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : ready ? (
              <div className="flex gap-2 pt-2 border-t border-forest-900">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg border border-cream/30"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-cream text-forest-700 font-semibold"
                >
                  Daftar
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </nav>
    </header>
  );
}
