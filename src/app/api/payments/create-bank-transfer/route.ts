// src/app/api/payments/create-bank-transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BankTransferOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    amount: number;
    imageURL?: string;
    sku?: string;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Bank account details - move to environment variables in production
const BANK_DETAILS = {
  accountName: process.env.BANK_ACCOUNT_NAME || "Symbol Stores Ltd",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0123456789",
  bankName: process.env.BANK_NAME || "GTBank",
  // You can add multiple bank accounts for different amount ranges
  alternativeBanks: [
    {
      accountName: "Symbol Stores Ltd",
      accountNumber: "0987654321", 
      bankName: "Access Bank",
      minAmount: 0,
      maxAmount: 100000
    },
    {
      accountName: "Symbol Stores Ltd",
      accountNumber: "1122334455",
      bankName: "Zenith Bank", 
      minAmount: 100000,
      maxAmount: null // No upper limit
    }
  ]
};

function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SS${timestamp}${random}`;
}

function selectBankAccount(amount: number) {
  // Select appropriate bank account based on amount
  for (const bank of BANK_DETAILS.alternativeBanks) {
    if (amount >= bank.minAmount && (bank.maxAmount === null || amount <= bank.maxAmount)) {
      return {
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        bankName: bank.bankName
      };
    }
  }
  
  // Default bank
  return {
    accountName: BANK_DETAILS.accountName,
    accountNumber: BANK_DETAILS.accountNumber,
    bankName: BANK_DETAILS.bankName
  };
}

function validateOrderData(data: BankTransferOrderRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Customer validation
  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters');
  }

  if (!data.customerEmail || !/\S+@\S+\.\S+/.test(data.customerEmail)) {
    errors.push('Valid email address is required');
  }

  // Amount validation
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (data.amount > 10000000) { // 10M NGN limit
    errors.push('Amount exceeds maximum limit');
  }

  // Items validation
  if (!data.items || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.itemName || item.itemName.trim().length === 0) {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.amount === undefined || item.amount < 0) {
        errors.push(`Item ${index + 1}: Amount cannot be negative`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  console.log('🏦 Bank transfer order creation API called');
  
  try {
    const orderData: BankTransferOrderRequest = await request.json();
    
    console.log('📝 Creating bank transfer order for:', orderData.customerEmail);

    // Validate input data
    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order data',
        details: validation.errors
      }, { status: 400 });
    }

    // Calculate and verify total amount
    const calculatedTotal = orderData.items.reduce(
      (sum, item) => sum + (item.amount * item.quantity), 
      0
    );

    if (Math.abs(calculatedTotal - orderData.amount) > 0.01) {
      return NextResponse.json({
        success: false,
        error: 'Amount mismatch between items and total. Please refresh and try again.'
      }, { status: 400 });
    }

    // Generate order ID
    const orderId = generateOrderId();
    
    // Select appropriate bank account
    const selectedBankDetails = selectBankAccount(orderData.amount);
    
    console.log('🏪 Selected bank account:', selectedBankDetails.bankName);

    // Create order document for Firestore
    const orderDocument = {
      orderId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone || null,
      amount: orderData.amount,
      items: orderData.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        amount: item.amount,
        imageURL: item.imageURL || null,
        sku: item.sku || null
      })),
      shippingAddress: orderData.shippingAddress || null,
      paymentMethod: 'bank_transfer',
      status: 'pending_payment',
      paymentVerified: false,
      bankDetails: selectedBankDetails,
      transactionReference: null,
      verificationStatus: 'awaiting_reference',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save order to Firestore
    console.log('💾 Saving order to Firestore...');
    const docRef = await addDoc(collection(db, 'bankTransferOrders'), orderDocument);
    
    console.log('✅ Order saved with ID:', docRef.id);

    // Send bank transfer instructions email to customer
    try {
      const { EmailService } = await import('@/lib/email');
      
      await EmailService.sendBankTransferInstructions({
        orderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        amount: orderData.amount,
        items: orderData.items,
        bankDetails: selectedBankDetails
      });
      
      console.log('📧 Bank transfer instructions email sent to customer');
    } catch (emailError) {
      console.error('❌ Failed to send instructions email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Send admin notification email
    try {
      const { EmailService } = await import('@/lib/email');
      
      await EmailService.sendAdminNotification({
        orderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || '',
        amount: orderData.amount,
        items: orderData.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          amount: item.amount,
          imageURL: item.imageURL
        })),
        bankDetails: selectedBankDetails,
        orderNotes: `New bank transfer order created. Customer needs to complete payment and submit transaction reference.`
      });
      
      console.log('📧 Admin notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
      // Don't fail the order creation if email fails
    }

    // Log order creation for analytics
    try {
      await addDoc(collection(db, 'order_events'), {
        orderId,
        eventType: 'bank_transfer_order_created',
        amount: orderData.amount,
        customerEmail: orderData.customerEmail,
        bankName: selectedBankDetails.bankName,
        itemCount: orderData.items.length,
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.error('❌ Failed to log order creation:', logError);
      // Don't fail if analytics logging fails
    }

    // Prepare order data for client (matches your order-confirmation page structure)
    const clientOrderData = {
      orderId,
      amount: orderData.amount,
      status: 'pending_payment',
      paymentMethod: 'bank_transfer',
      customerEmail: orderData.customerEmail,
      items: orderData.items,
      bankDetails: selectedBankDetails,
      paymentVerified: false
    };

    // Store in session for order confirmation page access
    // Note: This is a simplified approach - you might want to use a more secure method
    
    console.log('🎉 Bank transfer order created successfully');

    return NextResponse.json({
      success: true,
      orderId,
      orderData: clientOrderData,
      bankDetails: selectedBankDetails,
      redirectUrl: `/order-confirmation?orderId=${orderId}&orderData=${encodeURIComponent(JSON.stringify(clientOrderData))}`,
      message: 'Order created successfully. Please complete your bank transfer using the provided details.'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Bank transfer order creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create bank transfer order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get bank transfer statistics (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used to get bank transfer order statistics
    // You might want to add admin authentication here
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      // Return basic stats - implement based on your needs
      return NextResponse.json({
        success: true,
        stats: {
          pending: 0, // Query Firestore for actual counts
          processing: 0,
          completed: 0
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error fetching bank transfer stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 });
  }
}