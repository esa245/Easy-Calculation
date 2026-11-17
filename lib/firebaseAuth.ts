'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedGoogleAccessToken: string | null = null;

/**
 * Listen to Firebase Auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim();
  if (!cleanEmail || !pass) {
    throw new Error('দয়া করে আপনার ইমেইল এবং পাসওয়ার্ড সঠিকভাবে দিন।');
  }
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  return credential.user;
}

/**
 * Register new user with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('দয়া করে একটি সঠিক ইমেইল এড্রেস লিখুন।');
  }
  if (!pass || pass.length < 6) {
    throw new Error('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
  }
  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  if (displayName && displayName.trim()) {
    try {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    } catch {
      // non-fatal
    }
  }
  return credential.user;
}

/**
 * Sign in with Google (also captures Google Drive access token)
 */
export async function loginWithGoogleAuth(): Promise<{ user: User; accessToken: string | null }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedGoogleAccessToken = credential?.accessToken || null;
  return { user: result.user, accessToken: cachedGoogleAccessToken };
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  cachedGoogleAccessToken = null;
}

/**
 * Send password reset email
 */
export async function sendResetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('পাসওয়ার্ড রিসেট করতে আপনার ইমেইল এড্রেসটি লিখুন।');
  }
  await sendPasswordResetEmail(auth, cleanEmail);
}

export function getCachedGoogleToken(): string | null {
  return cachedGoogleAccessToken;
}

/**
 * Human friendly Bengali error messages for Firebase Auth errors
 */
export function getBengaliAuthError(error: any): string {
  const code = error?.code || '';
  const msg = String(error?.message || '');

  switch (code) {
    case 'auth/user-not-found':
      return 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে সঠিক ইমেইল দিন অথবা নতুন একাউন্ট খুলুন।';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় যাচাই করুন।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ডটি খুবই দুর্বল। অন্তত ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।';
    case 'auth/invalid-email':
      return 'ইমেইল এড্রেসের ফরম্যাটটি সঠিক নয়। যেমন: name@example.com';
    case 'auth/network-request-failed':
      return 'নেটওয়ার্কের সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।';
    case 'auth/too-many-requests':
      return 'অনেকবার ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    case 'auth/popup-closed-by-user':
      return 'লগইন উইন্ডোটি বন্ধ করে দেওয়া হয়েছে।';
    case 'auth/operation-not-allowed':
      return 'Firebase Console-এ Email/Password অথেন্টিকেশন চালু করা নেই। অনুগ্রহ করে Firebase Console > Authentication > Sign-in method থেকে Email/Password অন করুন।';
    default:
      if (msg.includes('network') || msg.includes('offline')) {
        return 'ইন্টারনেট সংযোগ পাওয়া যায়নি।';
      }
      return msg || 'লগইন প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
}
