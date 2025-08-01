// src/app/admin/page.tsx - FIXED Admin Dashboard Using API Routes

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Import your ProductsCache
import { getAllProducts, clearProductsCache } from "@/lib/ProductsCache";

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  amount: number;
  originalPrice?: number;
  status: string;
  sku: string;
  imageURL: string;
  images?: string[];
  createdAt: any;
  inStock: boolean;
}

interface PendingOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  items?: any[];
  transactionReference: string;
  referenceSubmittedAt: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: string;
  // Additional fields for proper totals
  totalAmountItemsOnly?: number;
  shippingCost?: number;
  taxAmount?: number;
  finalTotal?: number;
  isFreeShipping?: boolean;
}

export default function AdminDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Payment verification states
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      if (!userData?.isAdmin) {
        router.push("/");
        return;
      }
      loadProducts();
      loadPendingOrders();
    }
  }, [user, userData, authLoading, router]);

  // Load products using cache
  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsList = await getAllProducts();

      // Simple sort by creation date
      productsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      setProducts(productsList);
      console.log(`Loaded ${productsList.length} products`);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load pending orders
  const loadPendingOrders = async () => {
    try {
      setPaymentLoading(true);
      
      const ordersQuery = query(
        collection(db, 'bankTransferOrders'),
        where('status', 'in', ['pending_verification', 'pending_manual'])
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders: PendingOrder[] = [];
      
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.transactionReference && !data.paymentVerified) {
          orders.push({
            id: doc.id,
            orderId: data.orderId,
            customerName: data.customerName || 'N/A',
            customerEmail: data.customerEmail || 'N/A',
            customerPhone: data.customerPhone,
            amount: data.amount || 0,
            items: data.items || [],
            transactionReference: data.transactionReference,
            referenceSubmittedAt: data.referenceSubmittedAt || data.updatedAt || new Date().toISOString(),
            bankDetails: data.bankDetails,
            status: data.status,
            // Additional fields for proper email totals
            totalAmountItemsOnly: data.totalAmountItemsOnly || data.subtotal,
            shippingCost: data.shippingCost,
            taxAmount: data.taxAmount,
            finalTotal: data.finalTotal || data.amount,
            isFreeShipping: data.isFreeShipping
          });
        }
      });
      
      // Sort by submission time (newest first)
      orders.sort((a, b) => new Date(b.referenceSubmittedAt).getTime() - new Date(a.referenceSubmittedAt).getTime());
      
      setPendingOrders(orders);
      console.log(`Loaded ${orders.length} pending orders`);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      setPendingOrders([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ FIXED: Send customer notification via API route
  const sendCustomerNotification = async (order: PendingOrder, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/notify-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          orderData: {
            orderId: order.orderId,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            amount: order.amount,
            items: order.items,
            bankDetails: order.bankDetails,
            totalAmountItemsOnly: order.totalAmountItemsOnly,
            shippingCost: order.shippingCost,
            taxAmount: order.taxAmount,
            finalTotal: order.finalTotal,
            isFreeShipping: order.isFreeShipping
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }

      console.log(`✅ ${action} notification sent successfully`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to send ${action} notification:`, error);
      return { success: false, error };
    }
  };

  // ✅ FIXED: Verify payment using API for notifications
  const handleVerifyPayment = async (orderId: string, action: 'approve' | 'reject') => {
    if (processingOrderId) return;
    
    if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} payment for order ${orderId}?`)) return;
    
    setProcessingOrderId(orderId);
    
    try {
      const order = pendingOrders.find(o => o.orderId === orderId);
      if (!order) throw new Error('Order not found');
      
      // 1. Update order in Firestore
      await updateDoc(doc(db, 'bankTransferOrders', order.id), {
        paymentVerified: action === 'approve',
        status: action === 'approve' ? 'confirmed' : 'rejected',
        verificationMethod: 'manual_admin',
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Order ${action}d in Firestore`);
      
      // 2. Send notification email via API route
      if (action === 'approve') {
        const emailResult = await sendCustomerNotification(order, action);
        if (!emailResult.success) {
          console.warn('⚠️ Order updated but email notification failed:', emailResult.error);
          // Don't fail the whole operation if email fails
        }
      }
      
      // 3. Remove from pending list
      setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
      
      // 4. Show success message
      const emailStatus = action === 'approve' ? ' Customer has been notified via email.' : '';
      alert(`Payment ${action}d successfully!${emailStatus}`);
      
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      alert(`Failed to ${action} payment. Please try again.`);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const submitted = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
    
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)} days ago`;
    } else if (diffHours >= 1) {
      return `${diffHours} hours ago`;
    } else {
      return 'Just now';
    }
  };

  // Get urgency color
  const getUrgencyColor = (timestamp: string) => {
    const now = new Date();
    const submitted = new Date(timestamp);
    const diffHours = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    
    if (diffHours >= 8) return 'border-red-500 bg-red-50';
    if (diffHours >= 2) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  // Delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"?`)) return;
    
    try {
      await deleteDoc(doc(db, "products", productId));
      clearProductsCache();
      await loadProducts();
      alert("Product deleted!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product.");
    }
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/admin/edit-product/${productId}`);
  };

  const handleLogout = async () => {
    if (confirm("Logout?")) {
      try {
        await signOut(auth);
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    clearProductsCache();
    await Promise.all([loadProducts(), loadPendingOrders()]);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStatus = !filterStatus || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map((product) => product.category))];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage products and payment verifications</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={loading || paymentLoading}
              >
                {(loading || paymentLoading) ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => router.push("/admin/add-product")}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                + Add Product
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-xl font-bold text-green-600">
                {products.filter(p => p.status === "in stock").length}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-600">Limited</p>
              <p className="text-xl font-bold text-yellow-600">
                {products.filter(p => p.status === "limited stock").length}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">
                {products.filter(p => p.status === "out of stock").length}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className={`text-xl font-bold ${pendingOrders.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {pendingOrders.length}
              </p>
            </div>
          </div>

          {/* FIXED Payment Verification Section */}
          <div className="bg-white rounded shadow-sm mb-8">
            <div className="px-4 py-3 border-b bg-yellow-50 flex justify-between items-center">
              <div>
                <h3 className="font-medium">Payment Verification ({pendingOrders.length})</h3>
                <p className="text-sm text-gray-600">Orders waiting for approval</p>
              </div>
              <button
                onClick={loadPendingOrders}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {paymentLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No pending payments</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingOrders.map((order, index) => (
                    <div key={order.id} className={`p-4 border-l-4 ${getUrgencyColor(order.referenceSubmittedAt)}`}>
                      
                      {/* Order header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-medium">Order {order.orderId}</div>
                            <div className="text-sm text-gray-600">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{formatTimeAgo(order.referenceSubmittedAt)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">₦{order.amount.toLocaleString()}</div>
                          <button
                            onClick={() => toggleOrderExpansion(order.orderId)}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                          >
                            {expandedOrders.has(order.orderId) ? 'Less' : 'More'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedOrders.has(order.orderId) && (
                        <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded">
                          <div>
                            <p className="text-sm"><strong>Email:</strong> {order.customerEmail}</p>
                            {order.customerPhone && (
                              <p className="text-sm"><strong>Phone:</strong> {order.customerPhone}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm"><strong>Bank:</strong> {order.bankDetails?.bankName || 'N/A'}</p>
                            <p className="text-sm"><strong>Account:</strong> {order.bankDetails?.accountNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm"><strong>Transaction Reference:</strong></p>
                            <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                              {order.transactionReference}
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div>
                              <p className="text-sm"><strong>Items ({order.items.length}):</strong></p>
                              <div className="space-y-1">
                                {order.items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    {item.itemName} (Qty: {item.quantity})
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="text-xs text-gray-500">+{order.items.length - 3} more items</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleVerifyPayment(order.orderId, 'approve')}
                          disabled={processingOrderId === order.orderId}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          {processingOrderId === order.orderId ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(order.orderId, 'reject')}
                          disabled={processingOrderId === order.orderId}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => window.open(`mailto:${order.customerEmail}?subject=Order ${order.orderId}`)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.transactionReference);
                            alert('Copied!');
                          }}
                          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Copy Ref
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Filters */}
          <div className="bg-white rounded p-4 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Status</option>
                <option value="in stock">In Stock</option>
                <option value="limited stock">Limited Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("");
                  setFilterStatus("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="font-medium">Products ({filteredProducts.length})</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          {products.length === 0 ? "No products yet." : "No matches."}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <img className="h-10 w-10 rounded object-cover mr-3" src={product.imageURL} alt={product.itemName} />
                              <div>
                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{product.itemName}</div>
                                <div className="text-sm text-gray-500">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.category}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">₦{product.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              product.status === "in stock" ? "bg-green-100 text-green-800" :
                              product.status === "limited stock" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex space-x-1 justify-end">
                              <button
                                onClick={() => handleEditProduct(product.id)}
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.itemName)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}