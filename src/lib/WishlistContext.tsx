"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';

// Auth helper function (inline to avoid import issues)
const handleAuthError = async (errorType: 'account_not_found' | 'authentication_required') => {
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

interface WishlistItem {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  amount: number;
  originalPrice?: number;
  imageURL: string;
  slug: string;
  inStock: boolean;
  sku: string;
  warranty?: string;
  addedAt?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  isInWishlist: (itemId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  clearWishlist: () => Promise<void>;
  wishlistCount: number;
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'user_not_found';
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'user_not_found'>('idle');
  const { user, userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadWishlist = async () => {
      if (user && userData) {
        await loadWishlistFromFirebase();
      } else if (user && !userData && !authLoading) {
        console.warn('User authenticated but no userData found');
        setWishlistItems([]);
      } else {
        loadWishlistFromLocalStorage();
      }
    };

    loadWishlist();
  }, [user, userData, authLoading]);

  const loadWishlistFromFirebase = async () => {
    if (!user) return;

    setIsLoading(true);
    setSyncStatus('syncing');
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const firebaseWishlist = userData.wishlist || [];
        
        const localWishlist = getLocalWishlist();
        
        if (localWishlist.length > 0 && firebaseWishlist.length === 0) {
          await migrateLocalWishlistToFirebase(localWishlist);
          setWishlistItems(localWishlist);
        } else if (localWishlist.length > 0 && firebaseWishlist.length > 0) {
          const mergedWishlist = await mergeWishlists(localWishlist, firebaseWishlist);
          setWishlistItems(mergedWishlist);
          await updateFirebaseWishlist(mergedWishlist);
        } else {
          setWishlistItems(firebaseWishlist);
        }
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wishlist');
        }
      } else {
        console.warn('User document not found in Firestore. User may have been deleted.');
        setSyncStatus('user_not_found');
        setWishlistItems([]);
        await handleAuthError('account_not_found');
        return;
      }
      
      setSyncStatus('idle');
    } catch (error: any) {
      console.error('Error loading wishlist from Firebase:', error);
      setSyncStatus('error');
      
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        await handleAuthError('authentication_required');
        return;
      }
      
      loadWishlistFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadWishlistFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        try {
          setWishlistItems(JSON.parse(savedWishlist));
        } catch (error) {
          console.error('Error loading wishlist from localStorage:', error);
          setWishlistItems([]);
        }
      } else {
        setWishlistItems([]);
      }
    }
  };

  const getLocalWishlist = (): WishlistItem[] => {
    if (typeof window !== 'undefined') {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        try {
          return JSON.parse(savedWishlist);
        } catch (error) {
          console.error('Error parsing local wishlist:', error);
        }
      }
    }
    return [];
  };

  const migrateLocalWishlistToFirebase = async (localWishlist: WishlistItem[]) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        wishlist: localWishlist,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error migrating wishlist to Firebase:', error);
      throw error;
    }
  };

  const mergeWishlists = async (localWishlist: WishlistItem[], firebaseWishlist: WishlistItem[]): Promise<WishlistItem[]> => {
    const mergedMap = new Map<string, WishlistItem>();
    
    firebaseWishlist.forEach(item => mergedMap.set(item.id, item));
    
    localWishlist.forEach(item => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, { ...item, addedAt: Date.now() });
      }
    });
    
    return Array.from(mergedMap.values());
  };

  const updateFirebaseWishlist = async (wishlist: WishlistItem[]) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        wishlist: wishlist,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating Firebase wishlist:', error);
      throw error;
    }
  };

  const saveToLocalStorage = (items: WishlistItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  };

  const addToWishlist = async (item: WishlistItem) => {
    const itemWithTimestamp = { ...item, addedAt: Date.now() };
    
    const exists = wishlistItems.find(wishlistItem => wishlistItem.id === item.id);
    if (exists) {
      return;
    }

    const newWishlistItems = [...wishlistItems, itemWithTimestamp];
    setWishlistItems(newWishlistItems);

    if (user) {
      setSyncStatus('syncing');
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          wishlist: arrayUnion(itemWithTimestamp),
          updatedAt: Date.now()
        });
        setSyncStatus('idle');
      } catch (error) {
        console.error('Error adding to Firebase wishlist:', error);
        setSyncStatus('error');
        saveToLocalStorage(newWishlistItems);
      }
    } else {
      saveToLocalStorage(newWishlistItems);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    const itemToRemove = wishlistItems.find(item => item.id === itemId);
    if (!itemToRemove) return;

    const newWishlistItems = wishlistItems.filter(item => item.id !== itemId);
    setWishlistItems(newWishlistItems);

    if (user) {
      setSyncStatus('syncing');
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          wishlist: arrayRemove(itemToRemove),
          updatedAt: Date.now()
        });
        setSyncStatus('idle');
      } catch (error) {
        console.error('Error removing from Firebase wishlist:', error);
        setSyncStatus('error');
        saveToLocalStorage(newWishlistItems);
      }
    } else {
      saveToLocalStorage(newWishlistItems);
    }
  };

  const isInWishlist = (itemId: string) => {
    return wishlistItems.some(item => item.id === itemId);
  };

  const toggleWishlist = async (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      await removeFromWishlist(item.id);
    } else {
      await addToWishlist(item);
    }
  };

  const clearWishlist = async () => {
    setWishlistItems([]);

    if (user) {
      setSyncStatus('syncing');
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          wishlist: [],
          updatedAt: Date.now()
        });
        setSyncStatus('idle');
      } catch (error) {
        console.error('Error clearing Firebase wishlist:', error);
        setSyncStatus('error');
        saveToLocalStorage([]);
      }
    } else {
      saveToLocalStorage([]);
    }
  };

  const wishlistCount = wishlistItems.length;

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    wishlistCount,
    isLoading,
    syncStatus,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};