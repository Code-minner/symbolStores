// src/lib/hooks/useBankTransfer.ts - FIXED field names to match backend
import { useState } from 'react';

// ✅ FIXED: Updated interfaces to match backend expectations
interface CartItem {
  id: string;        // ✅ Changed from productId to id
  itemName: string;  // ✅ Changed from name to itemName
  quantity: number;
  amount: number;    // ✅ Changed from price to amount
  imageURL?: string;
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
  sortCode?: string;
}

// ✅ FIXED: Updated to match backend API expectations
export interface BankTransferData {
  cart_items: CartItem[];
  customer_data: CustomerData;
  bank_details: BankDetails;
}

interface BankTransferResult {
  success: boolean;
  orderReference?: string;
  bankDetails?: BankDetails;
  emailSent?: boolean;
  customerEmail?: string;
  message?: string;
  error?: string;
  amount?: number;
  status?: string;
}

interface PaymentConfirmationResult {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    submittedAt: Date;
    proofOfPayment?: {
      filename: string;
      size: number;
      type: string;
    } | null;
  };
  error?: string;
}

export function useBankTransfer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  const createBankTransferOrder = async (data: BankTransferData): Promise<BankTransferResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log("✅ Sending to bank transfer API:", data);

      // ✅ FIXED: Remove trailing slash from URL
      const response = await fetch('/api/payments/bank-transfer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      // Get response as text first to debug
      const responseText = await response.text();
      console.log("📄 Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("✅ Parsed JSON response:", result);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (response.ok && result.success) {
        setOrderReference(result.data.orderId);
        setBankDetails(result.data.bankDetails);
        
        return {
          success: true,
          orderReference: result.data.orderId,
          bankDetails: result.data.bankDetails,
          emailSent: result.data.emailSent,
          customerEmail: result.data.customerEmail,
          message: result.message,
          amount: result.data.amount,
          status: result.data.status,
        };
      } else {
        const errorMessage = result.error || `Server error: ${response.status}`;
        setError(errorMessage);
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    } catch (err) {
      console.error("❌ Bank transfer error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Network error or unexpected API response format.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async (reference: string, proofOfPayment?: File): Promise<PaymentConfirmationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('orderId', reference); // ✅ Updated to match backend expectations
      if (proofOfPayment) {
        formData.append('proof', proofOfPayment); // ✅ Updated field name
      }

      // ✅ FIXED: Updated to correct API endpoint
      const response = await fetch('/api/payments/bank-transfer/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to confirm payment');
        return { success: false, error: result.error || 'Failed to confirm payment' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createBankTransferOrder,
    confirmPayment,
    isProcessing,
    error,
    orderReference,
    bankDetails,
  };
}

// ✅ HELPER: Function to convert your existing cart format to backend format
export function convertCartToBackendFormat(cartItems: any[]): CartItem[] {
  return cartItems.map(item => ({
    id: item.productId || item.id || String(Math.random()), // Handle various id fields
    itemName: item.name || item.itemName || item.title || 'Unknown Item',
    quantity: Number(item.quantity) || 1,
    amount: Number(item.price) || Number(item.amount) || 0, // Handle both price and amount
    imageURL: item.imageURL || item.image || '',
    sku: item.sku || ''
  }));
}