// src/lib/hooks/useReviewData.ts
import { useState } from 'react';

export const useReviewData = () => {
  const [reviewData, setReviewData] = useState(null);

  const setAddressData = (data: any) => {
    setReviewData((prev: any) => ({
      ...prev,
      address: data
    }));
  };

  const setPaymentData = (data: any) => {
    setReviewData((prev: any) => ({
      ...prev,
      payment: data
    }));
  };

  return {
    reviewData,
    setAddressData,
    setPaymentData
  };
};