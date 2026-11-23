import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter, Merriweather } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactButtons from '@/components/ContactButtons';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BukuLapak — Review & Jual Beli Buku Bekas',
    template: '%s | BukuLapak',
  },
  description:
    'Platform komunitas pembaca untuk diskusi buku, review jujur, dan jual-beli buku bekas antarperorangan.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? '';
  const gaId = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : '';
  const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';

  return (
    <html lang="id" className={`${merriweather.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-stone-900 font-sans">
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
            <ContactButtons />
          </AuthProvider>
        </ToastProvider>
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} debugMode={gaDebug} /> : null}
    </html>
  );
}
