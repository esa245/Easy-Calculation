'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function notifyPromptListeners() {
  promptListeners.forEach((cb) => cb());
}

function subscribeInstallEvents(listener: () => void): () => void {
  promptListeners.add(listener);
  if (typeof window === 'undefined') {
    return () => {
      promptListeners.delete(listener);
    };
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  };

  const handleAppInstalled = () => {
    sharedDeferredPrompt = null;
    notifyPromptListeners();
  };

  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', listener);
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  return () => {
    promptListeners.delete(listener);
    mql.removeEventListener('change', listener);
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

function getPromptSnapshot(): BeforeInstallPromptEvent | null {
  return sharedDeferredPrompt;
}

function getServerPromptSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getServerFalse(): boolean {
  return false;
}

function subscribeNoop(): () => void {
  return () => {};
}

function getIOSSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function usePWAInstall() {
  const deferredPrompt = useSyncExternalStore(
    subscribeInstallEvents,
    getPromptSnapshot,
    getServerPromptSnapshot
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [acceptedThisSession, setAcceptedThisSession] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkState = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));
    };
    checkState();
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener('change', checkState);
    return () => mql.removeEventListener('change', checkState);
  }, []);

  const isInstalled = isStandalone || acceptedThisSession;

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      sharedDeferredPrompt = null;
      setAcceptedThisSession(true);
      notifyPromptListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    isIOS,
    install,
  };
}

function subscribeOnline(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );
}

export function useServiceWorkerRegistration() {
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (reg.active || reg.installing || reg.waiting) {
          setSwReady(true);
        }
        return navigator.serviceWorker.ready;
      })
      .then(() => {
        setSwReady(true);
      })
      .catch(() => {
        // Ignore service worker registration failures gracefully
      });
  }, []);

  return swReady;
}
