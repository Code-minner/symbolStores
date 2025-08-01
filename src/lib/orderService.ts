// src/lib/orderService.ts - Enhanced for Both Payment Methods
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Order {
  id: string;
  orderId: string;
  userId?: string;
  status: string;
  date: string;
  total: string;
  totalAmount: number;
  products: number;
  items: any[];
  paymentMethod: 'flutterwave' | 'bank_transfer';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: any;
  orderDate?: string;
  
  // Bank transfer specific fields
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  proofOfPayment?: {
    filename: string;
    fileUrl: string;
    uploadedAt: any;
  };
  paymentSubmittedAt?: any;
  paymentVerifiedAt?: any;
  
  // Flutterwave specific fields
  transactionId?: string;
  reference?: string;
  paymentStatus?: string;
}

// Types for Flutterwave payment completion
interface CartItem {
  id: string;
  itemName: string;
  quantity: number;
  amount: number;
  imageURL?: string;
  sku?: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface FlutterwavePaymentData {
  id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone_number: string;
  };
  meta?: {
    items_summary?: string;
    items_count?: string;
    [key: string]: any;
  };
}

interface OrderResult {
  success: boolean;
  orderId?: string;
  order?: {
    orderStatus: string;
    emailSent: boolean;
    adminEmailSent: boolean;
  };
  error?: string;
}

export class OrderService {
  /**
   * Complete Flutterwave payment and create order
   */
  static async completeFlutterwavePayment(
    paymentData: FlutterwavePaymentData,
    cartItems: CartItem[],
    customerInfo: CustomerData,
    userId?: string
  ): Promise<OrderResult> {
    try {
      const orderId = `FLW-${paymentData.tx_ref}`;
      
      // Prepare order data for Firestore
      const orderData = {
        orderId,
        userId: userId || null,
        status: 'confirmed',
        totalAmount: paymentData.amount,
        amount: paymentData.amount, // For backward compatibility
        currency: paymentData.currency,
        items: cartItems,
        paymentMethod: 'flutterwave',
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || '',
        transactionId: paymentData.id.toString(),
        reference: paymentData.tx_ref,
        paymentStatus: 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save order to Firestore
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('✅ Order saved to Firestore with ID:', docRef.id);
      
      // Send confirmation emails
      let emailSent = false;
      let adminEmailSent = false;

      try {
        const { EmailService } = await import('@/lib/email');
        
        const emailOrderData = {
          orderId,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          amount: paymentData.amount,
          items: cartItems.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            amount: item.amount
          })),
          bankDetails: {
            accountName: 'N/A',
            accountNumber: 'N/A',
            bankName: 'Flutterwave Payment',
          },
        };

        await EmailService.sendOrderConfirmation(emailOrderData);
        emailSent = true;
        console.log('✅ Order confirmation email sent');
        
        // ✅ FIXED: Use existing sendAdminNotification with correct parameters
        try {
          await EmailService.sendAdminNotification({
            orderId,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone, // ✅ ADDED: Missing customerPhone field
            amount: paymentData.amount,
            items: cartItems.map(item => ({
              itemName: item.itemName,
              quantity: item.quantity,
              amount: item.amount
            })),
            bankDetails: {
              accountName: 'N/A',
              accountNumber: 'N/A',
              bankName: 'Flutterwave Payment',
            },
          });
          adminEmailSent = true;
          console.log('✅ Admin notification email sent');
        } catch (adminEmailError) {
          console.error('❌ Failed to send admin email:', adminEmailError);
        }
        
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
      }

      return {
        success: true,
        orderId,
        order: {
          orderStatus: 'confirmed',
          emailSent,
          adminEmailSent
        }
      };
      
    } catch (error) {
      console.error('❌ Error completing Flutterwave payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  /**
   * Get all orders for a user from both collections
   */
/**
 * Get all orders for a user from both collections
 */
static async getUserOrders(userId: string, userEmail?: string): Promise<Order[]> {
  try {
    const orders: Order[] = [];

    // 1. Get Flutterwave orders
    try {
      const flutterwaveQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const flutterwaveSnapshot = await getDocs(flutterwaveQuery);
      
      flutterwaveSnapshot.docs.forEach(doc => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderId: data.orderId || doc.id,
          userId: data.userId,
          status: data.status || 'completed',
          date: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
          total: `₦${(data.totalAmount || data.amount || 0).toLocaleString()}`,
          totalAmount: data.totalAmount || data.amount || 0,
          products: Array.isArray(data.items) ? data.items.length : 1,
          items: data.items || [],
          paymentMethod: 'flutterwave',
          customerName: data.customerName || data.name,
          customerEmail: data.customerEmail || data.email,
          createdAt: data.createdAt,
          orderDate: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
          transactionId: data.transactionId,
          reference: data.reference,
          paymentStatus: data.paymentStatus || 'completed'
        });
      });
      
      console.log(`📦 Found ${flutterwaveSnapshot.size} Flutterwave orders for user ${userId}`);
    } catch (error) {
      console.error('Error fetching Flutterwave orders:', error);
    }

    // 2. Get Bank Transfer orders - FIXED: Use userEmail instead of userId
    if (userEmail) {
      try {
        const bankTransferQuery = query(
          collection(db, 'bankTransferOrders'),
          where('customerEmail', '==', userEmail), // ✅ FIXED: Use userEmail
          orderBy('createdAt', 'desc')
        );
        
        const bankTransferSnapshot = await getDocs(bankTransferQuery);
        
        bankTransferSnapshot.docs.forEach(doc => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            orderId: data.orderId || doc.id,
            status: this.mapBankTransferStatus(data.status),
            date: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            total: `₦${(data.amount || 0).toLocaleString()}`,
            totalAmount: data.amount || 0,
            products: Array.isArray(data.items) ? data.items.length : 1,
            items: data.items || [],
            paymentMethod: 'bank_transfer',
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            createdAt: data.createdAt,
            orderDate: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            bankDetails: data.bankDetails,
            proofOfPayment: data.proofOfPayment,
            paymentSubmittedAt: data.paymentSubmittedAt,
            paymentVerifiedAt: data.paymentVerifiedAt
          });
        });
        
        console.log(`🏦 Found ${bankTransferSnapshot.size} Bank Transfer orders for user ${userEmail}`);
      } catch (error) {
        console.error('Error fetching Bank Transfer orders:', error);
      }
    } else {
      console.log('⚠️ No user email provided, skipping bank transfer orders');
    }

    // 3. Sort all orders by creation date (newest first)
    orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.date);
      const dateB = b.createdAt?.toDate?.() || new Date(b.date);
      return dateB - dateA;
    });

    console.log(`✅ Total orders found: ${orders.length} (Flutterwave + Bank Transfer)`);
    return orders;
    
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return [];
  }
}

  /**
   * Get order for tracking by order ID from both collections
   */
  static async getOrderForTracking(orderId: string): Promise<{success: boolean, order?: Order, error?: string}> {
    try {
      console.log(`🔍 Tracking order: ${orderId}`);

      // 1. Check Flutterwave orders first
      try {
        const flutterwaveQuery = query(
          collection(db, 'orders'),
          where('orderId', '==', orderId),
          limit(1)
        );
        
        const flutterwaveSnapshot = await getDocs(flutterwaveQuery);
        
        if (!flutterwaveSnapshot.empty) {
          const doc = flutterwaveSnapshot.docs[0];
          const data = doc.data();
          
          const order: Order = {
            id: doc.id,
            orderId: data.orderId || doc.id,
            userId: data.userId,
            status: data.status || 'completed',
            date: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            total: `₦${(data.totalAmount || data.amount || 0).toLocaleString()}`,
            totalAmount: data.totalAmount || data.amount || 0,
            products: Array.isArray(data.items) ? data.items.length : 1,
            items: data.items || [],
            paymentMethod: 'flutterwave',
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            createdAt: data.createdAt,
            orderDate: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            transactionId: data.transactionId,
            reference: data.reference,
            paymentStatus: data.paymentStatus || 'completed'
          };
          
          console.log(`✅ Found Flutterwave order: ${orderId}`);
          return { success: true, order };
        }
      } catch (error) {
        console.error('Error checking Flutterwave orders:', error);
      }

      // 2. Check Bank Transfer orders
      try {
        const bankTransferQuery = query(
          collection(db, 'bankTransferOrders'),
          where('orderId', '==', orderId),
          limit(1)
        );
        
        const bankTransferSnapshot = await getDocs(bankTransferQuery);
        
        if (!bankTransferSnapshot.empty) {
          const doc = bankTransferSnapshot.docs[0];
          const data = doc.data();
          
          const order: Order = {
            id: doc.id,
            orderId: data.orderId || doc.id,
            status: data.status || 'pending_payment',
            date: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            total: `₦${(data.amount || 0).toLocaleString()}`,
            totalAmount: data.amount || 0,
            products: Array.isArray(data.items) ? data.items.length : 1,
            items: data.items || [],
            paymentMethod: 'bank_transfer',
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            createdAt: data.createdAt,
            orderDate: data.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
            bankDetails: data.bankDetails,
            proofOfPayment: data.proofOfPayment,
            paymentSubmittedAt: data.paymentSubmittedAt,
            paymentVerifiedAt: data.paymentVerifiedAt
          };
          
          console.log(`✅ Found Bank Transfer order: ${orderId}`);
          return { success: true, order };
        }
      } catch (error) {
        console.error('Error checking Bank Transfer orders:', error);
      }

      // 3. Order not found in either collection
      console.log(`❌ Order not found: ${orderId}`);
      return { success: false, error: 'Order not found' };
      
    } catch (error) {
      console.error('Error in getOrderForTracking:', error);
      return { success: false, error: 'Failed to track order' };
    }
  }

  /**
   * Map bank transfer status to user-friendly status
   */
  private static mapBankTransferStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending_payment': 'PENDING PAYMENT',
      'payment_submitted': 'PAYMENT REVIEW',
      'payment_verified': 'CONFIRMED',
      'payment_failed': 'PAYMENT FAILED',
      'processing': 'PROCESSING',
      'shipped': 'SHIPPED',
      'delivered': 'DELIVERED',
      'completed': 'COMPLETED'
    };
    
    return statusMap[status] || status.toUpperCase();
  }

  /**
   * Get order stage for progress tracking
   */
  static getOrderStage(order: Order): number {
    if (order.paymentMethod === 'flutterwave') {
      // Flutterwave orders are usually completed when created
      switch (order.status.toLowerCase()) {
        case 'pending': return 0;
        case 'confirmed': 
        case 'completed': return 1;
        case 'processing': return 2;
        case 'shipped': return 3;
        case 'delivered': return 4;
        default: return 1;
      }
    } else {
      // Bank transfer orders have different stages
      switch (order.status.toLowerCase()) {
        case 'pending_payment': return 0;
        case 'payment_submitted': return 1;
        case 'payment_verified': 
        case 'confirmed': return 2;
        case 'processing': return 3;
        case 'shipped': return 4;
        case 'delivered': return 5;
        default: return 0;
      }
    }
  }

  /**
   * Update order status (for admin use)
   */
  static async updateOrderStatus(
    orderId: string, 
    updateData: { 
      orderStatus: string; 
      updatedAt: any;
      trackingNumber?: string;
      shippedAt?: any;
      deliveredAt?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check both collections for the order
      const collections = ['orders', 'bankTransferOrders'];
      
      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('orderId', '==', orderId),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const docRef = doc(db, collectionName, snapshot.docs[0].id);
          
          // Prepare update data
          const updatePayload: any = {
            status: updateData.orderStatus,
            updatedAt: serverTimestamp()
          };
          
          // Add optional fields if provided
          if (updateData.trackingNumber) {
            updatePayload.trackingNumber = updateData.trackingNumber;
          }
          
          if (updateData.orderStatus === 'shipped' && updateData.shippedAt) {
            updatePayload.shippedAt = updateData.shippedAt;
          }
          
          if (updateData.orderStatus === 'delivered' && updateData.deliveredAt) {
            updatePayload.deliveredAt = updateData.deliveredAt;
            updatePayload.completedAt = updateData.deliveredAt;
          }
          
          // Update the document
          await updateDoc(docRef, updatePayload);
          
          console.log(`✅ Order ${orderId} status updated to ${updateData.orderStatus}`);
          return { success: true };
        }
      }
      
      return { success: false, error: 'Order not found' };
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update order' 
      };
    }
  }

  /**
   * Generate activities based on order type and status
   */
  static generateOrderActivities(order: Order): Array<{
    type: string;
    message: string;
    date: string;
    completed: boolean;
  }> {
    const activities = [];

    if (order.paymentMethod === 'flutterwave') {
      // Flutterwave order activities
      activities.push({
        type: 'confirmed',
        message: `Order ${order.orderId} placed and paid successfully`,
        date: order.orderDate || order.date,
        completed: true,
      });

      if (order.status.toLowerCase() !== 'pending') {
        activities.push({
          type: 'verified',
          message: 'Payment confirmed automatically via Flutterwave',
          date: order.orderDate || order.date,
          completed: true,
        });
      }
    } else {
      // Bank transfer order activities
      activities.push({
        type: 'confirmed',
        message: `Order ${order.orderId} placed - awaiting payment`,
        date: order.orderDate || order.date,
        completed: true,
      });

      if (order.paymentSubmittedAt) {
        activities.push({
          type: 'payment_submitted',
          message: 'Proof of payment submitted for verification',
          date: order.paymentSubmittedAt.toDate?.()?.toLocaleDateString() || 'Recently',
          completed: true,
        });
      }

      if (order.paymentVerifiedAt) {
        activities.push({
          type: 'verified',
          message: 'Payment verified and confirmed',
          date: order.paymentVerifiedAt.toDate?.()?.toLocaleDateString() || 'Recently',
          completed: true,
        });
      }
    }

    // Common activities for both payment methods
    if (['processing', 'shipped', 'delivered'].includes(order.status.toLowerCase())) {
      activities.push({
        type: 'processing',
        message: 'Order is being prepared for shipment',
        date: order.orderDate || order.date,
        completed: order.status.toLowerCase() !== 'processing',
      });
    }

    if (['shipped', 'delivered'].includes(order.status.toLowerCase())) {
      activities.push({
        type: 'shipped',
        message: 'Order has been shipped',
        date: order.orderDate || order.date,
        completed: order.status.toLowerCase() !== 'shipped',
      });
    }

    if (order.status.toLowerCase() === 'delivered') {
      activities.push({
        type: 'delivered',
        message: 'Order has been delivered successfully',
        date: order.orderDate || order.date,
        completed: true,
      });
    }

    return activities.reverse(); // Show most recent first
  }
}