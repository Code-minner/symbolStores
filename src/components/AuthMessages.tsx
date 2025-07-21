// src/components/AuthMessages.tsx
"use client";

import { useEffect, useState } from 'react';

export default function AuthMessages() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const messageParam = urlParams.get('message');
      
      if (messageParam) {
        setMessage(messageParam);
        
        // Clean up URL after showing message
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, []);

  if (!message) return null;

  const getMessageContent = (messageType: string) => {
    switch (messageType) {
      case 'account_not_found':
        return {
          type: 'error',
          title: 'Account Not Found',
          description: 'Your account could not be found in our system. Please sign in again to restore your data.'
        };
      case 'authentication_required':
        return {
          type: 'warning',
          title: 'Authentication Required',
          description: 'Please sign in to access your wishlist and account features.'
        };
      default:
        return null;
    }
  };

  const messageContent = getMessageContent(message);

  if (!messageContent) return null;

  return (
    <div className={`p-4 rounded-md mb-6 ${
      messageContent.type === 'error' 
        ? 'bg-red-50 border border-red-200 text-red-700' 
        : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
    }`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {messageContent.type === 'error' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">
            {messageContent.title}
          </h3>
          <div className="mt-2 text-sm">
            <p>{messageContent.description}</p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setMessage(null)}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                messageContent.type === 'error'
                  ? 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                  : 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600'
              }`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage in your auth page:
// import AuthMessages from '@/components/AuthMessages';
// 
// export default function AuthPage() {
//   return (
//     <div className="auth-page">
//       <AuthMessages />
//       {/* Your auth form here */}
//     </div>
//   );
// }