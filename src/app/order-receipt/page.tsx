// src/app/order-receipt/page.tsx - Fixed with Suspense
"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ✅ SEPARATE COMPONENT: Component that uses useSearchParams
function OrderReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get order number from URL params or generate a random one
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const orderParam = searchParams.get("order");
    if (orderParam) {
      setOrderNumber(orderParam);
    } else {
      // Generate a random order number
      const randomOrder = "#" + Math.floor(Math.random() * 90000000) + 10000000;
      setOrderNumber(randomOrder);
    }
  }, [searchParams]);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Cart", href: "/cart" },
    { name: "Checkouts", href: "/checkout" },
    { name: "Review", href: "/review" },
    { name: "Order Receipt", href: "#" },
  ];

  const handleGoToInbox = () => {
    // This could redirect to user's email or notifications
    window.open("https://mail.google.com", "_blank");
  };

  const handleViewOrder = () => {
    // Redirect to order details page
    router.push(`/orders/${orderNumber.replace("#", "")}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
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

        {/* Success Content */}
        <div className="flex flex-col items-center justify-center text-center py-16">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Order Confirmation */}
          <div className="mb-8 max-w-lg">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Order {orderNumber} has been placed
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Your order confirmation has been sent to your email address.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Go to Inbox Button */}
            <button
              onClick={handleGoToInbox}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              GO TO INBOX
            </button>

            {/* View Order Button */}
            <button
              onClick={handleViewOrder}
              className="flex items-center gap-2 bg-red-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors group"
            >
              VIEW ORDER
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

          {/* Additional Information */}
          <div className="mt-12 max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What happens next?
              </h3>
              <div className="space-y-3 text-sm text-gray-600 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p>
                    We'll send you an email confirmation with your order details
                    and tracking information.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p>
                    Your order will be processed and prepared for shipment
                    within 1-2 business days.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p>
                    Once shipped, you'll receive tracking information to monitor
                    your delivery.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <p>
                    Your order should arrive within 3-5 business days for
                    standard delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Need help with your order?
            </p>
            <Link
              href="/support"
              className="text-red-500 hover:text-red-600 font-medium text-sm"
            >
              Contact Customer Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ LOADING COMPONENT: Fallback while loading search params
function OrderReceiptLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );
}

// ✅ MAIN COMPONENT: Wraps content in Suspense
export default function OrderReceiptPage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<OrderReceiptLoading />}>
        <OrderReceiptContent />
      </Suspense>
      <Footer />
    </div>
  );
}
