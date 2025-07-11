// src/components/CartSidebar.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

export default function CartSidebar() {
  const { state, removeFromCart, updateQuantity, closeCart, formatPrice } = useCart();

  if (!state.isOpen) return null;

  const handleQuantityChange = (itemId: string, currentQuantity: number, type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      updateQuantity(itemId, currentQuantity + 1);
    } else if (type === 'decrease' && currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({state.totalItems})
            </h2>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some products to get started</p>
                <button
                  onClick={closeCart}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 bg-white rounded flex-shrink-0">
                      <Image
                        src={item.imageURL}
                        alt={item.itemName}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.itemName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.brand} • {item.category}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-semibold text-red-600">
                          {formatPrice(item.amount)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.amount && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, 'decrease')}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm">-</span>
                        </button>
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity, 'increase')}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <span className="text-sm">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-red-600">{formatPrice(state.totalAmount)}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link 
                  href="/cart"
                  onClick={closeCart}
                  className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  View Cart
                </Link>
                <button className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors">
                  Checkout
                </button>
              </div>

              {/* Continue Shopping */}
              <button
                onClick={closeCart}
                className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}