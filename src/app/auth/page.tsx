'use client';

import React, { useState, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Separate component that uses useSearchParams
function AuthContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Correct breadcrumbs for auth page
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Account", href: "/auth" },
    { name: isSignUp ? "Sign Up" : "Sign In", href: "#" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        if (!agreedToTerms) {
          setError('Please agree to Terms of Service and Privacy Policy');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: formData.name
        });

        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          email: formData.email,
          displayName: formData.name,
          isAdmin: false,
          createdAt: new Date(),
          orders: [],
          wishlist: []
        });

        router.push(redirectTo);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push(redirectTo);
      }
    } catch (error: any) {
      setError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: false,
          createdAt: new Date(),
          orders: [],
          wishlist: []
        });
      }
      
      router.push(redirectTo);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fixed Breadcrumb */}
      <div className="w-[100%] overflow-x-auto bg-gray-100 py-3 px-4 mr-4">
        <nav className="w-full max-w-[1400] bg-gray-100 mx-auto flex items-center text-sm text-gray-600 whitespace-nowrap space-x-2">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-gray-400 flex items-center">
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.25L5.25 5L1.5 8.75" stroke="#77878F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {item.href === "#" ? (
                <span
                  className={`flex items-center gap-1 text-[12px] ${
                    index === breadcrumbs.length - 1 ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {index === 0 && (
                    <svg className="mb-[1px]" width="12" height="14" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.875 15.2498V11.4998C9.875 11.334 9.80915 11.1751 9.69194 11.0579C9.57473 10.9406 9.41576 10.8748 9.25 10.8748H6.75C6.58424 10.8748 6.42527 10.9406 6.30806 11.0579C6.19085 11.1751 6.125 11.334 6.125 11.4998V15.2498C6.125 15.4156 6.05915 15.5745 5.94194 15.6917C5.82473 15.809 5.66576 15.8748 5.5 15.8748H1.75C1.58424 15.8748 1.42527 15.809 1.30806 15.6917C1.19085 15.5745 1.125 15.4156 1.125 15.2498V8.02324C1.1264 7.93674 1.14509 7.8514 1.17998 7.77224C1.21486 7.69308 1.26523 7.6217 1.32812 7.5623L7.57812 1.88261C7.69334 1.77721 7.84384 1.71875 8 1.71875C8.15616 1.71875 8.30666 1.77721 8.42187 1.88261L14.6719 7.5623C14.7348 7.6217 14.7851 7.69308 14.82 7.77224C14.8549 7.8514 14.8736 7.93674 14.875 8.02324V15.2498C14.875 15.4156 14.8092 15.5745 14.6919 15.6917C14.5747 15.809 14.4158 15.8748 14.25 15.8748H10.5C10.3342 15.8748 10.1753 15.809 10.0581 15.6917C9.94085 15.5745 9.875 15.4156 9.875 15.2498Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 text-[12px] hover:text-blue-600 transition-colors ${
                    index === breadcrumbs.length - 1 ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {index === 0 && (
                    <svg className="mb-[1px]" width="12" height="14" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.875 15.2498V11.4998C9.875 11.334 9.80915 11.1751 9.69194 11.0579C9.57473 10.9406 9.41576 10.8748 9.25 10.8748H6.75C6.58424 10.8748 6.42527 10.9406 6.30806 11.0579C6.19085 11.1751 6.125 11.334 6.125 11.4998V15.2498C6.125 15.4156 6.05915 15.5745 5.94194 15.6917C5.82473 15.809 5.66576 15.8748 5.5 15.8748H1.75C1.58424 15.8748 1.42527 15.809 1.30806 15.6917C1.19085 15.5745 1.125 15.4156 1.125 15.2498V8.02324C1.1264 7.93674 1.14509 7.8514 1.17998 7.77224C1.21486 7.69308 1.26523 7.6217 1.32812 7.5623L7.57812 1.88261C7.69334 1.77721 7.84384 1.71875 8 1.71875C8.15616 1.71875 8.30666 1.77721 8.42187 1.88261L14.6719 7.5623C14.7348 7.6217 14.7851 7.69308 14.82 7.77224C14.8549 7.8514 14.8736 7.93674 14.875 8.02324V15.2498C14.875 15.4156 14.8092 15.5745 14.6919 15.6917C14.5747 15.809 14.4158 15.8748 14.25 15.8748H10.5C10.3342 15.8748 10.1753 15.809 10.0581 15.6917C9.94085 15.5745 9.875 15.4156 9.875 15.2498Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="min-h-[60%] bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 text-center font-medium ${
                  !isSignUp 
                    ? 'text-black border-b-2 border-red-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 text-center font-medium ${
                  isSignUp 
                    ? 'text-black border-b-2 border-red-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Icon 
                    icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                    className="w-5 h-5" 
                  />
                </button>
              </div>

              {isSignUp && (
                <div>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Forgot Password Link - Only show on Sign In */}
              {!isSignUp && (
                <div className="flex justify-end">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-red-600 hover:text-red-500 transition duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              {isSignUp && (
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <span className="text-red-500 underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-red-500 underline cursor-pointer">Privacy Policy</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-md font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Icon icon="mdi:loading" className="w-5 h-5 animate-spin mr-2" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'SIGN UP' : 'SIGN IN'
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login with Iconify */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition duration-200"
              >
                <Icon icon="logos:google-icon" className="w-5 h-5 mr-3" />
                Sign {isSignUp ? 'up' : 'in'} with Google
              </button>

              <button
                disabled={true}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
              >
                <Icon icon="mdi:apple" className="w-5 h-5 mr-3" />
                Sign {isSignUp ? 'up' : 'in'} with Apple (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Loading fallback for auth page
function AuthFallback() {
  return (
    <>
      {/* Skeleton breadcrumb */}
      <div className="w-[100%] overflow-x-auto bg-gray-100 py-3 px-4 mr-4">
        <nav className="w-full max-w-[1400] bg-gray-100 mx-auto flex items-center text-sm text-gray-600 whitespace-nowrap space-x-2">
          <div className="animate-pulse flex space-x-2">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-1"></div>
            <div className="h-3 bg-gray-200 rounded w-14"></div>
          </div>
        </nav>
      </div>

      <div className="min-h-[60%] bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[500] w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              {/* Tab skeleton */}
              <div className="flex border-b border-gray-200 mb-8">
                <div className="flex-1 py-2 px-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
                <div className="flex-1 py-2 px-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              </div>

              {/* Form skeleton */}
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-4 h-4 bg-gray-200 rounded w-6"></div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main component with Suspense wrapper
export default function AuthPage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<AuthFallback />}>
        <AuthContent />
      </Suspense>
      <Footer />
    </div>
  );
}