// src/lib/cleanup-utils.ts
// ✅ Utility function to programmatically call the cleanup endpoint

export const cleanupPendingOrders = async () => {
  try {
    const response = await fetch('/api/orders/cleanup-pending', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLEANUP_API_SECRET}`,
      },
    });
    
    const result = await response.json();
    console.log('Cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Failed to run cleanup:', error);
    return { success: false, error };
  }
};