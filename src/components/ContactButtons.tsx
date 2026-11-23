'use client';

import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ContactButtons() {
  return (
    <Suspense fallback={null}>
      <ContactButtonsInner />
    </Suspense>
  );
}

function ContactButtonsInner() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popId = useId();

  const wa = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281234567890';
  const email = process.env.NEXT_PUBLIC_CS_EMAIL ?? 'cs@bukulapak.id';

  useEffect(() => {
    const pop = popoverRef.current;
    const btn = triggerRef.current;
    if (!pop || !btn) return;

    const place = () => {
      const r = btn.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
      pop.style.bottom = `${Math.max(8, Math.round(window.innerHeight - r.top + 8))}px`;
      pop.style.top = 'auto';
      pop.style.left = 'auto';
    };

    const onToggle = (e: Event) => {
      const open = (e as ToggleEvent).newState === 'open';
      setExpanded(open);
      if (open) place();
    };

    pop.addEventListener('toggle', onToggle);
    return () => pop.removeEventListener('toggle', onToggle);
  }, []);

  if (pathname.startsWith('/chat')) {
    return null;
  }

  function handleFallbackClick() {
    if (Object.hasOwn(HTMLElement.prototype, 'popover')) return;
    const pop = popoverRef.current;
    const btn = triggerRef.current;
    if (!pop || !btn) return;
    const open = pop.classList.toggle(':popover-open');
    setExpanded(open);
    if (open) {
      const r = btn.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
      pop.style.bottom = `${Math.max(8, Math.round(window.innerHeight - r.top + 8))}px`;
    }
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={popId}
        onClick={handleFallbackClick}
        popoverTarget={popId}
        className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg hover:bg-stone-800 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span>Bantuan</span>
      </button>

      <div
        ref={popoverRef}
        id={popId}
        popover="auto"
        className="w-64 bg-white text-stone-800 border border-stone-200 rounded-xl shadow-xl p-3.5 text-xs m-0"
      >
        <p className="font-bold text-stone-900 mb-1">Pusat Bantuan BukuLapak</p>
        <p className="text-stone-500 mb-3">Butuh bantuan transaksi atau lapor kendala?</p>
        <div className="flex flex-col gap-2">
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('Halo CS BukuLapak, saya butuh bantuan')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center px-3 py-2 rounded-lg bg-forest-700 text-cream font-semibold hover:bg-forest-900 transition"
          >
            Chat WhatsApp CS
          </a>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Bantuan BukuLapak')}`}
            className="w-full text-center px-3 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 transition"
          >
            Email ({email})
          </a>
        </div>
      </div>
    </div>
  );
}
