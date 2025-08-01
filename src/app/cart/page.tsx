// src/app/cart/page.tsx - Updated with centralized calculations
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/CartContext";

export default function CartPage() {
  const { 
    state, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    formatPrice,
    getShippingMessage 
  } = useCart();

  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    type: "increase" | "decrease"
  ) => {
    if (type === "increase") {
      updateQuantity(itemId, currentQuantity + 1);
    } else if (type === "decrease" && currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  const getProductUrl = (item: any) => {
    return `/home/${item.category
      .toLowerCase()
      .replace(/\s+/g, "-")}/${item.subcategory
      .toLowerCase()
      .replace(/\s+/g, "-")}/${item.slug}`;
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Cart", href: "#" },
  ];

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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-1xl sm:text-3xl font-bold text-gray-900">
              Shopping Cart ({state.totalItems} items)
            </h1>
            {state.items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {state.items.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-16">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Start shopping to add items to your cart
              </p>
              <Link
                href="/shop"
                className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            /* Cart with Items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Cart Items
                    </h2>

                    <div className="space-y-4">
                      {state.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex gap-2 sm:gap-4 ${
                            index !== state.items.length - 1
                              ? "border-b border-gray-200 pb-6"
                              : ""
                          }`}
                        >
                          {/* Product Image */}
                          <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                            <Image
                              src={item.imageURL}
                              alt={item.itemName}
                              fill
                              className="object-cover rounded-lg"
                              sizes="96px"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={getProductUrl(item)}
                              className="text-[9px] sm:text-lg font-medium text-gray-900 hover:text-red-600 transition-colors block"
                            >
                              {item.itemName}
                            </Link>
                            <p className="hidden sm:block text-sm text-gray-500 mt-1">
                              {item.brand} • {item.category} •{" "}
                              {item.subcategory}
                            </p>
                            <p className="hidden sm:block text-xs text-gray-500 mt-1">
                              SKU: {item.sku}
                            </p>
                            {item.warranty && (
                              <p className="text-xs text-gray-500 mt-1">
                                📋 {item.warranty}
                              </p>
                            )}

                            {/* Price */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-lg font-semibold text-red-600">
                                {formatPrice(item.amount)}
                              </span>
                              {item.originalPrice &&
                                item.originalPrice > item.amount && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(item.originalPrice)}
                                  </span>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mt-2">
                              {item.inStock ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity & Actions */}
                          <div className="flex flex-col items-end gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity,
                                    "decrease"
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="text-sm">-</span>
                              </button>
                              <span className="w-6 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity,
                                    "increase"
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                              >
                                <span className="text-sm">+</span>
                              </button>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPrice(item.amount * item.quantity)}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary - UPDATED with centralized calculations */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Order Summary
                    </h2>

                    {/* Free Shipping Progress */}
                    {!state.isFreeShipping && (
                      <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          🚚 Free Shipping After Purchase Order of ₦990,000.00
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {getShippingMessage()}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Cart Subtotal ({state.totalItems} items)
                        </span>
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
                        <span className={`font-medium ${state.isFreeShipping ? "text-green-600" : ""}`}>
                          {state.isFreeShipping ? "Free" : formatPrice(state.shippingCost)}
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

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <Link
                        href="/checkout"
                        className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors text-center block"
                      >
                        Proceed to Checkout
                      </Link>

                      <Link
                        href="/shop"
                        className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                      >
                        Continue Shopping
                      </Link>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Benefits
                      </h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Free delivery on orders over ₦990,000</li>
                        <li>✓ 30-day return policy</li>
                        <li>✓ Secure payment options</li>
                        <li>✓ Customer support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}