// src/app/cart/page.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const { state, removeFromCart, updateQuantity, clearCart, formatPrice } = useCart();

  const handleQuantityChange = (itemId: string, currentQuantity: number, type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      updateQuantity(itemId, currentQuantity + 1);
    } else if (type === 'decrease' && currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  const getProductUrl = (item: any) => {
    return `/home/${item.category.toLowerCase().replace(/\s+/g, '-')}/${item.subcategory.toLowerCase().replace(/\s+/g, '-')}/${item.slug}`;
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Cart", href: "#" }
  ];

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
          
          {/* Breadcrumbs */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <span className="text-gray-400 mx-2">›</span>}
                  <Link
                    href={item.href}
                    className={`hover:text-blue-600 ${index === breadcrumbs.length - 1
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600'
                      }`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
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
                <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h2>
                    
                    <div className="space-y-6">
                      {state.items.map((item, index) => (
                        <div key={item.id} className={`flex gap-4 ${index !== state.items.length - 1 ? 'border-b border-gray-200 pb-6' : ''}`}>
                          
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
                              className="text-lg font-medium text-gray-900 hover:text-red-600 transition-colors block"
                            >
                              {item.itemName}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.brand} • {item.category} • {item.subcategory}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
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
                              {item.originalPrice && item.originalPrice > item.amount && (
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
                                onClick={() => handleQuantityChange(item.id, item.quantity, 'decrease')}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="text-sm">-</span>
                              </button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity, 'increase')}
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
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({state.totalItems} items)</span>
                        <span className="font-medium">{formatPrice(state.totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (VAT)</span>
                        <span className="font-medium">Calculated at checkout</span>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span className="text-red-600">{formatPrice(state.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <button className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors">
                        Proceed to Checkout
                      </button>
                      
                      <Link 
                        href="/shop"
                        className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                      >
                        Continue Shopping
                      </Link>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Benefits</h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Free delivery on orders over ₦50,000</li>
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