// src/lib/OrdersContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, setDoc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

interface OrderItem {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  amount: number;
  originalPrice?: number;
  imageURL: string;
  slug: string;
  sku: string;
  warranty?: string;
  quantity: number;
  totalPrice: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  tax: number;
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: ShippingAddress;
  orderDate: number;
  estimatedDelivery?: number;
  deliveredDate?: number;
  trackingNumber?: string;
  notes?: string;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'orderDate'>) => Promise<string>;
  getOrderById: (orderId: string) => Order | null;
  getUserOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  reorderItems: (orderId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, userData } = useAuth();

  // Load orders when user changes
  useEffect(() => {
    if (user && userData) {
      loadUserOrders();
    } else {
      setOrders([]);
    }
  }, [user, userData]);

  // Generate unique order number
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  };

  // Load user orders from Firebase
  const loadUserOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('orderDate', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      const userOrders: Order[] = [];

      querySnapshot.forEach((doc) => {
        userOrders.push({
          id: doc.id,
          ...doc.data()
        } as Order);
      });

      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user orders (manual refresh)
  const getUserOrders = async (): Promise<Order[]> => {
    if (!user) return [];

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('orderDate', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      const userOrders: Order[] = [];

      querySnapshot.forEach((doc) => {
        userOrders.push({
          id: doc.id,
          ...doc.data()
        } as Order);
      });

      setOrders(userOrders);
      return userOrders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setError('Failed to fetch orders');
      return [];
    }
  };

  // Add new order
  const addOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'orderDate'>): Promise<string> => {
    if (!user) throw new Error('User must be logged in to create orders');

    setError(null);

    try {
      const newOrder: Omit<Order, 'id'> = {
        ...orderData,
        orderNumber: generateOrderNumber(),
        orderDate: Date.now(),
        userId: user.uid
      };

      // Add order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), newOrder);
      
      // Add order to local state
      const completeOrder: Order = {
        id: orderRef.id,
        ...newOrder
      };
      
      setOrders(prev => [completeOrder, ...prev]);

      // Update user's order history in user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        lastOrderDate: Date.now(),
        totalOrders: orders.length + 1,
        updatedAt: Date.now()
      });

      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order');
      throw error;
    }
  };

  // Get order by ID
  const getOrderById = (orderId: string): Order | null => {
    return orders.find(order => order.id === orderId) || null;
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!user) return;

    setError(null);

    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {
        status,
        updatedAt: Date.now()
      };

      // Add delivered date if status is delivered
      if (status === 'delivered') {
        updateData.deliveredDate = Date.now();
      }

      await updateDoc(orderRef, updateData);

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, deliveredDate: status === 'delivered' ? Date.now() : order.deliveredDate }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  // Reorder items (add to cart)
  const reorderItems = async (orderId: string) => {
    const order = getOrderById(orderId);
    if (!order) {
      setError('Order not found');
      return;
    }

    try {
      // This would integrate with your cart context
      // You'll need to import useCart and add items to cart
      console.log('Reordering items from order:', orderId, order.items);
      
      // Example implementation:
      // const { addToCart } = useCart();
      // order.items.forEach(item => {
      //   for (let i = 0; i < item.quantity; i++) {
      //     addToCart(item);
      //   }
      // });
      
      // For now, we'll just log it
      alert(`Reordering ${order.items.length} items from order ${order.orderNumber}`);
    } catch (error) {
      console.error('Error reordering items:', error);
      setError('Failed to reorder items');
    }
  };

  const value = {
    orders,
    addOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    reorderItems,
    isLoading,
    error,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};