// src/components/AdminPaymentVerification.tsx
"use client";

import { useState, useEffect } from 'react';

interface PendingOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  transactionReference: string;
  referenceSubmittedAt: string;
  status: string;
  autoVerificationConfidence?: number;
  verificationNotes?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    amount: number;
    imageURL?: string;
  }>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export default function AdminPaymentVerification() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingOrders();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingOrders = async () => {
    try {
      console.log('🔍 Loading pending payment verifications...');
      
      const response = await fetch('/admin/dashboard/orders/pending');
      const result = await response.json();
      
      if (result.success) {
        setPendingOrders(result.data);
        console.log(`✅ Loaded ${result.data.length} pending orders`);
      } else {
        console.error('Failed to load pending orders:', result.error);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, action: 'approve' | 'reject') => {
    const notes = prompt(
      action === 'approve' 
        ? 'Add verification notes (optional):' 
        : 'Why are you rejecting this payment? (required):'
    );
    
    if (action === 'reject' && !notes) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessing(orderId);
    
    try {
      const response = await fetch('/admin/dashboard/orders/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          action,
          notes: notes || `Payment ${action}d by admin`,
          verifiedBy: 'Admin Dashboard'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Payment ${action}d successfully! Customer has been notified.`);
        await loadPendingOrders(); // Refresh the list
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      alert(`Failed to ${action} payment. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)} hours ago`;
      } else {
        return `${Math.floor(diffInMinutes / 1440)} days ago`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getUrgencyClass = (dateString: string) => {
    if (!dateString) return 'border-gray-200 bg-gray-50';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes > 240) { // 4+ hours
        return 'border-red-200 bg-red-50';
      } else if (diffInMinutes > 120) { // 2+ hours
        return 'border-yellow-200 bg-yellow-50';
      } else {
        return 'border-blue-200 bg-blue-50';
      }
    } catch (error) {
      return 'border-gray-200 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-50px overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-yellow-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-200 rounded-lg mr-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                🔥 PAYMENT VERIFICATION SYSTEM (WORKING!) 🔥
              </h3>
              <p className="text-sm text-gray-600">
                {pendingOrders.length} orders waiting for manual verification
              </p>
            </div>
          </div>
          <button
            onClick={loadPendingOrders}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <svg className="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending payment verifications at the moment.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {pendingOrders.map((order) => (
            <div key={order.id} className={`p-6 border-l-4 ${getUrgencyClass(order.referenceSubmittedAt)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                        Pending Verification
                      </div>
                      <span className="text-sm text-gray-500">
                        Submitted {order.referenceSubmittedAt ? formatTimeAgo(order.referenceSubmittedAt) : 'Unknown time'}
                      </span>
                      {order.autoVerificationConfidence && (
                        <span className={`text-sm font-medium ml-3 ${getConfidenceColor(order.autoVerificationConfidence)}`}>
                          Confidence: {order.autoVerificationConfidence}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleOrderExpansion(order.orderId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedOrders.has(order.orderId) ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* Compact Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{order.orderId || 'N/A'}</div>
                      <div className="text-sm text-gray-600">{order.customerName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">₦{(order.amount || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{order.bankDetails?.bankName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{order.bankDetails?.accountNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Transaction Ref:</div>
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {order.transactionReference || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrders.has(order.orderId) && (
                    <div className="mt-6 space-y-4">
                      {order.verificationNotes && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">System Notes:</div>
                          <div className="text-sm text-gray-600">{order.verificationNotes}</div>
                        </div>
                      )}

                      {order.items && order.items.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Order Items ({order.items.length})</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                {item.imageURL && (
                                  <img 
                                    src={item.imageURL} 
                                    alt={item.itemName}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity || 0} × ₦{(item.amount || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => handleVerifyPayment(order.orderId, 'approve')}
                      disabled={processing === order.orderId}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {processing === order.orderId ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>✅ Approve Payment</>
                      )}
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(order.orderId, 'reject')}
                      disabled={processing === order.orderId}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {processing === order.orderId ? (
                        <>⏳ Processing...</>
                      ) : (
                        <>❌ Reject Payment</>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${order.customerEmail || ''}?subject=Payment Inquiry - Order ${order.orderId || 'N/A'}`)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                      disabled={!order.customerEmail}
                    >
                      📧 Contact Customer
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(order.transactionReference || 'N/A')}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                    >
                      📋 Copy Reference
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}