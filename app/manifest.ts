import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'সহজ হিসাব — দৈনিক, সাপ্তাহিক ও মাসিক টাকার হিসাব',
    short_name: 'সহজ হিসাব',
    description:
      'সহজ ও আধুনিক বাংলা টাকা হিসাব সফটওয়্যার — দৈনিক, সাপ্তাহিক ও মাসিক আয়-ব্যয়, বাজেট নিয়ন্ত্রণ এবং অফলাইন হিসাব ব্যবস্থাপনা।',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F6F8FA',
    theme_color: '#137C50',
    lang: 'bn',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
