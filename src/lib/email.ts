// src/lib/email.ts - CLEAN PROFESSIONAL VERSION WITH ROUNDING
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export { resend };

// Import the same constants from CartContext to ensure consistency
const FREE_SHIPPING_THRESHOLD = 990000.0; // ₦990,000.00
const TAX_RATE = 0.0001; // 0.01% as a decimal
const SHIPPING_COST = 900.0; // ₦900.00

// --- PRICE ROUNDING HELPER (same as CartContext) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

// Company branding - Add your logo URL here
const COMPANY_LOGO_URL = "https://blogger.googleusercontent.com/img/a/AVvXsEgK1twSSTpBfb733eXn3ufZ_gpU17vzZ0v25saCwUZRlrXQT3ceONzwo06auDlfUJt_7cEXDPIS-4IJLufMCFsEjDT_OcH5jHCXjUGA5b3iEAmQRL11hF_kPekeJOGvW0PYBnozZoTRdQtB5VHyvz4zbsXU3s1KK2MjnUuE3n-B2TtIiSSPwDSwJ4vL0HM"; // Replace with your actual logo URL
const COMPANY_NAME = "Symbol Stores";
const FALLBACK_LOGO = "SS"; // Fallback text if logo fails to load

interface OrderItemForEmail {
  itemName: string;
  quantity: number;
  amount: number;
  imageURL?: string;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  items: OrderItemForEmail[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    sortCode?: string;
  };
  orderNotes?: string;
  totalAmountItemsOnly?: number;
  shippingCost?: number;
  taxAmount?: number;
  finalTotal?: number;
  isFreeShipping?: boolean;
}

interface BankTransferInstructionsData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    amount: number;
    imageURL?: string;
  }>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  totalAmountItemsOnly?: number;
  shippingCost?: number;
  taxAmount?: number;
  finalTotal?: number;
  isFreeShipping?: boolean;
}

interface BankTransferConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    amount: number;
    imageURL?: string;
  }>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  totalAmountItemsOnly?: number;
  shippingCost?: number;
  taxAmount?: number;
  finalTotal?: number;
  isFreeShipping?: boolean;
}

// ✅ UPDATED: Helper function to calculate totals WITH ROUNDING (same as CartContext)
const calculateEmailTotals = (
  items: OrderItemForEmail[],
  providedSubtotal?: number
) => {
  // Round up individual item totals to nearest 10, then sum
  const totalAmountItemsOnly = providedSubtotal ?? 
    items.reduce((sum, item) => {
      const itemTotal = roundUpToNearest10(item.amount * item.quantity);
      return sum + itemTotal;
    }, 0);

  // Calculate shipping with rounding
  const isFreeShipping = totalAmountItemsOnly >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : roundUpToNearest10(SHIPPING_COST);

  // Calculate tax with rounding
  const taxAmount = roundUpToNearest10(totalAmountItemsOnly * TAX_RATE);

  // Calculate final total with rounding
  const finalTotal = roundUpToNearest10(totalAmountItemsOnly + shippingCost + taxAmount);

  return {
    totalAmountItemsOnly,
    shippingCost,
    taxAmount,
    finalTotal,
    isFreeShipping,
  };
};

// Helper function to generate company logo HTML
const getCompanyLogoHtml = () => {
  return `
    <div style="margin: 0 auto 16px; text-align: center;">
      <img src="${COMPANY_LOGO_URL}" 
           alt="${COMPANY_NAME}" 
           style="width: 48px; height: 48px; border-radius: 12px; display: block; margin: 0 auto; object-fit: contain;"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="width: 55px; height: 55px; background-color: rgba(255,255,255,0.15); margin: 0 auto; display: none; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: white;">
        ${FALLBACK_LOGO}
      </div>
    </div>
  `;
};

// ✅ UPDATED: Helper function to ensure order data has calculated totals for emails WITH ROUNDING
const ensureCalculatedTotalsForEmail = (
  orderData:
    | OrderData
    | BankTransferInstructionsData
    | BankTransferConfirmationData
) => {
  if (orderData.finalTotal !== undefined) {
    // ✅ FIXED: Even if totals are provided, ensure they're rounded
    return {
      totalAmountItemsOnly: roundUpToNearest10(orderData.totalAmountItemsOnly!),
      shippingCost: roundUpToNearest10(orderData.shippingCost!),
      taxAmount: roundUpToNearest10(orderData.taxAmount!),
      finalTotal: roundUpToNearest10(orderData.finalTotal),
      isFreeShipping: orderData.isFreeShipping!,
    };
  }
  return calculateEmailTotals(orderData.items, orderData.totalAmountItemsOnly);
};

// Professional email headers for anti-spam
const getEmailHeaders = (orderId: string, priority: string = "3") => ({
  "X-Entity-Ref-ID": orderId,
  "X-Priority": priority,
  "List-Unsubscribe": `<mailto:unsubscribe@symbolstores.com>`,
  "X-Auto-Response-Suppress": "OOF",
  Precedence: "bulk",
});

// Professional email styling with enhanced design
const getProfessionalEmailStyles = () => `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .email-wrapper { background-color: #f8fafc; padding: 20px 0; min-height: 100vh; }
    .email-container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); }
    .email-content { padding: 0; }
    
    /* Professional Header */
    .header { background: linear-gradient(135deg, #e3e3e4ff 0%, #dae7fcff 100%); color: #ffffff; padding: 32px 24px; text-align: center; position: relative; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); opacity: 0.1; }
    .header-content { position: relative; z-index: 1; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; }
    .header p { font-size: 16px; opacity: 0.9; font-weight: 400; }
    
    /* Enhanced Sections */
    .section { margin: 24px; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #ffffff; }
    .section-success { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border-color: #bbf7d0; }
    .section-warning { background: linear-gradient(135deg, #fefbeb 0%, #fef7cd 100%); border-color: #fde047; }
    .section-info { background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-color: #bfdbfe; }
    
    /* Typography */
    .section h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1e293b; letter-spacing: -0.3px; }
    .section h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #334155; }
    .section h4 { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #475569; }
    .section p { font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 12px; }
    
    /* Professional Tables */
    .table { width: 100%; border-collapse: collapse; margin: 12px 0; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
    .table td, .table th { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table th { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover { background-color: #f8fafc; }
    .total-row { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); font-weight: 600; }
    .total-row td { color: #1e293b; border-top: 2px solid #cbd5e1; }
    
    /* Enhanced Buttons */
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600; font-size: 15px; text-align: center; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
    .button-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    
    /* Product Images */
    .product-image { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; display: block; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    .product-placeholder { width: 60px; height: 60px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; font-weight: 500; border: 2px dashed #cbd5e1; }
    .product-details { padding-left: 12px; }
    .product-name { font-weight: 600; font-size: 15px; color: #1e293b; margin-bottom: 4px; }
    .product-price { color: #64748b; font-size: 13px; }
    
    /* Status Badges */
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-confirmed { background-color: #d1fae5; color: #065f46; }
    .status-processing { background-color: #dbeafe; color: #1e40af; }
    
    /* Process Steps Styling */
    .process-steps { margin-top: 16px; }
    .process-step { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .process-step:last-child { margin-bottom: 0; }
    .step-number { width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; flex-shrink: 0; margin-top: 4px; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; color: #1e293b; font-size: 16px; margin-bottom: 4px; }
    .step-description { color: #64748b; font-size: 14px; line-height: 1.5; }
    .step-highlight { color: #dc2626; font-weight: 600; }
    
    /* Enhanced Footer */
    .footer { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-content { max-width: 500px; margin: 0 auto; }
    .footer h4 { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; }
    .footer p { font-size: 13px; color: #6b7280; margin-bottom: 8px; line-height: 1.5; }
    .footer-links { margin-top: 16px; }
    .footer-links a { color: #3b82f6; text-decoration: none; margin: 0 8px; font-size: 13px; }
    .company-info { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; }
    
    /* Responsive Design */
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 10px; }
      .email-container { border-radius: 8px; }
      .header { padding: 24px 16px; }
      .header h1 { font-size: 24px; }
      .section { margin: 16px; padding: 20px; }
      .table td, .table th { padding: 10px 12px; font-size: 13px; }
      .button { display: block; margin: 16px auto; max-width: 200px; }
      .product-image, .product-placeholder { width: 50px; height: 50px; }
      .process-step { flex-direction: column; gap: 12px; }
      .step-number { align-self: flex-start; }
    }
  </style>
`;

export class EmailService {
  // PROFESSIONAL: Bank transfer instructions
  static async sendBankTransferInstructions(
    data: BankTransferInstructionsData
  ) {
    try {
      console.log(
        "Sending professional bank transfer instructions email to:",
        data.customerEmail
      );

      const totals = ensureCalculatedTotalsForEmail(data);

      const itemsHtml = data.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
        <tr>
          <td style="padding: 12px;">
            <div style="display: flex; align-items: center;">
              ${
                item.imageURL
                  ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                  : `<div class="product-placeholder">IMG</div>`
              }
              <div class="product-details">
                <div class="product-name">${item.itemName}</div>
                <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
              </div>
            </div>
          </td>
          <td style="text-align: center; padding: 12px; font-weight: 600;">${itemQuantity}</td>
          <td style="text-align: right; padding: 12px; font-weight: 600; color: #1e293b;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
        })
        .join("");

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Payment Instructions - Order ${data.orderId}</title>
        ${getProfessionalEmailStyles()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="header-content">
                ${getCompanyLogoHtml()}
                <h1>Payment Instructions</h1>
                <p>Complete your order: ${data.orderId}</p>
              </div>
            </div>
            
            <div class="email-content">
              <div class="section section-info">
                <h2>Bank Transfer Details</h2>
                <p>Please transfer the exact amount below to complete your order:</p>
                <table class="table">
                  <tr><td><strong>Bank Name</strong></td><td>${data.bankDetails.bankName}</td></tr>
                  <tr><td><strong>Account Number</strong></td><td style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-weight: 600; color: #1e40af;">${data.bankDetails.accountNumber}</td></tr>
                  <tr><td><strong>Account Name</strong></td><td>${data.bankDetails.accountName}</td></tr>
                  <tr class="total-row"><td><strong>Amount to Transfer</strong></td><td><strong style="color: #dc2626; font-size: 16px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </table>
              </div>

              <div class="section section-warning">
                <h3>Payment Instructions</h3>
                <ol style="padding-left: 20px; line-height: 1.8; color: #374151;">
                  <li><strong>Transfer exactly ₦${totals.finalTotal.toLocaleString()}</strong> to the account above</li>
                  <li>Use "<strong>${data.orderId}</strong>" as your transfer description/narration</li>
                  <li>Save your transaction reference number</li>
                  <li>Submit the reference number using the button below</li>
                </ol>
              </div>

              <div class="section">
                <h3>Order Summary</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    <tr style="border-top: 2px solid #e2e8f0;"><td><strong>Subtotal (Items)</strong></td><td></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                    <tr><td><strong>Shipping</strong></td><td></td><td style="text-align: right; font-weight: 600; color: ${totals.isFreeShipping ? '#059669' : '#374151'};">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                    <tr><td><strong>Tax (0.01%)</strong></td><td></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                    <tr class="total-row"><td><strong>Final Total</strong></td><td></td><td style="text-align: right;"><strong style="font-size: 16px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                  </tbody>
                </table>
                
                ${
                  totals.isFreeShipping
                    ? `
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #10b981;">
                  <p style="color: #065f46; font-weight: 600; margin: 0;">Congratulations! You qualified for FREE shipping by spending over ₦${FREE_SHIPPING_THRESHOLD.toLocaleString()}!</p>
                </div>
                `
                    : ""
                }
              </div>

              <div style="text-align: center; margin: 32px 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/order-success?orderId=${data.orderId}" class="button">
                  Submit Transaction Reference
                </a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 12px;">Click here after completing your bank transfer</p>
              </div>
            </div>

            <div class="footer">
              <div class="footer-content">
                <h4>Need Help?</h4>
                <p>Email: <a href="mailto:symbolstores45@gmail.com">symbolstores45@gmail.com</a></p>
                <p>WhatsApp: <a href="https://wa.me/2348123456789">+234 812 345 6789</a></p>
                
                <div class="company-info">
                  Order placed by <strong>${data.customerName}</strong> • ${data.customerEmail}<br>
                  © 2024 Symbol Stores. Professional e-commerce solutions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
SYMBOL STORES - PAYMENT INSTRUCTIONS
====================================

Order: ${data.orderId}
Customer: ${data.customerName}

BANK TRANSFER DETAILS:
Bank: ${data.bankDetails.bankName}
Account: ${data.bankDetails.accountNumber}
Name: ${data.bankDetails.accountName}
Amount: ₦${totals.finalTotal.toLocaleString()}

INSTRUCTIONS:
1. Transfer exactly ₦${totals.finalTotal.toLocaleString()}
2. Use "${data.orderId}" as description
3. Save transaction reference
4. Submit reference at: ${process.env.NEXT_PUBLIC_APP_URL}/order-success?orderId=${data.orderId}

ORDER SUMMARY:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total: ₦${totals.finalTotal.toLocaleString()}

Questions? Contact: symbolstores45@gmail.com
      `;

      const { data: emailResult, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [data.customerEmail],
        subject: `Payment Instructions - Order ${data.orderId} (₦${totals.finalTotal.toLocaleString()})`,
        html,
        text: plainText,
        headers: getEmailHeaders(data.orderId, "2"),
        tags: [
          { name: "type", value: "payment-instructions" },
          { name: "order-id", value: data.orderId },
          { name: "amount", value: Math.round(totals.finalTotal).toString() },
        ],
      });

      if (error) {
        console.error("Bank transfer instructions email error:", error);
        throw error;
      }

      console.log("Professional bank transfer instructions email sent successfully");
      return { success: true, data: emailResult };
    } catch (error) {
      console.error("Failed to send bank transfer instructions:", error);
      throw error;
    }
  }

  // PROFESSIONAL: Admin notification
  static async sendAdminNotification(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("Sending professional admin notification for order:", orderData.orderId);

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;
          return `
        <tr>
          <td style="padding: 12px;">
            <div style="display: flex; align-items: center;">
              ${
                item.imageURL
                  ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                  : `<div class="product-placeholder">IMG</div>`
              }
              <div class="product-details">
                <div class="product-name">${item.itemName}</div>
                <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
              </div>
            </div>
          </td>
          <td style="text-align: center; padding: 12px; font-weight: 600;">${itemQuantity}</td>
          <td style="text-align: right; padding: 12px; font-weight: 600; color: #1e293b;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
        })
        .join("");

      const isBankTransfer = !!orderData.bankDetails;

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Alert - ${orderData.orderId}</title>
        ${getProfessionalEmailStyles()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="header-content">
                ${getCompanyLogoHtml()}
                <h1>New Order Alert</h1>
                <p>Order ${orderData.orderId} • ₦${totals.finalTotal.toLocaleString()}</p>
              </div>
            </div>
            
            <div class="email-content">
              <div class="section ${isBankTransfer ? 'section-warning' : 'section-success'}">
                <h2>${isBankTransfer ? 'Awaiting Payment' : 'Payment Confirmed'}</h2>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px;">
                  <span class="status-badge ${isBankTransfer ? 'status-pending' : 'status-confirmed'}">
                    ${isBankTransfer ? 'Bank Transfer Pending' : 'Paid via Flutterwave'}
                  </span>
                  <span style="font-size: 14px; color: #64748b;">
                    ${isBankTransfer ? 'Customer needs to complete transfer' : 'Ready for fulfillment'}
                  </span>
                </div>
              </div>

              <div class="section">
                <h3>Customer Information</h3>
                <table class="table">
                  <tr><td><strong>Name</strong></td><td>${orderData.customerName}</td></tr>
                  <tr><td><strong>Email</strong></td><td><a href="mailto:${orderData.customerEmail}" style="color: #3b82f6;">${orderData.customerEmail}</a></td></tr>
                  <tr><td><strong>Phone</strong></td><td><a href="tel:${orderData.customerPhone}" style="color: #3b82f6;">${orderData.customerPhone || "Not provided"}</a></td></tr>
                  <tr><td><strong>Payment Method</strong></td><td><span class="status-badge ${isBankTransfer ? 'status-pending' : 'status-processing'}">${isBankTransfer ? "Bank Transfer" : "Flutterwave"}</span></td></tr>
                  <tr class="total-row"><td><strong>Order Value</strong></td><td><strong style="color: #dc2626; font-size: 16px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </table>
              </div>

              <div class="section">
                <h3>Items Ordered</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    <tr style="border-top: 2px solid #e2e8f0;"><td><strong>Subtotal</strong></td><td></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                    <tr><td><strong>Shipping</strong></td><td></td><td style="text-align: right; font-weight: 600;">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                    <tr><td><strong>Tax</strong></td><td></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                    <tr class="total-row"><td><strong>Grand Total</strong></td><td></td><td style="text-align: right;"><strong style="font-size: 16px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                  </tbody>
                </table>
              </div>

              <div style="text-align: center; margin: 32px 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}" class="button">
                  View Full Order Details
                </a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 12px;">Access admin dashboard for complete order management</p>
              </div>

              ${
                orderData.orderNotes
                  ? `
              <div class="section section-info">
                <h4>Customer Notes</h4>
                <p style="font-style: italic; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6;">"${orderData.orderNotes}"</p>
              </div>
              `
                  : ""
              }
            </div>

            <div class="footer">
              <div class="footer-content">
                <h4>Symbol Stores Admin System</h4>
                <p>Professional order management dashboard</p>
                
                <div class="footer-links">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Dashboard</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders">All Orders</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/customers">Customers</a>
                </div>
                
                <div class="company-info">
                  Automated notification • ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
SYMBOL STORES - NEW ORDER ALERT
===============================

Order: ${orderData.orderId}
Value: ₦${totals.finalTotal.toLocaleString()}
Status: ${isBankTransfer ? "Awaiting Payment" : "Payment Confirmed"}

CUSTOMER:
Name: ${orderData.customerName}
Email: ${orderData.customerEmail}
Phone: ${orderData.customerPhone || "Not provided"}
Payment: ${isBankTransfer ? "Bank Transfer" : "Flutterwave"}

ORDER BREAKDOWN:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total: ₦${totals.finalTotal.toLocaleString()}

View Details: ${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}

${orderData.orderNotes ? `Notes: "${orderData.orderNotes}"` : ''}
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores Admin <${process.env.FROM_EMAIL || "admin@symbolstores.com"}>`,
        to: [process.env.ADMIN_EMAIL || "admin@symbolstores.com"],
        subject: `New Order ${orderData.orderId} - ₦${totals.finalTotal.toLocaleString()} - ${orderData.customerName}`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "1"),
        tags: [
          { name: "type", value: "admin-notification" },
          { name: "payment-method", value: isBankTransfer ? "bank-transfer" : "flutterwave" },
          { name: "amount", value: Math.round(totals.finalTotal).toString() },
          { name: "priority", value: "high" },
        ],
      });

      if (error) {
        console.error("Admin email error:", error);
        return { success: false, error };
      }

      console.log("Professional admin notification email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Admin email service error:", error);
      return { success: false, error };
    }
  }

  // PROFESSIONAL: Bank transfer confirmation
  static async sendBankTransferConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("Sending professional bank transfer confirmation email");

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
        <tr>
          <td style="padding: 12px;">
            <div style="display: flex; align-items: center;">
              ${
                item.imageURL
                  ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                  : `<div class="product-placeholder">IMG</div>`
              }
              <div class="product-details">
                <div class="product-name">${item.itemName}</div>
                <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
              </div>
            </div>
          </td>
          <td style="text-align: center; padding: 12px; font-weight: 600;">${itemQuantity}</td>
          <td style="text-align: right; padding: 12px; font-weight: 600; color: #1e293b;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
        })
        .join("");

      const itemsList = orderData.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;
          return `${item.itemName} (Qty: ${itemQuantity}) - ₦${itemTotal.toLocaleString()}`;
        })
        .join("\n");

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Verified - ${orderData.orderId}</title>
        ${getProfessionalEmailStyles()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
              <div class="header-content">
                ${getCompanyLogoHtml()}
                <h1>Payment Verified!</h1>
                <p>Order ${orderData.orderId} confirmed</p>
              </div>
            </div>
            
            <div class="email-content">
              <div class="section section-success" style="text-align: center;">
                <h2 style="color: #065f46;">Thank you ${orderData.customerName}!</h2>
                <p style="font-size: 16px; margin: 12px 0;">Your bank transfer has been successfully verified and your order is now confirmed. We're excited to get your items ready for delivery!</p>
                <span class="status-badge status-confirmed">Payment Verified</span>
              </div>

              <div class="section">
                <h3>Order Summary</h3>
                <table class="table">
                  <tr><td><strong>Order ID</strong></td><td style="font-family: 'SF Mono', Monaco, monospace; color: #3b82f6;">${orderData.orderId}</td></tr>
                  <tr><td><strong>Payment Method</strong></td><td><span class="status-badge status-confirmed">Bank Transfer</span></td></tr>
                  <tr><td><strong>Order Date</strong></td><td>${new Date().toLocaleDateString('en-NG')}</td></tr>
                </table>
                
                <table class="table" style="margin-top: 16px;">
                  <tr><td><strong>Subtotal (Items)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                  <tr><td><strong>Shipping</strong></td><td style="text-align: right; font-weight: 600; color: ${totals.isFreeShipping ? '#059669' : '#374151'};">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                  <tr><td><strong>Tax (0.01%)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                  <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong style="color: #059669; font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </table>
              </div>

              <div class="section">
                <h3>Items in Your Order</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <div class="section section-info">
                <h3>What Happens Next?</h3>
                <div class="process-steps">
                  <div class="process-step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                      <div class="step-title">Order Processing</div>
                      <div class="step-description">We're carefully preparing your items for shipment</div>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                      <div class="step-title">Shipping Notification</div>
                      <div class="step-description">You'll receive tracking details once your order ships</div>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                      <div class="step-title">Delivery</div>
                      <div class="step-description"><span class="step-highlight">Estimated: 3-5 business days</span> to your location</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin: 32px 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button button-success">
                  Track Your Order
                </a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 12px;">Monitor your order status and delivery progress</p>
              </div>
            </div>

            <div class="footer">
              <div class="footer-content">
                <h4>Need Assistance?</h4>
                <p>Email: <a href="mailto:symbolstores45@gmail.com">symbolstores45@gmail.com</a></p>
                <p>WhatsApp: <a href="https://wa.me/2348123456789">+234 812 345 6789</a></p>
                <p>Business Hours: Monday - Saturday, 9AM - 6PM (WAT)</p>
                
                <div class="footer-links">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/returns">Returns Policy</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact">Contact Us</a>
                </div>
                
                <div class="company-info">
                  Thank you for choosing Symbol Stores!<br>
                  © 2024 Symbol Stores. Professional e-commerce solutions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
SYMBOL STORES - PAYMENT VERIFIED
================================

Thank you ${orderData.customerName}!

Your bank transfer has been verified and your order is confirmed.

ORDER DETAILS:
Order ID: ${orderData.orderId}
Payment: Bank Transfer ✅
Date: ${new Date().toLocaleDateString('en-NG')}

PAYMENT SUMMARY:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total Paid: ₦${totals.finalTotal.toLocaleString()}

ITEMS ORDERED:
${itemsList}

WHAT'S NEXT:
1. Order Processing - We're preparing your items
2. Shipping Notification - You'll get tracking details
3. Delivery - Estimated 3-5 business days

Track Order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}

SUPPORT:
Email: symbolstores45@gmail.com
WhatsApp: +234 812 345 6789
Hours: Mon-Sat, 9AM-6PM (WAT)
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [orderData.customerEmail],
        subject: `Payment Verified - Order ${orderData.orderId} (₦${totals.finalTotal.toLocaleString()})`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "2"),
        tags: [
          { name: "type", value: "payment-verified" },
          { name: "order-id", value: orderData.orderId },
          { name: "amount", value: Math.round(totals.finalTotal).toString() },
          { name: "status", value: "confirmed" },
        ],
      });

      if (error) {
        console.error("Bank transfer confirmation email error:", error);
        return { success: false, error };
      }

      console.log("Professional bank transfer confirmation email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Bank transfer confirmation email service error:", error);
      return { success: false, error };
    }
  }

  // PROFESSIONAL: Regular order confirmation
  static async sendOrderConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log(
        "Sending professional order confirmation email to:",
        orderData.customerEmail
      );

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
        <tr>
          <td style="padding: 12px;">
            <div style="display: flex; align-items: center;">
              ${
                item.imageURL
                  ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                  : `<div class="product-placeholder">IMG</div>`
              }
              <div class="product-details">
                <div class="product-name">${item.itemName}</div>
                <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
              </div>
            </div>
          </td>
          <td style="text-align: center; padding: 12px; font-weight: 600;">${itemQuantity}</td>
          <td style="text-align: right; padding: 12px; font-weight: 600; color: #1e293b;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
        })
        .join("");

      const itemsList = orderData.items
        .map((item) => {
          const itemPrice =
            typeof item.amount === "number" && !isNaN(item.amount)
              ? item.amount
              : 0;
          const itemQuantity =
            typeof item.quantity === "number" && !isNaN(item.quantity)
              ? item.quantity
              : 1;
          const itemTotal = itemPrice * itemQuantity;
          return `${item.itemName} (Qty: ${itemQuantity}) - ₦${itemTotal.toLocaleString()}`;
        })
        .join("\n");

      const paymentMethod = orderData.bankDetails ? "Bank Transfer" : "Flutterwave";

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed - ${orderData.orderId}</title>
        ${getProfessionalEmailStyles()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="header-content">
                ${getCompanyLogoHtml()}
                <h1>Order Confirmed!</h1>
                <p>Order ${orderData.orderId} • ₦${totals.finalTotal.toLocaleString()}</p>
              </div>
            </div>
            
            <div class="email-content">
              <div class="section section-success" style="text-align: center;">
                <h2 style="color: #065f46;">Thank you ${orderData.customerName}!</h2>
                <p style="font-size: 16px; margin: 12px 0;">Your payment has been successfully received and your order is now being processed. We appreciate your business!</p>
                <span class="status-badge status-confirmed">Order Confirmed</span>
              </div>

              <div class="section">
                <h3>Order Details</h3>
                <table class="table">
                  <tr><td><strong>Order ID</strong></td><td style="font-family: 'SF Mono', Monaco, monospace; color: #3b82f6;">${orderData.orderId}</td></tr>
                  <tr><td><strong>Payment Method</strong></td><td><span class="status-badge ${paymentMethod === 'Bank Transfer' ? 'status-pending' : 'status-processing'}">${paymentMethod}</span></td></tr>
                  <tr><td><strong>Order Date</strong></td><td>${new Date().toLocaleDateString('en-NG')}</td></tr>
                  <tr><td><strong>Customer</strong></td><td>${orderData.customerName} (${orderData.customerEmail})</td></tr>
                </table>
                
                <table class="table" style="margin-top: 16px;">
                  <tr><td><strong>Subtotal (Items)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                  <tr><td><strong>Shipping</strong></td><td style="text-align: right; font-weight: 600; color: ${totals.isFreeShipping ? '#059669' : '#374151'};">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                  <tr><td><strong>Tax (0.01%)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                  <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong style="color: #059669; font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </table>
              </div>

              <div class="section">
                <h3>Items Ordered</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <div class="section section-info">
                <h3>What Happens Next?</h3>
                <div class="process-steps">
                  <div class="process-step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                      <div class="step-title">Order Processing</div>
                      <div class="step-description">We're preparing your items for shipment</div>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                      <div class="step-title">Shipping Notification</div>
                      <div class="step-description">You'll receive tracking details once shipped</div>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                      <div class="step-title">Delivery</div>
                      <div class="step-description"><span class="step-highlight">Estimated: 3-5 business days</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin: 32px 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button">
                  Track Your Order
                </a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 12px;">Monitor your order status and delivery progress</p>
              </div>
            </div>

            <div class="footer">
              <div class="footer-content">
                <h4>Need Help?</h4>
                <p>Email: <a href="mailto:symbolstores45@gmail.com">symbolstores45@gmail.com</a></p>
                <p>WhatsApp: <a href="https://wa.me/2348123456789">+234 812 345 6789</a></p>
                <p>Business Hours: Monday - Saturday, 9AM - 6PM (WAT)</p>
                
                <div class="footer-links">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/returns">Returns Policy</a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact">Contact Us</a>
                </div>
                
                <div class="company-info">
                  Thank you for choosing Symbol Stores!<br>
                  © 2024 Symbol Stores. Professional e-commerce solutions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
SYMBOL STORES - ORDER CONFIRMED
===============================

Thank you ${orderData.customerName}!

Your payment has been received and your order is being processed.

ORDER DETAILS:
Order ID: ${orderData.orderId}
Payment: ${paymentMethod} ✅
Date: ${new Date().toLocaleDateString('en-NG')}

PAYMENT SUMMARY:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total Paid: ₦${totals.finalTotal.toLocaleString()}

ITEMS ORDERED:
${itemsList}

WHAT'S NEXT:
1. Order Processing - We're preparing your items
2. Shipping Notification - You'll get tracking details  
3. Delivery - Estimated 3-5 business days

Track Order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}

SUPPORT:
Email: symbolstores45@gmail.com
WhatsApp: +234 812 345 6789
Hours: Mon-Sat, 9AM-6PM (WAT)
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [orderData.customerEmail],
        subject: `Order Confirmed ${orderData.orderId} - ₦${totals.finalTotal.toLocaleString()}`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "2"),
        tags: [
          { name: "type", value: "order-confirmation" },
          { name: "payment-method", value: orderData.bankDetails ? "bank-transfer" : "flutterwave" },
          { name: "amount", value: Math.round(totals.finalTotal).toString() },
          { name: "status", value: "confirmed" },
        ],
      });

      if (error) {
        console.error("Email send error:", error);
        return { success: false, error };
      }

      console.log("Professional order confirmation email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error };
    }
  }

  // Existing method (unchanged)
  static async sendAdminPaymentProofNotification(data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    filename: string;
  }) {
    return { success: true, data: null };
  }
}