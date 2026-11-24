import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { IBM_Plex_Mono, Newsreader, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BukuLapak',
    template: '%s · BukuLapak',
  },
  description: 'Katalog ulasan pembaca dan lapak buku bekas antarperorangan.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? '';
  const gaId = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : '';
  const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';

  return (
    <html
      lang="id"
      className={`${newsreader.variable} ${plusJakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <ToastProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-link">
              Lewati ke konten utama
            </a>
            <Navbar />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} debugMode={gaDebug} /> : null}
    </html>
  );
}
