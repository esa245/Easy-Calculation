'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, Download, LogOut, RefreshCw, Upload, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  getCachedAccessToken,
  initAuth,
  loadAppDataFromGoogleDrive,
  loginWithGoogle,
  logoutGoogle,
  saveAppDataToGoogleDrive,
} from '@/lib/gdriveAuth';
import {
  AssetAccount,
  CustomAssetChannel,
  LedgerSettings,
  MonthlyArchive,
  Transaction,
} from '@/lib/ledger';

interface GoogleDriveSyncProps {
  settings: LedgerSettings;
  transactions: Transaction[];
  archives: MonthlyArchive[];
  assets?: AssetAccount[];
  assetChannels?: CustomAssetChannel[];
  onRestoreAll: (
    transactions: Transaction[],
    settings?: LedgerSettings,
    archives?: MonthlyArchive[],
    assets?: AssetAccount[],
    assetChannels?: CustomAssetChannel[]
  ) => void;
  onToast: (msg: string) => void;
  useBengaliDigits: boolean;
}

export default function GoogleDriveSync({
  settings,
  transactions,
  archives,
  assets,
  assetChannels,
  onRestoreAll,
  onToast,
  useBengaliDigits,
}: GoogleDriveSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      setUser(res.user);
      setAccessToken(res.accessToken);
      onToast(`স্বাগতম, ${res.user.email ?? 'ব্যবহারকারী'}! Google Drive সংযুক্ত হয়েছে।`);
    } catch (err: any) {
      onToast(`লগইন ব্যর্থ হয়েছে: ${err?.message || 'চেষ্টা করুন'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setAccessToken(null);
      onToast('Google Drive থেকে সাইন আউট করা হয়েছে');
    } catch {
      // ignore
    }
  };

  const handleSaveToDrive = async () => {
    const token = accessToken || getCachedAccessToken();
    if (!token) {
      onToast('প্রথমে Google দিয়ে সাইন ইন করুন');
      return;
    }

    setSyncing(true);
    try {
      const payload = {
        app: 'সহজ হিসাব',
        exportedAt: new Date().toISOString(),
        settings,
        transactions,
        archives,
        assets: assets ?? [],
        assetChannels: assetChannels ?? [],
      };
      await saveAppDataToGoogleDrive(token, payload);
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD'));
      onToast('আপনার সমস্ত হিসাব Google Drive-এ সফলভাবে সেভ হয়েছে!');
    } catch (err: any) {
      onToast(`ড্রাইভে সেভ ব্যর্থ: ${err?.message || 'ত্রুটি'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFromDrive = async () => {
    const token = accessToken || getCachedAccessToken();
    if (!token) {
      onToast('প্রথমে Google দিয়ে সাইন ইন করুন');
      return;
    }

    setSyncing(true);
    try {
      const data = await loadAppDataFromGoogleDrive(token);
      if (!data) {
        onToast('Google Drive-এ কোনো সংরক্ষিত হিসাব পাওয়া যায়নি');
        return;
      }

      const txs = Array.isArray(data.transactions) ? data.transactions : [];
      const setts = data.settings && typeof data.settings === 'object' ? data.settings : undefined;
      const arvs = Array.isArray(data.archives) ? data.archives : undefined;
      const asts = Array.isArray(data.assets) ? data.assets : undefined;
      const chs = Array.isArray(data.assetChannels) ? data.assetChannels : undefined;

      onRestoreAll(txs, setts, arvs, asts, chs);
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD'));
      onToast('Google Drive থেকে হিসাব সফলভাবে রিস্টোর হয়েছে!');
    } catch (err: any) {
      onToast(`ড্রাইভ থেকে লোড ব্যর্থ: ${err?.message || 'ত্রুটি'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#137C50]" />
            Google Drive ক্লাউড সিঙ্ক ও শেয়ারিং
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            আপনার Google অ্যাকাউন্ট দিয়ে লগইন করে সমস্ত হিসাব Google Drive-এ সুরক্ষিত রাখতে পারেন। অন্য ডিভাইসে বা অন্য কারো সাথে এই ইমেইল দিয়ে লগইন করে হিসাব শেয়ার বা সিঙ্ক করতে পারবেন। <br />
            <strong className="text-slate-700">নোট:</strong> লগইন না করলেও অ্যাপটি সম্পূর্ণ অফলাইনে নিজস্ব ডিভাইসে চলবে।
          </p>
        </div>
      </div>

      {user ? (
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#E7F6EE]/50 border border-[#137C50]/30 rounded-xl p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#137C50] text-white flex items-center justify-center font-bold shrink-0">
                {user.email ? user.email[0].toUpperCase() : <UserCheck className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">সংযুক্ত অ্যাকাউন্ট</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user.email || user.displayName || 'Google User'}
                </p>
                {lastSyncedTime && (
                  <p className="text-[11px] text-[#137C50] mt-0.5">
                    সর্বশেষ সিঙ্ক: {lastSyncedTime}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              সাইন আউট
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={syncing}
              onClick={handleSaveToDrive}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Google Drive-এ ডেটা সেভ করুন
            </button>

            <button
              type="button"
              disabled={syncing}
              onClick={handleLoadFromDrive}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#137C50]" />}
              Google Drive থেকে ডেটা আনুন
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
            className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 shadow-xs text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.1.74-2.5 1.18-4.05 1.18-3.12 0-5.77-2.11-6.72-4.95H1.2v3.15C3.17 21.36 7.22 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.74-.38-1.54-.38-2.27 0-.73.13-1.53.38-2.27V6.58H1.2C.44 8.12 0 9.87 0 12s.44 3.88 1.2 5.42l4.08-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.64 1.2 6.58l4.08 3.15c.95-2.84 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google Drive দিয়ে লগইন করুন</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            * লগইন ছাড়াই অ্যাপটি স্বাভাবিকভাবে ব্যবহার করা যাবে।
          </p>
        </div>
      )}
    </div>
  );
}
