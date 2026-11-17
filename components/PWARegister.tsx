'use client';

import { useServiceWorkerRegistration } from '@/hooks/usePWAInstall';

export default function PWARegister() {
  useServiceWorkerRegistration();
  return null;
}
