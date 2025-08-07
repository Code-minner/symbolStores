// src/lib/hooks/useFlutterwave.ts - Updated with Order Creation
"use client";

import { useState } from 'react';

interface FlutterwaveConfig {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options: string;
    customer: {
        email: string;
        phone_number: string;
        name: string;
    };
    customizations: {
        title: string;
        description: string;
        logo?: string;
    };
    meta?: {
        [key: string]: string | number;
    };
}

export interface CartItem {
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

interface PaymentData {
    email: string;
    name: string;
    phone: string;
    address?: string;
    amount: number;
    orderId: string;
    items: CartItem[];
    userId?: string;
    totalAmountItemsOnly: number;
    shippingCost: number;
    taxAmount: number;
    finalTotal: number;
}

interface FlutterwaveResponse {
    status: string;
    transaction_id: string;
    tx_ref: string;
    customer: {
        email: string;
        name: string;
        phone_number: string;
    };
    [key: string]: any;
}

interface PaymentResult {
    success: boolean;
    data?: {
        orderId: string;
        transaction_id: string;
        tx_ref: string;
        orderStatus?: string;
        emailSent?: boolean;
        adminEmailSent?: boolean;
        verificationData?: any;
        [key: string]: any;
    };
    error?: string;
}

interface VerificationResult {
    success: boolean;
    data?: any;
    error?: string;
    warning?: string;
}

declare global {
    interface Window {
        FlutterwaveCheckout: any;
    }
}

export function useFlutterwavePayment() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFlutterwaveScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (window.FlutterwaveCheckout) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
            document.head.appendChild(script);
        });
    };

    const simplifyItemsForMeta = (items: CartItem[]): string => {
        return items.map(item => `${item.itemName} (${item.quantity})`).join(', ');
    };

    const initiatePayment = async (paymentData: PaymentData): Promise<PaymentResult> => {
        try {
            setIsProcessing(true);
            setError(null);

            await loadFlutterwaveScript();

            // Generate unique transaction reference
            const txRef = `FLW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 🚀 STEP 1: Create order in database BEFORE payment
            console.log("🛒 Creating Flutterwave order before payment...");
            console.log(`👤 Customer: ${paymentData.name} (${paymentData.email})`);
            console.log(`💰 Amount: ₦${paymentData.finalTotal.toLocaleString()}`);
            console.log(`🆔 Order ID: ${paymentData.orderId}`);
            console.log(`📝 Tx Ref: ${txRef}`);
            
            const orderResponse = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: paymentData.orderId,
                    txRef: txRef,
                    customerName: paymentData.name,
                    customerEmail: paymentData.email, // ✅ CRITICAL: Save email for order history
                    customerPhone: paymentData.phone,
                    customerAddress: paymentData.address,
                    items: paymentData.items,
                    totalAmountItemsOnly: paymentData.totalAmountItemsOnly,
                    shippingCost: paymentData.shippingCost,
                    taxAmount: paymentData.taxAmount,
                    finalTotal: paymentData.finalTotal,
                    paymentMethod: 'flutterwave',
                    status: 'pending',
                    userId: paymentData.userId || null, // ✅ null for guests, ID for logged-in
                }),
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                console.error('❌ Order creation failed:', errorData);
                throw new Error(`Failed to create order: ${errorData.error || 'Unknown error'}`);
            }

            const orderResult = await orderResponse.json();
            console.log("✅ Order created successfully:", orderResult);

            // Prepare meta data with cart information
            const metaData: { [key: string]: string | number } = {
                order_id: paymentData.orderId,
                customer_name: paymentData.name,
                customer_email: paymentData.email,
                customer_address: paymentData.address || '',
                items_count: paymentData.items.length,
                items_summary: simplifyItemsForMeta(paymentData.items),
                user_id: paymentData.userId || '',
                total_amount_items_only: paymentData.totalAmountItemsOnly,
                shipping_cost: paymentData.shippingCost,
                tax_amount: paymentData.taxAmount,
                final_total: paymentData.finalTotal,
            };

            const config: FlutterwaveConfig = {
                public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
                tx_ref: txRef, // ✅ Use generated txRef that matches database
                amount: paymentData.finalTotal, // ✅ FIXED: Use actual total instead of hardcoded
                currency: 'NGN',
                payment_options: 'card,mobilemoney,ussd,banktransfer',
                customer: {
                    email: paymentData.email,
                    phone_number: paymentData.phone,
                    name: paymentData.name,
                },
                customizations: {
                    title: process.env.NEXT_PUBLIC_APP_NAME || 'Symbol Stores',
                    description: `Payment for order ${paymentData.orderId}`,
                },
                meta: metaData,
            };

            return new Promise<PaymentResult>((resolve, reject) => {
                window.FlutterwaveCheckout({
                    ...config,
                    callback: async (response: FlutterwaveResponse) => {
                        console.log('✅ Flutterwave payment response:', response);

                        if (response.status === 'successful') {
                            try {
                                // ✅ STEP 2: Verify payment and update order
                                console.log("🔍 Verifying payment with backend...");
                                const verificationResult = await verifyPayment(
                                    response.transaction_id,
                                    txRef
                                );

                                setIsProcessing(false);

                                if (verificationResult.success) {
                                    console.log("🎉 Payment verification successful!");
                                    resolve({
                                        success: true,
                                        data: {
                                            orderId: verificationResult.data?.orderId || paymentData.orderId,
                                            transaction_id: response.transaction_id,
                                            tx_ref: response.tx_ref,
                                            orderStatus: verificationResult.data?.status,
                                            emailSent: verificationResult.data?.emailSent,
                                            adminEmailSent: verificationResult.data?.adminEmailSent,
                                            verificationData: verificationResult.data,
                                        },
                                    });
                                } else {
                                    const errorMsg = verificationResult.warning || verificationResult.error || 'Payment verification failed';
                                    console.error("❌ Payment verification failed:", errorMsg);
                                    setError(errorMsg);
                                    reject({
                                        success: false,
                                        error: errorMsg
                                    });
                                }
                            } catch (error) {
                                console.error("❌ Payment verification error:", error);
                                setIsProcessing(false);
                                setError('Payment verification error');
                                reject({
                                    success: false,
                                    error: 'Payment verification error'
                                });
                            }
                        } else {
                            console.error("❌ Payment was not successful:", response.status);
                            setIsProcessing(false);
                            setError('Payment was not successful');
                            reject({
                                success: false,
                                error: 'Payment was not successful'
                            });
                        }
                    },
                    onclose: () => {
                        setIsProcessing(false);
                        console.log('⚠️ Payment modal closed by user');
                        reject({
                            success: false,
                            error: 'Payment cancelled by user'
                        });
                    },
                });
            });
        } catch (error) {
            setIsProcessing(false);
            const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
            console.error('❌ Payment initialization error:', errorMessage);
            setError(errorMessage);
            throw {
                success: false,
                error: errorMessage
            };
        }
    };

    // ✅ Simplified verification function
    const verifyPayment = async (
        transactionId: string,
        txRef: string
    ): Promise<VerificationResult> => {
        try {
            console.log("📡 Sending verification request to backend:", {
                transaction_id: transactionId,
                tx_ref: txRef,
            });

            // ✅ Call your existing verification API
            const response = await fetch('/api/payments/verify-flutterwave-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    tx_ref: txRef,
                }),
            });

            const result = await response.json();
            console.log("📨 Backend verification response:", result);
            return result;
        } catch (error) {
            console.error('❌ Payment verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    };

    return {
        initiatePayment,
        verifyPayment,
        isProcessing,
        error,
    };
}