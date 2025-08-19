"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrderService } from "@/lib/orderService";

// TypeScript interfaces
interface OrderActivity {
  message: string;
  date: string;
  type:
    | "delivered"
    | "pickup"
    | "hub"
    | "transit"
    | "verified"
    | "confirmed"
    | "payment_submitted"
    | "payment_failed"
    | "processing"
    | "shipped";
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
  paymentMethod?: "flutterwave" | "bank_transfer";
  status?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  proofSubmitted?: boolean;
  transactionId?: string;
  reference?: string;
  deliverySteps?: string[];
  businessDaysRemaining?: number;
  isDelivered?: boolean;
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
  paymentMethod?: "flutterwave" | "bank_transfer";
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

const Calendar: React.FC<IconProps> = ({ size = 20, className = "" }) => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const Refresh: React.FC<IconProps> = ({ size = 20, className = "" }) => (
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
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
  // Authentication hooks
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

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
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(
    null
  );
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [formInitialized, setFormInitialized] = useState<boolean>(false);
  const [alertDialog, setAlertDialog] = useState<{
    message: string;
    visible: boolean;
  }>({ message: "", visible: false });

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
    const normalizedStatus = status.toLowerCase();

    if (paymentMethod === "flutterwave") {
      switch (normalizedStatus) {
        case "pending":
          return 0;
        case "confirmed":
        case "payment_verified":
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
      switch (normalizedStatus) {
        case "pending":
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

  const generateEnhancedOrderActivities = (
    order: DashboardOrder
  ): OrderActivity[] => {
    const activities: OrderActivity[] = [];
    const currentDate = new Date().toLocaleDateString();
    const orderDate = order.orderDate || currentDate;

    if (order.paymentMethod === "flutterwave") {
      activities.push({
        message: `Order ${order.orderId} placed successfully`,
        date: orderDate,
        type: "confirmed",
        completed: true,
      });

      activities.push({
        message: "Payment confirmed via Flutterwave",
        date: orderDate,
        type: "verified",
        completed: true,
      });

      if (
        ["processing", "shipped", "delivered"].includes(
          order.status.toLowerCase()
        )
      ) {
        activities.push({
          message: "Order is being prepared for shipment",
          date: orderDate,
          type: "processing",
          completed: order.status.toLowerCase() !== "processing",
        });
      }

      if (["shipped", "delivered"].includes(order.status.toLowerCase())) {
        activities.push({
          message: "Order has been shipped",
          date: orderDate,
          type: "shipped",
          completed: order.status.toLowerCase() !== "shipped",
        });
      }

      if (order.status.toLowerCase() === "delivered") {
        activities.push({
          message: "Order delivered successfully",
          date: orderDate,
          type: "delivered",
          completed: true,
        });
      }
    } else {
      activities.push({
        message: `Order ${order.orderId} placed - awaiting payment`,
        date: orderDate,
        type: "confirmed",
        completed: true,
      });

      if (order.reference || order.transactionId) {
        activities.push({
          message: "Payment proof submitted for verification",
          date: orderDate,
          type: "payment_submitted",
          completed: true,
        });
      }

      if (order.paymentVerifiedAt || order.status === "confirmed") {
        const verifiedDate =
          order.paymentVerifiedAt?.toDate?.()?.toLocaleDateString() ||
          orderDate;
        activities.push({
          message: "Payment verified and confirmed by admin",
          date: verifiedDate,
          type: "verified",
          completed: true,
        });
      }

      if (
        ["processing", "shipped", "delivered"].includes(
          order.status.toLowerCase()
        )
      ) {
        activities.push({
          message: "Order is being prepared for shipment",
          date: orderDate,
          type: "processing",
          completed: order.status.toLowerCase() !== "processing",
        });
      }

      if (["shipped", "delivered"].includes(order.status.toLowerCase())) {
        activities.push({
          message: "Order has been shipped",
          date: orderDate,
          type: "shipped",
          completed: order.status.toLowerCase() !== "shipped",
        });
      }

      if (order.status.toLowerCase() === "delivered") {
        activities.push({
          message: "Order delivered successfully",
          date: orderDate,
          type: "delivered",
          completed: true,
        });
      }
    }

    return activities.reverse();
  };

  // Business days calculator (excludes weekends)
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  };

  // Check if date is a Nigerian holiday
  const isHoliday = (date: Date): boolean => {
    const holidays = [
      "2025-01-01", // New Year
      "2025-05-01", // Workers' Day
      "2025-10-01", // Independence Day
      "2025-12-25", // Christmas
      "2025-12-26", // Boxing Day
    ];

    const dateString = date.toISOString().split("T")[0];
    return holidays.includes(dateString);
  };

  // Enhanced delivery calculator
  const calculateEnhancedDelivery = (order: DashboardOrder) => {
    const now = new Date();

    // Safely get order date with fallback
    let orderDate = now;
    if (order.createdAt?.toDate) {
      orderDate = order.createdAt.toDate();
    } else if (order.orderDate) {
      orderDate = new Date(order.orderDate);
    } else if (order.date) {
      orderDate = new Date(order.date);
    }

    // Processing times based on business logic
    const processingTimes = {
      paymentVerification: { min: 1, max: 3 },
      orderProcessing: {
        flutterwave: { min: 1, max: 2 },
        bankTransfer: { min: 1, max: 2 },
      },
      shipping: {
        lagos: { min: 1, max: 2 },
        nearbyStates: { min: 2, max: 3 },
        farStates: { min: 3, max: 5 },
        default: { min: 2, max: 4 },
      },
    };

    let estimatedDays = 0;
    let deliverySteps: string[] = [];

    // Calculate based on current status and payment method
    if (order.paymentMethod === "flutterwave") {
      switch (order.status?.toLowerCase()) {
        case "pending":
        case "confirmed":
          estimatedDays =
            processingTimes.orderProcessing.flutterwave.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
          break;

        case "processing":
          estimatedDays = processingTimes.shipping.default.max;
          deliverySteps = ["Shipping: 2-4 business days"];
          break;

        case "shipped":
          estimatedDays = 1;
          deliverySteps = ["Delivery: 1 business day"];
          break;

        case "delivered":
          return {
            status: "delivered",
            message: "Order delivered",
            estimatedDate: orderDate.toLocaleDateString(),
            deliverySteps: ["✅ Order delivered successfully"],
            isDelivered: true,
            businessDaysRemaining: 0,
          };

        default:
          estimatedDays =
            processingTimes.orderProcessing.flutterwave.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
      }
    } else {
      // Bank Transfer flow
      switch (order.status?.toLowerCase()) {
        case "pending":
        case "pending_payment":
          estimatedDays =
            processingTimes.paymentVerification.max +
            processingTimes.orderProcessing.bankTransfer.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Payment verification: 1-3 business days",
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
          break;

        case "payment_submitted":
          estimatedDays =
            processingTimes.paymentVerification.max +
            processingTimes.orderProcessing.bankTransfer.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Payment verification: 1-3 business days (in progress)",
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
          break;

        case "payment_verified":
        case "confirmed":
          estimatedDays =
            processingTimes.orderProcessing.bankTransfer.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
          break;

        case "processing":
          estimatedDays = processingTimes.shipping.default.max;
          deliverySteps = ["Shipping: 2-4 business days"];
          break;

        case "shipped":
          estimatedDays = 1;
          deliverySteps = ["Delivery: 1 business day"];
          break;

        case "delivered":
          return {
            status: "delivered",
            message: "Order delivered",
            estimatedDate: orderDate.toLocaleDateString(),
            deliverySteps: ["✅ Order delivered successfully"],
            isDelivered: true,
            businessDaysRemaining: 0,
          };

        default:
          estimatedDays =
            processingTimes.paymentVerification.max +
            processingTimes.orderProcessing.bankTransfer.max +
            processingTimes.shipping.default.max;
          deliverySteps = [
            "Payment verification: 1-3 business days",
            "Order processing: 1-2 business days",
            "Shipping: 2-4 business days",
          ];
      }
    }

    // Location-based adjustment
    let locationAdjustment = 0;
    if (order.customerEmail) {
      const email = (order.customerEmail || "").toLowerCase();
      if (email.includes("lagos")) {
        locationAdjustment = -1; // 1 day faster for Lagos
      }
    }

    // Calculate delivery date
    let estimatedDeliveryDate = addBusinessDays(
      now,
      estimatedDays + locationAdjustment
    );

    // Adjust for holidays/weekends
    if (
      estimatedDeliveryDate.getDay() === 0 ||
      estimatedDeliveryDate.getDay() === 6 ||
      isHoliday(estimatedDeliveryDate)
    ) {
      estimatedDeliveryDate = addBusinessDays(estimatedDeliveryDate, 1);
    }

    return {
      status: order.status?.toLowerCase() || "pending",
      message: `Estimated delivery: ${estimatedDeliveryDate.toLocaleDateString()}`,
      estimatedDate: estimatedDeliveryDate.toLocaleDateString(),
      businessDaysRemaining: Math.max(0, estimatedDays + locationAdjustment),
      deliverySteps: deliverySteps,
      isDelivered: false,
    };
  };

  const calculateExpectedDelivery = (order: DashboardOrder): string => {
    const result = calculateEnhancedDelivery(order);
    return result.message;
  };

  useEffect(() => {
    // Check URL parameters on component mount
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");

      // Valid tab options
      const validTabs = ["profile", "track-order", "order-history"];

      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/dashboard");
      return;
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");

      if (message === "account_not_found") {
        setAlertDialog({
          message: "Your account was not found. Please sign in again.",
          visible: true,
        });
      } else if (message === "authentication_required") {
        setAlertDialog({
          message:
            "Authentication required. Please sign in to access your dashboard.",
          visible: true,
        });
      }
    }
  }, []);

  // Populate form data
  useEffect(() => {
    if (userData && user && !formInitialized) {
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
    }
  }, [userData, user, formInitialized]);

  // Enhanced order fetch - searches both collections
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.uid) {
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      try {
        let allOrders: any[] = [];

        // Try OrderService first
        if (typeof OrderService !== "undefined" && OrderService.getUserOrders) {
          try {
            const serviceOrders = await OrderService.getUserOrders(
              user.uid,
              user.email || undefined
            );
            if (serviceOrders && serviceOrders.length > 0) {
              allOrders = [...allOrders, ...serviceOrders];
            }
          } catch (error) {
            console.log("OrderService failed, trying direct queries...");
          }
        }

        // Collections to search
        const collections = ["orders", "bankTransferOrders"];

        // Query fields to try
        const queryFields = [
          { field: "userId", value: user.uid },
          { field: "customerEmail", value: user.email || "" },
          { field: "userEmail", value: user.email || "" },
          { field: "email", value: user.email || "" },
        ];

        // Search both collections
        for (const collectionName of collections) {
          for (const queryField of queryFields) {
            if (!queryField.value) continue;

            try {
              const q = query(
                collection(db, collectionName),
                where(queryField.field, "==", queryField.value)
              );
              const snapshot = await getDocs(q);

              snapshot.docs.forEach((doc) => {
                const order = {
                  id: doc.id,
                  ...doc.data(),
                  _collection: collectionName,
                };
                if (!allOrders.find((existing) => existing.id === order.id)) {
                  allOrders.push(order);
                }
              });
            } catch (queryError) {
              console.log(
                `Query failed for ${collectionName}.${queryField.field}:`,
                queryError
              );
            }
          }
        }

        // Convert to dashboard orders
        const dashboardOrders: DashboardOrder[] = allOrders.map(
          (order: any) => {
            const totalAmount =
              order.amount ||
              order.totalAmount ||
              order.expectedFinalTotal ||
              order.total ||
              0;

            let orderDate = new Date().toLocaleDateString();
            if (order.createdAt) {
              try {
                if (order.createdAt.toDate) {
                  orderDate = order.createdAt.toDate().toLocaleDateString();
                } else if (order.createdAt instanceof Date) {
                  orderDate = order.createdAt.toLocaleDateString();
                } else if (typeof order.createdAt === "string") {
                  orderDate = new Date(order.createdAt).toLocaleDateString();
                }
              } catch (error) {
                // Use current date if parsing fails
                orderDate = new Date().toLocaleDateString();
              }
            } else if (order.orderDate) {
              try {
                orderDate = new Date(order.orderDate).toLocaleDateString();
              } catch (error) {
                orderDate = order.orderDate; // Keep as string if it's already formatted
              }
            } else if (order.date) {
              try {
                orderDate = new Date(order.date).toLocaleDateString();
              } catch (error) {
                orderDate = order.date; // Keep as string if it's already formatted
              }
            }

            return {
              id: order.id,
              orderId: order.orderId || order.orderNumber || order.id,
              userId: order.userId || user.uid,
              status: order.status || order.orderStatus || "pending",
              date: orderDate,
              total:
                typeof totalAmount === "number"
                  ? `₦${totalAmount.toLocaleString()}`
                  : totalAmount,
              totalAmount:
                typeof totalAmount === "string"
                  ? parseFloat(totalAmount.replace(/[₦,]/g, ""))
                  : totalAmount,
              products: Array.isArray(order.items)
                ? order.items.length
                : order.itemCount || order.products || 1,
              items: order.items || order.products || [],
              createdAt: order.createdAt,
              orderDate: orderDate,
              // Determine payment method from collection or field
              paymentMethod:
                order.paymentMethod ||
                order.payment_method ||
                (order._collection === "bankTransferOrders"
                  ? "bank_transfer"
                  : "flutterwave"),
              customerName:
                order.customerName ||
                order.customer_name ||
                userData?.fullName ||
                "",
              customerEmail:
                order.customerEmail ||
                order.userEmail ||
                order.email ||
                user.email ||
                "",
              customerPhone:
                order.customerPhone ||
                order.customer_phone ||
                userData?.phone ||
                "",
              bankDetails: order.bankDetails || order.bank_details,
              proofOfPayment: order.proofOfPayment || order.proof_of_payment,
              paymentSubmittedAt:
                order.paymentSubmittedAt || order.payment_submitted_at,
              paymentVerifiedAt:
                order.paymentVerifiedAt ||
                order.payment_verified_at ||
                (order.verifiedAt
                  ? { toDate: () => new Date(order.verifiedAt) }
                  : undefined),
              transactionId: order.transactionId || order.transaction_id,
              reference:
                order.reference ||
                order.transactionReference ||
                order.transaction_reference,
              paymentStatus:
                order.paymentStatus || order.payment_status || order.status,
            };
          }
        );

        setOrders(dashboardOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setAlertDialog({
          message: `Error loading orders: ${error}`,
          visible: true,
        });
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user && user.uid) {
      fetchOrders();
    } else {
      setOrdersLoading(false);
    }
  }, [user, userData]);

  // Helper functions
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveChanges = async (): Promise<void> => {
    if (!user || !userData || !updateProfile) {
      setAlertDialog({
        message: "Profile update not available",
        visible: true,
      });
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

      setAlertDialog({
        message: "Profile updated successfully!",
        visible: true,
      });
    } catch (error) {
      setAlertDialog({
        message: "Failed to update profile. Please try again.",
        visible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (formData.newPassword !== formData.confirmPassword) {
      setAlertDialog({ message: "New passwords do not match!", visible: true });
      return;
    }

    if (formData.newPassword.length < 8) {
      setAlertDialog({
        message: "Password must be at least 8 characters long!",
        visible: true,
      });
      return;
    }

    if (!formData.currentPassword) {
      setAlertDialog({
        message: "Please enter your current password",
        visible: true,
      });
      return;
    }

    if (!changePassword) {
      setAlertDialog({
        message: "Change password function not available",
        visible: true,
      });
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
      setAlertDialog({
        message: "Password changed successfully!",
        visible: true,
      });
    } catch (error: any) {
      setAlertDialog({
        message: error.message || "Failed to change password",
        visible: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (!signOut) {
      setAlertDialog({
        message: "Logout function not available",
        visible: true,
      });
      return;
    }

    try {
      await signOut();
      router.push("/");
    } catch (error) {
      setAlertDialog({
        message: "Failed to log out. Please try again.",
        visible: true,
      });
    }
  };

  const handleTrackOrder = async (): Promise<void> => {
    if (!trackingForm.orderId.trim() || !trackingForm.billingEmail.trim()) {
      setAlertDialog({
        message: "Please fill in both Order ID and Billing Email",
        visible: true,
      });
      return;
    }

    try {
      let orderResult: { success: boolean; order?: any } | null = null;

      // Try OrderService first
      if (
        typeof OrderService !== "undefined" &&
        OrderService.getOrderForTracking
      ) {
        try {
          orderResult = await OrderService.getOrderForTracking(
            trackingForm.orderId
          );
        } catch (error) {
          console.log("OrderService tracking failed");
        }
      }

      // Fallback to direct query - search both collections
      if (!orderResult?.success) {
        const collections = ["orders", "bankTransferOrders"];

        for (const collectionName of collections) {
          try {
            // Try by orderId field
            const orderQuery = query(
              collection(db, collectionName),
              where("orderId", "==", trackingForm.orderId)
            );
            const orderSnapshot = await getDocs(orderQuery);

            if (!orderSnapshot.empty) {
              const orderDoc = orderSnapshot.docs[0];
              orderResult = {
                success: true,
                order: {
                  id: orderDoc.id,
                  ...orderDoc.data(),
                  _collection: collectionName,
                },
              };
              break;
            }

            // Try by document ID
            const docRef = doc(db, collectionName, trackingForm.orderId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              orderResult = {
                success: true,
                order: {
                  id: docSnap.id,
                  ...docSnap.data(),
                  _collection: collectionName,
                },
              };
              break;
            }
          } catch (error) {
            console.log(
              `Direct tracking query failed for ${collectionName}:`,
              error
            );
          }
        }
      }

      if (!orderResult?.success || !orderResult.order) {
        setAlertDialog({
          message: "Order not found. Please check your Order ID.",
          visible: true,
        });
        return;
      }

      const order = orderResult.order;
      const orderEmail = order.customerEmail || order.userEmail || order.email;

      if (
        orderEmail &&
        trackingForm.billingEmail &&
        orderEmail.toLowerCase() !== trackingForm.billingEmail.toLowerCase()
      ) {
        setAlertDialog({
          message:
            "Email doesn't match the order. Please check your billing email.",
          visible: true,
        });
        return;
      }

      // Create tracking data
      let orderDate = new Date().toLocaleDateString();
      if (order.createdAt) {
        try {
          if (order.createdAt.toDate) {
            orderDate = order.createdAt.toDate().toLocaleDateString();
          } else if (order.createdAt instanceof Date) {
            orderDate = order.createdAt.toLocaleDateString();
          } else if (typeof order.createdAt === "string") {
            orderDate = new Date(order.createdAt).toLocaleDateString();
          }
        } catch (error) {
          // Use current date if parsing fails
          orderDate = new Date().toLocaleDateString();
        }
      } else if (order.orderDate) {
        try {
          orderDate = new Date(order.orderDate).toLocaleDateString();
        } catch (error) {
          orderDate = order.orderDate; // Keep as string if it's already formatted
        }
      } else if (order.date) {
        try {
          orderDate = new Date(order.date).toLocaleDateString();
        } catch (error) {
          orderDate = order.date; // Keep as string if it's already formatted
        }
      }

      const totalAmount =
        order.amount ||
        order.totalAmount ||
        order.expectedFinalTotal ||
        order.total ||
        0;

      const dashboardOrder: DashboardOrder = {
        id: order.id,
        orderId: order.orderId || order.id,
        userId: order.userId || user?.uid || "",
        status: order.status || "pending",
        date: orderDate,
        total: `₦${totalAmount.toLocaleString()}`,
        totalAmount: totalAmount,
        products: Array.isArray(order.items) ? order.items.length : 1,
        items: order.items || [],
        createdAt: order.createdAt,
        orderDate: orderDate,
        paymentMethod: order.paymentMethod || "bank_transfer",
        customerName: order.customerName || "",
        customerEmail: order.customerEmail || order.userEmail || "",
        customerPhone: order.customerPhone || "",
        bankDetails: order.bankDetails,
        proofOfPayment: order.proofOfPayment,
        paymentSubmittedAt: order.paymentSubmittedAt,
        paymentVerifiedAt:
          order.paymentVerifiedAt ||
          (order.verifiedAt
            ? { toDate: () => new Date(order.verifiedAt) }
            : undefined),
        transactionId: order.transactionId,
        reference: order.reference || order.transactionReference,
        paymentStatus: order.paymentStatus || order.status,
      };

      const enhancedDelivery = calculateEnhancedDelivery(dashboardOrder);

      const enhancedTrackingData: TrackingData = {
        orderId: dashboardOrder.orderId || dashboardOrder.id,
        products: dashboardOrder.products,
        orderDate: dashboardOrder.orderDate || new Date().toLocaleDateString(),
        expectedDate: enhancedDelivery.estimatedDate,
        total: dashboardOrder.total,
        currentStage: getOrderStage(
          dashboardOrder.status,
          dashboardOrder.paymentMethod
        ),
        activities: generateEnhancedOrderActivities(dashboardOrder),
        paymentMethod: dashboardOrder.paymentMethod,
        status: dashboardOrder.status,
        bankDetails: dashboardOrder.bankDetails,
        proofSubmitted: !!dashboardOrder.proofOfPayment,
        transactionId: dashboardOrder.transactionId,
        reference: dashboardOrder.reference,
        deliverySteps: enhancedDelivery.deliverySteps,
        businessDaysRemaining: enhancedDelivery.businessDaysRemaining,
        isDelivered: enhancedDelivery.isDelivered,
      };

      setTrackingData(enhancedTrackingData);
    } catch (error) {
      setAlertDialog({
        message: "Failed to track order. Please try again.",
        visible: true,
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
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

  // Loading state
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

  // If not authenticated
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
              <span className="font-medium">
                {selectedOrder.orderId || selectedOrder.id}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}
              >
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
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.paymentMethod === "flutterwave"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {selectedOrder.paymentMethod === "flutterwave"
                    ? "Flutterwave"
                    : "Bank Transfer"}
                </span>
              </div>
            )}

            <div className="pt-3 border-t">
              <span className="text-gray-600 block mb-2">Items:</span>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items?.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {typeof item === "string"
                        ? item
                        : item.itemName || "Product"}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">
                    Order items not available
                  </li>
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
      if (!user || !userData || !updateProfile) {
        setAlertDialog({
          message: "Profile update not available",
          visible: true,
        });
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

        setFormData((prev) => ({ ...prev, ...localFormData }));
        setAlertDialog({
          message: "Profile updated successfully!",
          visible: true,
        });
      } catch (error) {
        setAlertDialog({
          message: "Failed to update profile. Please try again.",
          visible: true,
        });
      } finally {
        setSaving(false);
      }
    };

    const handleLocalChangePassword = async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setAlertDialog({
          message: "New passwords do not match!",
          visible: true,
        });
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setAlertDialog({
          message: "Password must be at least 8 characters long!",
          visible: true,
        });
        return;
      }

      if (!passwordData.currentPassword) {
        setAlertDialog({
          message: "Please enter your current password",
          visible: true,
        });
        return;
      }

      if (!changePassword) {
        setAlertDialog({
          message: "Change password function not available",
          visible: true,
        });
        return;
      }

      setChangingPassword(true);
      try {
        await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setAlertDialog({
          message: "Password changed successfully!",
          visible: true,
        });
      } catch (error: any) {
        setAlertDialog({
          message: error.message || "Failed to change password",
          visible: true,
        });
      } finally {
        setChangingPassword(false);
      }
    };

    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">ACCOUNT SETTING</h2>

          {getRemainingTime &&
            (() => {
              const remaining = getRemainingTime();
              const showWarning = remaining < 10 * 60 * 1000 && remaining > 0;

              if (remaining <= 0) return null;

              return (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                    showWarning
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-green-100 text-green-700 border border-green-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${showWarning ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                  ></div>
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
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
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
                  value={formData.email}
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
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Nigeria">Nigeria</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={localFormData.state}
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLocalFormData((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
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
    <div className="min-h-[400px] bg-white rounded-lg p-6">
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
              <p className="text-gray-600 flex items-center gap-1">
                <Calendar size={16} className="text-gray-500" />
                Expected Delivery:
              </p>
              <p className="font-bold text-green-600">
                {trackingData.expectedDate}
              </p>
              {trackingData.businessDaysRemaining !== undefined &&
                trackingData.businessDaysRemaining > 0 && (
                  <p className="text-xs text-gray-500">
                    ({trackingData.businessDaysRemaining} business days
                    remaining)
                  </p>
                )}
            </div>
            <div>
              <p className="text-gray-600">Total:</p>
              <p className="font-bold text-lg">{trackingData.total}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Method:</p>
              <p className="font-medium capitalize">
                {trackingData.paymentMethod?.replace("_", " ")}
              </p>
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

          {/* Enhanced Delivery Breakdown */}
          {trackingData.deliverySteps &&
            trackingData.deliverySteps.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-800">
                    📦 Delivery Timeline Breakdown:
                  </h4>
                  {trackingData.businessDaysRemaining !== undefined &&
                    trackingData.businessDaysRemaining <= 2 &&
                    !trackingData.isDelivered && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full animate-pulse">
                        🚚 Arriving Soon!
                      </span>
                    )}
                </div>
                <ul className="space-y-2">
                  {trackingData.deliverySteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-blue-700"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                      {step}
                    </li>
                  ))}
                </ul>
                {trackingData.isDelivered ? (
                  <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-sm font-medium">
                    🎉 Your order has been delivered!
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                    💡 Delivery times exclude weekends and public holidays
                  </div>
                )}
              </div>
            )}

          <h4 className="font-semibold text-gray-700 mb-3">Order Progress:</h4>
          <div className="relative flex flex-col items-start space-y-4">
            {trackingData.activities.map((activity, index) => (
              <div key={index} className="flex items-start w-full">
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`w-4 h-4 rounded-full ${activity.completed ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  {index < trackingData.activities.length - 1 && (
                    <div
                      className={`w-0.5 h-8 ${activity.completed ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p
                    className={`font-medium ${activity.completed ? "text-gray-800" : "text-gray-500"}`}
                  >
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
    <div className="min-h-[400px] bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">ORDER HISTORY</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center gap-2"
          disabled={ordersLoading}
        >
          <Refresh size={16} />
          Refresh
        </button>
      </div>

      {ordersLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
          <p className="mb-4">
            You haven't placed any orders yet, or we couldn't find orders
            associated with your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-blue-800 mb-2">
              💡 Possible Solutions:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check if you placed orders with a different email</li>
              <li>• Verify you're logged in with the correct account</li>
              <li>• Try refreshing the page</li>
              <li>• Contact support if you've placed orders before</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <Refresh size={16} />
            Refresh Orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium">
              ✅ Found {orders.length} order{orders.length !== 1 ? "s" : ""} for
              your account
            </p>
          </div>

          <div className="overflow-x-auto space-y-4 max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const deliveryInfo = calculateEnhancedDelivery(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId || order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentMethod === "flutterwave"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.paymentMethod === "flutterwave"
                            ? "Flutterwave"
                            : "Bank Transfer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deliveryInfo.isDelivered ? (
                          <span className="text-green-600 font-medium">
                            ✅ Delivered
                          </span>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-900">
                              {deliveryInfo.estimatedDate}
                            </p>
                            {deliveryInfo.businessDaysRemaining !== undefined &&
                              deliveryInfo.businessDaysRemaining > 0 && (
                                <p className="text-xs text-gray-400">
                                  {deliveryInfo.businessDaysRemaining} days left
                                </p>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.products} item{order.products !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 border border-gray-300 rounded-lg flex items-center justify-between w-full bg-white text-gray-700"
            >
              <span>
                {menuItems.find((item) => item.id === activeTab)?.label ||
                  "Menu"}
              </span>
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div
            className={`w-full lg:w-1/4 bg-white h-auto max-h-fit rounded-lg p-6 shadow-md lg:block ${
              showMobileMenu ? "block" : "hidden"
            }`}
          >
            <nav className="min-h-auto">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowMobileMenu(false);
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
                        className={`mr-3 ${activeTab === item.id ? "text-white" : "text-gray-500"}`}
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
