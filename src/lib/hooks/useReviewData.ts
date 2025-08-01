// src/lib/hooks/useReviewData.ts - Corrected ReviewData interface
import { useState, useEffect } from 'react';

// Define the structure of review data
interface AddressData {
  name: string;
  fullAddress: string;
  email: string;
  phone: string;
  company?: string;
}

interface PaymentData {
  type: string;
  name: string;
  cardNumber: string;
  expiryDate: string;
  method: 'flutterwave' | 'bank' | 'card';
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  companyName?: string;
  address: string;
  country: string;
  region: string;
  city: string;
  zipCode?: string;
  email: string;
  phone: string;
}

interface CardInfo {
  nameOnCard: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface ReviewData {
  address: AddressData;
  payment: PaymentData;
  orderNotes?: string;
  billingInfo?: BillingInfo;
  cardInfo?: CardInfo | null;
  // --- ADD THESE PROPERTIES ---
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  // --------------------------
}

export function useReviewData() {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  // Load data from sessionStorage on mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = sessionStorage.getItem('checkoutData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setReviewData(parsedData);
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
        // Clear corrupted data
        sessionStorage.removeItem('checkoutData');
      }
    };

    loadSavedData();
  }, []);

  // Save complete review data (main function used by checkout page)
  const saveReviewData = (data: ReviewData) => {
    try {
      setReviewData(data);
      sessionStorage.setItem('checkoutData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving checkout data:', error);
    }
  };

  // Update address data only
  const setAddressData = (addressData: Partial<AddressData>) => {
    setReviewData((prev) => {
      const newData = {
        ...prev,
        address: {
          ...prev?.address,
          ...addressData
        }
      } as ReviewData;
      
      try {
        sessionStorage.setItem('checkoutData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving address data:', error);
      }
      
      return newData;
    });
  };

  // Update payment data only
  const setPaymentData = (paymentData: Partial<PaymentData>) => {
    setReviewData((prev) => {
      const newData = {
        ...prev,
        payment: {
          ...prev?.payment,
          ...paymentData
        }
      } as ReviewData;
      
      try {
        sessionStorage.setItem('checkoutData', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving payment data:', error);
      }
      
      return newData;
    });
  };

  // Clear all review data (call after successful order)
  const clearReviewData = () => {
    setReviewData(null);
    try {
      sessionStorage.removeItem('checkoutData');
    } catch (error) {
      console.error('Error clearing checkout data:', error);
    }
  };

  // Get specific parts of the data
  const getOrderData = () => {
    if (!reviewData) return null;
    
    return {
      name: reviewData.address.name,
      email: reviewData.address.email,
      phone: reviewData.address.phone,
      address: reviewData.address.fullAddress,
      orderNotes: reviewData.orderNotes || '',
      paymentMethod: reviewData.payment.method,
      billingInfo: reviewData.billingInfo,
    };
  };

  return {
    // Data
    reviewData,
    
    // Main functions
    saveReviewData,
    clearReviewData,
    
    // Partial update functions
    setAddressData,
    setPaymentData,
    
    // Utility functions
    getOrderData,
  };
}