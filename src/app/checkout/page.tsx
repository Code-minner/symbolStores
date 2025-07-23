// src/app/checkout/page.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/CartContext";

export default function CheckoutPage() {
  const { state, formatPrice } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("card");
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

  const shippingCost = 0; // Free shipping
  const tax = 0; // Calculated at checkout
  const totalAmount = state.totalAmount + shippingCost + tax;

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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
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
                            First name
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
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last name
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
                          Address
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
                        />
                      </div>

                      {/* Location Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
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
                          >
                            <option value="">Select</option>
                            <option value="nigeria">Nigeria</option>
                            <option value="ghana">Ghana</option>
                            <option value="kenya">Kenya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Region/State
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
                          >
                            <option value="">Select</option>
                            <option value="lagos">Lagos</option>
                            <option value="abuja">Abuja</option>
                            <option value="kano">Kano</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
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
                          >
                            <option value="">Select</option>
                            <option value="ikeja">Ikeja</option>
                            <option value="victoria-island">
                              Victoria Island
                            </option>
                            <option value="lekki">Lekki</option>
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
                            placeholder="Zip code"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
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
                            placeholder="Email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
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
                            placeholder="Phone number"
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
                          Ship into different address
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Payment Option */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
                      Payment Option
                    </h2>

                    <div className="space-y-4">
                      {/* Bank Transfer */}
                      <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          id="bank-transfer"
                          name="payment"
                          value="bank"
                          checked={selectedPayment === "bank"}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="bank-transfer"
                          className="ml-3 flex items-center"
                        >
                          <span className="text-blue-600 font-medium">
                            Bank Transfer
                          </span>
                        </label>
                      </div>

                      {/* Amazon Pay / Flutterwave */}
                      <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          id="amazon-pay"
                          name="payment"
                          value="amazon"
                          checked={selectedPayment === "amazon"}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="amazon-pay"
                          className="ml-3 flex items-center"
                        >
                          <span className="text-orange-500 font-medium">
                            Amazon Pay
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            (Flutterwave)
                          </span>
                        </label>
                      </div>

                      {/* Credit/Debit Card */}
                      <div className="border border-gray-200 rounded-lg">
                        <div className="flex items-center p-4">
                          <input
                            type="radio"
                            id="credit-card"
                            name="payment"
                            value="card"
                            checked={selectedPayment === "card"}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="credit-card"
                            className="ml-3 flex items-center"
                          >
                            <span className="font-medium">
                              Credit/Debit Card
                            </span>
                            <div className="ml-3 flex items-center">
                              <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  M
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Card Details */}
                        {selectedPayment === "card" && (
                          <div className="p-4 border-t border-gray-200 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name on Card
                              </label>
                              <input
                                type="text"
                                value={cardInfo.nameOnCard}
                                onChange={(e) =>
                                  handleInputChange(
                                    "card",
                                    "nameOnCard",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Name on card"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Card Number
                              </label>
                              <input
                                type="text"
                                value={cardInfo.cardNumber}
                                onChange={(e) =>
                                  handleInputChange(
                                    "card",
                                    "cardNumber",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Expiry Date
                                </label>
                                <input
                                  type="text"
                                  value={cardInfo.expiryDate}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "card",
                                      "expiryDate",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="MM/YY"
                                  maxLength={5}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  CVC
                                </label>
                                <input
                                  type="text"
                                  value={cardInfo.cvc}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "card",
                                      "cvc",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="123"
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          </div>
                        )}
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
                    Order Summary
                  </h2>

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

                  {/* Order Totals */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(state.totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">₦0.00</span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-red-600">
                          {formatPrice(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <div className="mt-6">
                    <Link
                      href="/review"
                      className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors block text-center"
                    >
                      Review
                    </Link>
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
