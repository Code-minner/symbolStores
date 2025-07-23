"use client";

import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// TypeScript interfaces
interface OrderActivity {
  message: string;
  date: string;
  type: 'delivered' | 'pickup' | 'hub' | 'transit' | 'verified' | 'confirmed';
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

// SVG Icon Components (replacing lucide-react)
interface IconProps {
  size?: number;
  className?: string;
}

const User: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Package: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const Clock: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LogOut: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Eye: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOff: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const Menu: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const X: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeft: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Single dummy order
const dummyOrder: Order = {
  id: "#9345710",
  status: "IN PROGRESS",
  date: "Dec 30, 2016 07:52",
  total: "N6,000.00",
  products: 3,
  items: ["Samsung 43-inch Smart TV", "LG Bluetooth Soundbar", "Premium HDMI Cable"]
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingForm, setTrackingForm] = useState<{orderId: string; billingEmail: string}>({
    orderId: '',
    billingEmail: ''
  });
  const [showPasswords, setShowPasswords] = useState<{current: boolean; new: boolean; confirm: boolean}>({
    current: false,
    new: false,
    confirm: false
  });

  const [formData, setFormData] = useState<FormData>({
    fullName: 'John Doe',
    username: 'john234',
    email: 'john1234@gmail.com',
    phone: '+234-805-555-0118',
    country: 'Nigeria',
    state: 'Lagos',
    zipCode: '100001',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveChanges = (): void => {
    // TODO: Save to Firebase
    alert('Changes saved successfully!');
  };

  const handleChangePassword = (): void => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (formData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    // TODO: Update password in Firebase Auth
    alert('Password changed successfully!');
  };

  const handleTrackOrder = (): void => {
    if (!trackingForm.orderId.trim() || !trackingForm.billingEmail.trim()) {
      alert('Please fill in both Order ID and Billing Email');
      return;
    }
    
    // Mock tracking data - replace with real API call
    const mockTrackingData: TrackingData = {
      orderId: "#54903843",
      products: 3,
      orderDate: "17 Jan, 2021 at 7:52 PM",
      expectedDate: "23 Jan, 2021",
      total: "₦5,400,108.9",
      currentStage: 2, // 0: Order Placed, 1: Packaging, 2: On the Road, 3: Delivered
      activities: [
        {
          message: "Your order has been delivered. Thank you for shopping at Citizent",
          date: "23 Jan, 2021 at 7:52 PM",
          type: "delivered"
        },
        {
          message: "Our delivery man (John West) has picked up your order for delivery.",
          date: "22 Jan, 2021 at 7:06 PM",
          type: "pickup"
        },
        {
          message: "Your order has reached at last mile hub.",
          date: "22 Jan, 2021 at 6:55 AM",
          type: "hub"
        },
        {
          message: "Your order on the way to (last mile) hub.",
          date: "21 Jan, 2021 at 8:33 AM",
          type: "transit"
        },
        {
          message: "Your order is successfully verified.",
          date: "20 Jan, 2021 at 7:23 PM",
          type: "verified"
        },
        {
          message: "Your order has been confirmed.",
          date: "19 Jan, 2021 at 8:42 PM",
          type: "confirmed"
        }
      ]
    };
    setTrackingData(mockTrackingData);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'IN PROGRESS':
        return 'text-orange-600 bg-orange-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleViewDetails = (order: Order): void => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'track-order', label: 'Track Order', icon: Clock },
    { id: 'order-history', label: 'Order History', icon: Package },
    { id: 'logout', label: 'Log-out', icon: LogOut }
  ];

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
            
            <div className="pt-3 border-t">
              <span className="text-gray-600 block mb-2">Items:</span>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">{item}</li>
                ))}
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
            {selectedOrder.status === 'IN PROGRESS' && (
              <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Track Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProfileTab = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">ACCOUNT SETTING</h2>
      
      <div className="space-y-8">
        {/* Profile Picture & Basic Info */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region</label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Nigeria">Nigeria</option>
              </select>
            </div>


            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">States</label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-start-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        </div>
        
        <button
          onClick={handleSaveChanges}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          SAVE CHANGES
        </button>
        
        {/* Change Password Section */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-bold mb-6">CHANGE PASSWORD</h3>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="8+ characters"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleChangePassword}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              CHANGE PASSWORD
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TrackOrderTab = () => (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Track Order</h2>
      
      {!trackingData ? (
        <div className="space-y-6">
          <p className="text-gray-600">
            To track your order please enter your order ID in the input field below and press the "Track Order" 
            button. this was given to you on your receipt and in the confirmation email you should have received.
          </p>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
              <input
                type="text"
                value={trackingForm.orderId}
                onChange={(e) => setTrackingForm(prev => ({...prev, orderId: e.target.value}))}
                placeholder="Order ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
              <input
                type="email"
                value={trackingForm.billingEmail}
                onChange={(e) => setTrackingForm(prev => ({...prev, billingEmail: e.target.value}))}
                placeholder="Email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
                <h3 className="text-lg font-bold text-gray-900">{trackingData.orderId}</h3>
                <p className="text-sm text-gray-600">
                  {trackingData.products} Products • Order Placed on {trackingData.orderDate}
                </p>
                <p className="text-sm text-gray-600">
                  Order expected on <span className="font-medium">{trackingData.expectedDate}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{trackingData.total}</p>
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
                  width: `${Math.max(0, (trackingData.currentStage / 3) * (100 - 8))}%`
                }}
              ></div>
              
              {[
                { label: 'Order Placed', completed: trackingData.currentStage >= 0, current: trackingData.currentStage === 0 },
                { label: 'Packaging', completed: trackingData.currentStage >= 1, current: trackingData.currentStage === 1 },
                { label: 'On the Road', completed: trackingData.currentStage >= 2, current: trackingData.currentStage === 2 },
                { label: 'Delivered', completed: trackingData.currentStage >= 3, current: trackingData.currentStage === 3 }
              ].map((stage, index) => (
                <div key={index} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                    stage.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : stage.current 
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {stage.completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : stage.current ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 border border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-xs text-center ${
                    stage.completed || stage.current ? 'text-gray-900 font-medium' : 'text-gray-400'
                  }`}>
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
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    activity.type === 'delivered' ? 'bg-green-500' :
                    activity.type === 'pickup' ? 'bg-blue-500' :
                    activity.type === 'hub' ? 'bg-blue-400' :
                    activity.type === 'transit' ? 'bg-orange-500' :
                    activity.type === 'verified' ? 'bg-green-400' :
                    'bg-gray-400'
                  }`}></div>
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
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 font-medium text-gray-700">ORDER ID</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">DATE</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">TOTAL</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6 font-medium text-gray-900">{dummyOrder.id}</td>
              <td className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dummyOrder.status)}`}>
                  {dummyOrder.status}
                </span>
              </td>
              <td className="py-4 px-6 text-gray-600">{dummyOrder.date}</td>
              <td className="py-4 px-6 font-medium">{dummyOrder.total} ({dummyOrder.products} Products)</td>
              <td className="py-4 px-6">
                <button
                  onClick={() => handleViewDetails(dummyOrder)}
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  View Details <Eye size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
                      if (id === 'logout') {
                        // Handle logout
                        alert('Logging out...');
                      } else {
                        setActiveTab(id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                      activeTab === id
                        ? 'bg-red-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
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
                      const activeMenuItem = menuItems.find(item => item.id === activeTab);
                      const Icon = activeMenuItem?.icon || User;
                      return (
                        <>
                          <Icon size={20} className="text-red-500" />
                          <span className="font-medium">{activeMenuItem?.label || 'Profile'}</span>
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
                          if (id === 'logout') {
                            alert('Logging out...');
                          } else {
                            setActiveTab(id);
                          }
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                          activeTab === id
                            ? 'bg-red-50 text-red-600'
                            : 'text-gray-700 hover:bg-gray-50'
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
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'track-order' && <TrackOrderTab />}
              {activeTab === 'order-history' && <OrderHistoryTab />}
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