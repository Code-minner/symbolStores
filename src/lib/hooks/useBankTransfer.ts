// src/lib/hooks/useBankTransfer.ts
import { useState } from 'react';

interface BankTransferData {
  orderData: {
    totalAmount: number;
    items: any[];
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  sortCode: string;
}

export function useBankTransfer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  const createBankTransferOrder = async (data: BankTransferData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/bank-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setOrderReference(result.data.orderId);
        setBankDetails(result.data.bankDetails);
        
        return {
          success: true,
          orderReference: result.data.orderId,
          bankDetails: result.data.bankDetails,
          emailSent: result.data.emailSent,
          customerEmail: result.data.customerEmail,
          message: result.message,
        };
      } else {
        setError(result.error || 'Failed to create bank transfer order');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async (reference: string, proofOfPayment?: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('reference', reference);
      if (proofOfPayment) {
        formData.append('proofOfPayment', proofOfPayment);
      }

      const response = await fetch('/api/confirm-bank-transfer', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to confirm payment');
        return { success: false, error: result.error };
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