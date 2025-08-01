// src/app/admin/dashboard/orders/pending/route.ts - WORKING NO-INDEX VERSION

export const dynamic = "force-dynamic";



import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  console.log('📋 Admin API: Fetching pending bank transfer orders - NO INDEX VERSION');
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_verification';
    
    console.log(`🔍 Fetching ALL orders, will filter for status: ${status}`);
    
    // ✅ SIMPLE QUERY - Get all bank transfer orders (NO COMPOUND INDEX REQUIRED)
    const bankTransfersRef = collection(db, 'bankTransferOrders');
    
    console.log('🔥 Executing simple collection query...');
    const querySnapshot = await getDocs(bankTransfersRef);
    
    const allOrders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      console.log(`📄 Processing order: ${data.orderId} - Status: ${data.status}`);
      
      // Convert Firestore timestamps to ISO strings for JSON serialization
      const processedData = {
        id: doc.id, // Use Firestore document ID
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        referenceSubmittedAt: data.referenceSubmittedAt || null,
        verifiedAt: data.verifiedAt?.toDate?.()?.toISOString() || data.verifiedAt,
      };
      
      allOrders.push(processedData);
    });
    
    console.log(`📊 Retrieved ${allOrders.length} total bank transfer orders`);
    
    // ✅ FILTER IN MEMORY (no Firebase index needed)
    const pendingOrders = allOrders.filter(order => {
      console.log(`🔍 Checking order ${order.orderId}: status = ${order.status}, target = ${status}`);
      return order.status === status;
    });
    
    // ✅ SORT IN MEMORY (newest first)
    pendingOrders.sort((a, b) => {
      const dateA = a.referenceSubmittedAt ? new Date(a.referenceSubmittedAt).getTime() : 0;
      const dateB = b.referenceSubmittedAt ? new Date(b.referenceSubmittedAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
    
    console.log(`✅ Found ${pendingOrders.length} orders with status: ${status}`);
    
    // 🎯 LOG THE ACTUAL DATA FOR DEBUGGING
    console.log('🎯 PENDING ORDERS FOUND:');
    pendingOrders.forEach(order => {
      console.log(`- Order: ${order.orderId}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Amount: ₦${order.amount}`);
      console.log(`  Reference: ${order.transactionReference}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Submitted: ${order.referenceSubmittedAt}`);
      console.log('---');
    });
    
    // Calculate stats for dashboard
    const now = new Date();
    const stats = {
      urgent: 0,  // Over 4 hours old
      recent: 0,  // Under 2 hours old  
      highValue: 0, // Over 500k NGN
      lowConfidence: 0 // Low auto-verification confidence
    };
    
    pendingOrders.forEach(order => {
      // Calculate time since submission
      if (order.referenceSubmittedAt) {
        const submittedTime = new Date(order.referenceSubmittedAt);
        const hoursAgo = (now.getTime() - submittedTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursAgo > 4) stats.urgent++;
        if (hoursAgo < 2) stats.recent++;
      }
      
      // High value orders
      if (order.amount > 500000) stats.highValue++;
      
      // Low confidence (if you implement auto-verification later)
      if (order.autoVerificationConfidence && order.autoVerificationConfidence < 60) {
        stats.lowConfidence++;
      }
    });
    
    console.log(`📈 Stats - Urgent: ${stats.urgent}, Recent: ${stats.recent}, High Value: ${stats.highValue}`);
    
    return NextResponse.json({
      success: true,
      data: pendingOrders,
      count: pendingOrders.length,
      stats: stats,
      status: status,
      debug: {
        totalOrdersRetrieved: allOrders.length,
        filteredByStatus: pendingOrders.length,
        queryStatus: status,
        allOrderStatuses: allOrders.map(o => ({ orderId: o.orderId, status: o.status }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending orders:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}