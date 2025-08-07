// src/app/api/admin/notify-customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

// --- PRICE ROUNDING HELPER (optional, for consistency) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

export async function POST(request: NextRequest) {
  try {
    const { action, orderData } = await request.json();

    console.log(`📧 Admin API: Sending ${action} notification for order ${orderData.orderId}`);

    let result;
    
    if (action === 'approve') {
      // ✅ OPTIONAL: Round amounts for perfect consistency
      const roundedOrderData = {
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || '',
        amount: roundUpToNearest10(orderData.amount || 0),
        items: orderData.items || [],
        bankDetails: orderData.bankDetails || {
          accountName: '',
          accountNumber: '',
          bankName: ''
        },
        totalAmountItemsOnly: roundUpToNearest10(orderData.totalAmountItemsOnly || 0),
        shippingCost: roundUpToNearest10(orderData.shippingCost || 0),
        taxAmount: roundUpToNearest10(orderData.taxAmount || 0),
        finalTotal: roundUpToNearest10(orderData.finalTotal || orderData.amount || 0),
        isFreeShipping: orderData.isFreeShipping || false
      };

      // Send approval/confirmation email
      result = await EmailService.sendBankTransferConfirmation(roundedOrderData);
    } else if (action === 'reject') {
      // For rejection, you might want to create a separate email template
      // For now, we'll just return success without sending
      result = { success: true, message: 'Rejection notification not implemented yet' };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${action} notification sent successfully`
      });
    } else {
      // ✅ FIX: Properly handle error message
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : JSON.stringify(result.error) || 'Failed to send notification';
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Admin notify customer API error:', error);
    
    // ✅ FIX: Properly handle error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Failed to send notification';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}