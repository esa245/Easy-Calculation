import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import OfflineIndicator from '@/components/OfflineIndicator';
import PWARegister from '@/components/PWARegister';
import './globals.css';

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bengali',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono-code',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#137C50',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'সহজ হিসাব — মাসিক, সাপ্তাহিক ও দৈনিক টাকার হিসাব',
  description:
    'সহজ ও আধুনিক বাংলা টাকা হিসাব সফটওয়্যার — দৈনিক, সাপ্তাহিক ও মাসিক আয়-ব্যয়, বাজেট নিয়ন্ত্রণ এবং রিপোর্ট ব্যবস্থাপনা।',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'সহজ হিসাব',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'সহজ হিসাব — মাসিক, সাপ্তাহিক ও দৈনিক টাকার হিসাব',
    description:
      'সহজ ও আধুনিক বাংলা টাকা হিসাব সফটওয়্যার — দৈনিক, সাপ্তাহিক ও মাসিক আয়-ব্যয়, বাজেট নিয়ন্ত্রণ এবং রিপোর্ট ব্যবস্থাপনা।',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'সহজ হিসাব — মাসিক, সাপ্তাহিক ও দৈনিক টাকার হিসাব',
    description:
      'সহজ ও আধুনিক বাংলা টাকা হিসাব সফটওয়্যার — দৈনিক, সাপ্তাহিক ও মাসিক আয়-ব্যয়, বাজেট নিয়ন্ত্রণ এবং রিপোর্ট ব্যবস্থাপনা।',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      className={`${notoSansBengali.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="font-sans bg-[#F6F8FA] text-[#0F172A] antialiased selection:bg-[#137C50]/15 selection:text-[#137C50]"
        suppressHydrationWarning
      >
        <PWARegister />
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
