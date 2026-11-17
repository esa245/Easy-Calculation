'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWAInstall';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[70px] lg:bottom-5 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-medium shadow-lg no-print"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>অফলাইন মোড · এমবি ছাড়াই আপনার হিসাব নিরাপদ ও সচল আছে</span>
    </div>
  );
}
