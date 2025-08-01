// src/components/TransactionReferenceModal.tsx - USING ICONIFY ICONS
"use client";

import React, { useState } from 'react';
import { Icon } from "@iconify/react";

interface TransactionReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    bankDetails: {
      accountName: string;
      accountNumber: string;
      bankName: string;
    };
  };
  onSuccess: (result: any) => void;
}

export default function TransactionReferenceModal({ 
  isOpen, 
  onClose, 
  orderData, 
  onSuccess 
}: TransactionReferenceModalProps) {
  const [transactionReference, setTransactionReference] = useState('');
  const [transferAmount, setTransferAmount] = useState(orderData.amount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'reference' | 'success'>('instructions');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleTransferComplete = () => {
    setStep('reference');
  };

  const handleSubmitReference = async () => {
    if (!transactionReference.trim()) {
      setError('Please enter your transaction reference number');
      return;
    }

    if (!transferAmount || isNaN(Number(transferAmount))) {
      setError('Please enter a valid transfer amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/bank-transfer/verify-reference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          transactionReference: transactionReference.trim(),
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          amount: Number(transferAmount)
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult(result);
        setStep('success');
        onSuccess(result);
      } else {
        setError(result.error || 'Failed to verify transaction reference');
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'instructions' && '🏦 Complete Your Bank Transfer'}
            {step === 'reference' && '📝 Enter Transaction Reference'}
            {step === 'success' && '✅ Payment Verification'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        {/* Step 1: Bank Transfer Instructions */}
        {step === 'instructions' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Icon icon="mdi:alert-circle" className="text-blue-500 mt-1 mr-3 flex-shrink-0" width={20} height={20} />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Transfer Instructions</h3>
                  <p className="text-blue-800 text-sm">
                    Make a bank transfer to the account below, then provide your transaction reference for instant verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Transfer Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{orderData.bankDetails.accountName}</span>
                    <button
                      onClick={() => handleCopyToClipboard(orderData.bankDetails.accountName)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="mdi:content-copy" width={16} height={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{orderData.bankDetails.accountNumber}</span>
                    <button
                      onClick={() => handleCopyToClipboard(orderData.bankDetails.accountNumber)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="mdi:content-copy" width={16} height={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="font-medium">{orderData.bankDetails.bankName}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Amount to Transfer:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-red-600">{formatPrice(orderData.amount)}</span>
                    <button
                      onClick={() => handleCopyToClipboard(orderData.amount.toString())}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="mdi:content-copy" width={16} height={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{orderData.orderId}</span>
                    <button
                      onClick={() => handleCopyToClipboard(orderData.orderId)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="mdi:content-copy" width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Transfer the EXACT amount: {formatPrice(orderData.amount)}</li>
                <li>• Use "{orderData.orderId}" as your payment reference</li>
                <li>• Keep your bank's transaction reference number</li>
                <li>• Don't close this page until verification is complete</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleTransferComplete}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                I've Completed the Transfer
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Transaction Reference Input */}
        {step === 'reference' && (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mt-1 mr-3 flex-shrink-0" width={20} height={20} />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Transfer Completed</h3>
                  <p className="text-green-800 text-sm">
                    Great! Now enter your transaction reference number for instant verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Transaction Reference Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value.toUpperCase())}
                  placeholder="Enter your bank's transaction reference (e.g., FT240123456789)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  maxLength={25}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usually starts with FT, NIP, REF, or TXN followed by numbers
                </p>
              </div>

              {/* Amount Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Transferred <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter the exact amount you transferred"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expected: {formatPrice(orderData.amount)} (small differences for bank charges are acceptable)
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Icon icon="mdi:alert-circle" className="text-red-500 mt-1 mr-3 flex-shrink-0" width={20} height={20} />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Where to Find Reference */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Where to find your transaction reference:</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>SMS:</strong> Check the transaction SMS from your bank</li>
                  <li>• <strong>Mobile App:</strong> View transaction details in your banking app</li>
                  <li>• <strong>Receipt:</strong> Check your transfer receipt/confirmation</li>
                  <li>• <strong>Bank Statement:</strong> Reference appears on your statement</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('instructions')}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Instructions
                </button>
                
                <button
                  onClick={handleSubmitReference}
                  disabled={loading || !transactionReference.trim()}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success/Result */}
        {step === 'success' && verificationResult && (
          <div className="p-6">
            {verificationResult.verified ? (
              /* Auto-Verified Success */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:check-circle" className="text-green-500" width={32} height={32} />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Verified Successfully! 🎉
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Your payment has been automatically verified and your order is now confirmed.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="text-left space-y-2">
                    <p><strong>Order ID:</strong> {verificationResult.data.orderId}</p>
                    <p><strong>Status:</strong> <span className="text-green-600 font-medium">Confirmed</span></p>
                    <p><strong>Transaction Reference:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{verificationResult.data.transactionReference}</code></p>
                    <p><strong>Verified At:</strong> {new Date(verificationResult.data.verifiedAt).toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  You'll receive an order confirmation email shortly. We'll begin processing your order immediately.
                </p>

                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              /* Manual Verification Pending */
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:clock" className="text-yellow-500" width={32} height={32} />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Verification In Progress ⏳
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Your transaction reference has been received and is being verified by our team.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="text-left space-y-2">
                    <p><strong>Order ID:</strong> {verificationResult.data.orderId}</p>
                    <p><strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending Verification</span></p>
                    <p><strong>Transaction Reference:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{verificationResult.data.transactionReference}</code></p>
                    <p><strong>Estimated Time:</strong> {verificationResult.data.estimatedVerificationTime}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  We'll send you an email confirmation once your payment is verified. Please keep this page open or save your order ID for reference.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}