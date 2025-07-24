// lib/firebase.ts - Enhanced version of your original
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Removed getStorage import since we're using Cloudinary

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// Removed storage export since we're using Cloudinary

// 🔧 Configure session persistence for enhanced security
// This makes sessions end when browser closes, working with our custom timeout
export const configureSessionPersistence = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log('Firebase Auth configured for session-only persistence');
  } catch (error) {
    console.error('Error configuring Firebase Auth persistence:', error);
  }
};

// 🚀 Call this in your app initialization (optional but recommended)
if (typeof window !== 'undefined') {
  configureSessionPersistence();
}