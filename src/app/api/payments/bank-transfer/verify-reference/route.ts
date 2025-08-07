// src/app/api/payments/bank-transfer/verify-reference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Import the same constants for consistency
const FREE_SHIPPING_THRESHOLD = 990000.00; // ₦990,000.00
const TAX_RATE = 0.0001; // 0.01% as a decimal
const SHIPPING_COST = 900.00; // ₦900.00

// --- PRICE ROUNDING HELPER (same as CartContext) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

// ✅ UPDATED: Helper function to calculate proper totals WITH ROUNDING
const calculateTotals = (items: any[], providedSubtotal?: number) => {
  // Calculate subtotal by rounding each item total, then sum (same as CartContext)
  const totalAmountItemsOnly = providedSubtotal ?? 
    items.reduce((sum: number, item: any) => {
      const itemTotal = roundUpToNearest10(item.amount * item.quantity);
      return sum + itemTotal;
    }, 0);
  
  // Calculate shipping, tax, and final total with rounding
  const isFreeShipping = totalAmountItemsOnly >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : roundUpToNearest10(SHIPPING_COST);
  const taxAmount = roundUpToNearest10(totalAmountItemsOnly * TAX_RATE);
  const finalTotal = roundUpToNearest10(totalAmountItemsOnly + shippingCost + taxAmount);
  
  console.log('💰 Verify Reference - Totals Breakdown (WITH ROUNDING):');
  console.log(`   Subtotal: ₦${totalAmountItemsOnly.toFixed(2)}`);
  console.log(`   Shipping: ₦${shippingCost.toFixed(2)} ${isFreeShipping ? "(FREE!)" : ""}`);
  console.log(`   Tax: ₦${taxAmount.toFixed(2)}`);
  console.log(`   FINAL TOTAL: ₦${finalTotal.toFixed(2)}`);
  
  return {
    totalAmountItemsOnly,
    shippingCost,
    taxAmount,
    finalTotal,
    isFreeShipping,
  };
};

export async function POST(request: NextRequest) {
  console.log('🔍 Payment verification API called');
  
  try {
    const {
      orderId,
      transactionReference,
      customerName,
      customerEmail,
      amount // This might be the old amount without shipping/tax
    } = await request.json();

    console.log('📝 Processing payment reference:', { orderId, transactionReference, amount });

    // Basic validation
    if (!orderId || !transactionReference || !customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, transaction reference, and email are required'
      }, { status: 400 });
    }

    // Clean transaction reference
    const cleanReference = transactionReference.trim();

    // Find the order
    const orderQuery = query(
      collection(db, 'bankTransferOrders'),
      where('orderId', '==', orderId),
      where('customerEmail', '==', customerEmail)
    );
    
    const orderSnapshot = await getDocs(orderQuery);
    
    if (orderSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Order not found. Please check your order ID and email.'
      }, { status: 404 });
    }

    const orderDoc = orderSnapshot.docs[0];
    const orderData = orderDoc.data();

    // Check if already processed
    if (orderData.paymentVerified) {
      return NextResponse.json({
        success: false,
        error: 'This order has already been verified.'
      }, { status: 400 });
    }

    // ✅ UPDATED: Calculate proper totals from order data WITH ROUNDING
    let finalTotal = amount; // Default fallback

    // If order has items, calculate proper totals
    if (orderData.items && Array.isArray(orderData.items)) {
      const calculatedTotals = calculateTotals(
        orderData.items, 
        orderData.totalAmountItemsOnly || orderData.total_amount_items_only
      );
      finalTotal = calculatedTotals.finalTotal;
      
      console.log('💰 Calculated final total with shipping, tax, and rounding:', finalTotal);
    } else if (orderData.finalTotal) {
      // Use stored finalTotal if available, but ensure it's rounded
      finalTotal = roundUpToNearest10(orderData.finalTotal);
    } else if (orderData.total_amount) {
      // Use stored total_amount if available, but ensure it's rounded
      finalTotal = roundUpToNearest10(orderData.total_amount);
    }

    // ✅ UPDATED: Save with proper final total
    await updateDoc(doc(db, 'bankTransferOrders', orderDoc.id), {
      transactionReference: cleanReference,
      paymentVerified: false,
      verificationMethod: 'pending_manual',
      referenceSubmittedAt: new Date().toISOString(),
      status: 'pending_verification',
      customerSubmittedAmount: amount, // Keep original submitted amount for comparison
      expectedFinalTotal: finalTotal, // Store the expected final total (rounded)
      updatedAt: new Date().toISOString()
    });

    // ✅ UPDATED: Send admin notification with proper total
    await sendAdminNotification({
      orderId,
      customerName: orderData.customerName || customerName,
      customerEmail: orderData.customerEmail || customerEmail,
      expectedAmount: finalTotal, // Use calculated final total (rounded)
      submittedAmount: amount, // Amount customer thinks they should pay
      transactionReference: cleanReference,
      orderData: orderData // Pass full order data for breakdown
    });

    console.log('✅ Order saved as pending verification, admin notified');

    return NextResponse.json({
      success: true,
      verified: false,
      method: 'manual_pending',
      message: 'Payment reference received! We will verify your payment within 2-4 hours and notify you via email.',
      data: {
        orderId,
        status: 'pending_verification',
        transactionReference: cleanReference,
        expectedTotal: finalTotal
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process payment reference',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ KEEP EMAIL DESIGN UNCHANGED - Anti-spam admin notification with proper totals
async function sendAdminNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  expectedAmount: number; // The correct final total
  submittedAmount: number; // What customer submitted
  transactionReference: string;
  orderData: any; // Full order data for breakdown
}) {
  try {
    const { resend } = await import('@/lib/email');
    
    // Calculate if there's a discrepancy
    const hasDiscrepancy = Math.abs(data.expectedAmount - data.submittedAmount) > 1; // Allow for small rounding
    
    // ✅ ANTI-SPAM: More transactional, less promotional email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Verification Required - Order ${data.orderId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background-color: #1f2937; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 600;">Payment Verification Required</h1>
            <p style="color: #d1d5db; margin: 8px 0 0 0; font-size: 14px;">Order ${data.orderId}</p>
          </div>

          <div style="padding: 20px;">
            
            <!-- Order Details -->
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Transaction Details</h3>
              <table style="width: 100%; border-spacing: 0; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #374151;">Customer:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #374151;">Email:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 13px;">${data.customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #374151;">Reference:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: 600; background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${data.transactionReference}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0 4px 0; color: #374151; font-weight: 500;">Expected Amount:</td>
                  <td style="padding: 8px 0 4px 0; text-align: right; font-weight: 700; color: #059669; font-size: 16px;">₦${data.expectedAmount.toLocaleString()}</td>
                </tr>
                ${hasDiscrepancy ? `
                <tr>
                  <td style="padding: 4px 0; color: #dc2626;">Customer Submitted:</td>
                  <td style="padding: 4px 0; text-align: right; color: #dc2626; font-weight: 600;">₦${data.submittedAmount.toLocaleString()}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${hasDiscrepancy ? `
            <!-- Discrepancy Warning -->
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 14px; font-weight: 600;">⚠️ Amount Discrepancy</h4>
              <p style="margin: 0; font-size: 13px; color: #7f1d1d;">
                Customer submitted ₦${data.submittedAmount.toLocaleString()} but the order total is ₦${data.expectedAmount.toLocaleString()}. 
                Please verify the correct amount was received.
              </p>
            </div>
            ` : ''}

            <!-- Verification Steps -->
            <div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Verification Steps</h4>
              <ol style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e40af; line-height: 1.5;">
                <li style="margin-bottom: 4px;">Check bank account for transfer of ₦${data.expectedAmount.toLocaleString()}</li>
                <li style="margin-bottom: 4px;">Verify reference: ${data.transactionReference}</li>
                <li style="margin-bottom: 4px;">Access admin dashboard to approve/reject</li>
                <li>Customer receives automatic email notification</li>
              </ol>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${data.orderId}" 
                 style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Verify Payment
              </a>
            </div>

            <!-- Timing Notice -->
            <div style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; text-align: center;">
              <p style="margin: 0; color: #0369a1; font-size: 12px;">
                <strong>Target Response Time:</strong> 2-4 hours for optimal customer experience
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 12px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 11px;">
              Symbol Stores Payment Verification System
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // ✅ ANTI-SPAM: Clean plain text version
    const plainText = `
Payment Verification Required - Order ${data.orderId}

Transaction Details:
- Customer: ${data.customerName} (${data.customerEmail})
- Reference: ${data.transactionReference}
- Expected Amount: ₦${data.expectedAmount.toLocaleString()}
${hasDiscrepancy ? `- Customer Submitted: ₦${data.submittedAmount.toLocaleString()} (DISCREPANCY!)` : ''}

Verification Steps:
1. Check bank account for transfer of ₦${data.expectedAmount.toLocaleString()}
2. Verify reference: ${data.transactionReference}
3. Access admin dashboard to approve/reject
4. Customer receives automatic notification

Admin Link: ${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${data.orderId}

Target Response Time: 2-4 hours
    `;

    const result = await resend.emails.send({
      // ✅ ANTI-SPAM: Use proper from address
      from: `Symbol Stores System <${process.env.FROM_EMAIL || 'notifications@symbolstores.com'}>`,
      to: [process.env.ADMIN_EMAIL || 'admin@symbolstores.com'],
      // ✅ ANTI-SPAM: More transactional subject
      subject: `Payment Verification Required - Order ${data.orderId} - ₦${data.expectedAmount.toLocaleString()}`,
      html,
      // ✅ ANTI-SPAM: Include plain text version
      text: plainText,
      // ✅ ANTI-SPAM: Proper headers
      headers: {
        "X-Entity-Ref-ID": data.orderId,
        "X-Priority": "2", // Normal priority, not urgent
        "List-Unsubscribe": `<mailto:unsubscribe@symbolstores.com>`,
        "X-Auto-Response-Suppress": "OOF", // Suppress auto-responses
      },
      // ✅ ANTI-SPAM: Proper categorization
      tags: [
        { name: "type", value: "payment-verification" },
        { name: "order-id", value: data.orderId },
        { name: "automated", value: "true" },
      ],
    });

    console.log('✅ Admin notification sent successfully:', result);
    
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
  }
}