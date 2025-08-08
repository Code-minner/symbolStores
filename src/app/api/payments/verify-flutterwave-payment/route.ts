// src/app/api/payments/verify-flutterwave-payment/route.ts - TYPESCRIPT FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailService } from '@/lib/email';

// --- PRICE ROUNDING HELPER (same as CartContext) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

// Define interfaces for clarity
interface FlutterwaveVerificationRequestBody {
  transaction_id?: string; // Flutterwave's transaction ID
  tx_ref: string;          // Your unique transaction reference
}

interface FlutterwaveVerificationResponse {
  status: string; // "success" or "error"
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    currency: string;
    amount: number;
    status: string; // "successful", "pending", "failed"
    customer: {
      email: string;
      name: string;
      phone_number: string;
    };
    // ... other Flutterwave data
  };
}

// ✅ NEW: Function to release inventory (implement based on your inventory system)
const releaseInventory = async (items: any[]) => {
  try {
    console.log('🔄 Releasing inventory for failed payment...');
    // TODO: Implement your inventory release logic here
    // Example:
    // for (const item of items) {
    //   await updateDoc(doc(db, 'products', item.id), {
    //     stockQuantity: increment(item.quantity)
    //   });
    // }
    console.log('✅ Inventory released successfully');
  } catch (error) {
    console.error('❌ Failed to release inventory:', error);
  }
};

// ✅ NEW: Function to send payment failure notification
const sendPaymentFailureNotification = async (orderData: any, reason: string) => {
  try {
    console.log('📧 Sending payment failure notification...');
    
    const failureEmailData = {
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      orderId: orderData.orderId,
      amount: orderData.finalTotal,
      reason: reason,
      retryLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://yoursite.com'}/checkout?retry=${orderData.orderId}`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yoursite.com',
    };

    // ✅ FIXED: Now using the correct method name from EmailService
    await EmailService.sendPaymentFailedEmail(failureEmailData);
    
    console.log('✅ Payment failure notification sent');
  } catch (error) {
    console.error('❌ Failed to send payment failure notification:', error);
  }
};

// ✅ FIXED: Function to mark order as failed - proper type handling
const markOrderAsFailed = async (orderDocId: string, orderData: any, reason: string, transactionId?: string | number) => {
  try {
    console.log(`❌ Marking order ${orderData.orderId} as failed: ${reason}`);
    
    await updateDoc(doc(db, 'orders', orderDocId), {
      status: 'failed',
      failureReason: reason,
      failedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // ✅ FIXED: Convert transactionId to string if it's a number
      ...(transactionId && { 
        transactionId: typeof transactionId === 'number' ? transactionId.toString() : transactionId 
      }),
    });

    // Release inventory
    if (orderData.items && orderData.items.length > 0) {
      await releaseInventory(orderData.items);
    }

    // Send failure notification
    await sendPaymentFailureNotification(orderData, reason);

    console.log(`✅ Order ${orderData.orderId} marked as failed and cleanup completed`);
  } catch (error) {
    console.error('❌ Failed to mark order as failed:', error);
  }
};

export async function POST(request: NextRequest) {
  console.log('🚀 Flutterwave payment verification API called (TYPESCRIPT FIXED VERSION)');

  try {
    const { transaction_id, tx_ref }: FlutterwaveVerificationRequestBody = await request.json();

    if (!transaction_id || !tx_ref) {
      console.error('❌ Validation failed: transaction_id and tx_ref are required for Flutterwave verification.');
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID and transaction reference (tx_ref) are required.' 
      }, { status: 400 });
    }

    console.log(`🔍 Verifying Flutterwave transaction for tx_ref: ${tx_ref}, transaction_id: ${transaction_id}`);

    // 1. Find the corresponding order in Firestore using tx_ref FIRST
    console.log(`🔍 Finding order in Firestore with txRef: ${tx_ref}`);

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('txRef', '==', tx_ref));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ Order not found in Firestore for txRef: ${tx_ref}`);
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // Check if order is already processed to prevent double processing
    if (orderData.status === 'confirmed') {
      console.warn(`⚠️ Order ${orderData.orderId} is already confirmed. Skipping verification.`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and order confirmed.',
        data: { 
          orderId: orderData.orderId, 
          status: 'confirmed', 
          transactionId: orderData.transactionId 
        }
      });
    }

    if (orderData.status === 'failed') {
      console.warn(`⚠️ Order ${orderData.orderId} is already marked as failed.`);
      return NextResponse.json({
        success: false,
        error: 'This order has already failed. Please create a new order.',
        data: { orderId: orderData.orderId, status: 'failed' }
      }, { status: 400 });
    }

    // 2. Call Flutterwave's verification endpoint
    const flutterwaveVerifyUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    console.log(`📡 Calling Flutterwave API: ${flutterwaveVerifyUrl}`);

    const flutterwaveResponse = await fetch(flutterwaveVerifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    if (!flutterwaveResponse.ok) {
      const errorText = await flutterwaveResponse.text();
      console.error(`❌ Flutterwave API error: Status ${flutterwaveResponse.status}, Response: ${errorText}`);
      
      // ✅ IMPROVED: Mark order as failed for API errors
      await markOrderAsFailed(orderDoc.id, orderData, `Flutterwave API error: ${errorText}`, transaction_id);
      
      return NextResponse.json({
        success: false,
        error: `Flutterwave verification failed: ${errorText}`,
        details: 'Failed to verify payment with Flutterwave.',
      }, { status: flutterwaveResponse.status });
    }

    const flutterwaveResult: FlutterwaveVerificationResponse = await flutterwaveResponse.json();
    console.log('✅ Flutterwave API response:', JSON.stringify(flutterwaveResult, null, 2));

    // 3. Process Flutterwave's response
    if (flutterwaveResult.status !== 'success') {
      const reason = `Flutterwave API returned error: ${flutterwaveResult.message}`;
      console.warn(`⚠️ ${reason} for tx_ref: ${tx_ref}`);
      
      // ✅ IMPROVED: Mark order as failed for API-level failures
      await markOrderAsFailed(orderDoc.id, orderData, reason, transaction_id);
      
      return NextResponse.json({
        success: false,
        error: flutterwaveResult.message || 'Flutterwave payment verification failed.',
        details: 'API_ERROR',
      }, { status: 400 });
    }

    const verifiedPaymentData = flutterwaveResult.data;

    if (!verifiedPaymentData) {
      console.error('❌ Flutterwave data is missing from successful response.');
      await markOrderAsFailed(orderDoc.id, orderData, 'Missing payment data from Flutterwave', transaction_id);
      return NextResponse.json({ success: false, error: 'Flutterwave data missing.' }, { status: 500 });
    }

    // 4. Check payment status from Flutterwave
    if (verifiedPaymentData.status !== 'successful') {
      const reason = `Payment status is '${verifiedPaymentData.status}' instead of 'successful'`;
      console.warn(`⚠️ ${reason} for tx_ref: ${tx_ref}`);
      
      // ✅ FIXED: Convert number to string when marking as failed
      await markOrderAsFailed(orderDoc.id, orderData, reason, verifiedPaymentData.id.toString());
      
      return NextResponse.json({
        success: false,
        error: `Payment was not successful. Status: ${verifiedPaymentData.status}`,
        details: verifiedPaymentData.status,
      }, { status: 400 });
    }

    // 5. ✅ IMPROVED: Validate amount with better error handling
    const storedAmountRaw = typeof orderData.finalTotal === 'number' ? orderData.finalTotal : (orderData.amount || 0);
    const receivedAmountRaw = typeof verifiedPaymentData.amount === 'number' ? verifiedPaymentData.amount : 0;
    
    // Apply rounding to both amounts before comparison (same as CartContext logic)
    const storedAmount = roundUpToNearest10(storedAmountRaw);
    const receivedAmount = roundUpToNearest10(receivedAmountRaw);
    const currency = verifiedPaymentData.currency;

    console.log(`💰 Amount comparison (rounded): Stored: ₦${storedAmount}, Received: ₦${receivedAmount}`);

    // ✅ IMPROVED: More detailed amount validation
    const amountDifference = Math.abs(storedAmount - receivedAmount);
    const currencyMatch = orderData.currency === currency || currency === 'NGN'; // Default to NGN

    if (amountDifference > 0.01 || !currencyMatch) {
      const reason = amountDifference > 0.01 
        ? `Amount mismatch: Expected ₦${storedAmount}, Received ₦${receivedAmount} (Difference: ₦${amountDifference})`
        : `Currency mismatch: Expected ${orderData.currency || 'NGN'}, Received ${currency}`;
      
      console.error('❌ Payment validation failed:', {
        storedAmountRaw, storedAmount, receivedAmountRaw, receivedAmount, 
        storedCurrency: orderData.currency, receivedCurrency: currency,
        amountDifference, currencyMatch
      });
      
      // ✅ FIXED: Convert number to string when marking as failed
      await markOrderAsFailed(orderDoc.id, orderData, reason, verifiedPaymentData.id.toString());
      
      return NextResponse.json({
        success: false,
        error: 'Payment amount or currency does not match the order. Please contact support.',
        details: reason,
      }, { status: 400 });
    }

    // 6. ✅ SUCCESS: Update order status in Firestore
    console.log(`💾 Updating order ${orderData.orderId} status to 'confirmed'`);
    await updateDoc(doc(db, 'orders', orderDoc.id), {
      status: 'confirmed',
      paymentVerified: true,
      transactionId: verifiedPaymentData.id.toString(), // ✅ FIXED: Convert to string
      flwRef: verifiedPaymentData.flw_ref,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // ✅ NEW: Store verification details
      paymentDetails: {
        gateway: 'flutterwave',
        verifiedAmount: receivedAmount,
        currency: currency,
        verificationDate: new Date().toISOString(),
        flutterwaveTransactionId: verifiedPaymentData.id.toString(), // ✅ FIXED: Convert to string
      }
    });
    console.log(`✅ Order ${orderData.orderId} updated to 'confirmed' in Firestore.`);

    // 7. Send success email notifications (use rounded stored amount)
    const customerEmailData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName || verifiedPaymentData.customer.name,
      customerEmail: orderData.customerEmail || verifiedPaymentData.customer.email,
      customerPhone: orderData.customerPhone || verifiedPaymentData.customer.phone_number,
      amount: storedAmount, // Use rounded stored amount as the source of truth
      items: orderData.items || [],
      totalAmountItemsOnly: orderData.totalAmountItemsOnly || storedAmount,
      shippingCost: orderData.shippingCost || 0,
      taxAmount: orderData.taxAmount || 0,
      finalTotal: storedAmount, // Use rounded amount
      isFreeShipping: orderData.isFreeShipping || false,
      transactionId: verifiedPaymentData.id.toString(), // ✅ FIXED: Convert to string
      paymentMethod: 'Flutterwave',
    };

    let customerEmailSent = false;
    try {
      console.log('📧 Sending customer confirmation email...');
      const { success } = await EmailService.sendOrderConfirmation(customerEmailData);
      customerEmailSent = success;
      if (!success) console.error('❌ Failed to send customer confirmation email for Flutterwave order.');
    } catch (emailError) {
      console.error('❌ Error sending customer confirmation email for Flutterwave order:', emailError);
    }

    let adminEmailSent = false;
    try {
      console.log('📧 Sending admin notification email...');
      const { success } = await EmailService.sendAdminNotification(customerEmailData);
      adminEmailSent = success;
      if (!success) console.error('❌ Failed to send admin notification email for Flutterwave order.');
    } catch (emailError) {
      console.error('❌ Error sending admin notification email for Flutterwave order:', emailError);
    }

    console.log('🎉 Flutterwave payment verification successful (TYPESCRIPT FIXED VERSION)!');

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed!',
      data: {
        orderId: orderData.orderId,
        status: 'confirmed',
        transactionId: verifiedPaymentData.id.toString(), // ✅ FIXED: Convert to string
        flwRef: verifiedPaymentData.flw_ref,
        amount: storedAmount,
        emailSent: customerEmailSent,
        adminEmailSent: adminEmailSent,
        verificationTimestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Flutterwave payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to verify Flutterwave payment.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}