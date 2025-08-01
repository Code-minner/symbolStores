"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrderService } from "@/lib/orderService";

// TypeScript interfaces
interface OrderActivity {
  message: string;
  date: string;
  type: "delivered" | "pickup" | "hub" | "transit" | "verified" | "confirmed" | "payment_submitted" | "payment_failed" | "processing" | "shipped";
  completed?: boolean;
}

interface TrackingData {
  orderId: string;
  products: number;
  orderDate: string;
  expectedDate: string;
  total: string;
  currentStage: number;
  activities: OrderActivity[];
  paymentMethod?: 'flutterwave' | 'bank_transfer';
  status?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  proofSubmitted?: boolean;
  transactionId?: string;
  reference?: string;
}

interface DashboardOrder {
  id: string;
  orderId?: string;
  userId?: string;
  status: string;
  date: string;
  total: string;
  totalAmount?: number;
  products: number;
  items: any[];
  createdAt?: any;
  orderDate?: string;
  paymentMethod?: 'flutterwave' | 'bank_transfer';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  transactionId?: string;
  reference?: string;
  paymentStatus?: string;
}

interface FormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  zipCode: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// SVG Icon Components
interface IconProps {
  size?: number;
  className?: string;
}

const User: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const Package: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const Clock: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LogOut: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const Eye: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOff: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
    />
  </svg>
);

const Menu: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const X: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Custom Alert Dialog Component
interface AlertDialogProps {
  message: string;
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-lg">
        <p className="text-gray-800 text-center mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  // 🔐 FIREBASE AUTHENTICATION HOOKS
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check if all enhanced functions are available
  const authContext = useAuth();
  const {
    signOut,
    updateProfile,
    changePassword,
    extendSession,
    getRemainingTime,
  } = authContext;

  // Component State
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [formInitialized, setFormInitialized] = useState<boolean>(false);
  const [alertDialog, setAlertDialog] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [trackingForm, setTrackingForm] = useState<{
    orderId: string;
    billingEmail: string;
  }>({
    orderId: "",
    billingEmail: "",
  });

  const [showPasswords, setShowPasswords] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    country: "Nigeria",
    state: "Lagos",
    zipCode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

  // Helper functions
  const getOrderStage = (status: string, paymentMethod?: string): number => {
    if (paymentMethod === "flutterwave") {
      switch (status.toLowerCase()) {
        case "pending":
          return 0;
        case "confirmed":
        case "completed":
          return 1;
        case "processing":
          return 2;
        case "shipped":
          return 3;
        case "delivered":
          return 4;
        default:
          return 1;
      }
    } else {
      switch (status.toLowerCase()) {
        case "pending_payment":
          return 0;
        case "payment_submitted":
          return 1;
        case "payment_verified":
        case "confirmed":
          return 2;
        case "processing":
          return 3;
        case "shipped":
          return 4;
        case "delivered":
          return 5;
        default:
          return 0;
      }
    }
  };

  const generateOrderActivities = (order: DashboardOrder): OrderActivity[] => {
    const activities: OrderActivity[] = [];

    if (order.paymentMethod === "flutterwave") {
      activities.push({
        message: `Order ${order.orderId || order.id} placed and paid successfully`,
        date: order.orderDate || order.date,
        type: "confirmed",
        completed: true,
      });

      if (order.status.toLowerCase() !== "pending") {
        activities.push({
          message: "Payment confirmed automatically via Flutterwave",
          date: order.orderDate || order.date,
          type: "verified",
          completed: true,
        });
      }
    } else {
      activities.push({
        message: `Order ${order.orderId || order.id} placed - awaiting payment`,
        date: order.orderDate || order.date,
        type: "confirmed",
        completed: true,
      });

      if (order.paymentSubmittedAt) {
        activities.push({
          message: "Proof of payment submitted for verification",
          date: order.paymentSubmittedAt.toDate?.()?.toLocaleDateString() || "Recently",
          type: "payment_submitted",
          completed: true,
        });
      }

      if (order.paymentVerifiedAt) {
        activities.push({
          message: "Payment verified and confirmed",
          date: order.paymentVerifiedAt.toDate?.()?.toLocaleDateString() || "Recently",
          type: "verified",
          completed: true,
        });
      }
    }

    if (["processing", "shipped", "delivered"].includes(order.status.toLowerCase())) {
      activities.push({
        message: "Order is being prepared for shipment",
        date: order.orderDate || order.date,
        type: "processing",
        completed: order.status.toLowerCase() !== "processing",
      });
    }

    if (["shipped", "delivered"].includes(order.status.toLowerCase())) {
      activities.push({
        message: "Order has been shipped",
        date: order.orderDate || order.date,
        type: "shipped",
        completed: order.status.toLowerCase() !== "shipped",
      });
    }

    if (order.status.toLowerCase() === "delivered") {
      activities.push({
        message: "Order has been delivered successfully",
        date: order.orderDate || order.date,
        type: "delivered",
        completed: true,
      });
    }

    return activities.reverse();
  };

  const calculateExpectedDelivery = (order: DashboardOrder): string => {
    if (order.paymentMethod === "flutterwave") {
      return "2-4 business days";
    } else {
      switch (order.status.toLowerCase()) {
        case "pending_payment":
          return "Pending payment verification";
        case "payment_submitted":
          return "Pending payment verification + 3-5 business days";
        case "payment_verified":
        case "confirmed":
          return "3-5 business days";
        case "processing":
          return "2-3 business days";
        case "shipped":
          return "1-2 business days";
        default:
          return "3-5 business days";
      }
    }
  };

  // 🔐 ENHANCED AUTHENTICATION CHECK
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/dashboard");
      return;
    }
  }, [user, userData, authLoading, router]);

  // Additional check for URL message parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");

      if (message === "account_not_found") {
        setAlertDialog({ message: "Your account was not found. Please sign in again.", visible: true });
      } else if (message === "authentication_required") {
        setAlertDialog({ message: "Authentication required. Please sign in to access your dashboard.", visible: true });
      }
    }
  }, []);

  // 📝 POPULATE FORM DATA ONLY ONCE
  useEffect(() => {
    if (userData && user && !formInitialized) {
      console.log("🔍 Initializing form data for the first time...");

      setFormData((prev) => ({
        ...prev,
        fullName:
          userData.fullName ||
          (userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : ""),
        username: userData.username || "",
        email: user.email || "",
        phone: userData.phone || "",
        country: userData.country || "Nigeria",
        state: userData.state || "Lagos",
        zipCode: userData.zipCode || "",
      }));

      setFormInitialized(true);
      console.log("✅ Form initialized with user data");
    }
  }, [userData, user, formInitialized]);

  // ✅ ENHANCED ORDER FETCH with OrderService
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.uid) {
        console.log("No authenticated user, skipping order fetch");
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      try {
        console.log("📦 Fetching orders for user:", user.uid);

        const userOrders = await OrderService.getUserOrders(user.uid);
        
        const dashboardOrders: DashboardOrder[] = userOrders.map(order => ({
          id: order.id,
          orderId: order.orderId,
          userId: order.userId,
          status: order.status,
          date: order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(), // Use createdAt for date
          total: `₦${(order.totalAmount || 0).toLocaleString()}`, // Format total
          totalAmount: order.totalAmount,
          products: Array.isArray(order.items) ? order.items.length : 1,
          items: order.items,
          createdAt: order.createdAt,
          orderDate: order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          bankDetails: order.bankDetails,
          proofOfPayment: order.proofOfPayment,
          paymentSubmittedAt: order.paymentSubmittedAt,
          paymentVerifiedAt: order.paymentVerifiedAt,
          transactionId: order.transactionId,
          reference: order.reference,
          paymentStatus: order.paymentStatus
        }));

        console.log("📦 Orders converted:", dashboardOrders.length);
        setOrders(dashboardOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user && userData && user.uid) {
      fetchOrders();
    } else {
      setOrdersLoading(false);
    }
  }, [user, userData]);

  // 🔧 Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    console.log(`🔍 Updating ${field} to:`, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // 💾 SAVE PROFILE CHANGES TO FIREBASE
  const handleSaveChanges = async (): Promise<void> => {
    if (!user || !userData) {
      setAlertDialog({ message: "User not authenticated", visible: true });
      return;
    }

    if (!updateProfile) {
      setAlertDialog({ message: "Profile update function not available. Please refresh the page.", visible: true });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        country: formData.country,
        state: formData.state,
        zipCode: formData.zipCode,
      });

      setAlertDialog({ message: "Profile updated successfully!", visible: true });
    } catch (error) {
      console.error("Error updating profile:", error);
      setAlertDialog({ message: "Failed to update profile. Please try again.", visible: true });
    } finally {
      setSaving(false);
    }
  };

  // 🔒 CHANGE PASSWORD IN FIREBASE AUTH
  const handleChangePassword = async (): Promise<void> => {
    if (formData.newPassword !== formData.confirmPassword) {
      setAlertDialog({ message: "New passwords do not match!", visible: true });
      return;
    }

    if (formData.newPassword.length < 8) {
      setAlertDialog({ message: "Password must be at least 8 characters long!", visible: true });
      return;
    }

    if (!formData.currentPassword) {
      setAlertDialog({ message: "Please enter your current password", visible: true });
      return;
    }

    if (!changePassword) {
      setAlertDialog({ message: "Change password function not available. Please refresh the page.", visible: true });
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setAlertDialog({ message: "Password changed successfully!", visible: true });
    } catch (error: any) {
      setAlertDialog({ message: error.message || "Failed to change password. Please try again.", visible: true });
    } finally {
      setChangingPassword(false);
    }
  };

  // 🚪 LOGOUT FUNCTION
  const handleLogout = async () => {
    if (!signOut) {
      setAlertDialog({ message: "Logout function not available. Please refresh the page.", visible: true });
      return;
    }

    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setAlertDialog({ message: "Failed to log out. Please try again.", visible: true });
    }
  };

  // 📦 TRACK ORDER FUNCTION
  const handleTrackOrder = async (): Promise<void> => {
    if (!trackingForm.orderId.trim() || !trackingForm.billingEmail.trim()) {
      setAlertDialog({ message: "Please fill in both Order ID and Billing Email", visible: true });
      return;
    }

    if (!user || !user.uid) {
      setAlertDialog({ message: "Please log in to track your orders", visible: true });
      return;
    }

    try {
      console.log("🔍 Tracking order:", trackingForm.orderId);

      const orderResult = await OrderService.getOrderForTracking(trackingForm.orderId);
      
      if (!orderResult.success || !orderResult.order) {
        setAlertDialog({ message: "Order not found. Please check your Order ID and billing email.", visible: true });
        return;
      }

      const order = orderResult.order;
      
      if (order.customerEmail && order.customerEmail.toLowerCase() !== trackingForm.billingEmail.toLowerCase()) {
        setAlertDialog({ message: "Order not found. Please check your Order ID and billing email.", visible: true });
        return;
      }

      const dashboardOrder: DashboardOrder = {
        id: order.id,
        orderId: order.orderId,
        userId: order.userId,
        status: order.status,
        date: order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
        total: `₦${(order.totalAmount || 0).toLocaleString()}`,
        totalAmount: order.totalAmount,
        products: Array.isArray(order.items) ? order.items.length : 1,
        items: order.items,
        createdAt: order.createdAt,
        orderDate: order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        bankDetails: order.bankDetails,
        proofOfPayment: order.proofOfPayment,
        paymentSubmittedAt: order.paymentSubmittedAt,
        paymentVerifiedAt: order.paymentVerifiedAt,
        transactionId: order.transactionId,
        reference: order.reference,
        paymentStatus: order.paymentStatus,
      };

      const enhancedTrackingData: TrackingData = {
        orderId: dashboardOrder.orderId || dashboardOrder.id,
        products: Array.isArray(dashboardOrder.items) ? dashboardOrder.items.length : 1,
        orderDate: dashboardOrder.orderDate || new Date().toLocaleDateString(),
        expectedDate: calculateExpectedDelivery(dashboardOrder),
        total: dashboardOrder.total,
        currentStage: getOrderStage(dashboardOrder.status, dashboardOrder.paymentMethod),
        activities: generateOrderActivities(dashboardOrder),
        paymentMethod: dashboardOrder.paymentMethod,
        status: dashboardOrder.status,
        bankDetails: dashboardOrder.bankDetails,
        proofSubmitted: !!dashboardOrder.proofOfPayment,
        transactionId: dashboardOrder.transactionId,
        reference: dashboardOrder.reference,
      };
      
      console.log("✅ Tracking data created:", enhancedTrackingData);
      setTrackingData(enhancedTrackingData);
      
    } catch (error) {
      console.error("Error tracking order:", error);
      setAlertDialog({ message: "Failed to track order. Please try again.", visible: true });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) { // Ensure status is uppercase for consistent matching
      case "COMPLETED":
      case "DELIVERED":
      case "CONFIRMED":
      case "PAYMENT_VERIFIED":
        return "text-green-600 bg-green-50";
      case "IN PROGRESS":
      case "PROCESSING":
      case "SHIPPED":
      case "PAYMENT_SUBMITTED":
        return "text-orange-600 bg-orange-50";
      case "CANCELLED":
      case "PENDING_PAYMENT":
      case "PAYMENT_FAILED":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleViewDetails = (order: DashboardOrder): void => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "track-order", label: "Track Order", icon: Clock },
    { id: "order-history", label: "Order History", icon: Package },
    { id: "logout", label: "Log-out", icon: LogOut },
  ];

  // 🔄 LOADING STATE
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 🚫 If not authenticated
  if (!user || (user && userData === null && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const OrderDetailsModal = () => {
    if (!showOrderDetails || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <button
              onClick={() => setShowOrderDetails(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{selectedOrder.orderId || selectedOrder.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{selectedOrder.date}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg">{selectedOrder.total}</span>
            </div>

            {selectedOrder.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedOrder.paymentMethod === 'flutterwave' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedOrder.paymentMethod === 'flutterwave' ? 'Flutterwave' : 'Bank Transfer'}
                </span>
              </div>
            )}

            <div className="pt-3 border-t">
              <span className="text-gray-600 block mb-2">Items:</span>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items?.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {typeof item === 'string' ? item : item.itemName || 'Product'}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">Order items not available</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowOrderDetails(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowOrderDetails(false);
                setActiveTab("track-order");
                setTrackingForm({
                  orderId: selectedOrder.orderId || selectedOrder.id,
                  billingEmail: formData.email,
                });
              }}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProfileTab = () => {
    const [localFormData, setLocalFormData] = useState({
      fullName: "",
      username: "",
      phone: "",
      country: "Nigeria",
      state: "Lagos",
      zipCode: "",
    });

    const localInitializedRef = useRef(false);

    const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    useEffect(() => {
      if (formData && formInitialized && !localInitializedRef.current) {
        setLocalFormData({
          fullName: formData.fullName || "",
          username: formData.username || "",
          phone: formData.phone || "",
          country: formData.country || "Nigeria",
          state: formData.state || "Lagos",
          zipCode: formData.zipCode || "",
        });
        localInitializedRef.current = true;
      }
    }, [formData, formInitialized]);

    const handleLocalSaveChanges = async () => {
      if (!user || !userData) {
        setAlertDialog({ message: "User not authenticated", visible: true });
        return;
      }

      if (!updateProfile) {
        setAlertDialog({ message: "Profile update function not available. Please refresh the page.", visible: true });
        return;
      }

      setSaving(true);
      try {
        await updateProfile({
          fullName: localFormData.fullName,
          username: localFormData.username,
          phone: localFormData.phone,
          country: localFormData.country,
          state: localFormData.state,
          zipCode: localFormData.zipCode,
        });

        setFormData((prev) => ({
          ...prev,
          ...localFormData,
        }));

        setAlertDialog({ message: "Profile updated successfully!", visible: true });
      } catch (error) {
        console.error("Error updating profile:", error);
        setAlertDialog({ message: "Failed to update profile. Please try again.", visible: true });
      } finally {
        setSaving(false);
      }
    };

    const handleLocalChangePassword = async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setAlertDialog({ message: "New passwords do not match!", visible: true });
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setAlertDialog({ message: "Password must be at least 8 characters long!", visible: true });
        return;
      }

      if (!passwordData.currentPassword) {
        setAlertDialog({ message: "Please enter your current password", visible: true });
        return;
      }

      if (!changePassword) {
        setAlertDialog({ message: "Change password function not available. Please refresh the page.", visible: true });
        return;
      }

      setChangingPassword(true);
      try {
        await changePassword(passwordData.currentPassword, passwordData.newPassword);

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setAlertDialog({ message: "Password changed successfully!", visible: true });
      } catch (error: any) {
        setAlertDialog({ message: error.message || "Failed to change password. Please try again.", visible: true });
      } finally {
        setChangingPassword(false);
      }
    };

    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">ACCOUNT SETTING</h2>

          {getRemainingTime && (() => {
            const remaining = getRemainingTime();
            const showWarning = remaining < 10 * 60 * 1000 && remaining > 0;

            if (remaining <= 0) return null;

            return (
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                showWarning
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  showWarning ? "bg-red-500 animate-pulse" : "bg-green-500"
                }`}></div>
                <span>In Session</span>
                {showWarning && extendSession && (
                  <button
                    onClick={extendSession}
                    className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                  >
                    Extend
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
                {userData?.profilePicture ? (
                  <img
                    src={userData.profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={localFormData.fullName}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={localFormData.username}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email} // Email from main formData as it's from auth
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={localFormData.phone}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={localFormData.country}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Nigeria">Nigeria</option>
                  {/* Add more countries if needed */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={localFormData.state}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={localFormData.zipCode}
                  onChange={(e) => {
                    setLocalFormData((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your zip code"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleLocalSaveChanges}
            disabled={saving}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Password Change Section */}
          <div className="pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 mt-7"
                >
                  {showPasswords.current ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 mt-7"
                >
                  {showPasswords.new ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 mt-7"
                >
                  {showPasswords.confirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLocalChangePassword}
              disabled={changingPassword}
              className={`mt-6 w-full py-3 rounded-lg text-white font-semibold transition-colors ${
                changingPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {changingPassword ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TrackOrderTab = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">TRACK YOUR ORDER</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order ID
          </label>
          <input
            type="text"
            value={trackingForm.orderId}
            onChange={(e) =>
              setTrackingForm((prev) => ({ ...prev, orderId: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter your Order ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Email
          </label>
          <input
            type="email"
            value={trackingForm.billingEmail}
            onChange={(e) =>
              setTrackingForm((prev) => ({
                ...prev,
                billingEmail: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter your billing email"
          />
        </div>
        <button
          onClick={handleTrackOrder}
          className="w-full py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
        >
          Track Order
        </button>
      </div>

      {trackingData && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-lg font-bold mb-4">Order Tracking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-600">Order ID:</p>
              <p className="font-medium">{trackingData.orderId}</p>
            </div>
            <div>
              <p className="text-gray-600">Items:</p>
              <p className="font-medium">{trackingData.products} products</p>
            </div>
            <div>
              <p className="text-gray-600">Order Date:</p>
              <p className="font-medium">{trackingData.orderDate}</p>
            </div>
            <div>
              <p className="text-gray-600">Expected Delivery:</p>
              <p className="font-medium">{trackingData.expectedDate}</p>
            </div>
            <div>
              <p className="text-gray-600">Total:</p>
              <p className="font-bold text-lg">{trackingData.total}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Method:</p>
              <p className="font-medium capitalize">{trackingData.paymentMethod?.replace('_', ' ')}</p>
            </div>
            {trackingData.transactionId && (
              <div>
                <p className="text-gray-600">Transaction ID:</p>
                <p className="font-medium">{trackingData.transactionId}</p>
              </div>
            )}
            {trackingData.reference && (
              <div>
                <p className="text-gray-600">Reference:</p>
                <p className="font-medium">{trackingData.reference}</p>
              </div>
            )}
          </div>

          <h4 className="font-semibold text-gray-700 mb-3">Order Progress:</h4>
          <div className="relative flex flex-col items-start space-y-4">
            {trackingData.activities.map((activity, index) => (
              <div key={index} className="flex items-start w-full">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-4 h-4 rounded-full ${activity.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  {index < trackingData.activities.length - 1 && (
                    <div className={`w-0.5 flex-grow ${activity.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`font-medium ${activity.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-400">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const OrderHistoryTab = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">ORDER HISTORY</h2>
      {ordersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You haven't placed any orders yet.</p>
          <p className="mt-2">Start shopping to see your order history here!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId || order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 border border-gray-300 rounded-lg flex items-center justify-between w-full bg-white text-gray-700"
            >
              <span>{menuItems.find(item => item.id === activeTab)?.label || 'Menu'}</span>
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div
            className={`w-full lg:w-1/4 bg-white rounded-lg p-6 shadow-md lg:block ${
              showMobileMenu ? "block" : "hidden"
            }`}
          >
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowMobileMenu(false); // Close menu on item click
                        if (item.id === "logout") {
                          handleLogout();
                        }
                      }}
                      className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === item.id
                          ? "bg-red-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 ${
                          activeTab === item.id ? "text-white" : "text-gray-500"
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "track-order" && <TrackOrderTab />}
            {activeTab === "order-history" && <OrderHistoryTab />}
          </div>
        </div>
      </main>
      <Footer />
      {alertDialog.visible && (
        <AlertDialog
          message={alertDialog.message}
          onClose={() => setAlertDialog({ ...alertDialog, visible: false })}
        />
      )}
      <OrderDetailsModal />
    </div>
  );
};

export default UserDashboard;
