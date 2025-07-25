"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// TypeScript interfaces
interface OrderActivity {
  message: string;
  date: string;
  type: "delivered" | "pickup" | "hub" | "transit" | "verified" | "confirmed";
}

interface TrackingData {
  orderId: string;
  products: number;
  orderDate: string;
  expectedDate: string;
  total: string;
  currentStage: number;
  activities: OrderActivity[];
}

interface Order {
  id: string;
  status: string;
  date: string;
  total: string;
  products: number;
  items: string[];
  userId: string;
  createdAt: any;
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [formInitialized, setFormInitialized] = useState<boolean>(false); // 🔧 NEW: Track if form was populated

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

  // 🔐 ENHANCED AUTHENTICATION CHECK (FIXED VERSION)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/dashboard");
      return;
    }

    // if (!authLoading) {
    //   if (!user) {
    //     // No Firebase Auth user - redirect to login
    //     router.push("/auth?redirect=/dashboard");
    //     return;
    //   }

    //   // Give userData some time to load after user authentication
    //   if (user && userData === null) {
    //     const timeoutId = setTimeout(() => {
    //       // Only redirect if userData is still null after 3 seconds
    //       if (userData === null) {
    //         console.warn("User authenticated but no user document found");
    //         router.push("/auth?redirect=/dashboard&message=account_not_found");
    //       }
    //     }, 3000); // Wait 3 seconds for userData to load

    //     return () => clearTimeout(timeoutId);
    //   }
    // }
  }, [user, userData, authLoading, router]);

  // Additional check for URL message parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");

      if (message === "account_not_found") {
        alert("Your account was not found. Please sign in again.");
      } else if (message === "authentication_required") {
        alert(
          "Authentication required. Please sign in to access your dashboard."
        );
      }
    }
  }, []);

  // 📝 FIXED: POPULATE FORM DATA ONLY ONCE (prevents overriding user input)
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
    } else if (userData && user && formInitialized) {
      console.log("⚠️ Form already initialized - SKIPPING override"); // 🔧 ADD THIS
    }
  }, [userData, user, formInitialized]);

  // 📦 FIXED ORDERS FETCH (no composite index required)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      setOrdersLoading(true);
      try {
        console.log("📦 Fetching orders for user:", user.uid);

        // 🔧 Simple query - only filter by userId (no orderBy to avoid index requirement)
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", user.uid));

        const querySnapshot = await getDocs(q);
        const userOrders: Order[] = [];

        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          userOrders.push({
            id: doc.id,
            ...orderData,
          } as Order);
        });

        // 🔧 Sort orders by date in JavaScript instead of Firestore
        userOrders.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });

        setOrders(userOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user && userData) {
      fetchOrders();
    }
  }, [user, userData]);

  // 🔧 FIXED: Handle input changes (this was working before)
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
      alert("User not authenticated");
      return;
    }

    // Check if updateProfile function is available
    if (!updateProfile) {
      alert("Profile update function not available. Please refresh the page.");
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

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // 🔒 CHANGE PASSWORD IN FIREBASE AUTH
  const handleChangePassword = async (): Promise<void> => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (formData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    if (!formData.currentPassword) {
      alert("Please enter your current password");
      return;
    }

    // Check if changePassword function is available
    if (!changePassword) {
      alert("Change password function not available. Please refresh the page.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      alert("Password changed successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to change password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  // 🚪 LOGOUT FUNCTION
  const handleLogout = async () => {
    if (!signOut) {
      alert("Logout function not available. Please refresh the page.");
      return;
    }

    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // 📦 TRACK ORDER FUNCTION
  const handleTrackOrder = async (): Promise<void> => {
    if (!trackingForm.orderId.trim() || !trackingForm.billingEmail.trim()) {
      alert("Please fill in both Order ID and Billing Email");
      return;
    }

    // Check if order exists in user's orders
    const foundOrder = orders.find(
      (order) =>
        order.id.includes(trackingForm.orderId) &&
        formData.email.toLowerCase() === trackingForm.billingEmail.toLowerCase()
    );

    if (!foundOrder) {
      alert("Order not found. Please check your Order ID and billing email.");
      return;
    }

    // Mock tracking data - replace with real tracking API
    const mockTrackingData: TrackingData = {
      orderId: foundOrder.id,
      products: foundOrder.products,
      orderDate: foundOrder.date,
      expectedDate: "23 Jan, 2021",
      total: foundOrder.total,
      currentStage:
        foundOrder.status === "COMPLETED"
          ? 3
          : foundOrder.status === "IN PROGRESS"
          ? 2
          : 1,
      activities: [
        {
          message:
            foundOrder.status === "COMPLETED"
              ? "Your order has been delivered. Thank you for shopping!"
              : "Your order is being processed",
          date: foundOrder.date,
          type: foundOrder.status === "COMPLETED" ? "delivered" : "confirmed",
        },
      ],
    };
    setTrackingData(mockTrackingData);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50";
      case "IN PROGRESS":
        return "text-orange-600 bg-orange-50";
      case "CANCELLED":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleViewDetails = (order: Order): void => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "track-order", label: "Track Order", icon: Clock },
    { id: "order-history", label: "Order History", icon: Package },
    { id: "logout", label: "Log-out", icon: LogOut },
  ];

  // 🔄 LOADING STATE - Show spinner while checking auth (same as WishlistPage)
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

  // 🚫 If not authenticated or no user data, don't render anything (will redirect)
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
              <span className="font-medium">{selectedOrder.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  selectedOrder.status
                )}`}
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

            <div className="pt-3 border-t">
              <span className="text-gray-600 block mb-2">Items:</span>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items?.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {item}
                  </li>
                )) || (
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
            {selectedOrder.status === "IN PROGRESS" && (
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setActiveTab("track-order");
                  setTrackingForm({
                    orderId: selectedOrder.id,
                    billingEmail: formData.email,
                  });
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Track Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

const ProfileTab = () => {
    // Local state for immediate editing (won't be affected by AuthContext re-renders)
    const [localFormData, setLocalFormData] = useState({
      fullName: "",
      username: "",
      phone: "",
      country: "Nigeria",
      state: "Lagos",
      zipCode: ""
    });

    // Track if local state has been initialized (using ref to prevent re-initialization)
    const localInitializedRef = useRef(false);

    // Add local state for password fields too
    const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });

    // Initialize local state ONCE when formData is ready
    useEffect(() => {
      if (formData && formInitialized && !localInitializedRef.current) {
        setLocalFormData({
          fullName: formData.fullName || "",
          username: formData.username || "",
          phone: formData.phone || "",
          country: formData.country || "Nigeria",
          state: formData.state || "Lagos",
          zipCode: formData.zipCode || ""
        });
        localInitializedRef.current = true;
      }
    }, [formData, formInitialized]);

    // Enhanced save function that uses local state
    const handleSaveChanges = async () => {
      if (!user || !userData) {
        alert("User not authenticated");
        return;
      }

      if (!updateProfile) {
        alert("Profile update function not available. Please refresh the page.");
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

        // Update main formData to match local state
        setFormData(prev => ({
          ...prev,
          ...localFormData
        }));

        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
      } finally {
        setSaving(false);
      }
    };

    // Update the password change handler to use local password state
    const handleChangePassword = async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("New passwords do not match!");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        alert("Password must be at least 8 characters long!");
        return;
      }

      if (!passwordData.currentPassword) {
        alert("Please enter your current password");
        return;
      }

      if (!changePassword) {
        alert("Change password function not available. Please refresh the page.");
        return;
      }

      setChangingPassword(true);
      try {
        await changePassword(passwordData.currentPassword, passwordData.newPassword);

        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        alert("Password changed successfully!");
      } catch (error: any) {
        alert(error.message || "Failed to change password. Please try again.");
      } finally {
        setChangingPassword(false);
      }
    };
    
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">ACCOUNT SETTING</h2>

          {/* Session Status Display */}
          {getRemainingTime &&
            (() => {
              const remaining = getRemainingTime();
              const minutes = Math.floor(remaining / (60 * 1000));
              const hours = Math.floor(minutes / 60);
              const displayMinutes = minutes % 60;
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
                    className={`w-2 h-2 rounded-full ${
                      showWarning ? "bg-red-500 animate-pulse" : "bg-green-500"
                    }`}
                  ></div>
                  <span>
                    Session:{" "}
                    {hours > 0 ? `${hours}h ${displayMinutes}m` : `${minutes}m`}
                  </span>
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
          {/* Profile Picture & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Profile Picture */}
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

            {/* Form Fields - Using LOCAL STATE for smooth editing */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={localFormData.fullName}
                  onChange={(e) => {
                    setLocalFormData(prev => ({
                      ...prev,
                      fullName: e.target.value
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
                    setLocalFormData(prev => ({
                      ...prev,
                      username: e.target.value
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  title="Email cannot be changed"
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
                    setLocalFormData(prev => ({
                      ...prev,
                      phone: e.target.value
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country/Region
                </label>
                <select
                  value={localFormData.country}
                  onChange={(e) => {
                    setLocalFormData(prev => ({
                      ...prev,
                      country: e.target.value
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Nigeria">Nigeria</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={localFormData.state}
                    onChange={(e) => {
                      setLocalFormData(prev => ({
                        ...prev,
                        state: e.target.value
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
                      setLocalFormData(prev => ({
                        ...prev,
                        zipCode: e.target.value
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveChanges}
            disabled={saving || !updateProfile}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>

          {/* Change Password Section - Using LOCAL PASSWORD STATE */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold mb-6">CHANGE PASSWORD</h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev, 
                      currentPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.current ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev, 
                      newPassword: e.target.value
                    }))}
                    placeholder="8+ characters"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev, 
                      confirmPassword: e.target.value
                    }))}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !changePassword}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? "CHANGING..." : "CHANGE PASSWORD"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  

  const TrackOrderTab = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Track Order</h2>

      {!trackingData ? (
        <div className="space-y-6">
          <p className="text-gray-600">
            To track your order please enter your order ID in the input field
            below and press the "Track Order" button. this was given to you on
            your receipt and in the confirmation email you should have received.
          </p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={trackingForm.orderId}
                onChange={(e) =>
                  setTrackingForm((prev) => ({
                    ...prev,
                    orderId: e.target.value,
                  }))
                }
                placeholder="Order ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                placeholder="Email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Order ID that we emailed to you in your email database.
            </div>

            <button
              onClick={handleTrackOrder}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
            >
              TRACK ORDER →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setTrackingData(null)}
            className="text-red-500 hover:text-red-600 font-medium flex items-center gap-2 mb-4"
          >
            ← Back to Track Order
          </button>

          {/* Order Info Header */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {trackingData.orderId}
                </h3>
                <p className="text-sm text-gray-600">
                  {trackingData.products} Products • Order Placed on{" "}
                  {trackingData.orderDate}
                </p>
                <p className="text-sm text-gray-600">
                  Order expected on{" "}
                  <span className="font-medium">
                    {trackingData.expectedDate}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {trackingData.total}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-8 relative">
              {/* Progress Line Background */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-300"></div>
              <div
                className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    0,
                    (trackingData.currentStage / 3) * (100 - 8)
                  )}%`,
                }}
              ></div>

              {[
                {
                  label: "Order Placed",
                  completed: trackingData.currentStage >= 0,
                  current: trackingData.currentStage === 0,
                },
                {
                  label: "Packaging",
                  completed: trackingData.currentStage >= 1,
                  current: trackingData.currentStage === 1,
                },
                {
                  label: "On the Road",
                  completed: trackingData.currentStage >= 2,
                  current: trackingData.currentStage === 2,
                },
                {
                  label: "Delivered",
                  completed: trackingData.currentStage >= 3,
                  current: trackingData.currentStage === 3,
                },
              ].map((stage, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center relative z-10"
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                      stage.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : stage.current
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {stage.completed ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : stage.current ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 border border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`text-xs text-center ${
                      stage.completed || stage.current
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Activity */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Activity</h3>
            <div className="space-y-4">
              {trackingData.activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      activity.type === "delivered"
                        ? "bg-green-500"
                        : activity.type === "pickup"
                        ? "bg-blue-500"
                        : activity.type === "hub"
                        ? "bg-blue-400"
                        : activity.type === "transit"
                        ? "bg-orange-500"
                        : activity.type === "verified"
                        ? "bg-green-400"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <div>
                    <p className="text-gray-900 text-sm">{activity.message}</p>
                    <p className="text-gray-500 text-xs">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const OrderHistoryTab = () => (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Order History</h2>
      </div>

      {ordersLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-500">
            You haven't placed any orders yet. Start shopping to see your order
            history here!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">
                  ORDER ID
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">
                  STATUS
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">
                  DATE
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">
                  TOTAL
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-6 font-medium text-gray-900">
                    #{order.id.substring(0, 8)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{order.date}</td>
                  <td className="py-4 px-6 font-medium">
                    {order.total} ({order.products} Products)
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium transition-colors"
                    >
                      View Details <Eye size={16} />
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
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1400px] mx-auto py-6 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-lg overflow-hidden">
                {menuItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === "logout") {
                        handleLogout();
                      } else {
                        setActiveTab(id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                      activeTab === id
                        ? "bg-red-500 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="lg:hidden mb-4">
              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="w-full bg-white p-4 rounded-lg flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const activeMenuItem = menuItems.find(
                        (item) => item.id === activeTab
                      );
                      const Icon = activeMenuItem?.icon || User;
                      return (
                        <>
                          <Icon size={20} className="text-red-500" />
                          <span className="font-medium">
                            {activeMenuItem?.label || "Profile"}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                </button>

                {showMobileMenu && (
                  <div className="absolute top-full left-0 right-0 bg-white rounded-lg mt-2 shadow-lg z-10">
                    {menuItems.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => {
                          if (id === "logout") {
                            handleLogout();
                          } else {
                            setActiveTab(id);
                          }
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                          activeTab === id
                            ? "bg-red-50 text-red-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={20} />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "track-order" && <TrackOrderTab />}
              {activeTab === "order-history" && <OrderHistoryTab />}
            </div>
          </div>
        </div>
      </div>

      <OrderDetailsModal />
      <Footer />
    </div>
  );
};

export default UserDashboard;
