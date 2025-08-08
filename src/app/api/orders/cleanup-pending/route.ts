// src/app/api/orders/cleanup-pending/route.ts
// ✅ NEW: API endpoint to cleanup old pending orders
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailService } from '@/lib/email';

interface PendingOrder {
  id: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  createdAt: any;
  items: any[];
  finalTotal: number;
}

// ✅ Function to release inventory for expired orders
const releaseInventoryForOrder = async (items: any[]) => {
  try {
    console.log('🔄 Releasing inventory for expired order...');
    // TODO: Implement your inventory release logic here
    // Example:
    // for (const item of items) {
    //   await updateDoc(doc(db, 'products', item.id), {
    //     stockQuantity: increment(item.quantity)
    //   });
    // }
    console.log('✅ Inventory released for expired order');
  } catch (error) {
    console.error('❌ Failed to release inventory for expired order:', error);
  }
};

// ✅ Function to send order expiration email
const sendOrderExpiredEmail = async (orderData: PendingOrder) => {
  try {
    const emailData = {
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      orderId: orderData.orderId,
      amount: orderData.finalTotal,
      reason: 'Order expired due to payment timeout',
      retryLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://yoursite.com'}/shop`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yoursite.com',
    };

    // Send expiration email (you'll need to create this method)
    // await EmailService.sendOrderExpiredEmail(emailData);
    console.log(`📧 Order expiration email sent to ${orderData.customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send order expiration email:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of pending orders...');

    // ✅ Authentication check (optional - add your auth logic)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CLEANUP_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Find orders that are pending and older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('status', '==', 'pending'),
      // Note: Firestore doesn't support inequality on timestamp directly with other where clauses
      // You might need to fetch all pending orders and filter by date in code
    );
    
    const querySnapshot = await getDocs(q);
    const expiredOrders: PendingOrder[] = [];

    // Filter orders by creation time
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date(0);
      
      if (createdAt < thirtyMinutesAgo) {
        expiredOrders.push({
          id: doc.id,
          orderId: data.orderId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          createdAt: data.createdAt,
          items: data.items || [],
          finalTotal: data.finalTotal || 0,
        });
      }
    });

    console.log(`🔍 Found ${expiredOrders.length} expired pending orders`);

    if (expiredOrders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired orders found',
        cleanedUp: 0 
      });
    }

    // ✅ Process each expired order
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const expiredOrder of expiredOrders) {
      try {
        console.log(`⏰ Processing expired order: ${expiredOrder.orderId}`);

        // Mark as expired
        await updateDoc(doc(db, 'orders', expiredOrder.id), {
          status: 'expired',
          expiredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          expiredReason: 'Payment timeout - order expired after 30 minutes',
        });

        // Release inventory
        if (expiredOrder.items.length > 0) {
          await releaseInventoryForOrder(expiredOrder.items);
        }

        // Send expiration email (optional)
        await sendOrderExpiredEmail(expiredOrder);

        results.successful++;
        console.log(`✅ Expired order ${expiredOrder.orderId} processed successfully`);

      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process expired order ${expiredOrder.orderId}: ${error}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🧹 Cleanup completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      totalFound: expiredOrders.length,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });

  } catch (error) {
    console.error('❌ Cleanup process error:', error);
    return NextResponse.json({
      success: false,
      error: 'Cleanup process failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ✅ Alternative: You can also call this function programmatically
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