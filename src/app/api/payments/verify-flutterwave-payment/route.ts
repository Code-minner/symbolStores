// src/app/api/payments/verify-flutterwave-payment/route.ts - FIXED VERSION WITH ROUNDING
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

export async function POST(request: NextRequest) {
  console.log('🚀 Flutterwave payment verification API called (WITH ROUNDING)');

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

    // 1. Call Flutterwave's verification endpoint
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
      return NextResponse.json({
        success: false,
        error: `Flutterwave verification failed: ${errorText}`,
        details: 'Failed to verify payment with Flutterwave.',
      }, { status: flutterwaveResponse.status });
    }

    const flutterwaveResult: FlutterwaveVerificationResponse = await flutterwaveResponse.json();
    console.log('✅ Flutterwave API response:', JSON.stringify(flutterwaveResult, null, 2));

    // 2. Process Flutterwave's response
    if (flutterwaveResult.status !== 'success' || flutterwaveResult.data?.status !== 'successful') {
      console.warn(`⚠️ Flutterwave payment not successful for tx_ref: ${tx_ref}. Status: ${flutterwaveResult.data?.status || 'N/A'}`);
      return NextResponse.json({
        success: false,
        error: flutterwaveResult.message || 'Flutterwave payment was not successful.',
        details: flutterwaveResult.data?.status || 'unknown_status',
      }, { status: 400 });
    }

    const verifiedPaymentData = flutterwaveResult.data;

    if (!verifiedPaymentData) {
      console.error('❌ Flutterwave data is missing from successful response.');
      return NextResponse.json({ success: false, error: 'Flutterwave data missing.' }, { status: 500 });
    }

    // 3. 🚀 FIXED: Find the corresponding order in Firestore using tx_ref
    console.log(`🔍 Finding order in Firestore with txRef: ${tx_ref}`);

    const ordersRef = collection(db, 'orders'); // ✅ FIXED: Use orders collection
    const q = query(ordersRef, where('txRef', '==', tx_ref)); // ✅ FIXED: Query by txRef
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ Order not found in Firestore for txRef: ${tx_ref}`);
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // 4. Validate against your stored order data (WITH ROUNDING)
    // Ensure the amount matches (within a small tolerance) - apply rounding to both amounts
    const storedAmountRaw = typeof orderData.finalTotal === 'number' ? orderData.finalTotal : (orderData.amount || 0);
    const receivedAmountRaw = typeof verifiedPaymentData.amount === 'number' ? verifiedPaymentData.amount : 0;
    
    // Apply rounding to both amounts before comparison (same as CartContext logic)
    const storedAmount = roundUpToNearest10(storedAmountRaw);
    const receivedAmount = roundUpToNearest10(receivedAmountRaw);
    const currency = verifiedPaymentData.currency;

    console.log(`💰 Amount comparison (rounded): Stored: ₦${storedAmount}, Received: ₦${receivedAmount}`);

    if (Math.abs(storedAmount - receivedAmount) > 0.01 || orderData.currency !== currency) {
      console.error('❌ Amount or currency mismatch between stored order and Flutterwave response:', {
        storedAmountRaw, storedAmount, receivedAmountRaw, receivedAmount, storedCurrency: orderData.currency, receivedCurrency: currency
      });
      // It's critical to NOT confirm the order if amounts don't match
      return NextResponse.json({
        success: false,
        error: 'Amount or currency mismatch. Please contact support.',
        details: 'Payment amount or currency does not match the order.',
      }, { status: 400 });
    }

    // Check if order is already confirmed to prevent double processing
    if (orderData.status === 'confirmed') {
      console.warn(`⚠️ Order ${orderData.orderId} is already confirmed. Skipping update.`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and order confirmed.',
        data: { 
          orderId: orderData.orderId, 
          status: 'confirmed', 
          transactionId: verifiedPaymentData.id 
        }
      });
    }

    // 5. 🚀 FIXED: Update order status in Firestore
    console.log(`💾 Updating order ${orderData.orderId} status to 'confirmed'`);
    await updateDoc(doc(db, 'orders', orderDoc.id), { // ✅ FIXED: Use orders collection
      status: 'confirmed',
      paymentVerified: true,
      transactionId: verifiedPaymentData.id,
      flwRef: verifiedPaymentData.flw_ref,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Order ${orderData.orderId} updated to 'confirmed' in Firestore.`);

    // 6. Send email notifications (use rounded stored amount)
    const customerEmailData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName || verifiedPaymentData.customer.name,
      customerEmail: orderData.customerEmail || verifiedPaymentData.customer.email,
      customerPhone: orderData.customerPhone || verifiedPaymentData.customer.phone_number,
      amount: storedAmount, // Use rounded stored amount as the source of truth
      items: orderData.items || [], // Get items from stored order data
      totalAmountItemsOnly: orderData.totalAmountItemsOnly || storedAmount,
      shippingCost: orderData.shippingCost || 0,
      taxAmount: orderData.taxAmount || 0,
      finalTotal: storedAmount, // Use rounded amount
      isFreeShipping: orderData.isFreeShipping || false,
      // No bankDetails for Flutterwave orders
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

    console.log('🎉 Flutterwave payment verification successful (WITH ROUNDING)!');

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed!',
      data: {
        orderId: orderData.orderId,
        status: 'confirmed',
        transactionId: verifiedPaymentData.id,
        flwRef: verifiedPaymentData.flw_ref,
        amount: storedAmount, // Use rounded amount in response
        emailSent: customerEmailSent,
        adminEmailSent: adminEmailSent,
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