// src/app/api/orders/[orderId]/route.ts - Create this file
import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/orderService';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    console.log(`🔍 Fetching order details for: ${orderId}`);

    // Use your existing OrderService to get order details
    const orderResult = await OrderService.getOrderForTracking(orderId);

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const order = orderResult.order;

    // ✅ Map the order data to match what your frontend expects
    const responseData = {
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      items: order.items?.map(item => ({
        productId: item.id || Math.random().toString(),
        itemName: item.itemName || item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        amount: item.amount || item.price || 0,
        imageURL: item.imageURL || item.image || '',
        sku: item.sku || ''
      })) || [],
      customerName: order.customerName || 'Valued Customer',
      paymentMethod: order.paymentMethod || 'unknown',
      status: order.status || 'confirmed',
      emailSent: true, // Assume emails are sent if order exists
      createdAt: order.createdAt,
      orderDate: order.orderDate || order.date
    };

    console.log(`✅ Order found: ${orderId}`, responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error(`❌ Error fetching order ${params.orderId}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}