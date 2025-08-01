// src/app/order-success/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransactionReferenceModal from '@/components/TransactionReferenceModal';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Import the constants from CartContext
import { FREE_SHIPPING_THRESHOLD, TAX_RATE, SHIPPING_COST } from '@/lib/CartContext';

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  amount: number;
  imageURL?: string;
  sku?: string;
}

interface OrderData {
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  paymentVerified?: boolean;
  transactionReference?: string;
  verificationStatus?: string;
  transactionId?: string;
  reference?: string;
  // Calculated totals - always defined after processing
  totalAmountItemsOnly: number;
  shippingCost: number;
  taxAmount: number;
  finalTotal: number;
  isFreeShipping: boolean;
}

// Helper function to calculate totals (same logic as CartContext)
const calculateOrderTotals = (items: OrderItem[], providedSubtotal?: number) => {
  // Calculate items subtotal
  const totalAmountItemsOnly = providedSubtotal ?? items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
  
  // Calculate shipping
  const isFreeShipping = totalAmountItemsOnly >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
  
  // Calculate tax on subtotal only (not including shipping)
  const taxAmount = totalAmountItemsOnly * TAX_RATE;
  
  // Calculate final total
  const finalTotal = totalAmountItemsOnly + shippingCost + taxAmount;
  
  return {
    totalAmountItemsOnly,
    shippingCost,
    taxAmount,
    finalTotal,
    isFreeShipping,
  };
};

// Helper function to ensure order data has proper calculated totals
const ensureCalculatedTotals = (orderData: Partial<OrderData>): OrderData => {
  const items = orderData.items || [];
  
  // If we already have all calculated totals, use them
  if (orderData.finalTotal !== undefined && 
      orderData.totalAmountItemsOnly !== undefined && 
      orderData.shippingCost !== undefined && 
      orderData.taxAmount !== undefined &&
      orderData.isFreeShipping !== undefined) {
    return {
      orderId: orderData.orderId || '',
      amount: orderData.amount || orderData.totalAmountItemsOnly,
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod || 'unknown',
      customerName: orderData.customerName || 'Guest',
      customerEmail: orderData.customerEmail || 'guest@example.com',
      items: items,
      bankDetails: orderData.bankDetails,
      paymentVerified: orderData.paymentVerified || false,
      transactionReference: orderData.transactionReference,
      verificationStatus: orderData.verificationStatus,
      transactionId: orderData.transactionId,
      reference: orderData.reference,
      totalAmountItemsOnly: orderData.totalAmountItemsOnly,
      shippingCost: orderData.shippingCost,
      taxAmount: orderData.taxAmount,
      finalTotal: orderData.finalTotal,
      isFreeShipping: orderData.isFreeShipping,
    };
  }
  
  // Otherwise, calculate them
  const calculatedTotals = calculateOrderTotals(items, orderData.totalAmountItemsOnly);
  
  return {
    orderId: orderData.orderId || '',
    amount: orderData.amount || calculatedTotals.totalAmountItemsOnly,
    status: orderData.status || 'pending',
    paymentMethod: orderData.paymentMethod || 'unknown',
    customerName: orderData.customerName || 'Guest',
    customerEmail: orderData.customerEmail || 'guest@example.com',
    items: items,
    bankDetails: orderData.bankDetails,
    paymentVerified: orderData.paymentVerified || false,
    transactionReference: orderData.transactionReference,
    verificationStatus: orderData.verificationStatus,
    transactionId: orderData.transactionId,
    reference: orderData.reference,
    ...calculatedTotals, // Spread the calculated totals (all defined)
  };
};

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('method');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const orderDataParam = searchParams.get('orderData');

    const loadOrder = async () => {
      setLoading(true);

      if (orderDataParam) {
        // Path 1: Data passed directly via URL params
        try {
          const parsedData = JSON.parse(decodeURIComponent(orderDataParam));
          
          // Create order data with proper structure
          const orderData: Partial<OrderData> = {
            orderId: parsedData.orderReference || parsedData.orderId,
            amount: parseFloat(amount || parsedData.total_amount || 0),
            status: status || parsedData.orderStatus || 'pending',
            paymentMethod: paymentMethod || parsedData.paymentMethod || 'bank_transfer',
            customerName: parsedData.customer_data?.name || parsedData.customerName || 'Guest',
            customerEmail: parsedData.customer_data?.email || parsedData.customerEmail || 'guest@example.com',
            items: parsedData.cart_items || parsedData.items || [],
            bankDetails: parsedData.bank_details || parsedData.bankDetails,
            paymentVerified: parsedData.paymentVerified || false,
            transactionReference: parsedData.transactionReference,
            verificationStatus: parsedData.verificationStatus,
            // Use provided calculated totals if available
            totalAmountItemsOnly: parsedData.total_amount_items_only || parsedData.totalAmountItemsOnly,
            shippingCost: parsedData.shipping_cost || parsedData.shippingCost,
            taxAmount: parsedData.tax_amount || parsedData.taxAmount,
            finalTotal: parsedData.total_amount || parsedData.finalTotal,
          };

          // Ensure all totals are properly calculated
          const populatedOrder = ensureCalculatedTotals(orderData);
          setOrder(populatedOrder);

          if (populatedOrder.paymentMethod === 'bank_transfer' &&
              !populatedOrder.paymentVerified &&
              !populatedOrder.transactionReference) {
            setTimeout(() => setShowReferenceModal(true), 1000);
          }
        } catch (err) {
          console.error('Failed to parse order data from URL param:', err);
          setError('Invalid order data format.');
        } finally {
          setLoading(false);
        }
      } else if (orderId) {
        // Path 2: Order ID provided, fetch from Firestore
        await fetchOrderFromFirestore(orderId, paymentMethod);
      } else {
        setError('No order information provided.');
        setLoading(false);
      }
    };

    loadOrder();
  }, [searchParams]);

  const fetchOrderFromFirestore = async (id: string, method: string | null) => {
    try {
      let collectionName = '';
      if (method === 'bank_transfer') {
        collectionName = 'bankTransferOrders';
      } else if (method === 'flutterwave') {
        collectionName = 'flutterwaveOrders';
      } else {
        collectionName = 'bankTransferOrders';
        console.warn('Payment method not specified, defaulting to bankTransferOrders collection.');
      }

      if (!collectionName) {
        setError('Could not determine order type for fetching.');
        return;
      }
      
      const orderQuery = query(
        collection(db, collectionName),
        where('orderId', '==', id)
      );
      
      const orderSnapshot = await getDocs(orderQuery);
      
      if (!orderSnapshot.empty) {
        const orderDoc = orderSnapshot.docs[0];
        const fetchedData = orderDoc.data();

        // Create order data from Firestore
        const orderData: Partial<OrderData> = {
          orderId: fetchedData.orderId || id,
          amount: fetchedData.amount || 0,
          status: fetchedData.status || 'unknown',
          paymentMethod: fetchedData.paymentMethod || method || 'unknown',
          customerName: fetchedData.customerInfo?.name || fetchedData.customerName || 'N/A',
          customerEmail: fetchedData.customerInfo?.email || fetchedData.customerEmail || 'N/A',
          items: fetchedData.items || fetchedData.cart_items || [],
          bankDetails: fetchedData.bankDetails || fetchedData.bank_details,
          paymentVerified: fetchedData.paymentVerified || false,
          transactionReference: fetchedData.transactionReference || fetchedData.reference,
          verificationStatus: fetchedData.verificationStatus,
          transactionId: fetchedData.transactionId,
          // Use stored calculated totals if available
          totalAmountItemsOnly: fetchedData.totalAmountItemsOnly || fetchedData.total_amount_items_only,
          shippingCost: fetchedData.shippingCost || fetchedData.shipping_cost,
          taxAmount: fetchedData.taxAmount || fetchedData.tax_amount,
          finalTotal: fetchedData.finalTotal || fetchedData.total_amount,
        };

        // Ensure all totals are properly calculated
        const populatedOrder = ensureCalculatedTotals(orderData);
        setOrder(populatedOrder);

        if (populatedOrder.paymentMethod === 'bank_transfer' &&
            !populatedOrder.paymentVerified &&
            !populatedOrder.transactionReference) {
          setTimeout(() => setShowReferenceModal(true), 1000);
        }
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      console.error('Error fetching order from Firestore:', err);
      setError('Failed to load order details from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceSubmitted = (result: any) => {
    setShowReferenceModal(false);

    if (order) {
      setOrder({
        ...order,
        paymentVerified: result.verified,
        transactionReference: result.data?.transactionReference,
        verificationStatus: result.verified ? 'auto_verified' : 'pending_verification',
        status: result.verified ? 'confirmed' : 'pending_verification'
      });
    }

    // Refresh order data from Firestore after a delay
    if (order?.orderId && order?.paymentMethod) {
      setTimeout(() => fetchOrderFromFirestore(order.orderId, order.paymentMethod), 2000);
    }
  };

  const formatPrice = (amount: number) => `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getPaymentStatusDisplay = () => {
    if (!order) return null;

    const { paymentMethod, paymentVerified, status, transactionReference, verificationStatus } = order;

    if (paymentMethod === 'bank_transfer') {
      if (paymentVerified) {
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">✅ Payment Verified!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Your bank transfer has been verified and your order is being processed.
                </p>
                {transactionReference && (
                  <p className="text-green-600 text-xs mt-1 font-mono">
                    Reference: {transactionReference}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      } else if (transactionReference) {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <Icon icon="mdi:clock" className="w-8 h-8 text-yellow-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">⏳ Payment Being Verified</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  We received your transaction reference and are verifying your payment.
                  You'll receive an email confirmation once verified.
                </p>
                <p className="text-yellow-600 text-xs mt-1 font-mono">
                  Reference: {transactionReference}
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Estimated verification time: 2-4 hours
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Icon icon="mdi:bank" className="w-8 h-8 text-blue-500 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">🏦 Complete Your Payment</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Please complete your bank transfer and submit your transaction reference.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReferenceModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Icon icon="mdi:upload" className="w-4 h-4" />
                Submit Reference
              </button>
            </div>
          </div>
        );
      }
    } else if (paymentMethod === 'flutterwave') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">✅ Payment Successful!</h3>
              <p className="text-green-700 text-sm mt-1">
                Your payment via Flutterwave has been processed successfully.
              </p>
              {order.transactionReference && (
                <p className="text-green-600 text-xs mt-1 font-mono">
                  Reference: {order.transactionReference}
                </p>
              )}
               {order.transactionId && (
                <p className="text-green-600 text-xs mt-1 font-mono">
                  Transaction ID: {order.transactionId}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (order.status === 'confirmed') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">✅ Order Confirmed</h3>
              <p className="text-green-700 text-sm mt-1">
                Your order is confirmed and will be processed shortly.
              </p>
            </div>
          </div>
        </div>
      );
    } else if (order.status === 'pending_payment') {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                    <Icon icon="mdi:clock" className="w-8 h-8 text-yellow-500 mr-4" />
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-800">⏳ Order Pending Payment</h3>
                        <p className="text-yellow-700 text-sm mt-1">
                            Your order is awaiting payment confirmation.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h1>
            <p className="text-gray-600 mb-6">{error || "No order details available."}</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Go to Homepage
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:check" className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {order.paymentVerified ? 'Order Confirmed!' : 'Order Placed Successfully!'}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {order.paymentVerified
                ? 'Thank you for your order! Your payment has been confirmed and we\'re preparing your items for shipment.'
                : 'Thank you for your order! Please complete your payment to confirm your order.'
              }
            </p>
          </div>

          {/* Payment Status */}
          {getPaymentStatusDisplay()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Icon icon="mdi:receipt" className="w-6 h-6 mr-2" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium font-mono">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg text-red-600">{formatPrice(order.finalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{order.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium capitalize ${
                    order.paymentVerified ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.paymentVerified ? 'Confirmed' : 'Pending Payment'}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t pt-4 text-sm text-gray-700">
                <h3 className="font-medium text-gray-900 mb-3">Order Breakdown:</h3>
                
                {/* Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="text-gray-900 font-medium">{item.itemName}</span>
                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {formatPrice(item.amount * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal (Items):</span>
                    <span>{formatPrice(order.totalAmountItemsOnly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      Shipping:
                      {order.isFreeShipping && (
                        <span className="text-xs text-green-600">(Free!)</span>
                      )}
                    </span>
                    <span className={order.isFreeShipping ? 'text-green-600' : ''}>
                      {order.isFreeShipping ? 'FREE' : formatPrice(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (0.01%):</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total:</span>
                    <span className="text-red-600">{formatPrice(order.finalTotal)}</span>
                  </div>
                </div>

                {/* Free Shipping Message */}
                {order.isFreeShipping && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    🎉 You qualified for free shipping by spending over {formatPrice(FREE_SHIPPING_THRESHOLD)}!
                  </div>
                )}
              </div>
            </div>

            {/* Bank Transfer Details */}
            {order.paymentMethod === 'bank_transfer' && order.bankDetails && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Icon icon="mdi:bank" className="w-6 h-6 mr-2" />
                  Bank Transfer Details
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-medium">{order.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono">{order.bankDetails.accountNumber}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(order.bankDetails!.accountNumber)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Icon icon="mdi:content-copy" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-medium">{order.bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-gray-600">Amount to Transfer:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-red-600">{formatPrice(order.finalTotal)}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(order.finalTotal.toString())}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Icon icon="mdi:content-copy" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {!order.transactionReference && (
                  <button
                    onClick={() => setShowReferenceModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:upload" className="w-5 h-5" />
                    Submit Transaction Reference
                  </button>
                )}
              </div>
            )}
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Icon icon="mdi:lightbulb" className="w-6 h-6 mr-2" />
              What's Next?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  order.paymentVerified ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Icon icon="mdi:email" className={`w-6 h-6 ${
                    order.paymentVerified ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className="font-medium mb-2">Email Confirmation</h3>
                <p className="text-sm text-gray-600">
                  {order.paymentVerified
                    ? "You'll receive order confirmation and tracking details via email."
                    : "You'll receive confirmation once payment is verified."
                  }
                </p>
              </div>

              <div className="text-center p-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  order.paymentVerified ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Icon icon="mdi:package" className={`w-6 h-6 ${
                    order.paymentVerified ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-medium mb-2">Order Processing</h3>
                <p className="text-sm text-gray-600">
                  {order.paymentVerified
                    ? "We're preparing your order for shipment."
                    : "Processing begins after payment verification."
                  }
                </p>
              </div>

              <div className="text-center p-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  order.paymentVerified ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Icon icon="mdi:truck" className={`w-6 h-6 ${
                    order.paymentVerified ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-medium mb-2">Shipping</h3>
                <p className="text-sm text-gray-600">
                  {order.paymentVerified
                    ? "Track your order with the provided tracking number."
                    : "Shipping details will be sent after payment confirmation."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/shop"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Continue Shopping
            </Link>

            {order.paymentMethod === 'bank_transfer' && !order.transactionReference && (
              <button
                onClick={() => setShowReferenceModal(true)}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:upload" className="w-5 h-5" />
                Submit Payment Reference
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Print Order Details
            </button>
          </div>

          {/* Contact Info */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Questions about your order?</p>
            <p>
              <a href="mailto:symbolstores45@gmail.com" className="text-blue-600 hover:underline">
                symbolstores45@gmail.com
              </a>
              {' '} | {' '}
              <a href="tel:+2348012345678" className="text-blue-600 hover:underline">
                +234 801 234 5678
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Reference Modal */}
      {order.bankDetails && (
        <TransactionReferenceModal
          isOpen={showReferenceModal}
          onClose={() => setShowReferenceModal(false)}
          orderData={{
            orderId: order.orderId,
            amount: order.finalTotal, // Always use finalTotal (guaranteed to be defined)
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            bankDetails: order.bankDetails
          }}
          onSuccess={handleReferenceSubmitted}
        />
      )}

      <Footer />
    </div>
  );
}