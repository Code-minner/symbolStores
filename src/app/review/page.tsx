// src/app/review/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, CartItem } from "@/lib/CartContext"; // ✅ Import CartItem
import { useReviewData } from "@/lib/hooks/useReviewData";
import { useFlutterwavePayment } from "@/lib/hooks/useFlutterwave";
import { useBankTransfer } from "@/lib/hooks/useBankTransfer";

// No need for BackendOrderItem if CartItem is consistent across frontend and backend.
// interface BackendOrderItem {
//   productId: string;
//   name: string;
//   quantity: number;
//   price: number;
//   imageUrl?: string;
//   sku?: string;
// }

// Flutterwave Payment Component (no change here, as it uses PaymentData which is correct)
function FlutterwavePayment({
  orderData,
  onSuccess,
  onError,
}: {
  orderData: any; // Contains finalTotal, items, etc.
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}) {
  const { initiatePayment, isProcessing, error } = useFlutterwavePayment();
  const { state } = useCart(); // Get full cart state here
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  const handleFlutterwavePayment = async () => {
    try {
      setPaymentAttempted(true);

      console.log("🛒 Original cart state.items:", state.items);

      state.items.forEach((item, index) => {
        console.log(`📦 Cart Item ${index}:`, {
          id: item.id,
          itemName: item.itemName,
          amount: item.amount,
          quantity: item.quantity,
          amountType: typeof item.amount,
          quantityType: typeof item.quantity,
          calculation: item.amount * item.quantity,
          isNaN: isNaN(item.amount * item.quantity),
          // Check for the missing properties here for debugging
          category: (item as any).category,
          subcategory: (item as any).subcategory,
          brand: (item as any).brand,
          slug: (item as any).slug,
        });
      });

      const calculatedItemsSubtotal = state.items.reduce((sum: number, item: CartItem) => {
        const itemTotal = item.amount * item.quantity;
        return sum + itemTotal;
      }, 0);

      if (isNaN(calculatedItemsSubtotal)) {
        console.error("❌ NaN detected in cart calculation!");
        onError("Cart calculation error. Please refresh and try again.");
        return;
      }

      // ✅ Defensive mapping to ensure all CartItem properties are present
      // This is crucial if your cart items might sometimes lack these properties
      const cartItemsForPayment: CartItem[] = state.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        amount: item.amount,
        imageURL: item.imageURL,
        sku: item.sku,
        category: item.category || 'unknown', // Provide default if missing
        subcategory: item.subcategory || 'unknown',
        brand: item.brand || 'unknown',
        slug: item.slug || item.itemName.toLowerCase().replace(/\s+/g, '-'), // Generate slug if missing
        inStock: item.inStock || true, // Provide default if missing
        originalPrice: item.originalPrice, // Optional, can be undefined
        warranty: item.warranty, // Optional, can be undefined
      }));


      console.log("🔄 Cart items passed to Flutterwave hook (defensive map):", cartItemsForPayment);

      const paymentRequestData = {
        email: orderData.email || "customer@example.com",
        name: orderData.name,
        phone: orderData.phone || "08012345678",
        address: orderData.address || "Address not provided",
        amount: orderData.totalAmount, // This is already state.finalTotal from ReviewPage
        orderId: `ORD-${Date.now()}`, // Generate unique order ID here or get from backend
        items: cartItemsForPayment, // ✅ Use the defensively mapped items
        userId: orderData.userId,
        totalAmountItemsOnly: state.totalAmount,
        shippingCost: state.shippingCost,
        taxAmount: state.taxAmount,
        finalTotal: state.finalTotal,
      };

      console.log(
        "🔵 Starting payment with data for Flutterwave:",
        paymentRequestData
      );

      const result = await initiatePayment(paymentRequestData);

      if (result.success && result.data) {
        console.log("🟢 Payment completed successfully!");

        onSuccess({
          orderId: result.data.orderId,
          paymentMethod: "flutterwave",
          transactionId: result.data.transaction_id,
          reference: result.data.tx_ref,
          orderStatus: result.data.orderStatus || "confirmed",
          emailSent: result.data.emailSent || false,
          adminEmailSent: result.data.adminEmailSent || false,
          amount: orderData.totalAmount,
        });
      } else {
        onError(result.error || "Payment failed");
      }
    } catch (err: any) {
      let userMessage = "Payment failed. Please try again.";

      if (err?.error) {
        if (err.error.includes("cancelled")) {
          userMessage = "Payment was cancelled. You can try again when ready.";
        } else if (err.error.includes("verification")) {
          userMessage =
            "Payment verification failed. If money was deducted, please contact support.";
        } else if (
          err.error.includes("network") ||
          err.error.includes("Network")
        ) {
          userMessage =
            "Network error. Please check your connection and try again.";
        } else {
          userMessage = err.error;
        }
      }

      console.log("🔴 Payment error:", userMessage);
      onError(userMessage);
    }
  };

  const getButtonText = () => {
    if (isProcessing) {
      return "PROCESSING PAYMENT...";
    }
    if (paymentAttempted && error) {
      return "TRY AGAIN";
    }
    return `PAY ${state.finalTotal.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })} WITH FLUTTERWAVE`;
  };

  const getButtonColor = () => {
    if (isProcessing) {
      return "bg-gray-400 cursor-not-allowed text-white";
    }
    if (paymentAttempted && error) {
      return "bg-orange-600 hover:bg-orange-700 text-white";
    }
    return "bg-orange-600 hover:bg-orange-700 text-white";
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleFlutterwavePayment}
        disabled={isProcessing}
        className={`flex items-center justify-center gap-2 w-full px-8 py-3 rounded-lg font-medium transition-colors ${getButtonColor()}`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {getButtonText()}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 10h20v4H2zm0-4h20v2H2zm0 10h20v2H2z" />
            </svg>
            {getButtonText()}
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium">Payment Issue</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {paymentAttempted && !error && !isProcessing && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Payment completed successfully!</span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 text-center">
        <p>💳 Card • 🏦 Bank Transfer • 📱 USSD • 💰 Mobile Money</p>
        <p className="mt-1">
          Secured by Flutterwave •{" "}
          {process.env.NODE_ENV === "development" ? "Test Mode" : "Live Mode"}
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-1 text-blue-600">
            🧪 Use test card: 5531 8866 5214 2950 | CVV: 564 | Expiry: 09/32
          </p>
        )}
      </div>
    </div>
  );
}

// Bank Transfer Payment Component - SKIPPING DETAILS, GO STRAIGHT TO SUCCESS
function BankTransferPayment({
  orderData,
  onSuccess,
  onError,
  cartState,
}: {
  orderData: any;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  cartState: {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    shippingCost: number;
    taxAmount: number;
    finalTotal: number;
    isFreeShipping: boolean;
  };
}) {
  const { createBankTransferOrder, isProcessing, error } = useBankTransfer();

  const handleBankTransfer = async () => {
    try {
      console.log("🛒 Original orderData.items:", orderData.items);

      // ✅ Defensive mapping to ensure all CartItem properties are present
      const cartItemsForBackend: CartItem[] = cartState.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        amount: item.amount,
        imageURL: item.imageURL,
        sku: item.sku,
        category: item.category || 'unknown', // Provide default if missing
        subcategory: item.subcategory || 'unknown',
        brand: item.brand || 'unknown',
        slug: item.slug || item.itemName.toLowerCase().replace(/\s+/g, '-'), // Generate slug if missing
        inStock: item.inStock || true,
        originalPrice: item.originalPrice,
        warranty: item.warranty,
      }));

      console.log(
        "🔄 Converted cart_items for backend (Bank Transfer - defensive map):",
        cartItemsForBackend
      );

      // Define static bank details for the frontend for now.
      const staticBankDetails = {
        accountName: "SYMBOL STORES",
        accountNumber: "0123456789",
        bankName: "ACCESS BANK",
      };

      const transferData = {
        cart_items: cartItemsForBackend, // ✅ Use the defensively mapped items
        customer_data: {
          name: orderData.name,
          email: orderData.email || "customer@example.com",
          phone: orderData.phone || "08012345678",
          address: orderData.address,
        },
        bank_details: staticBankDetails,
        total_amount: orderData.totalAmount,
        total_amount_items_only: cartState.totalAmount,
        shipping_cost: cartState.shippingCost,
        tax_amount: cartState.taxAmount,
        user_id: orderData.userId,
      };

      console.log("📤 Complete payload being sent (Bank Transfer):", transferData);

      const result = await createBankTransferOrder(transferData);

      if (result.success && result.bankDetails && result.orderReference) {
        console.log("🏦 Bank transfer order created successfully, skipping details page");

        const amountForSuccess = cartState.finalTotal;

        onSuccess({
          orderReference: result.orderReference,
          orderId: result.orderReference,
          paymentMethod: "bank_transfer",
          emailSent: result.emailSent || false,
          amount: amountForSuccess,
          orderStatus: "pending_payment",
        });
      } else {
        onError(result.error || "Failed to create bank transfer order");
      }
    } catch (err: any) {
      const errorMessage =
        err?.message || "Failed to create bank transfer order";
      console.error("❌ Bank transfer error:", err);
      onError(errorMessage);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleBankTransfer}
        disabled={isProcessing}
        className={`flex items-center justify-center gap-2 w-full px-8 py-3 rounded-lg font-medium transition-colors ${
          isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            CREATING ORDER...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 5h18l-2 7H5L3 5zm0 0L2 3m7 4v10m4-10v10" />
            </svg>
            BANK TRANSFER - {cartState.finalTotal.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-600 text-center">
        <p>🏛️ Direct transfer to our bank account</p>
        <p className="mt-1">Manual confirmation within 24 hours</p>
      </div>
    </div>
  );
}

// Payment Method Selector Component - Modified to auto-trigger bank transfer
function PaymentMethodSelector({
  orderData,
  onSuccess,
  onError,
  cartState,
}: {
  orderData: any;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  cartState: {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    shippingCost: number;
    taxAmount: number;
    finalTotal: number;
    isFreeShipping: boolean;
  };
}) {
  const [selectedMethod, setSelectedMethod] = useState<
    "flutterwave" | "bank" | null
  >(null);

  const handlePaymentSuccess = (result: any) => {
    console.log("Payment successful:", result);
    onSuccess(result);
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment failed:", error);
    console.log("Payment failed: " + error);
  };

  if (!selectedMethod) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Payment Method
        </h3>

        {/* Flutterwave Option */}
        <div
          className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer"
          onClick={() => setSelectedMethod("flutterwave")}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-8 bg-orange-600 rounded flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 7h-2v4L9 9l-1 1 3 3 3-3-1-1zm1-5H6v2h8V2zM4 6v2h16V6H4zm2 12h8v2H6v-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Pay with Flutterwave
                  </h4>
                  <p className="text-sm text-gray-600">
                    Card • Bank Transfer • USSD • Mobile Money
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-600 font-medium">
                  ✅ Instant confirmation
                </span>
                <span className="text-blue-600">🔒 Secure payment</span>
              </div>
            </div>
            <button className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors">
              Select
            </button>
          </div>
        </div>

        {/* Bank Transfer Option - Auto-trigger bank transfer flow */}
        <div
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => {
            console.log("🏦 Bank Transfer selected - Auto-triggering flow");
            setSelectedMethod("bank");
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 5h18l-2 7H5L3 5zm0 0L2 3m7 4v10m4-10v10" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Direct Bank Transfer
                  </h4>
                  <p className="text-sm text-gray-600">
                    Transfer directly to our bank account
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-yellow-600 font-medium">
                  ⏱️ Manual confirmation (24hrs)
                </span>
                <span className="text-green-600">💰 No extra fees</span>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Select
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            🔒 Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedMethod === "flutterwave" && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-orange-700 font-medium">
              Payment via Flutterwave
            </span>
          </div>
          <FlutterwavePayment
            orderData={orderData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </>
      )}

      {selectedMethod === "bank" && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 font-medium">
              Direct Bank Transfer
            </span>
          </div>
          <BankTransferPayment
            orderData={orderData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            cartState={cartState}
          />
        </>
      )}

      {/* Only show back button for Flutterwave */}
      {selectedMethod === "flutterwave" && (
        <button
          onClick={() => setSelectedMethod(null)}
          className="text-gray-600 hover:text-gray-800 font-medium text-sm underline w-full text-center"
        >
          ← Choose Different Payment Method
        </button>
      )}
    </div>
  );
}

// Main Review Page Component
export default function ReviewPage() {
  const { state, formatPrice } = useCart();
  const router = useRouter();
  const { reviewData } = useReviewData();
  const { user, userData } = useAuth(); // ✅ Get user and userData from AuthContext

  const handlePaymentSuccess = (result: any) => {
    console.log("Payment successful:", result);

    const amountToPass = state.finalTotal;

    console.log("💰 Using calculated finalTotal from cart for redirect:", amountToPass);

    const params = new URLSearchParams({
      orderId: result.orderId || result.orderReference,
      method: result.paymentMethod,
      status: result.orderStatus || "confirmed",
      emailSent: result.emailSent ? "true" : "false",
      adminNotified: result.adminEmailSent ? "true" : "false",
      amount: amountToPass.toString(),
    });

    console.log("🎉 Redirecting with amount:", amountToPass);
    router.push(`/order-success?${params.toString()}`);
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment failed:", error);
    console.log("Payment failed: " + error);
  };

  const displayData = reviewData || {
    address: {
      name: "John Doe",
      email: "customer@example.com",
      phone: "08012345678",
      fullAddress: "Sample Address, Lagos, Nigeria",
    },
    payment: {
      type: "Flutterwave/Bank Transfer",
      name: "John Doe",
      cardNumber: "N/A",
      expiryDate: "N/A",
    },
    orderNotes: "",
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Cart", href: "/cart" },
    { name: "Checkouts", href: "/checkout" },
    { name: "Review", href: "#" },
  ];

  const handleBackToPayment = () => {
    router.push("/checkout");
  };

  // Prepare order data for payment components
  // ✅ IMPORTANT: Ensure `items` here are fully compliant `CartItem[]`
  const orderData = {
    name: displayData.address.name,
    email: displayData.address.email || "customer@example.com",
    phone: displayData.address.phone || "08012345678",
    address: displayData.address.fullAddress,
    totalAmount: state.finalTotal, // Final total for payment gateways
    // ✅ DEFENSIVE MAPPING: Ensure all items conform to CartItem fully
    items: state.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        amount: item.amount,
        imageURL: item.imageURL,
        sku: item.sku,
        category: item.category || 'unknown', // Provide default if potentially missing from cart state
        subcategory: item.subcategory || 'unknown',
        brand: item.brand || 'unknown',
        slug: item.slug || item.itemName.toLowerCase().replace(/\s+/g, '-'), // Generate slug if missing
        inStock: item.inStock || true,
        originalPrice: item.originalPrice,
        warranty: item.warranty,
    })),
    orderNotes: displayData.orderNotes || "",
    userId: userData?.uid, // ✅ Use userData.uid as the user's unique ID
    totalAmountItemsOnly: state.totalAmount,
    shippingCost: state.shippingCost,
    taxAmount: state.taxAmount,
    finalTotal: state.finalTotal,
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="w-[95%] overflow-x-auto py-3 pr-4 mr-4">
            <nav className="flex items-center text-sm text-gray-600 whitespace-nowrap space-x-2">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-gray-400 flex items-center">
                      <svg
                        width="6"
                        height="10"
                        viewBox="0 0 6 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.5 1.25L5.25 5L1.5 8.75"
                          stroke="#77878F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  <a
                    href={item.href}
                    className={`flex items-center gap-1 text-[12px] hover:text-blue-600 transition-colors ${
                      index === breadcrumbs.length - 1
                        ? "text-blue-600 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {index === 0 && (
                      <svg
                        className="mb-[1px]"
                        width="12"
                        height="14"
                        viewBox="0 0 16 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.875 15.2498V11.4998C9.875 11.334 9.80915 11.1751 9.69194 11.0579C9.57473 10.9406 9.41576 10.8748 9.25 10.8748H6.75C6.58424 10.8748 6.42527 10.9406 6.30806 11.0579C6.19085 11.1751 6.125 11.334 6.125 11.4998V15.2498C6.125 15.4156 6.05915 15.5745 5.94194 15.6917C5.82473 15.809 5.66576 15.8748 5.5 15.8748H1.75C1.58424 15.8748 1.42527 15.809 1.30806 15.6917C1.19085 15.5745 1.125 15.4156 1.125 15.2498V8.02324C1.1264 7.93674 1.14509 7.8514 1.17998 7.77224C1.21486 7.69308 1.26523 7.6217 1.32812 7.5623L7.57812 1.88261C7.69334 1.77721 7.84384 1.71875 8 1.71875C8.15616 1.71875 8.30666 1.77721 8.42187 1.88261L14.6719 7.5623C14.7348 7.6217 14.7851 7.69308 14.82 7.77224C14.8549 7.8514 14.8736 7.93674 14.875 8.02324V15.2498C14.875 15.4156 14.8092 15.5745 14.6919 15.6917C14.5747 15.809 14.4158 15.8748 14.25 15.8748H10.5C10.3342 15.8748 10.1753 15.809 10.0581 15.6917C9.94085 15.5745 9.875 15.4156 9.875 15.2498Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {item.name}
                  </a>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Page Content */}
          <div className="max-w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Review
              </h1>
              <p className="text-gray-600">
                Please confirm if all information is filled correctly
              </p>

              {/* Debug info for development */}
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">
                  Data source: {reviewData ? "Hook" : "Placeholder"}
                </p>
              )}
            </div>

            {/* Review Sections */}
            <div className="space-y-6">
              {/* Address Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2 inline-block">
                        Address
                      </h2>
                      <Link
                        href="/checkout"
                        className="ml-6 text-red-500 hover:text-red-600 font-medium text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                      >
                        EDIT
                      </Link>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {displayData.address.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {displayData.address.fullAddress}
                      </p>
                      {displayData.address.email && (
                        <p className="text-gray-600 text-sm mt-2">
                          Email: {displayData.address.email}
                        </p>
                      )}
                      {displayData.address.phone && (
                        <p className="text-gray-600 text-sm">
                          Phone: {displayData.address.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2 inline-block">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.itemName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-red-600">
                        {formatPrice(item.amount * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* New: Display Subtotal, Shipping, Tax */}
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span>Subtotal (Items)</span>
                        <span>{formatPrice(state.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{formatPrice(state.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax ({state.totalAmount > 0 ? (state.taxAmount / state.totalAmount * 100).toFixed(2) : 0}%)</span>
                        <span>{formatPrice(state.taxAmount)}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-red-600">
                      {formatPrice(state.finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <PaymentMethodSelector
                  orderData={orderData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  cartState={state}
                />
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600">
                  By proceeding with payment, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-red-500 hover:text-red-600 underline"
                  >
                    terms and conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/return-policy"
                    className="text-red-500 hover:text-red-600 underline"
                  >
                    return policy
                  </Link>
                </p>
              </div>

              {/* Back Button */}
              <div className="flex justify-start pt-6">
                <button
                  onClick={handleBackToPayment}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors group"
                >
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  BACK TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}