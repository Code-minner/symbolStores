// src/app/api/orders/create/route.ts - For Flutterwave Orders
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CartItem {
    id: string;
    itemName: string;
    category: string;
    subcategory: string;
    brand: string;
    amount: number;
    originalPrice?: number;
    imageURL: string;
    slug: string;
    inStock: boolean;
    quantity: number;
    sku: string;
    warranty?: string;
}

interface CreateOrderRequest {
    orderId: string;
    txRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    items: CartItem[];
    totalAmountItemsOnly: number;
    shippingCost: number;
    taxAmount: number;
    finalTotal: number;
    paymentMethod: 'flutterwave';
    status: 'pending' | 'confirmed' | 'failed';
    userId?: string;
}

export async function POST(request: NextRequest) {
    console.log('🚀 Flutterwave order creation API called');

    try {
        const orderData: CreateOrderRequest = await request.json();

        // Validate required fields
        if (!orderData.orderId || !orderData.customerEmail || !orderData.items || orderData.items.length === 0) {
            console.error('❌ Validation failed: Missing required order fields');
            return NextResponse.json({ 
                success: false, 
                error: 'Missing required fields: orderId, customerEmail, or items' 
            }, { status: 400 });
        }

        // Validate totals
        if (!orderData.finalTotal || orderData.finalTotal <= 0) {
            console.error('❌ Validation failed: Invalid final total');
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid final total amount' 
            }, { status: 400 });
        }

        console.log(`💾 Creating Flutterwave order in Firestore: ${orderData.orderId}`);
        console.log(`👤 Customer: ${orderData.customerName} (${orderData.customerEmail})`);
        console.log(`💰 Total: ₦${orderData.finalTotal.toLocaleString()}`);
        console.log(`🛒 Items: ${orderData.items.length} products`);

        // Create the order document
        const orderDoc = {
            // Order identification
            orderId: orderData.orderId,
            txRef: orderData.txRef,
            
            // Customer information (CRITICAL for order history)
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail, // ✅ CRITICAL: Always save email for order history
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress || '',
            userId: orderData.userId || null, // ✅ null for guests, ID for logged-in users
            
            // Order details
            items: orderData.items,
            totalAmountItemsOnly: orderData.totalAmountItemsOnly,
            shippingCost: orderData.shippingCost,
            taxAmount: orderData.taxAmount,
            finalTotal: orderData.finalTotal,
            currency: 'NGN',
            
            // Payment details
            paymentMethod: 'flutterwave',
            status: orderData.status,
            paymentVerified: false,
            transactionId: null,
            flwRef: null,
            
            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // ✅ Save to 'orders' collection for Flutterwave orders
        const docRef = await addDoc(collection(db, 'orders'), orderDoc);
        
        console.log(`✅ Flutterwave order created successfully with doc ID: ${docRef.id}`);
        console.log(`📧 Order will be linked to email: ${orderData.customerEmail}`);

        return NextResponse.json({
            success: true,
            message: 'Flutterwave order created successfully',
            data: {
                orderId: orderData.orderId,
                docId: docRef.id,
                status: orderData.status,
                finalTotal: orderData.finalTotal,
                customerEmail: orderData.customerEmail,
                userId: orderData.userId,
                paymentMethod: 'flutterwave'
            }
        });

    } catch (error) {
        console.error('❌ Flutterwave order creation error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create Flutterwave order',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}