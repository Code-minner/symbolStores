// FILE 1: src/lib/authHelpers.ts
// ===================================================================
import { auth } from '@/lib/firebase';

export const handleAuthError = async (errorType: 'account_not_found' | 'authentication_required') => {
  try {
    await auth.signOut();
    
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = `/auth?redirect=/wishlist&message=${errorType}`;
    }
  } catch (error) {
    console.error('Error during auth cleanup:', error);
    if (typeof window !== 'undefined') {
      window.location.href = `/auth?redirect=/wishlist&message=${errorType}`;
    }
  }
};