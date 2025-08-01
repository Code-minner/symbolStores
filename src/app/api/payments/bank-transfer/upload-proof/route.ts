// src/app/api/payments/bank-transfer/upload-proof/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('proof') as File;
    const customerEmail = formData.get('customerEmail') as string;

    // Validation
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Proof of payment file is required'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.'
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Find the order
    const ordersQuery = query(
      collection(db, 'bankTransferOrders'),
      where('orderId', '==', orderId)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // Verify customer email if provided
    if (customerEmail && orderData.customerEmail !== customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email for this order'
      }, { status: 403 });
    }

    // Check if order status allows proof upload
    if (!['pending_payment', 'payment_failed'].includes(orderData.status)) {
      return NextResponse.json({
        success: false,
        error: 'Proof of payment cannot be uploaded for this order status'
      }, { status: 400 });
    }

    // TODO: Upload file to your storage (Firebase Storage, AWS S3, etc.)
    // For now, we'll simulate file upload
    const filename = `proof_${orderId}_${Date.now()}.${file.name.split('.').pop()}`;
    const fileUrl = `https://your-storage-url.com/proofs/${filename}`;
    
    // In a real implementation, you would upload the file like this:
    /*
    import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    const storage = getStorage();
    const storageRef = ref(storage, `payment-proofs/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(snapshot.ref);
    */

    // Update the order with proof of payment
    const orderRef = doc(db, 'bankTransferOrders', orderDoc.id);
    
    await updateDoc(orderRef, {
      status: 'payment_submitted',
      proofOfPayment: {
        filename: filename,
        fileUrl: fileUrl,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: serverTimestamp()
      },
      paymentSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Proof of payment uploaded for order: ${orderId}`);

    // Send notification email to admin
    try {
      const { EmailService } = await import('@/lib/email');
      
      // ✅ FIXED: Use existing sendAdminNotification with complete OrderData format
      await EmailService.sendAdminNotification({
        orderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || 'N/A', // ✅ Ensure this field exists
        amount: orderData.amount,
        items: orderData.items || [],
        bankDetails: {
          accountName: 'Payment Proof Uploaded',
          accountNumber: filename,
          bankName: 'Awaiting Verification',
        },
      });
      
      console.log('✅ Admin notification sent for payment proof');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
      // Continue anyway - don't fail the upload because of email
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: 'payment_submitted',
        message: 'Proof of payment uploaded successfully. Your payment will be verified within 24-48 hours.',
        proofOfPayment: {
          filename: filename,
          uploadedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Proof upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload proof of payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method to check upload status
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
    const ordersQuery = query(
      collection(db, 'bankTransferOrders'),
      where('orderId', '==', orderId)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
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
        orderId,
        status: orderData.status,
        proofUploaded: !!orderData.proofOfPayment,
        proofOfPayment: orderData.proofOfPayment || null,
        paymentSubmittedAt: orderData.paymentSubmittedAt?.toDate?.()?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('❌ Error checking upload status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check upload status'
    }, { status: 500 });
  }
}