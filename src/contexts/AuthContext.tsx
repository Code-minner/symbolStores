// contexts/AuthContext.tsx - Enhanced version with fixed activity detection
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  phone?: string;
  country?: string;
  state?: string;
  zipCode?: string;
  profilePicture?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  extendSession: () => void;
  getRemainingTime: () => number;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  extendSession: () => {},
  getRemainingTime: () => 0
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // 🕐 SESSION TIMEOUT CONFIGURATION
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
  const ACTIVITY_THROTTLE = 60 * 1000; // Only refresh session every 60 seconds
  
  // 🔧 FIXED: Use useRef for immediate access, state for UI updates
  const lastActivityRef = useRef<number>(Date.now());
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);
  const [showingWarning, setShowingWarning] = useState(false);

  // 🔄 Update last activity time
  const updateActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(now);
    // 🔧 FIXED: Only log occasionally to reduce console spam
    if (Math.random() < 0.1) { // Only log 10% of the time
      console.log('Activity detected - session refreshed');
    }
  };

  // 🔄 Extend session manually
  const extendSession = () => {
    updateActivity();
    setShowingWarning(false);
    console.log('Session manually extended');
  };

  // 📊 Get remaining session time
  const getRemainingTime = () => {
    if (!user) return 0;
    const elapsed = Date.now() - lastActivityRef.current; // Use ref for immediate access
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  };

  // 🚪 Auto logout due to inactivity
  const autoLogout = async () => {
    console.log('Session expired due to inactivity');
    setShowingWarning(false);
    
    try {
      await signOut();
      // Show alert after logout
      setTimeout(() => {
        alert('Your session has expired due to inactivity. Please log in again for security.');
      }, 100);
    } catch (error) {
      console.error('Error during auto logout:', error);
    }
  };

  // 🔔 Show session warning
  const showSessionWarning = () => {
    if (showingWarning) return; // Don't show multiple warnings
    
    setShowingWarning(true);
    const remainingMinutes = Math.ceil(getRemainingTime() / (60 * 1000));
    
    const shouldExtend = confirm(
      `⚠️ Session Timeout Warning\n\nYour session will expire in ${remainingMinutes} minutes due to inactivity.\n\nClick "OK" to extend your session, or "Cancel" to logout now.`
    );
    
    if (shouldExtend) {
      extendSession();
    } else {
      autoLogout();
    }
  };

  // 🔄 Clear all timers
  const clearAllTimers = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      setWarningTimer(null);
    }
  };

  // 🕐 Setup session management timers
  const setupSessionTimers = () => {
    if (!user) return;

    clearAllTimers();

    // Main session timeout
    const mainTimer = setTimeout(() => {
      autoLogout();
    }, SESSION_TIMEOUT);
    setSessionTimer(mainTimer);

    // Warning timer (5 minutes before main timeout)
    const warnTimer = setTimeout(() => {
      showSessionWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);
    setWarningTimer(warnTimer);

    // 🔧 FIXED: Only log timer setup occasionally
    if (Math.random() < 0.2) { // Only log 20% of the time
      console.log(`Session timers set: ${SESSION_TIMEOUT / 1000 / 60} minutes until timeout`);
    }
  };

  // 🎯 Reset timers on activity
  const resetTimers = () => {
    updateActivity();
    setupSessionTimers();
  };

  // 📡 Setup activity listeners for session timeout
  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown', 'focus'
    ];
    
    // 🔧 FIXED: Proper throttling using useRef for immediate access
    const handleActivity = () => {
      const now = Date.now();
      // Use ref for immediate access to last activity time
      if (now - lastActivityRef.current > ACTIVITY_THROTTLE) {
        resetTimers();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    setupSessionTimers();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }, [user]);

  // 📡 Fetch user data (your original logic)
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              isAdmin: data.isAdmin || false,
              firstName: data.firstName,
              lastName: data.lastName,
              fullName: data.fullName,
              username: data.username,
              phone: data.phone,
              country: data.country,
              state: data.state,
              zipCode: data.zipCode,
              profilePicture: data.profilePicture,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            });
          } else {
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              isAdmin: false
            });
          }
          
          // Initialize session tracking when user data is loaded
          updateActivity();
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
        clearAllTimers();
      }
      setDataLoading(false);
    };

    fetchUserData();
  }, [user]);

  // 🔐 Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully');
      updateActivity(); // Reset activity timer on login
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // 📝 Sign up function
  const signUp = async (email: string, password: string, newUserData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully');
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUserData,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('User document created in Firestore');
      updateActivity(); // Reset activity timer on signup
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // 💾 Update profile function
  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date()
      });
      
      // Update local userData state
      setUserData(prev => prev ? { ...prev, ...data } : null);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // 🔒 Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      console.log('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('New password is too weak');
      } else {
        throw new Error('Failed to change password. Please try again.');
      }
    }
  };

  // 🚪 Sign out function (your original logic enhanced)
  const signOut = async () => {
    try {
      clearAllTimers();
      setShowingWarning(false);
      await auth.signOut();
      setUserData(null);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // 🔍 Debug: Log session status every 5 minutes (reduced frequency)
  useEffect(() => {
    if (!user) return;

    const debugInterval = setInterval(() => {
      const remaining = getRemainingTime();
      const minutes = Math.floor(remaining / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      console.log(`Session remaining: ${minutes}m ${seconds}s`);
    }, 5 * 60 * 1000); // Log every 5 minutes instead of 1 minute

    return () => clearInterval(debugInterval);
  }, [user, lastActivity]);

  // ✅ FIXED: Handle undefined user by converting to null (your original fix)
  const value = {
    user: user ?? null, // Convert undefined to null
    userData,
    loading: loading || dataLoading,
    signOut,
    signIn,
    signUp,
    updateProfile,
    changePassword,
    extendSession,
    getRemainingTime
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};