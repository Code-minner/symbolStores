// src/app/api/payments/flutterwave/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp  } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailService } from '@/lib/email'; // Import your EmailService

// Define interfaces for clarity
interface FlutterwaveVerificationRequestBody {
  transaction_id?: string; // Flutterwave's transaction ID
  tx_ref: string;          // Your unique transaction reference (orderId)
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
  console.log('🚀 Flutterwave payment verification API called');

  try {
    const { transaction_id, tx_ref }: FlutterwaveVerificationRequestBody = await request.json();

    if (!tx_ref) {
      console.error('❌ Validation failed: tx_ref is required for Flutterwave verification.');
      return NextResponse.json({ success: false, error: 'Transaction reference (tx_ref) is required.' }, { status: 400 });
    }

    console.log(`🔍 Verifying Flutterwave transaction for tx_ref: ${tx_ref}, transaction_id: ${transaction_id || 'N/A'}`);

    // 1. Call Flutterwave's verification endpoint
    const flutterwaveVerifyUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    console.log(`📡 Calling Flutterwave API: ${flutterwaveVerifyUrl}`);

    const flutterwaveResponse = await fetch(flutterwaveVerifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, // Use your secret key
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

    // 3. Find the corresponding order in Firestore using tx_ref (which should be your orderId)
    const orderId = tx_ref; // Assuming tx_ref is your orderId
    console.log(`🔍 Finding order in Firestore with orderId (tx_ref): ${orderId}`);

    const ordersRef = collection(db, 'flutterwaveOrders'); // Assuming a 'flutterwaveOrders' collection
    const q = query(ordersRef, where('orderId', '==', orderId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ Order not found in Firestore for orderId: ${orderId}`);
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // 4. Validate against your stored order data
    // Ensure the amount matches (within a small tolerance)
    const storedAmount = typeof orderData.amount === 'number' ? orderData.amount : 0;
    const receivedAmount = typeof verifiedPaymentData.amount === 'number' ? verifiedPaymentData.amount : 0;
    const currency = verifiedPaymentData.currency;

    if (Math.abs(storedAmount - receivedAmount) > 0.01 || orderData.currency !== currency) {
      console.error('❌ Amount or currency mismatch between stored order and Flutterwave response:', {
        storedAmount, receivedAmount, storedCurrency: orderData.currency, receivedCurrency: currency
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
      console.warn(`⚠️ Order ${orderId} is already confirmed. Skipping update.`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and order confirmed.',
        data: { orderId, status: 'confirmed', transactionId: verifiedPaymentData.id }
      });
    }

    // 5. Update order status in Firestore
    console.log(`💾 Updating order ${orderId} status to 'confirmed'`); // Corrected line
    await updateDoc(doc(db, 'flutterwaveOrders', orderDoc.id), {
      status: 'confirmed',
      paymentVerified: true,
      transactionId: verifiedPaymentData.id,
      flwRef: verifiedPaymentData.flw_ref,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Order ${orderId} updated to 'confirmed' in Firestore.`);

    // 6. Send email notifications
    const customerEmailData = {
      orderId: orderId,
      customerName: verifiedPaymentData.customer.name || orderData.customerName,
      customerEmail: verifiedPaymentData.customer.email || orderData.customerEmail,
      customerPhone: verifiedPaymentData.customer.phone_number || orderData.customerPhone,
      amount: storedAmount, // Use your stored amount as the source of truth
      items: orderData.items, // Get items from stored order data
      // No bankDetails for Flutterwave orders
    };

    let customerEmailSent = false;
    try {
      const { success } = await EmailService.sendOrderConfirmation(customerEmailData);
      customerEmailSent = success;
      if (!success) console.error('❌ Failed to send customer confirmation email for Flutterwave order.');
    } catch (emailError) {
      console.error('❌ Error sending customer confirmation email for Flutterwave order:', emailError);
    }

    let adminEmailSent = false;
    try {
      const { success } = await EmailService.sendAdminNotification(customerEmailData); // Use the same data structure
      adminEmailSent = success;
      if (!success) console.error('❌ Failed to send admin notification email for Flutterwave order.');
    } catch (emailError) {
      console.error('❌ Error sending admin notification email for Flutterwave order:', emailError);
    }

    console.log('🎉 Flutterwave payment verification successful!');

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed!',
      data: {
        orderId: orderId,
        status: 'confirmed',
        transactionId: verifiedPaymentData.id,
        flwRef: verifiedPaymentData.flw_ref,
        amount: storedAmount,
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
