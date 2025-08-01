// src/app/api/track-order/route.ts - FIXED TypeScript Errors
import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/orderService';

// ✅ FIXED: Define proper types for order data
interface OrderTrackingData {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: any[];
  createdAt: any;
  paymentSubmittedAt?: any;
  paymentVerifiedAt?: any;
  completedAt?: any;
  shippedAt?: any;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  proofOfPayment?: {
    filename: string;
    fileUrl: string;
    uploadedAt: any;
  };
  trackingNumber?: string;
  paymentMethod: 'flutterwave' | 'bank_transfer';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('orderId');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Order reference is required'
      }, { status: 400 });
    }

    // ✅ Use the OrderService method we already have
    const orderResult = await OrderService.getOrderForTracking(reference);

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found. Please check your order reference.'
      }, { status: 404 });
    }

    const order = orderResult.order;

    // ✅ Optional verification - email or phone
    if (email && order.customerEmail !== email) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address for this order'
      }, { status: 403 });
    }

    if (phone && order.customerPhone && !order.customerPhone.includes(phone.slice(-4))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number for this order'
      }, { status: 403 });
    }

    // ✅ FIXED: Safely access order properties with proper typing
    const orderData: OrderTrackingData = {
      id: order.id,
      orderId: order.orderId,
      status: order.status,
      amount: order.totalAmount,
      customerName: order.customerName || 'N/A',
      customerEmail: order.customerEmail || 'N/A',
      customerPhone: order.customerPhone || undefined,
      customerAddress: (order as any).customerAddress || undefined,
      items: order.items || [],
      createdAt: order.createdAt,
      paymentSubmittedAt: (order as any).paymentSubmittedAt || undefined,
      paymentVerifiedAt: (order as any).paymentVerifiedAt || undefined,
      completedAt: (order as any).completedAt || undefined,
      shippedAt: (order as any).shippedAt || undefined,
      bankDetails: order.bankDetails || undefined,
      proofOfPayment: order.proofOfPayment || undefined,
      trackingNumber: (order as any).trackingNumber || undefined,
      paymentMethod: order.paymentMethod
    };

    // Calculate progress and activities
    const activities = generateOrderActivities(orderData);
    const estimatedDelivery = calculateEstimatedDelivery(orderData);

    // ✅ FIXED: Build response with proper error handling
    const trackingData = {
      orderId: orderData.orderId,
      status: orderData.status.toUpperCase(),
      amount: orderData.amount,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      items: orderData.items,
      createdAt: orderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      paymentSubmittedAt: orderData.paymentSubmittedAt?.toDate?.()?.toISOString() || null,
      paymentVerifiedAt: orderData.paymentVerifiedAt?.toDate?.()?.toISOString() || null,
      completedAt: orderData.completedAt?.toDate?.()?.toISOString() || null,
      estimatedDelivery,
      activities,
      proofSubmitted: !!orderData.proofOfPayment,
      bankDetails: orderData.bankDetails || null,
      trackingNumber: orderData.trackingNumber || null,
      paymentMethod: orderData.paymentMethod
    };

    console.log(`📍 Order tracking requested for: ${reference}`);

    return NextResponse.json({
      success: true,
      data: trackingData,
    });

  } catch (error) {
    console.error('❌ Order tracking error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ FIXED: Admin route to update order status
export async function POST(request: NextRequest) {
  try {
    const { orderId, status, message, location, updatedBy, trackingNumber } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and status are required'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending_payment', 'payment_submitted', 'payment_verified', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status'
      }, { status: 400 });
    }

    // ✅ Use the OrderService method we just added
    const updateData = {
      orderStatus: status.toLowerCase(),
      updatedAt: new Date(),
      ...(trackingNumber && { trackingNumber }),
      ...(status.toLowerCase() === 'shipped' && { shippedAt: new Date() }),
      ...(status.toLowerCase() === 'delivered' && { deliveredAt: new Date() })
    };

    const updateResult = await OrderService.updateOrderStatus(orderId, updateData);

    if (!updateResult.success) {
      return NextResponse.json({
        success: false,
        error: updateResult.error || 'Failed to update order'
      }, { status: 404 });
    }

    // Get updated order
    const orderResult = await OrderService.getOrderForTracking(orderId);
    
    // TODO: Send status update email to customer
    if (status.toLowerCase() === 'shipped' || status.toLowerCase() === 'delivered') {
      console.log(`📧 Should send ${status} email to customer`);
      // You can implement status update emails here
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: orderId,
        status: status,
        order: orderResult.order
      }
    });

  } catch (error) {
    console.error('❌ Order status update error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ FIXED: Helper function with proper typing
function generateOrderActivities(order: OrderTrackingData) {
  const activities = [];

  // Order placed
  activities.push({
    type: 'order_placed',
    message: `Order ${order.orderId} placed successfully`,
    date: order.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
    completed: true,
  });

  // Payment submitted (Bank Transfer)
  if (order.paymentSubmittedAt) {
    activities.push({
      type: 'payment_submitted',
      message: 'Proof of payment submitted for verification',
      date: order.paymentSubmittedAt.toDate?.()?.toLocaleString() || 'Recently',
      completed: true,
    });
  }

  // Payment verified
  if (order.paymentVerifiedAt || order.paymentMethod === 'flutterwave') {
    activities.push({
      type: 'payment_verified',
      message: order.paymentMethod === 'flutterwave' 
        ? 'Payment confirmed automatically via Flutterwave'
        : 'Payment verified and confirmed',
      date: order.paymentVerifiedAt?.toDate?.()?.toLocaleString() || order.createdAt?.toDate?.()?.toLocaleString() || 'Recently',
      completed: true,
    });
  }

  // Processing
  if (['processing', 'shipped', 'delivered'].includes(order.status.toLowerCase())) {
    activities.push({
      type: 'processing',
      message: 'Order is being prepared for shipment',
      date: order.paymentVerifiedAt?.toDate?.()?.toLocaleString() || 'Processing...',
      completed: order.status.toLowerCase() !== 'processing',
    });
  }

  // Shipped
  if (['shipped', 'delivered'].includes(order.status.toLowerCase())) {
    activities.push({
      type: 'shipped',
      message: order.trackingNumber 
        ? `Order shipped with tracking number: ${order.trackingNumber}`
        : 'Order has been shipped',
      date: order.shippedAt?.toDate?.()?.toLocaleString() || 'Shipped',
      completed: order.status.toLowerCase() !== 'shipped',
    });
  }

  // Delivered
  if (order.status.toLowerCase() === 'delivered') {
    activities.push({
      type: 'delivered',
      message: 'Order delivered successfully',
      date: order.completedAt?.toDate?.()?.toLocaleString() || 'Delivered',
      completed: true,
    });
  }

  // Handle failed payments
  if (order.status.toLowerCase() === 'payment_failed') {
    activities.push({
      type: 'payment_failed',
      message: 'Payment verification failed. Please contact support.',
      date: new Date().toLocaleString(),
      completed: false,
    });
  }

  return activities.reverse(); // Show most recent first
}

// ✅ FIXED: Helper function with proper typing
function calculateEstimatedDelivery(order: OrderTrackingData): string | null {
  if (order.status.toLowerCase() === 'delivered') {
    return order.completedAt?.toDate?.()?.toISOString() || null;
  }

  if (order.status.toLowerCase() === 'shipped') {
    // Add 2-5 days for delivery
    const shippedDate = order.shippedAt?.toDate?.() || new Date();
    const estimatedDate = new Date(shippedDate);
    estimatedDate.setDate(estimatedDate.getDate() + 3); // 3 days average
    return estimatedDate.toISOString();
  }

  if (order.paymentVerifiedAt || order.paymentMethod === 'flutterwave') {
    // Add 3-7 days for processing and delivery
    const verifiedDate = order.paymentVerifiedAt?.toDate?.() || order.createdAt?.toDate?.() || new Date();
    const estimatedDate = new Date(verifiedDate);
    estimatedDate.setDate(estimatedDate.getDate() + 5); // 5 days average
    return estimatedDate.toISOString();
  }

  if (order.createdAt) {
    // Add 7-14 days for payment verification + processing + delivery
    const createdDate = order.createdAt.toDate?.() || new Date();
    const estimatedDate = new Date(createdDate);
    estimatedDate.setDate(estimatedDate.getDate() + 10); // 10 days average
    return estimatedDate.toISOString();
  }

  return null;
}