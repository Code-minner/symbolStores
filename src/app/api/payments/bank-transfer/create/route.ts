// src/app/api/payments/bank-transfer/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmailService } from "@/lib/email";

// ✅ ADD: Import shipping/tax constants from CartContext
const FREE_SHIPPING_THRESHOLD = 990000.0; // ₦990,000.00
const TAX_RATE = 0.0001; // 0.01% as a decimal
const SHIPPING_COST = 900.0; // ₦900.00

// --- PRICE ROUNDING HELPER (same as CartContext) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

interface CartItem {
  id: string;
  itemName?: string;
  name?: string;
  quantity: number;
  amount?: number;
  price?: number;
  imageURL?: string;
  imageUrl?: string;
  sku?: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

// ✅ ADD: Helper function to calculate totals with shipping and tax (WITH ROUNDING)
function calculateOrderTotals(items: CartItem[]) {
  // Calculate subtotal by rounding each item total, then sum (same as CartContext)
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number(item.amount) || Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    const itemTotal = roundUpToNearest10(itemPrice * quantity);
    return sum + itemTotal;
  }, 0);

  // Calculate shipping with rounding
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : roundUpToNearest10(SHIPPING_COST);

  // Calculate tax with rounding
  const taxAmount = roundUpToNearest10(subtotal * TAX_RATE);

  // Calculate final total with rounding
  const finalTotal = roundUpToNearest10(subtotal + shippingCost + taxAmount);

  console.log("💰 Order Totals Breakdown (WITH ROUNDING):");
  console.log(`   Subtotal: ₦${subtotal.toFixed(2)}`);
  console.log(
    `   Shipping: ₦${shippingCost.toFixed(2)} ${isFreeShipping ? "(FREE!)" : ""}`
  );
  console.log(`   Tax: ₦${taxAmount.toFixed(2)}`);
  console.log(`   FINAL TOTAL: ₦${finalTotal.toFixed(2)}`);

  return {
    subtotal,
    shippingCost,
    taxAmount,
    finalTotal,
    isFreeShipping,
  };
}

function getAbsoluteImageURL(imageURL: string | undefined): string | undefined {
  if (!imageURL) return undefined;
  if (imageURL.startsWith("http://") || imageURL.startsWith("https://")) {
    return imageURL;
  }
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "https://symbolstores.com";
  const cleanURL = imageURL.startsWith("/") ? imageURL : `/${imageURL}`;
  return `${baseURL}${cleanURL}`;
}

function normalizeCartItem(item: CartItem) {
  const itemName = item.itemName || item.name || "Unknown Item";
  const itemPrice = Number(item.amount) || Number(item.price) || 0;
  const imageURL = item.imageURL || item.imageUrl || "";
  const quantity = Number(item.quantity) || 1;

  return {
    id: item.id,
    itemName,
    quantity,
    amount: itemPrice,
    imageURL,
    sku: item.sku || "",
  };
}

export async function POST(request: NextRequest) {
  console.log("🚀 Bank transfer API called - WITH SHIPPING & TAX & ROUNDING");

  try {
    const requestBody = await request.json();
    const userId = requestBody.user_id || null;

    console.log(
      "📥 Received request body:",
      JSON.stringify(requestBody, null, 2)
    );

    const {
      cart_items,
      customer_data,
      bank_details,
    }: {
      cart_items: CartItem[];
      customer_data: CustomerData;
      bank_details: BankDetails;
    } = requestBody;

    // Validation
    if (!cart_items || cart_items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cart items are required",
        },
        { status: 400 }
      );
    }

    if (
      !customer_data?.name ||
      !customer_data?.email ||
      !customer_data?.phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer information is required (name, email, phone)",
        },
        { status: 400 }
      );
    }

    if (
      !bank_details?.accountName ||
      !bank_details?.accountNumber ||
      !bank_details?.bankName
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank details are required",
        },
        { status: 400 }
      );
    }

    // Normalize cart items
    const normalizedItems = cart_items.map(normalizeCartItem);
    console.log(
      "🔧 Normalized items:",
      JSON.stringify(normalizedItems, null, 2)
    );

    // ✅ FIX: Calculate totals WITH shipping and tax AND ROUNDING
    const orderTotals = calculateOrderTotals(normalizedItems);

    if (orderTotals.finalTotal <= 0 || isNaN(orderTotals.finalTotal)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid total amount calculated: ${orderTotals.finalTotal}. Please check your cart items.`,
        },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `BT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isGuest = !userId;

    console.log(
      "🆔 Order ID generated:",
      orderId,
      "Final Amount:",
      orderTotals.finalTotal
    );

    // ✅ Create bank transfer order with FINAL TOTAL
    const orderData = {
      orderId,
      userId: userId || null,
      isGuest: isGuest,
      userEmail: customer_data.email,
      status: "pending_payment",
      amount: orderTotals.finalTotal, // ✅ Use final total including shipping + tax
      subtotal: orderTotals.subtotal, // ✅ Store subtotal separately
      shippingCost: orderTotals.shippingCost, // ✅ Store shipping cost
      taxAmount: orderTotals.taxAmount, // ✅ Store tax amount
      isFreeShipping: orderTotals.isFreeShipping, // ✅ Store free shipping flag
      currency: "NGN",
      items: normalizedItems,
      paymentMethod: "bank_transfer",
      customerName: customer_data.name,
      customerEmail: customer_data.email,
      customerPhone: customer_data.phone,
      customerAddress: customer_data.address || "",
      bankDetails: bank_details,

      // Reference system fields
      paymentVerified: false,
      transactionReference: null,
      verificationMethod: null,
      verifiedAt: null,
      referenceSubmittedAt: null,
      verificationNotes: null,

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to Firestore
    console.log("💾 Saving to Firestore...");
    const docRef = await addDoc(
      collection(db, "bankTransferOrders"),
      orderData
    );
    console.log("✅ Order saved to Firestore with ID:", docRef.id);

    // ✅ Send admin notification with BREAKDOWN
    console.log("📧 Sending admin notification...");
    let adminEmailSent = false;

    try {
      const emailOrderData = {
        orderId,
        customerName: customer_data.name,
        customerEmail: customer_data.email,
        customerPhone: customer_data.phone,
        amount: orderTotals.finalTotal, // ✅ Final total for admin
        subtotal: orderTotals.subtotal, // ✅ Add breakdown info
        shippingCost: orderTotals.shippingCost,
        taxAmount: orderTotals.taxAmount,
        isFreeShipping: orderTotals.isFreeShipping,
        items: normalizedItems.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          amount: item.amount,
          imageURL: getAbsoluteImageURL(item.imageURL),
        })),
        bankDetails: bank_details,
      };

      const adminResult =
        await EmailService.sendAdminNotification(emailOrderData);
      adminEmailSent = adminResult.success;
      console.log(
        "📧 Admin notification:",
        adminEmailSent ? "✅ Sent" : "❌ Failed"
      );
    } catch (emailError) {
      console.error("❌ Failed to send admin notification:", emailError);
    }

    // ✅ Send customer bank transfer instructions with FINAL TOTAL
    console.log("📧 Sending customer bank transfer instructions...");
    let customerEmailSent = false;

    try {
      const customerInstructionsData = {
        orderId,
        customerName: customer_data.name,
        customerEmail: customer_data.email,
        customerPhone: customer_data.phone,
        amount: orderTotals.finalTotal, // ✅ Final total for customer
        subtotal: orderTotals.subtotal,
        shippingCost: orderTotals.shippingCost,
        taxAmount: orderTotals.taxAmount,
        isFreeShipping: orderTotals.isFreeShipping,
        items: normalizedItems.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          amount: item.amount,
          imageURL: getAbsoluteImageURL(item.imageURL),
        })),
        bankDetails: bank_details,
      };

      const customerResult = await EmailService.sendBankTransferInstructions(
        customerInstructionsData
      );
      customerEmailSent = customerResult.success;
      console.log(
        "📧 Customer instructions:",
        customerEmailSent ? "✅ Sent" : "❌ Failed"
      );
    } catch (emailError) {
      console.error("❌ Failed to send customer instructions:", emailError);
    }

    console.log(
      "🎉 Bank transfer order created successfully - WITH PROPER TOTALS & ROUNDING!"
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        userId: userId,
        isGuest: isGuest,
        amount: orderTotals.finalTotal, // ✅ Final total in response
        subtotal: orderTotals.subtotal,
        shippingCost: orderTotals.shippingCost,
        taxAmount: orderTotals.taxAmount,
        isFreeShipping: orderTotals.isFreeShipping,
        status: "pending_payment",
        paymentVerified: false,

        customerName: customer_data.name,
        customerEmail: customer_data.email,
        customerPhone: customer_data.phone,

        bankDetails: bank_details,
        items: normalizedItems,

        adminEmailSent: adminEmailSent,
        customerEmailSent: customerEmailSent,

        paymentInstructions: {
          step: 1,
          title: "Complete Your Bank Transfer",
          message:
            "Transfer the exact amount to the provided bank account, then submit your transaction reference for instant verification.",
          bankDetails: bank_details,
          amount: orderTotals.finalTotal, // ✅ Final total for instructions
          reference: orderId,
          nextStep:
            'After transfer, click "I\'ve Completed Transfer" to submit your transaction reference.',
          breakdown: {
            subtotal: orderTotals.subtotal,
            shipping: orderTotals.shippingCost,
            tax: orderTotals.taxAmount,
            total: orderTotals.finalTotal,
          },
        },

        verificationEndpoint: "/api/payments/bank-transfer/verify-reference",
      },
      message:
        "Bank transfer order created successfully - complete payment and submit reference for verification",
    });
  } catch (error) {
    console.error("❌ Bank transfer order creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET method unchanged
export async function GET(request: NextRequest) {
  try {
    const instructions = {
      bankDetails: {
        accountName:
          process.env.BANK_ACCOUNT_NAME || "Symbol Global Services Ltd",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0036612207",
        bankName: process.env.BANK_NAME || "Access Bank",
      },
      instructions: [
        "Make payment to the above bank account",
        "Use your Order ID as payment reference",
        "Submit your transaction reference number for instant verification",
        "Order will be confirmed automatically or within 2-4 hours",
      ],
      processingTime:
        "Instant verification for most transactions, manual verification within 2-4 hours",
      supportedBanks: [
        "All Nigerian banks",
        "USSD transfers",
        "Mobile banking apps",
        "Internet banking",
        "ATM transfers",
      ],
    };

    return NextResponse.json({
      success: true,
      data: instructions,
    });
  } catch (error) {
    console.error("❌ Error getting bank transfer instructions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get bank transfer instructions",
      },
      { status: 500 }
    );
  }
}