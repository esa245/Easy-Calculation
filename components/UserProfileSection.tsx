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
  ShieldCheck,
  AlertCircle,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';

interface UserProfileSectionProps {
  onToast: (msg: string) => void;
  onNavigateToDrive?: () => void;
  onNameActivated?: (name: string) => void;
  variant?: 'top' | 'settings';
}

export default function UserProfileSection({
  onToast,
  onNavigateToDrive,
  onNameActivated,
  variant = 'top',
}: UserProfileSectionProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Form mode: 'activate' (name+email+pass) | 'login' (email+pass) | 'forgot'
  const [mode, setMode] = useState<'activate' | 'login' | 'forgot'>('activate');

  // Input states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Collapsed state for guest mode when placed at the very top
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Handle Account Activation (Name + Email + Password)
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowFirebaseConsoleTip(false);

    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMsg('অনুগ্রহ করে আপনার সাধারণ নাম বা প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }
    if (!cleanEmail) {
      setErrorMsg('অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerWithEmail(cleanEmail, password, cleanName);
      if (onNameActivated && cleanName) {
        onNameActivated(cleanName);
      }
      onToast(`অভিনন্দন ${cleanName}! আপনার অ্যাকাউন্ট সফলভাবে একটিভ হয়েছে।`);
      setSuccessMsg(`স্বাগতম ${cleanName}! আপনার অ্যাকাউন্ট এখন পুরোপুরি সক্রিয়।`);
      setPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। নিচে "লগইন করুন" বাটনে চাপুন।');
      } else {
        setErrorMsg(getBengaliAuthError(err));
      }
      if (err?.code === 'auth/operation-not-allowed') {
        setShowFirebaseConsoleTip(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Login (Email + Password)
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
    } catch (err: any) {
      setErrorMsg(getBengaliAuthError(err));
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
      setErrorMsg('পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে আপনার ইমেইল এড্রেসটি দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।');
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
      if (onNameActivated && user.displayName) {
        onNameActivated(user.displayName);
      }
      onToast(`স্বাগতম! Google দিয়ে ${user.email} হিসেবে একটিভ হয়েছে।`);
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
      setMode('activate');
      setErrorMsg(null);
      setSuccessMsg(null);
    } catch (err: any) {
      onToast('লগআউট ব্যর্থ হয়েছে: ' + (err?.message || ''));
    }
  };

  if (authChecking) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-slate-500 text-xs sm:text-sm">
        <RefreshCw className="w-4 h-4 animate-spin text-[#137C50]" />
        <span>অ্যাকাউন্ট স্ট্যাটাস লোড হচ্ছে...</span>
      </div>
    );
  }

  // ==================== 1. LOGGED IN / ACTIVE STATE ====================
  if (currentUser) {
    const isGoogle = currentUser.providerData.some((p) => p.providerId === 'google.com');
    const isPassword = currentUser.providerData.some((p) => p.providerId === 'password');
    const userTitle = currentUser.displayName || 'সহজ হিসাব ব্যবহারকারী';

    return (
      <div className="bg-white border-2 border-[#137C50]/35 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#137C50] via-[#10B981] to-[#34D399]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* User Profile Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {currentUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#137C50]/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#137C50] to-[#0D5737] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  {currentUser.displayName
                    ? currentUser.displayName[0].toUpperCase()
                    : currentUser.email
                    ? currentUser.email[0].toUpperCase()
                    : <UserCheck className="w-6 h-6" />}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                title="সক্রিয় ও একটিভ আছে"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {userTitle}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E7F6EE] text-[#137C50] border border-[#137C50]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  অ্যাকাউন্ট সক্রিয়
                </span>
              </div>

              <p className="text-xs text-slate-600 truncate mt-0.5 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.email || 'ইমেইল বিহীন'}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>
                  লগইন মাধ্যম:{' '}
                  <strong className="text-slate-600 font-semibold">
                    {isPassword
                      ? 'নাম, ইমেইল ও পাসওয়ার্ড'
                      : isGoogle
                      ? 'Google একাউন্ট'
                      : 'Firebase Auth'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Logout & Drive Backup */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
            {onNavigateToDrive && (
              <button
                type="button"
                onClick={onNavigateToDrive}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-[#137C50]" />
                ড্রাইভ সিঙ্ক
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/90 text-xs font-bold text-red-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              লগআউট
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. NOT LOGGED IN - COLLAPSED SLIM BANNER ====================
  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-[#137C50]/25 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#137C50] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              নাম, ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট একটিভ করুন
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              অ্যাকাউন্ট ছাড়াও অফলাইনে সব হিসাব ব্যবহার করা যায়
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>এখনই একটিভ করুন</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ==================== 3. NOT LOGGED IN - MAIN ACTIVATION / LOGIN CARD ====================
  return (
    <div className="bg-white border-2 border-slate-200 hover:border-[#137C50]/40 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs relative overflow-hidden transition-all">
      {/* Decorative Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#137C50]" />

      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E7F6EE] text-[#137C50] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {mode === 'activate'
                ? 'নাম, ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট একটিভ করুন'
                : mode === 'login'
                ? 'ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন'
                : 'পাসওয়ার্ড রিসেট'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            সাধারণ নাম, ইমেইল ও পাসওয়ার্ড দিয়ে এক ক্লিকে অ্যাকাউন্ট একটিভ করে সব ডিভাইসে হিসাব সিঙ্ক রাখুন।{' '}
            <strong className="text-slate-700">নোট:</strong> লগইন ছাড়াও আপনি সম্পূর্ণ অফলাইনে সাধারণ মোডে হিসাব রাখতে পারবেন।
          </p>
        </div>

        {/* Tab Switcher & Collapse */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('activate');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'activate'
                  ? 'bg-white text-[#137C50] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অ্যাকাউন্ট একটিভ
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#137C50] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              লগইন
            </button>
          </div>

          {variant === 'top' && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="পরে একটিভ করব (সংক্ষিপ্ত করুন)"
              className="min-h-[34px] px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">লুকান</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMsg}</p>
            {showFirebaseConsoleTip && (
              <p className="text-[11px] text-red-600">
                টিপস: Firebase Console &gt; Authentication &gt; Sign-in method-এ গিয়ে &quot;Email/Password&quot; অন করা থাকলে নাম ও ইমেইল দিয়ে সহজেই অ্যাকাউন্ট সক্রিয় করা যায়।
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

      {/* ==================== 1. ACTIVATE FORM (NAME + EMAIL + PASSWORD) ==================== */}
      {mode === 'activate' && (
        <form onSubmit={handleActivateAccount} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার নাম <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="যেমন: রহিম বা রহিম স্টোর"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Field 2: Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইমেইল এড্রেস <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="যেমন: name@gmail.com"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#137C50] focus:ring-2 focus:ring-[#137C50]/20 text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Field 3: Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন"
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
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              অ্যাকাউন্ট একটিভ করুন
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-600 hover:text-[#137C50] font-semibold underline underline-offset-2"
            >
              ইতিমধ্যে অ্যাকাউন্ট আছে? সরাসরি লগইন করুন
            </button>
          </div>
        </form>
      )}

      {/* ==================== 2. LOGIN FORM (EMAIL + PASSWORD) ==================== */}
      {mode === 'login' && (
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইমেইল এড্রেস <span className="text-red-500">*</span>
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
                  পাসওয়ার্ড <span className="text-red-500">*</span>
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
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#137C50] hover:bg-[#0F6842] disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              লগইন করুন
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('activate');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-600 hover:text-[#137C50] font-semibold underline underline-offset-2"
            >
              নতুন একাউন্ট একটিভ করতে চান? এখানে চাপুন
            </button>
          </div>
        </form>
      )}

      {/* ==================== 3. FORGOT PASSWORD ==================== */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
            আপনার নিবন্ধিত ইমেইল এড্রেসটি দিন। আমরা সেখানে একটি পাসওয়ার্ড রিসেট লিংক পাঠাব।
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
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              লগইনে ফিরুন
            </button>
          </div>
        </form>
      )}

      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">অথবা বিকল্প পদ্ধতি</span>
        </div>
      </div>

      {/* Google Login Alternative */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleLogin}
          className="w-full sm:w-auto flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs text-xs sm:text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
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
          <span>Google দিয়ে এক-ক্লিকে একটিভ করুন</span>
        </button>

        {variant === 'top' && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            লগইন ছাড়াই অফলাইনে চালান
          </button>
        )}
      </div>
    </div>
  );
}
