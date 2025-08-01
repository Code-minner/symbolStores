// src/lib/email.ts - ANTI-SPAM OPTIMIZED VERSION
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export { resend };

// Import the same constants from CartContext to ensure consistency
const FREE_SHIPPING_THRESHOLD = 990000.00; // ₦990,000.00
const TAX_RATE = 0.0001; // 0.01% as a decimal
const SHIPPING_COST = 900.00; // ₦900.00

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

// Helper function to calculate totals
const calculateEmailTotals = (items: OrderItemForEmail[], providedSubtotal?: number) => {
  const totalAmountItemsOnly = providedSubtotal ?? items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
  const isFreeShipping = totalAmountItemsOnly >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
  const taxAmount = totalAmountItemsOnly * TAX_RATE;
  const finalTotal = totalAmountItemsOnly + shippingCost + taxAmount;
  
  return {
    totalAmountItemsOnly,
    shippingCost,
    taxAmount,
    finalTotal,
    isFreeShipping,
  };
};

// Helper function to ensure order data has calculated totals for emails
const ensureCalculatedTotalsForEmail = (orderData: OrderData | BankTransferInstructionsData | BankTransferConfirmationData) => {
  if (orderData.finalTotal !== undefined) {
    return {
      totalAmountItemsOnly: orderData.totalAmountItemsOnly!,
      shippingCost: orderData.shippingCost!,
      taxAmount: orderData.taxAmount!,
      finalTotal: orderData.finalTotal,
      isFreeShipping: orderData.isFreeShipping!,
    };
  }
  return calculateEmailTotals(orderData.items, orderData.totalAmountItemsOnly);
};

// Common email headers for anti-spam
const getEmailHeaders = (orderId: string, priority: string = "3") => ({
  "X-Entity-Ref-ID": orderId,
  "X-Priority": priority,
  "List-Unsubscribe": `<mailto:unsubscribe@symbolstores.com>`,
  "X-Auto-Response-Suppress": "OOF",
  "Precedence": "bulk",
});

// Common email styling for better compatibility
const getEmailStyles = () => `
  <style>
    .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
    .email-content { background-color: #ffffff; padding: 20px; }
    .header { background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center; }
    .section { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td, .table th { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background-color: #f9fafb; font-weight: bold; }
    .total-row { font-weight: bold; background-color: #f9fafb; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
`;

export class EmailService {
  // ANTI-SPAM: Bank transfer instructions
  static async sendBankTransferInstructions(data: BankTransferInstructionsData) {
    try {
      console.log("Sending bank transfer instructions email to:", data.customerEmail);

      const totals = ensureCalculatedTotalsForEmail(data);

      const itemsHtml = data.items.map((item) => {
        const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
        const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
        const itemTotal = itemPrice * itemQuantity;

        return `
        <tr>
          <td style="padding: 8px;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 50px; vertical-align: top;">
                  ${item.imageURL ? 
                    `<img src="${item.imageURL}" alt="${item.itemName}" style="width: 45px; height: 45px; border-radius: 4px; object-fit: cover; display: block;">` : 
                    `<div style="width: 45px; height: 45px; background-color: #f3f4f6; border-radius: 4px; text-align: center; line-height: 45px; font-size: 10px; color: #6b7280;">IMG</div>`
                  }
                </td>
                <td style="padding-left: 10px; vertical-align: top;">
                  <div style="font-weight: 500; font-size: 14px; margin-bottom: 2px;">${item.itemName}</div>
                  <div style="color: #6b7280; font-size: 12px;">₦${itemPrice.toLocaleString()} each</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: center; padding: 8px;">${itemQuantity}</td>
          <td style="text-align: right; padding: 8px;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
      }).join("");

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Instructions - Order ${data.orderId}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">Payment Instructions</h1>
            <p style="margin: 5px 0 0 0;">Order ${data.orderId}</p>
          </div>
          
          <div class="email-content">
            <div class="section">
              <h2 style="margin-top: 0;">Bank Transfer Details</h2>
              <table class="table">
                <tr><td><strong>Bank Name:</strong></td><td>${data.bankDetails.bankName}</td></tr>
                <tr><td><strong>Account Number:</strong></td><td style="font-family: monospace;">${data.bankDetails.accountNumber}</td></tr>
                <tr><td><strong>Account Name:</strong></td><td>${data.bankDetails.accountName}</td></tr>
                <tr class="total-row"><td><strong>Amount to Transfer:</strong></td><td><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
              </table>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Payment Instructions</h3>
              <ol>
                <li>Transfer exactly ₦${totals.finalTotal.toLocaleString()} to the account above</li>
                <li>Use "${data.orderId}" as your transfer description</li>
                <li>Save your transaction reference number</li>
                <li>Submit the reference number to confirm your order</li>
              </ol>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr><td>Subtotal (Items)</td><td></td><td style="text-align: right;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                  <tr><td>Shipping</td><td></td><td style="text-align: right;">${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}</td></tr>
                  <tr><td>Tax (0.01%)</td><td></td><td style="text-align: right;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                  <tr class="total-row"><td><strong>Total</strong></td><td></td><td style="text-align: right;"><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </tbody>
              </table>
              
              ${totals.isFreeShipping ? `
              <p style="color: #059669; font-size: 14px; margin-top: 10px;">
                You qualified for free shipping by spending over ₦${FREE_SHIPPING_THRESHOLD.toLocaleString()}.
              </p>
              ` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/order-success?orderId=${data.orderId}" class="button">
                Submit Transaction Reference
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Questions? Contact us at symbolstores45@gmail.com</p>
            <p>Order placed by ${data.customerName} (${data.customerEmail})</p>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
Payment Instructions - Order ${data.orderId}

Bank Transfer Details:
Bank: ${data.bankDetails.bankName}
Account: ${data.bankDetails.accountNumber}
Name: ${data.bankDetails.accountName}
Amount: ₦${totals.finalTotal.toLocaleString()}

Order Summary:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total: ₦${totals.finalTotal.toLocaleString()}

Instructions:
1. Transfer exactly ₦${totals.finalTotal.toLocaleString()}
2. Use "${data.orderId}" as description
3. Save transaction reference
4. Submit reference at: ${process.env.NEXT_PUBLIC_APP_URL}/order-success?orderId=${data.orderId}

Questions? Contact: symbolstores45@gmail.com
      `;

      const { data: emailResult, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [data.customerEmail],
        subject: `Payment Instructions - Order ${data.orderId}`,
        html,
        text: plainText,
        headers: getEmailHeaders(data.orderId, "2"),
        tags: [
          { name: "type", value: "payment-instructions" },
          { name: "order-id", value: data.orderId },
        ],
      });

      if (error) {
        console.error("Bank transfer instructions email error:", error);
        throw error;
      }

      console.log("Bank transfer instructions email sent successfully");
      return { success: true, data: emailResult };
    } catch (error) {
      console.error("Failed to send bank transfer instructions:", error);
      throw error;
    }
  }

  // ANTI-SPAM: Admin notification
  static async sendAdminNotification(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("Sending admin notification for order:", orderData.orderId);

      const itemsHtml = orderData.items.map(item => {
        const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
        const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
        const itemTotal = itemPrice * itemQuantity;
        return `
        <tr>
          <td style="padding: 8px;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 50px; vertical-align: top;">
                  ${item.imageURL ? 
                    `<img src="${item.imageURL}" alt="${item.itemName}" style="width: 45px; height: 45px; border-radius: 4px; object-fit: cover; display: block;">` : 
                    `<div style="width: 45px; height: 45px; background-color: #f3f4f6; border-radius: 4px; text-align: center; line-height: 45px; font-size: 10px; color: #6b7280;">IMG</div>`
                  }
                </td>
                <td style="padding-left: 10px; vertical-align: top;">
                  <div style="font-weight: 500; font-size: 14px; margin-bottom: 2px;">${item.itemName}</div>
                  <div style="color: #6b7280; font-size: 12px;">₦${itemPrice.toLocaleString()} each</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: center; padding: 8px;">${itemQuantity}</td>
          <td style="text-align: right; padding: 8px;">₦${itemTotal.toLocaleString()}</td>
        </tr>`;
      }).join('');

      const isBankTransfer = !!orderData.bankDetails;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order - ${orderData.orderId}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">New Order Received</h1>
            <p style="margin: 5px 0 0 0;">Order ${orderData.orderId}</p>
          </div>
          
          <div class="email-content">
            <div class="section" style="background-color: ${isBankTransfer ? '#fef3c7' : '#ecfdf5'};">
              <h3 style="margin-top: 0;">${isBankTransfer ? 'Bank Transfer Order' : 'Flutterwave Payment'}</h3>
              <p style="margin: 0;">
                <strong>Status:</strong> ${isBankTransfer ? 'Awaiting Payment - Customer needs to complete transfer' : 'Payment Processed - Ready for fulfillment'}
              </p>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Customer Details</h3>
              <table class="table">
                <tr><td><strong>Name:</strong></td><td>${orderData.customerName}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${orderData.customerEmail}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>${orderData.customerPhone || 'Not provided'}</td></tr>
                <tr><td><strong>Payment Method:</strong></td><td>${isBankTransfer ? 'Bank Transfer' : 'Flutterwave'}</td></tr>
                <tr class="total-row"><td><strong>Order Total:</strong></td><td><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
              </table>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Items Ordered</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr><td>Subtotal</td><td></td><td style="text-align: right;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                  <tr><td>Shipping</td><td></td><td style="text-align: right;">${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}</td></tr>
                  <tr><td>Tax</td><td></td><td style="text-align: right;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                  <tr class="total-row"><td><strong>Final Total</strong></td><td></td><td style="text-align: right;"><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                </tbody>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}" class="button">
                View Order Details
              </a>
            </div>

            ${orderData.orderNotes ? `
            <div class="section">
              <h4 style="margin-top: 0;">Order Notes</h4>
              <p style="margin: 0; font-style: italic;">${orderData.orderNotes}</p>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Symbol Stores Admin System</p>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
New Order Received - ${orderData.orderId}

Customer: ${orderData.customerName} (${orderData.customerEmail})
Phone: ${orderData.customerPhone || 'Not provided'}
Payment: ${isBankTransfer ? 'Bank Transfer' : 'Flutterwave'}
Total: ₦${totals.finalTotal.toLocaleString()}

Status: ${isBankTransfer ? 'Awaiting Payment' : 'Payment Processed'}

Order Breakdown:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total: ₦${totals.finalTotal.toLocaleString()}

View Details: ${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores Admin <${process.env.FROM_EMAIL || "admin@symbolstores.com"}>`,
        to: [process.env.ADMIN_EMAIL || "admin@symbolstores.com"],
        subject: `New Order ${orderData.orderId} - ₦${totals.finalTotal.toLocaleString()} - ${orderData.customerName}`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "2"),
        tags: [
          { name: "type", value: "admin-notification" },
          { name: "payment-method", value: isBankTransfer ? "bank-transfer" : "flutterwave" },
        ],
      });

      if (error) {
        console.error("Admin email error:", error);
        return { success: false, error };
      }

      console.log("Admin notification email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Admin email service error:", error);
      return { success: false, error };
    }
  }

  // ANTI-SPAM: Bank transfer confirmation
  static async sendBankTransferConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("Sending bank transfer confirmation email");
      
      const itemsList = orderData.items.map(item => {
        const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
        const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
        const itemTotal = itemPrice * itemQuantity;
        return `${item.itemName} (Qty: ${itemQuantity}) - ₦${itemTotal.toLocaleString()}`;
      }).join('\n');

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Verified - ${orderData.orderId}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          <div class="header" style="background-color: #059669;">
            <h1 style="margin: 0; font-size: 20px;">Payment Verified</h1>
            <p style="margin: 5px 0 0 0;">Order ${orderData.orderId}</p>
          </div>
          
          <div class="email-content">
            <div class="section" style="background-color: #ecfdf5; text-align: center;">
              <h3 style="margin-top: 0; color: #059669;">Thank you ${orderData.customerName}!</h3>
              <p style="margin: 0;">Your bank transfer has been verified and your order is confirmed.</p>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <table class="table">
                <tr><td>Subtotal (Items)</td><td style="text-align: right;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                <tr><td>Shipping</td><td style="text-align: right;">${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}</td></tr>
                <tr><td>Tax (0.01%)</td><td style="text-align: right;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
              </table>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Items Ordered</h3>
              <div style="font-family: monospace; font-size: 14px; white-space: pre-line;">${itemsList}</div>
            </div>

            <div class="section" style="background-color: #dbeafe;">
              <h3 style="margin-top: 0;">What happens next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>We are preparing your order for shipment</li>
                <li>You will receive tracking details once shipped</li>
                <li>Estimated delivery: 3-5 business days</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Questions? Contact: symbolstores45@gmail.com | +234 801 234 5678</p>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
Payment Verified - Order ${orderData.orderId}

Thank you ${orderData.customerName}!
Your bank transfer has been verified and your order is confirmed.

Order Summary:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total Paid: ₦${totals.finalTotal.toLocaleString()}

Items Ordered:
${itemsList}

What happens next:
- We are preparing your order for shipment
- You will receive tracking details once shipped
- Estimated delivery: 3-5 business days

Questions? Contact: symbolstores45@gmail.com | +234 801 234 5678
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [orderData.customerEmail],
        subject: `Payment Verified - Order ${orderData.orderId}`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "2"),
        tags: [
          { name: "type", value: "payment-verified" },
          { name: "order-id", value: orderData.orderId },
        ],
      });

      if (error) {
        console.error("Bank transfer confirmation email error:", error);
        return { success: false, error };
      }

      console.log("Bank transfer confirmation email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Bank transfer confirmation email service error:", error);
      return { success: false, error };
    }
  }

  // ANTI-SPAM: Regular order confirmation
  static async sendOrderConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("Sending order confirmation email to:", orderData.customerEmail);

      const itemsList = orderData.items.map(item => {
        const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
        const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
        const itemTotal = itemPrice * itemQuantity;
        return `${item.itemName} (Qty: ${itemQuantity}) - ₦${itemTotal.toLocaleString()}`;
      }).join('\n');

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${orderData.orderId}</title>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">Order Confirmed</h1>
            <p style="margin: 5px 0 0 0;">Order ${orderData.orderId}</p>
          </div>
          
          <div class="email-content">
            <div class="section" style="background-color: #ecfdf5; text-align: center;">
              <h3 style="margin-top: 0; color: #059669;">Thank you ${orderData.customerName}!</h3>
              <p style="margin: 0;">Your payment has been received and your order is being processed.</p>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <table class="table">
                <tr><td><strong>Order ID:</strong></td><td>${orderData.orderId}</td></tr>
                <tr><td><strong>Payment Method:</strong></td><td>${orderData.bankDetails ? "Bank Transfer" : "Flutterwave"}</td></tr>
              </table>
              
              <table class="table" style="margin-top: 15px;">
                <tr><td>Subtotal (Items)</td><td style="text-align: right;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                <tr><td>Shipping</td><td style="text-align: right;">${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}</td></tr>
                <tr><td>Tax (0.01%)</td><td style="text-align: right;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong>₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
              </table>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Items Ordered</h3>
              <div style="font-family: monospace; font-size: 14px; white-space: pre-line;">${itemsList}</div>
            </div>

            <div class="section" style="background-color: #dbeafe;">
              <h3 style="margin-top: 0;">What happens next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>We are preparing your order for shipment</li>
                <li>You will receive tracking details once shipped</li>
                <li>Estimated delivery: 3-5 business days</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Questions? Contact: symbolstores45@gmail.com | +234 801 234 5678</p>
          </div>
        </div>
      </body>
      </html>`;

      const plainText = `
Order Confirmation - ${orderData.orderId}

Thank you ${orderData.customerName}!
Your payment has been received and your order is being processed.

Order Details:
Order ID: ${orderData.orderId}
Payment Method: ${orderData.bankDetails ? "Bank Transfer" : "Flutterwave"}

Order Summary:
Subtotal: ₦${totals.totalAmountItemsOnly.toLocaleString()}
Shipping: ${totals.isFreeShipping ? 'FREE' : '₦' + totals.shippingCost.toLocaleString()}
Tax: ₦${totals.taxAmount.toLocaleString()}
Total Paid: ₦${totals.finalTotal.toLocaleString()}

Items Ordered:
${itemsList}

What happens next:
- We are preparing your order for shipment
- You will receive tracking details once shipped
- Estimated delivery: 3-5 business days

Questions? Contact: symbolstores45@gmail.com | +234 801 234 5678
      `;

      const { data, error } = await resend.emails.send({
        from: `Symbol Stores <${process.env.FROM_EMAIL || "orders@symbolstores.com"}>`,
        to: [orderData.customerEmail],
        subject: `Order Confirmation ${orderData.orderId}`,
        html,
        text: plainText,
        headers: getEmailHeaders(orderData.orderId, "2"),
        tags: [
          { name: "type", value: "order-confirmation" },
          { name: "payment-method", value: orderData.bankDetails ? "bank-transfer" : "flutterwave" },
        ],
      });

      if (error) {
        console.error("Email send error:", error);
        return { success: false, error };
      }

      console.log("Order confirmation email sent successfully");
      return { success: true, data };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error };
    }
  }

  // Existing method
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