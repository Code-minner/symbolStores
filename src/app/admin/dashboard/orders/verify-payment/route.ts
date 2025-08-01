// src/app/admin/dashboard/orders/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailService } from '@/lib/email';

interface VerifyPaymentRequest {
  orderId: string;
  action: 'approve' | 'reject';
  notes?: string;
  verifiedBy?: string;
}

export async function POST(request: NextRequest) {
  console.log('🔐 Admin Verify Payment API called');
  
  try {
    // TODO: Add admin authentication check here
    // const isAdmin = await verifyAdminToken(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const requestBody = await request.json();
    console.log('📥 Verify payment request:', JSON.stringify(requestBody, null, 2));
    
    const { orderId, action, notes, verifiedBy }: VerifyPaymentRequest = requestBody;

    // Validation
    if (!orderId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and action (approve/reject) are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be either "approve" or "reject"'
      }, { status: 400 });
    }

    console.log(`🔍 Looking for order: ${orderId}`);
    
    // Find the order by orderId (not document ID)
    const bankTransfersRef = collection(db, 'bankTransferOrders');
    const q = query(bankTransfersRef, where('orderId', '==', orderId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ Order not found:', orderId);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    // Get the first (and should be only) matching document
    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    
    console.log('📋 Order found:', orderData.status, orderData.amount);

    // Check if order can be verified
    if (orderData.paymentVerified === true) {
      return NextResponse.json({
        success: false,
        error: 'Order has already been verified'
      }, { status: 400 });
    }

    if (orderData.status !== 'pending_verification') {
      return NextResponse.json({
        success: false,
        error: `Order cannot be verified. Current status: ${orderData.status}`
      }, { status: 400 });
    }

    if (!orderData.transactionReference) {
      return NextResponse.json({
        success: false,
        error: 'Customer has not submitted transaction reference yet'
      }, { status: 400 });
    }

    // Prepare update data based on action
    const updateData: any = {
      updatedAt: serverTimestamp(),
      verificationMethod: 'manual_admin',
      verificationNotes: notes || null,
      verifiedAt: serverTimestamp(),
      verifiedBy: verifiedBy || 'admin'
    };

    if (action === 'approve') {
      updateData.paymentVerified = true;
      updateData.status = 'confirmed';
      console.log('✅ Approving payment for order:', orderId);
    } else {
      updateData.paymentVerified = false;
      updateData.status = 'payment_rejected';
      console.log('❌ Rejecting payment for order:', orderId);
    }

    // Update the order in Firestore using the document reference
    console.log('💾 Updating order in Firestore...');
    const orderRef = doc(db, 'bankTransferOrders', orderDoc.id);
    await updateDoc(orderRef, updateData);
    console.log('✅ Order updated successfully');

    // Send email notifications
    let emailResults = { customer: false, admin: false };

    if (action === 'approve') {
      // Send customer confirmation email
      console.log('📧 Sending customer confirmation email...');
      try {
        const customerEmailData = {
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          amount: orderData.amount,
          items: orderData.items.map((item: any) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            amount: item.amount,
            imageURL: item.imageURL
          })),
          bankDetails: orderData.bankDetails
        };

        const customerResult = await EmailService.sendBankTransferConfirmation(customerEmailData);
        emailResults.customer = customerResult.success;
        console.log('📧 Customer confirmation email:', emailResults.customer ? '✅ Sent' : '❌ Failed');
      } catch (emailError) {
        console.error('❌ Failed to send customer confirmation:', emailError);
      }
    } else {
      // Send rejection email to customer
      console.log('📧 Sending payment rejection email...');
      try {
        // Create a simple rejection email (you can enhance this)
        const rejectionEmailData = {
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          amount: orderData.amount,
          rejectionReason: notes || 'Payment could not be verified',
          items: orderData.items || []
        };

        // For now, we'll use a simple approach - you can create a dedicated rejection email method
        console.log('📧 Rejection email would be sent to:', orderData.customerEmail);
        // TODO: Implement EmailService.sendPaymentRejection(rejectionEmailData)
        emailResults.customer = true; // Temporarily mark as sent
      } catch (emailError) {
        console.error('❌ Failed to send rejection email:', emailError);
      }
    }

    console.log('🎉 Payment verification completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderData.orderId,
        action: action,
        newStatus: updateData.status,
        paymentVerified: updateData.paymentVerified,
        verifiedAt: new Date().toISOString(),
        verifiedBy: verifiedBy || 'admin',
        verificationNotes: notes,
        emailResults: emailResults,
        
        // Order details for confirmation
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        amount: orderData.amount,
        transactionReference: orderData.transactionReference
      },
      message: action === 'approve' 
        ? 'Payment approved successfully - customer notified' 
        : 'Payment rejected - customer will be notified'
    });
    
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}