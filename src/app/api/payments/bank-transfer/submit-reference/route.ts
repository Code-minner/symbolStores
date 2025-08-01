// src/app/api/payments/bank-transfer/submit-reference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SubmitReferenceRequest {
  orderId: string;
  transactionReference: string;
  customerSubmittedAmount?: number;
  customerNotes?: string;
}

export async function POST(request: NextRequest) {
  console.log('📋 Customer reference submission API called');
  
  try {
    const requestBody = await request.json();
    console.log('📥 Reference submission request:', JSON.stringify(requestBody, null, 2));
    
    const { 
      orderId, 
      transactionReference, 
      customerSubmittedAmount,
      customerNotes 
    }: SubmitReferenceRequest = requestBody;

    // Validation
    if (!orderId || !transactionReference) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and transaction reference are required'
      }, { status: 400 });
    }

    if (transactionReference.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Transaction reference seems too short. Please provide a valid reference number.'
      }, { status: 400 });
    }

    console.log(`🔍 Looking for order: ${orderId}`);
    
    // Find the order by orderId
    const bankTransfersRef = collection(db, 'bankTransferOrders');
    const q = query(bankTransfersRef, where('orderId', '==', orderId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ Order not found:', orderId);
      return NextResponse.json({
        success: false,
        error: 'Order not found. Please check your order ID.'
      }, { status: 404 });
    }

    // Get the first matching document
    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    
    console.log('📋 Order found - Current status:', orderData.status);

    // Check if order can accept reference submission
    if (orderData.status !== 'pending_payment') {
      if (orderData.status === 'pending_verification') {
        return NextResponse.json({
          success: false,
          error: 'You have already submitted a transaction reference for this order. It is currently being verified.',
          data: {
            orderId: orderData.orderId,
            status: orderData.status,
            submittedReference: orderData.transactionReference,
            submittedAt: orderData.referenceSubmittedAt
          }
        }, { status: 400 });
      } else if (orderData.status === 'confirmed') {
        return NextResponse.json({
          success: false,
          error: 'This order has already been confirmed and completed.',
          data: {
            orderId: orderData.orderId,
            status: orderData.status
          }
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          error: `Order cannot accept reference submission. Current status: ${orderData.status}`
        }, { status: 400 });
      }
    }

    // Check for duplicate transaction reference
    console.log('🔍 Checking for duplicate transaction references...');
    const duplicateQuery = query(
      bankTransfersRef, 
      where('transactionReference', '==', transactionReference.trim())
    );
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    if (!duplicateSnapshot.empty) {
      const existingOrder = duplicateSnapshot.docs[0].data();
      if (existingOrder.orderId !== orderId) {
        return NextResponse.json({
          success: false,
          error: 'This transaction reference has already been used for another order. Please provide a unique reference number.'
        }, { status: 400 });
      }
    }

    // Update the order with the transaction reference
    const updateData = {
      transactionReference: transactionReference.trim(),
      status: 'pending_verification',
      referenceSubmittedAt: new Date().toISOString(),
      customerSubmittedAmount: customerSubmittedAmount || orderData.amount,
      customerNotes: customerNotes || null,
      verificationMethod: 'pending_manual',
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Updating order with transaction reference...');
    const orderRef = doc(db, 'bankTransferOrders', orderDoc.id);
    await updateDoc(orderRef, updateData);
    
    console.log('✅ Transaction reference submitted successfully');

    return NextResponse.json({
      success: true,
      message: 'Transaction reference submitted successfully! Your payment is now being verified.',
      data: {
        orderId: orderData.orderId,
        transactionReference: transactionReference.trim(),
        newStatus: 'pending_verification',
        submittedAt: updateData.referenceSubmittedAt,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        amount: orderData.amount,
        
        verificationProcess: {
          step: 2,
          title: 'Reference Submitted - Verification in Progress',
          message: 'We are verifying your payment. This usually takes 2-4 hours during business hours.',
          estimatedTime: '2-4 hours',
          nextStep: 'You will receive an email confirmation once payment is verified.'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Reference submission error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to submit transaction reference',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET method to check reference submission status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // Find the order
    const bankTransfersRef = collection(db, 'bankTransferOrders');
    const q = query(bankTransfersRef, where('orderId', '==', orderId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const orderData = querySnapshot.docs[0].data();
    
    return NextResponse.json({
      success: true,
      data: {
        orderId: orderData.orderId,
        status: orderData.status,
        transactionReference: orderData.transactionReference || null,
        referenceSubmittedAt: orderData.referenceSubmittedAt || null,
        paymentVerified: orderData.paymentVerified || false,
        verifiedAt: orderData.verifiedAt || null,
        amount: orderData.amount,
        canSubmitReference: orderData.status === 'pending_payment'
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking reference status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check reference status'
    }, { status: 500 });
  }
}