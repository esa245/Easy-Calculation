'use client';

import dynamic from 'next/dynamic';

const MoneyManagerApp = dynamic(() => import('@/components/MoneyManagerApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center font-bold text-2xl shadow-xs animate-pulse">
          ৳
        </div>
        <p className="text-sm font-semibold text-slate-700">সহজ হিসাব প্রস্তুত হচ্ছে...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <MoneyManagerApp />;
}
