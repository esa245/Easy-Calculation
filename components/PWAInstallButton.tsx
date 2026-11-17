'use client';

import React, { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card';
  onToast?: (msg: string) => void;
}

export default function PWAInstallButton({
  variant = 'header',
  onToast,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted && onToast) {
        onToast('অ্যাপটি হোম স্ক্রিনে ইনস্টল করা হচ্ছে');
      }
      return;
    }
    setShowGuideModal(true);
  };

  // For compact header/sidebar triggers, hide once installed or if browser is neither installable nor iOS
  if (variant !== 'card' && (isInstalled || (!isInstallable && !isIOS))) {
    return null;
  }

  const guideModal = showGuideModal && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-guide-title"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pwa-install-guide-title" className="text-base font-bold text-slate-900">
                মোবাইলে অ্যাপ ইনস্টল করুন
              </h3>
              <p className="text-xs text-slate-500">এমবি ছাড়াও অফলাইনে চলবে</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            aria-label="বন্ধ করুন"
            className="min-w-[36px] min-h-[36px] -mr-1 -mt-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <ol className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed list-decimal list-inside">
            <li>
              Safari ব্রাউজারের নিচে{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                <Share className="w-3.5 h-3.5 text-[#137C50]" /> Share
              </span>{' '}
              বাটনে ট্যাপ করুন।
            </li>
            <li>
              নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।
            </li>
            <li>
              ওপরে ডানে <strong>Add</strong> চাপুন — অ্যাপ হিসেবে হোম স্ক্রিনে যুক্ত হয়ে যাবে।
            </li>
          </ol>
        ) : (
          <ol className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed list-decimal list-inside">
            <li>
              আপনার Chrome / Edge ব্রাউজারের ওপরে ডানে{' '}
              <strong>মেনু (⋮)</strong> বাটনে ট্যাপ করুন।
            </li>
            <li>
              <strong>Install app</strong> অথবা <strong>Add to Home screen</strong> অপশনে চাপুন।
            </li>
            <li>
              ইনস্টল হয়ে গেলে ইন্টারনেট / এমবি ছাড়াই সরাসরি ফোনের অ্যাপ থেকে ব্যবহার করতে পারবেন।
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={() => setShowGuideModal(false)}
          className="w-full min-h-[42px] rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-sm font-semibold transition-colors"
        >
          বুঝেছি
        </button>
      </div>
    </div>
  );

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#E7F6EE] hover:bg-[#d5efe1] text-[#137C50] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ইনস্টল</span>
        </button>
        {guideModal}
      </>
    );
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#137C50]/30 bg-[#E7F6EE]/50 hover:bg-[#E7F6EE] text-[#137C50] text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{isIOS ? 'iPhone-এ অ্যাপ ইনস্টল' : 'অ্যাপ হিসেবে ইনস্টল করুন'}</span>
        </button>
        {guideModal}
      </>
    );
  }

  // Settings card variant
  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
            {isInstalled ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {isInstalled
                ? 'অ্যাপ ইনস্টল করা আছে'
                : 'মোবাইলে অ্যাপ ইনস্টল ও অফলাইন ব্যবহার'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {isInstalled
                ? 'অফলাইন সাপোর্ট সক্রিয় · এমবি ছাড়াই সব হিসাব রাখা ও দেখা যাবে'
                : 'ইনস্টল করলে ফোনের হোম স্ক্রিন থেকে এমবি/ইন্টারনেট ছাড়াই অ্যাপটি চলবে'}
            </p>
          </div>
        </div>

        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            {isInstallable ? 'অ্যাপ ইনস্টল করুন' : 'ইনস্টল নিয়ম দেখুন'}
          </button>
        )}
      </div>
      {guideModal}
    </>
  );
}
