'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  auth,
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogleAuth,
  logoutUser,
  getBengaliAuthError,
} from '@/lib/firebaseAuth';
import {
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface UserProfileSectionProps {
  onToast: (msg: string) => void;
  onNavigateToDrive?: () => void;
}

export default function UserProfileSection({
  onToast,
  onNavigateToDrive,
}: UserProfileSectionProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Form mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showFirebaseConsoleTip, setShowFirebaseConsoleTip] = useState(false);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowFirebaseConsoleTip(false);

    if (!email.trim() || !password) {
      setErrorMsg('ইমেইল ও পাসওয়ার্ড উভয় ফিল্ড পূরণ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginWithEmail(email, password);
      onToast(`স্বাগতম! ${user.email} হিসেবে সফলভাবে লগইন হয়েছে।`);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const bengaliError = getBengaliAuthError(err);
      setErrorMsg(bengaliError);
      if (err?.code === 'auth/operation-not-allowed') {
        setShowFirebaseConsoleTip(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Email & Password Registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowFirebaseConsoleTip(false);

    if (!email.trim()) {
      setErrorMsg('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerWithEmail(email, password, displayName);
      onToast(`অভিনন্দন! আপনার নতুন অ্যাকাউন্ট তৈরি ও লগইন সম্পন্ন হয়েছে।`);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const bengaliError = getBengaliAuthError(err);
      setErrorMsg(bengaliError);
      if (err?.code === 'auth/operation-not-allowed') {
        setShowFirebaseConsoleTip(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে ইমেইল এড্রেসটি দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('আপনার ইমেইলে পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে। ইনবক্স চেক করুন।');
      onToast('পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে');
    } catch (err: any) {
      setErrorMsg(getBengaliAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowFirebaseConsoleTip(false);
    setSubmitting(true);

    try {
      const { user } = await loginWithGoogleAuth();
      onToast(`স্বাগতম! Google দিয়ে ${user.email} হিসেবে লগইন হয়েছে।`);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(getBengaliAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      onToast('সফলভাবে লগআউট করা হয়েছে। এখন আপনি অতিথি মোডে আছেন।');
      setMode('login');
      setErrorMsg(null);
      setSuccessMsg(null);
    } catch (err: any) {
      onToast('লগআউট ব্যর্থ হয়েছে: ' + (err?.message || ''));
    }
  };

  if (authChecking) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-center gap-2.5 text-slate-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin text-[#137C50]" />
        <span>লগইন স্ট্যাটাস লোড হচ্ছে...</span>
      </div>
    );
  }

  // ==================== LOGGED IN STATE ====================
  if (currentUser) {
    const isGoogle = currentUser.providerData.some((p) => p.providerId === 'google.com');
    const isPassword = currentUser.providerData.some((p) => p.providerId === 'password');

    return (
      <div className="bg-white border-2 border-[#137C50]/30 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#137C50] via-[#10B981] to-[#34D399]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* User Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {currentUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#137C50]/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#137C50] to-[#0D5737] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : <UserCheck className="w-6 h-6" />}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                title="সক্রিয় ও লগইন আছে"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {currentUser.displayName || 'সহজ হিসাব ব্যবহারকারী'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#E7F6EE] text-[#137C50] border border-[#137C50]/20">
                  <ShieldCheck className="w-3 h-3" />
                  লগইন সক্রিয়
                </span>
              </div>

              <p className="text-xs text-slate-600 truncate mt-0.5 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.email || 'ইমেইল বিহীন অ্যাকাউন্ট'}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-400">
                  মাধ্যম:{' '}
                  {isPassword
                    ? 'ইমেইল ও পাসওয়ার্ড'
                    : isGoogle
                    ? 'Google একাউন্ট'
                    : 'Firebase Auth'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions: Logout Button + Drive shortcut */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
            {onNavigateToDrive && (
              <button
                type="button"
                onClick={onNavigateToDrive}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
              >
                <Cloud className="w-4 h-4 text-[#137C50]" />
                ড্রাইভ ব্যাকআপ
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-xs font-bold text-red-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              লগআউট
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== NOT LOGGED IN (AUTH CARD) ====================
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করে বিভিন্ন ডিভাইসে হিসাব সহজে ব্যাকআপ ও সিঙ্ক রাখতে পারবেন।{' '}
            <strong className="text-slate-700">নোট:</strong> লগইন না করলেও অফলাইনে সবকিছু সম্পূর্ণ স্বাভাবিক চলবে।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0 self-start">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            লগইন
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            নতুন একাউন্ট
          </button>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMsg}</p>
            {showFirebaseConsoleTip && (
              <p className="text-[11px] text-red-600">
                টিপস: Firebase Console &gt; Authentication &gt; Sign-in method-এ গিয়ে &quot;Email/Password&quot; অপশনটি এনাবল করা থাকলে যেকেউ নিজের ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন ও লগইন করতে পারবেন।
              </p>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* ==================== LOGIN FORM ==================== */}
      {mode === 'login' && (
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল এড্রেস
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল দিন (যেমন: name@gmail.com)"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                পাসওয়ার্ড
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[11px] text-[#137C50] hover:underline font-semibold"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার গোপন পাসওয়ার্ড দিন"
                className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            লগইন করুন
          </button>
        </form>
      )}

      {/* ==================== REGISTER FORM ==================== */}
      {mode === 'register' && (
        <form onSubmit={handleEmailRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              আপনার নাম / ব্যবসার নাম (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="যেমন: রহিম স্টোর বা আপনার নাম"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল এড্রেস
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল (যেমন: name@gmail.com)"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                কনফার্ম পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="একই পাসওয়ার্ড আবার দিন"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            নতুন অ্যাকাউন্ট তৈরি করুন
          </button>
        </form>
      )}

      {/* ==================== FORGOT PASSWORD FORM ==================== */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
            আপনার নিবন্ধিত ইমেইল এড্রেসটি দিন। আমরা সেখানে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠাব।
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল এড্রেস
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার নিবন্ধিত ইমেইল দিন"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[44px] rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              রিসেট লিঙ্ক পাঠান
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              লগইনে ফিরুন
            </button>
          </div>
        </form>
      )}

      {/* Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">অথবা</span>
        </div>
      </div>

      {/* Google Login Alternative */}
      <button
        type="button"
        disabled={submitting}
        onClick={handleGoogleLogin}
        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 shadow-xs text-xs sm:text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-3 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
        <span>Google দিয়ে এক-ক্লিকে লগইন</span>
      </button>
    </div>
  );
}
