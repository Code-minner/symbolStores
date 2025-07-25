// src/app/review/page.tsx - Using the hook
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/CartContext";
import { useReviewData } from "@/lib/hooks/useReviewData";

export default function ReviewPage() {
  const { state, formatPrice } = useCart();
  const router = useRouter();

  // ✅ USE THE HOOK instead of local state
  const { reviewData } = useReviewData();

  // ✅ FALLBACK: If no data from hook, use placeholder
  const displayData = reviewData || {
    address: {
      name: "John Doe",
      fullAddress:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Turpis facilisis faucibus sed et ut. Turpis facilibus faucibus sed et ut.",
    },
    payment: {
      type: "Credit / Debit Card",
      name: "John Doe",
      cardNumber: "0000 0000 0000 0000",
      expiryDate: "12 / 2027",
    },
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Cart", href: "/cart" },
    { name: "Checkouts", href: "/checkout" },
    { name: "Review", href: "#" },
  ];

  const handleBackToPayment = () => {
    router.push("/checkout");
  };

  const handlePlaceOrder = () => {
    // Here you would typically:
    // 1. Process the payment
    // 2. Create the order in your database
    // 3. Send confirmation emails
    // 4. Redirect to success page

    console.log("Processing order with data:", displayData);
    // router.push('/order-success');
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

          {/* Page Content */}
          <div className="max-w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Review
              </h1>
              <p className="text-gray-600">
                Please confirm if all informations are filled correctly
              </p>

              {/* ✅ DEBUG: Show data source */}
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">
                  Data source: {reviewData ? "Hook" : "Placeholder"}
                </p>
              )}
            </div>

            {/* Review Sections */}
            <div className="space-y-6">
              {/* Address Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="">
                    <div className="flex justify-between mb-4">
                      {" "}
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2 inline-block">
                        Address
                      </h2>{" "}
                      <Link
                        href="/checkout"
                        className="ml-6 text-red-500 hover:text-red-600 font-medium text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                      >
                        EDIT
                      </Link>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {displayData.address.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {displayData.address.fullAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2 inline-block">
                      Payment
                    </h2>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">
                        {displayData.payment.type}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">
                          {displayData.payment.name}
                        </p>
                        <p className="font-mono tracking-wider">
                          {displayData.payment.cardNumber}
                        </p>
                        <p>{displayData.payment.expiryDate}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/checkout"
                    className="ml-6 text-red-500 hover:text-red-600 font-medium text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    EDIT
                  </Link>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600">
                  By clicking place order, You agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-red-500 hover:text-red-600 underline"
                  >
                    terms and condition
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/return-policy"
                    className="text-red-500 hover:text-red-600 underline"
                  >
                    return policy
                  </Link>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                {/* Back Button */}
                <button
                  onClick={handleBackToPayment}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors group"
                >
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  BACK TO PAYMENT
                </button>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  className="flex items-center gap-2 bg-red-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors group"
                >
                  PLACE ORDER
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
