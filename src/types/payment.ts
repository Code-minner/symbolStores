// src/types/payment.ts - Optional: Clean type definitions
export interface OrderData {
  name: string;
  email: string;
  phone: string;
  address: string;
  totalAmount: number;
  items: CartItem[];
  orderNotes?: string;
}

export interface CartItem {
  id: string;
  itemName: string;
  quantity: number;
  amount: number;
  imageURL?: string;
}

export interface PaymentSuccessData {
  orderId: string;
  paymentMethod: 'flutterwave' | 'bank_transfer';
  transactionId?: string;
  reference?: string;
  orderReference?: string;
  emailSent?: boolean;
}

export interface PaymentComponentProps {
  orderData: OrderData;
  onSuccess: (data: PaymentSuccessData) => void;
  onError: (error: string) => void;
}

// Flutterwave specific types
export interface FlutterwavePaymentData {
  email: string;
  name: string;
  phone: string;
  amount: number;
  orderId: string;
  items: CartItem[];
}

export interface FlutterwaveResponse {
  status: string;
  transaction_id: string;
  tx_ref: string;
  customer: {
    email: string;
    name: string;
    phone_number: string;
  };
}

// Bank Transfer specific types
export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  sortCode?: string;
}

export interface BankTransferOrderData {
  orderData: {
    totalAmount: number;
    items: CartItem[];
    orderNotes?: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

// If you want to use these types, import them in your components:
// import { PaymentComponentProps, OrderData, PaymentSuccessData } from '@/types/payment';