// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, to, orderData } = await request.json();

    console.log(`📧 Email API called with type: ${type}`);

    // Dynamically import EmailService only in the API route (server-side)
    const { EmailService } = await import('@/lib/email');

    let result;

    switch (type) {
      case 'order_confirmation':
        // Send customer order confirmation
        console.log('📧 Sending order confirmation email...');
        result = await EmailService.sendOrderConfirmation(orderData);
        break;

      case 'admin_notification':
        // Send admin notification
        console.log('📧 Sending admin notification email...');
        result = await EmailService.sendAdminNotification(orderData);
        break;

      case 'bank_transfer_instructions':
        // Send bank transfer instructions
        console.log('📧 Sending bank transfer instructions...');
        result = await EmailService.sendBankTransferInstructions(orderData);
        break;

      case 'bank_transfer_confirmation':
        // Send bank transfer confirmation
        console.log('📧 Sending bank transfer confirmation...');
        result = await EmailService.sendBankTransferConfirmation(orderData);
        break;

      case 'payment_failure':
        // Send payment failure notification
        console.log('📧 Sending payment failure email...');
        result = await EmailService.sendPaymentFailedEmail(orderData);
        break;

      case 'payment_verification':
        // Send payment verification email (admin notification)
        console.log('📧 Sending payment verification notification...');
        result = await EmailService.sendAdminPaymentProofNotification(orderData);
        break;

      default:
        console.error(`❌ Invalid email type: ${type}`);
        return NextResponse.json(
          { error: `Invalid email type: ${type}` }, 
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`✅ ${type} email sent successfully`);
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        type,
        result 
      });
    } else {
      // Handle different return types safely
      const errorMessage = 'error' in result ? result.error : `Failed to send ${type} email`;
      console.error(`❌ Failed to send ${type} email:`, errorMessage);
      return NextResponse.json(
        { 
          error: `Failed to send ${type} email`, 
          details: errorMessage
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}