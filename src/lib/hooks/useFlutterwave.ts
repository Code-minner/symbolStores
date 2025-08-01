// src/lib/hooks/useFlutterwave.ts - Enhanced to pass cart data and full totals to verification
"use client"; // This hook might be used in client components

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

// Re-using CartItem from CartContext for consistency
export interface CartItem {
    id: string;
    itemName: string;
    category: string;
    subcategory: string;
    brand: string;
    amount: number; // Price per unit
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
    amount: number; // This is the finalTotal to be paid
    orderId: string;
    items: CartItem[];
    userId?: string;
    // Add new fields for detailed totals
    totalAmountItemsOnly: number; // Sum of (item.amount * item.quantity)
    shippingCost: number;
    taxAmount: number;
    finalTotal: number; // This should be the same as 'amount' above
}

interface CustomerVerificationData {
    name: string;
    email: string;
    phone: string;
    address?: string;
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
    warning?: string; // For cases where payment succeeded but order creation failed
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

            // Prepare meta data with cart information
            const metaData: { [key: string]: string | number } = {
                order_id: paymentData.orderId,
                customer_name: paymentData.name,
                customer_email: paymentData.email,
                customer_address: paymentData.address || '',
                items_count: paymentData.items.length,
                items_summary: simplifyItemsForMeta(paymentData.items),
                user_id: paymentData.userId || '',
                // Add new meta fields for debugging/backend visibility
                total_amount_items_only: paymentData.totalAmountItemsOnly,
                shipping_cost: paymentData.shippingCost,
                tax_amount: paymentData.taxAmount,
                final_total: paymentData.finalTotal,
            };

            const config: FlutterwaveConfig = {
                public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
                tx_ref: `FLW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                amount: 100, // Use finalTotal here for the actual amount to be charged-----------------------------------
                currency: 'NGN',
                payment_options: 'card,mobilemoney,ussd,banktransfer',
                customer: {
                    email: paymentData.email,
                    phone_number: paymentData.phone,
                    name: paymentData.name,
                },
                customizations: {
                    title: process.env.NEXT_PUBLIC_APP_NAME || 'Your Store',
                    description: `Payment for order ${paymentData.orderId}`,
                },
                meta: metaData,
            };

            return new Promise<PaymentResult>((resolve, reject) => {
                window.FlutterwaveCheckout({
                    ...config,
                    callback: async (response: FlutterwaveResponse) => {
                        console.log('Flutterwave response:', response);

                        if (response.status === 'successful') {
                            try {
                                // Pass all relevant data to verification
                                const verificationResult = await verifyPayment(
                                    response.transaction_id,
                                    paymentData.items,
                                    { // customerData
                                        name: paymentData.name,
                                        email: paymentData.email,
                                        phone: paymentData.phone,
                                        address: paymentData.address
                                    },
                                    paymentData.userId,
                                    // Pass the calculated totals explicitly
                                    paymentData.totalAmountItemsOnly,
                                    paymentData.shippingCost,
                                    paymentData.taxAmount,
                                    paymentData.finalTotal
                                );

                                setIsProcessing(false);

                                if (verificationResult.success) {
                                    resolve({
                                        success: true,
                                        data: {
                                            orderId: verificationResult.data?.orderId || paymentData.orderId,
                                            transaction_id: response.transaction_id,
                                            tx_ref: response.tx_ref,
                                            orderStatus: verificationResult.data?.orderStatus,
                                            emailSent: verificationResult.data?.emailSent,
                                            adminEmailSent: verificationResult.data?.adminEmailSent,
                                            verificationData: verificationResult.data,
                                        },
                                    });
                                } else {
                                    const errorMsg = verificationResult.warning || verificationResult.error || 'Payment verification failed';
                                    setError(errorMsg);

                                    // If there's a warning, it means payment succeeded but order creation failed
                                    if (verificationResult.warning) {
                                        resolve({
                                            success: true,
                                            data: {
                                                orderId: verificationResult.data?.orderId || `TMP-${response.tx_ref}`,
                                                transaction_id: response.transaction_id,
                                                tx_ref: response.tx_ref,
                                                verificationData: verificationResult.data,
                                            },
                                        });
                                    } else {
                                        reject({
                                            success: false,
                                            error: errorMsg
                                        });
                                    }
                                }
                            } catch (error) {
                                setIsProcessing(false);
                                setError('Payment verification error');
                                reject({
                                    success: false,
                                    error: 'Payment verification error'
                                });
                            }
                        } else {
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
                        console.log('Payment modal closed by user');
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
            setError(errorMessage);
            throw {
                success: false,
                error: errorMessage
            };
        }
    };

    // Enhanced verification function that passes cart data and full totals
    const verifyPayment = async (
        transactionId: string,
        cartItems: CartItem[],
        customerData: CustomerVerificationData, // Changed to specific interface
        userId: string | undefined,
        // New parameters for calculated totals
        totalAmountItemsOnly: number,
        shippingCost: number,
        taxAmount: number,
        finalTotal: number
    ): Promise<VerificationResult> => {
        try {
            console.log("Sending verification request to backend with:", {
                transaction_id: transactionId,
                cart_items: cartItems,
                customer_data: customerData,
                user_id: userId,
                total_amount_items_only: totalAmountItemsOnly,
                shipping_cost: shippingCost,
                tax_amount: taxAmount,
                final_total: finalTotal,
            });

            const response = await fetch('/api/verify-flutterwave-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    cart_items: cartItems,
                    customer_data: customerData,
                    user_id: userId,
                    // Pass the calculated totals to the backend
                    total_amount_items_only: totalAmountItemsOnly,
                    shipping_cost: shippingCost,
                    tax_amount: taxAmount,
                    final_total: finalTotal,
                }),
            });

            const result = await response.json();
            console.log("Backend verification response:", result);
            return result;
        } catch (error) {
            console.error('Payment verification error:', error);
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