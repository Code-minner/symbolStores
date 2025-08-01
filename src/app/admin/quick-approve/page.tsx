// src/app/admin/quick-approve/page.tsx
"use client";

import { useState } from "react";

export default function QuickApprovePage() {
  const [orderId, setOrderId] = useState("BT-1753900934604-q8672yix8");
  const [notes, setNotes] = useState("Payment verified and approved");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const approveOrder = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/admin/dashboard/orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "approve",
          notes,
          verifiedBy: "Admin Quick Approve",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(
          "✅ ORDER APPROVED SUCCESSFULLY! Customer has been notified."
        );
      } else {
        setResult("❌ ERROR: " + data.error);
      }
    } catch (error) {
      setResult("❌ FAILED: " + error);
    } finally {
      setLoading(false);
    }
  };

  const rejectOrder = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/admin/dashboard/orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "reject",
          notes,
          verifiedBy: "Admin Quick Approve",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult("❌ ORDER REJECTED. Customer has been notified.");
      } else {
        setResult("❌ ERROR: " + data.error);
      }
    } catch (error) {
      setResult("❌ FAILED: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🚨 URGENT: Quick Order Approval
          </h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID:
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter Order ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add verification notes..."
              />
            </div>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={approveOrder}
              disabled={loading || !orderId}
              className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold"
            >
              {loading ? "⏳ Processing..." : "✅ APPROVE ORDER"}
            </button>

            <button
              onClick={rejectOrder}
              disabled={loading || !orderId}
              className="flex-1 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold"
            >
              {loading ? "⏳ Processing..." : "❌ REJECT ORDER"}
            </button>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg ${result.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <p className="font-medium">{result}</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Current Pending Order:
            </h3>
            <div className="text-sm text-blue-800">
              <p>
                <strong>Order:</strong> BT-1753900934604-q8672yix8
              </p>
              <p>
                <strong>Customer:</strong> Opeyemi Boluwatife
              </p>
              <p>
                <strong>Amount:</strong> ₦852,100
              </p>
              <p>
                <strong>Reference:</strong> JNJGNMRGMVGKMRGVKNMG
              </p>
              <p>
                <strong>Status:</strong> Waiting for manual approval
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
