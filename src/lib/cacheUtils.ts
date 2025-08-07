// src/lib/cacheUtils.ts
import { clearProductsCache } from '@/lib/ProductsCache';

/**
 * Safely extracts error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

/**
 * Clears both client-side cache and Next.js server cache
 */
export async function clearAllProductCaches(): Promise<void> {
  try {
    // 1. Clear client-side cache (your ProductsCache system)
    clearProductsCache();
    console.log('✅ Client cache cleared');

    // 2. Clear Next.js server cache via API
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
        action: 'products'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server cache cleared:', data.message);
    } else {
      console.warn('⚠️ Server cache clear failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Cache clearing error:', getErrorMessage(error));
    // Don't throw error - cache clearing failure shouldn't break the user flow
  }
}

/**
 * Shows a user-friendly message about cache clearing
 */
export function showCacheUpdateMessage(): void {
  const message = `
✅ Product saved successfully!

🔄 Cache is being cleared to ensure changes appear immediately on the storefront.

Changes will be visible within 10-15 seconds.
  `.trim();
  
  alert(message);
}

/**
 * Comprehensive cache clearing with user feedback
 */
export async function clearCachesWithFeedback(): Promise<void> {
  try {
    console.log('🔄 Clearing all caches...');
    
    // Clear client cache immediately
    clearProductsCache();
    
    // Clear server cache
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
        action: 'products'
      }),
    });
    
    console.log('✅ All caches cleared successfully');
  } catch (error) {
    console.warn('⚠️ Some cache clearing failed:', getErrorMessage(error));
  }
}