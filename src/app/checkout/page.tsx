// src/app/checkout/page.tsx - Updated to use centralized cart logic
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart, TAX_RATE } from "@/lib/CartContext";
import { useReviewData, ReviewData } from "@/lib/hooks/useReviewData";

// Define the payment method type
type PaymentMethod = "flutterwave" | "bank" | "card";

export default function CheckoutPage() {
  // Now using the centralized cart state with all calculations
  const { state, formatPrice } = useCart();
  const router = useRouter();
  const { saveReviewData } = useReviewData();

  // Updated with proper type
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("flutterwave");
  const [shipToDifferent, setShipToDifferent] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    address: "",
    country: "",
    region: "",
    city: "",
    zipCode: "",
    email: "",
    phone: "",
  });

  const [cardInfo, setCardInfo] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  });

  const [orderNotes, setOrderNotes] = useState("");

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Cart", href: "/cart" },
    { name: "Checkout", href: "#" },
  ];

  const handleInputChange = (
    section: "billing" | "card",
    field: string,
    value: string
  ) => {
    if (section === "billing") {
      setBillingInfo((prev) => ({ ...prev, [field]: value }));
    } else {
      setCardInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    // Check required billing fields
    if (!billingInfo.firstName.trim()) errors.push("First name is required");
    if (!billingInfo.lastName.trim()) errors.push("Last name is required");
    if (!billingInfo.address.trim()) errors.push("Address is required");
    if (!billingInfo.email.trim()) errors.push("Email is required");
    if (!billingInfo.phone.trim()) errors.push("Phone number is required");
    if (!billingInfo.country) errors.push("Country is required");
    if (!billingInfo.region) errors.push("Region/State is required");
    if (!billingInfo.city) errors.push("City is required");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (billingInfo.email && !emailRegex.test(billingInfo.email)) {
      errors.push("Please enter a valid email address");
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (billingInfo.phone && !phoneRegex.test(billingInfo.phone)) {
      errors.push("Please enter a valid phone number");
    }

    return errors;
  };

  // Helper function to get payment type display
  const getPaymentTypeDisplay = (method: PaymentMethod): string => {
    switch (method) {
      case "flutterwave":
        return "Flutterwave Payment";
      case "bank":
        return "Bank Transfer";
      case "card":
        return "Credit/Debit Card";
      default:
        return "Selected Payment Method";
    }
  };

  // Save data and proceed to review
  const handleProceedToReview = () => {
    const errors = validateForm();

    if (errors.length > 0) {
      alert("Please fix the following errors:\n\n" + errors.join("\n"));
      return;
    }

    // Format address
    const fullAddress = [
      billingInfo.address,
      billingInfo.city,
      billingInfo.region,
      billingInfo.country,
      billingInfo.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    // Format card display for security
    const cardDisplay =
      selectedPayment === "card" && cardInfo.cardNumber
        ? cardInfo.cardNumber.replace(/\d(?=\d{4})/g, "*")
        : "N/A";

    // Prepare review data with values from centralized cart state
    const reviewData: ReviewData = {
      address: {
        name: `${billingInfo.firstName} ${billingInfo.lastName}`,
        fullAddress: fullAddress,
        email: billingInfo.email,
        phone: billingInfo.phone,
        company: billingInfo.companyName || "",
      },
      payment: {
        type: getPaymentTypeDisplay(selectedPayment),
        name:
          selectedPayment === "card"
            ? cardInfo.nameOnCard
            : `${billingInfo.firstName} ${billingInfo.lastName}`,
        cardNumber: cardDisplay,
        expiryDate: cardInfo.expiryDate || "N/A",
        method: selectedPayment,
      },
      orderNotes: orderNotes,
      billingInfo: billingInfo,
      cardInfo: selectedPayment === "card" ? cardInfo : null,
      // Using values from centralized cart state
      subtotal: state.totalAmount, // Cart subtotal
      shippingCost: state.shippingCost, // Calculated shipping
      taxAmount: state.taxAmount, // Calculated tax
      totalAmount: state.finalTotal, // Final total
    };

    // Save to hook/storage
    saveReviewData(reviewData);

    // Navigate to review page
    router.push("/review");
  };

  // Handle payment method change with proper typing
  const handlePaymentMethodChange = (method: string) => {
    // Type guard to ensure only valid payment methods are set
    if (method === "flutterwave" || method === "bank" || method === "card") {
      setSelectedPayment(method);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="w-[95%] overflow-x-auto py-3 pr-4 mr-4">
            <nav className="flex items-center text-sm text-gray-600 whitespace-nowrap space-x-2">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-gray-400 flex items-center">
                      <svg
                        width="6"
                        height="10"
                        viewBox="0 0 6 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.5 1.25L5.25 5L1.5 8.75"
                          stroke="#77878F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  <a
                    href={item.href}
                    className={`flex items-center gap-1 text-[12px] hover:text-blue-600 transition-colors ${
                      index === breadcrumbs.length - 1
                        ? "text-blue-600 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {index === 0 && (
                      <svg
                        className="mb-[1px]"
                        width="12"
                        height="14"
                        viewBox="0 0 16 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.875 15.2498V11.4998C9.875 11.334 9.80915 11.1751 9.69194 11.0579C9.57473 10.9406 9.41576 10.8748 9.25 10.8748H6.75C6.58424 10.8748 6.42527 10.9406 6.30806 11.0579C6.19085 11.1751 6.125 11.334 6.125 11.4998V15.2498C6.125 15.4156 6.05915 15.5745 5.94194 15.6917C5.82473 15.809 5.66576 15.8748 5.5 15.8748H1.75C1.58424 15.8748 1.42527 15.809 1.30806 15.6917C1.19085 15.5745 1.125 15.4156 1.125 15.2498V8.02324C1.1264 7.93674 1.14509 7.8514 1.17998 7.77224C1.21486 7.69308 1.26523 7.6217 1.32812 7.5623L7.57812 1.88261C7.69334 1.77721 7.84384 1.71875 8 1.71875C8.15616 1.71875 8.30666 1.77721 8.42187 1.88261L14.6719 7.5623C14.7348 7.6217 14.7851 7.69308 14.82 7.77224C14.8549 7.8514 14.8736 7.93674 14.875 8.02324V15.2498C14.875 15.4156 14.8092 15.5745 14.6919 15.6917C14.5747 15.809 14.4158 15.8748 14.25 15.8748H10.5C10.3342 15.8748 10.1753 15.809 10.0581 15.6917C9.94085 15.5745 9.875 15.4156 9.875 15.2498Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {item.name}
                  </a>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Checkout
            </h1>
            <p className="text-gray-600 mt-2">
              Please fill in your details to complete your order
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form - Billing Information, Payment Methods, etc. */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {/* Billing Information */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
                      Billing Information
                    </h2>

                    <div className="space-y-4">
                      {/* Full Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={billingInfo.firstName}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "firstName",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="First name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={billingInfo.lastName}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "lastName",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Last name"
                            required
                          />
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name{" "}
                          <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={billingInfo.companyName}
                          onChange={(e) =>
                            handleInputChange(
                              "billing",
                              "companyName",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Company name"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={billingInfo.address}
                          onChange={(e) =>
                            handleInputChange(
                              "billing",
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="House number and street name"
                          required
                        />
                      </div>

                      {/* Location Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={billingInfo.country}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "country",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select</option>
                            <option value="nigeria">Nigeria</option>
                            <option value="ghana">Ghana</option>
                            <option value="kenya">Kenya</option>
                            <option value="south-africa">South Africa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Region/State <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={billingInfo.region}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "region",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select</option>
                            <option value="lagos">Lagos</option>
                            <option value="abuja">Abuja</option>
                            <option value="kano">Kano</option>
                            <option value="rivers">Rivers</option>
                            <option value="ogun">Ogun</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={billingInfo.city}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "city",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select</option>
                            <option value="ikeja">Ikeja</option>
                            <option value="victoria-island">
                              Victoria Island
                            </option>
                            <option value="lekki">Lekki</option>
                            <option value="surulere">Surulere</option>
                            <option value="yaba">Yaba</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            value={billingInfo.zipCode}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "zipCode",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="100001"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={billingInfo.email}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "email",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={billingInfo.phone}
                            onChange={(e) =>
                              handleInputChange(
                                "billing",
                                "phone",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+234 801 234 5678"
                            required
                          />
                        </div>
                      </div>

                      {/* Ship to different address */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="ship-different"
                          checked={shipToDifferent}
                          onChange={(e) => setShipToDifferent(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="ship-different"
                          className="ml-2 text-sm text-gray-600"
                        >
                          Ship to different address
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
                      Additional Information
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Notes{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Notes about your order, e.g. special notes for delivery"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary - UPDATED to use centralized calculations */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
                    Order Summary
                  </h2>

                  {/* Free Shipping Progress */}
                  {!state.isFreeShipping && (
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">
                        🚚 Free Shipping After Purchase Order of ₦990,000.00
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Add{" "}
                        {formatPrice(
                          state.totalAmount >= 990000
                            ? 0
                            : 990000 - state.totalAmount
                        )}{" "}
                        more for free shipping
                      </p>
                    </div>
                  )}

                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {state.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                          <Image
                            src={item.imageURL}
                            alt={item.itemName}
                            fill
                            className="object-cover rounded-lg"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.itemName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-red-600 mt-1">
                            {formatPrice(item.amount * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals - Using centralized calculations */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cart Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(state.totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estimated tax</span>
                      <span className="font-medium">
                        {formatPrice(state.taxAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span
                        className={`font-medium ${state.isFreeShipping ? "text-green-600" : ""}`}
                      >
                        {state.isFreeShipping
                          ? "Free"
                          : formatPrice(state.shippingCost)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Order total</span>
                        <span className="text-red-600">
                          {formatPrice(state.finalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proceed to Review Button */}
                  <div className="mt-6">
                    <button
                      onClick={handleProceedToReview}
                      className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Proceed to Review
                    </button>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      🔒 Your information is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
