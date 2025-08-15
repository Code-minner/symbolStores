// src/lib/email.ts - MIGRATED TO ZEPTOMAIL WITH NODEMAILER (WORKING VERSION)
import nodemailer from "nodemailer";

// Create SMTP transporter - fully configurable through environment variables
const transporter = nodemailer.createTransport({
  host: process.env.ZEPTOMAIL_HOST || "smtp.zeptomail.com",
  port: parseInt(process.env.ZEPTOMAIL_PORT || "465"),
  secure: process.env.ZEPTOMAIL_PORT === "465" ? true : false, // Auto-detect based on port
  auth: {
    user: process.env.ZEPTOMAIL_USER,
    pass: process.env.ZEPTOMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Import the same constants from CartContext to ensure consistency
const FREE_SHIPPING_THRESHOLD = 990000.0; // ₦990,000.00
const TAX_RATE = 0.0001; // 0.01% as a decimal
const SHIPPING_COST = 900.0; // ₦900.00

// --- PRICE ROUNDING HELPER (same as CartContext) ---
const roundUpToNearest10 = (price: number): number => {
  return Math.ceil(price / 10) * 10;
};

// Company branding - fully configurable through environment variables
const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || "https://blogger.googleusercontent.com/img/a/AVvXsEgK1twSSTpBfb733eXn3ufZ_gpU17vzZ0v25saCwUZRlrXQT3ceONzwo06auDlfUJt_7cEXDPIS-4IJLufMCFsEjDT_OcH5jHCXjUGA5b3iEAmQRL11hF_kPekeJOGvW0PYBnozZoTRdQtB5VHyvz4zbsXU3s1KK2MjnUuE3n-B2TtIiSSPwDSwJ4vL0HM";
const COMPANY_NAME = process.env.COMPANY_NAME || "Symbol Stores";
const FALLBACK_LOGO = COMPANY_NAME.split(' ').map(word => word[0]).join('').toUpperCase() || "SS";

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

// ✅ NEW: Payment failure email interface
interface PaymentFailureEmailData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  amount: number;
  reason: string;
  retryLink: string;
  supportEmail: string;
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
    <div style="margin: 0 auto 20px; text-align: center;">
      <img src="${COMPANY_LOGO_URL}" 
           alt="${COMPANY_NAME}" 
           style="width: 56px; height: 56px; border-radius: 16px; display: block; margin: 0 auto; object-fit: contain; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #64748b, #475569); margin: 0 auto; display: none; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
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

// ✅ UPDATED: Professional Modern Gray Theme Styling
const getProfessionalEmailStyles = () => `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Helvetica, Arial, sans-serif; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
      margin: 0; 
      padding: 0; 
      line-height: 1.6;
    }
    .email-wrapper { 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
      padding: 24px 12px; 
      min-height: 100vh; 
    }
    .email-container { 
      max-width: 680px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 20px; 
      overflow: hidden; 
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 16px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }
    
    /* Modern Header Design */
    .header { 
      background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); 
      color: #ffffff; 
      padding: 40px 32px; 
      text-align: center; 
      position: relative; 
      overflow: hidden;
    }
    .header::before { 
      content: ''; 
      position: absolute; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); 
    }
    .header-content { position: relative; z-index: 1; }
    .header h1 { 
      font-size: 32px; 
      font-weight: 700; 
      margin-bottom: 8px; 
      letter-spacing: -0.8px; 
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header p { 
      font-size: 17px; 
      opacity: 0.9; 
      font-weight: 400; 
      color: #cbd5e1;
    }
    
    /* Success Header Variant */
    .header-success { 
      background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%); 
    }
    
    /* Warning Header Variant */
    .header-warning { 
      background: linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%); 
    }
    
    /* Error Header Variant */
    .header-error { 
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%); 
    }
    
    /* Enhanced Section Styling */
    .email-content { padding: 0; }
    .section { 
      margin: 32px; 
      padding: 28px; 
      border-radius: 16px; 
      background: #ffffff;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 6px rgba(15, 23, 42, 0.02);
    }
    .section-success { 
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); 
      border: 1px solid #bbf7d0; 
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.08);
    }
    .section-warning { 
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
      border: 1px solid #fde047; 
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
    }
    .section-info { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
      border: 1px solid #cbd5e1; 
      box-shadow: 0 4px 12px rgba(71, 85, 105, 0.04);
    }
    .section-error { 
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
      border: 1px solid #fca5a5; 
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
    }
    
    /* Modern Typography */
    .section h2 { 
      font-size: 24px; 
      font-weight: 700; 
      margin-bottom: 16px; 
      color: #0f172a; 
      letter-spacing: -0.6px; 
    }
    .section h3 { 
      font-size: 20px; 
      font-weight: 600; 
      margin-bottom: 14px; 
      color: #1e293b; 
      letter-spacing: -0.4px;
    }
    .section h4 { 
      font-size: 18px; 
      font-weight: 600; 
      margin-bottom: 10px; 
      color: #334155; 
      letter-spacing: -0.2px;
    }
    .section p { 
      font-size: 16px; 
      line-height: 1.7; 
      color: #475569; 
      margin-bottom: 14px; 
    }
    
    /* Enhanced Table Design */
    .table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 16px 0; 
      border-radius: 12px; 
      overflow: hidden; 
      border: 1px solid #e2e8f0; 
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .table td, .table th { 
      padding: 16px 20px; 
      text-align: left; 
      border-bottom: 1px solid #f1f5f9; 
      font-size: 15px; 
    }
    .table th { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
      font-weight: 600; 
      color: #374151; 
      font-size: 14px; 
      text-transform: uppercase; 
      letter-spacing: 0.8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover { background-color: #f8fafc; transition: background-color 0.2s ease; }
    .total-row { 
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
      font-weight: 700; 
    }
    .total-row td { 
      color: #0f172a; 
      border-top: 2px solid #cbd5e1; 
      font-size: 16px;
    }
    
    /* Modern Button Design */
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #475569 0%, #334155 100%); 
      color: #ffffff; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 12px; 
      margin: 20px 0; 
      font-weight: 600; 
      font-size: 16px; 
      text-align: center; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      box-shadow: 0 4px 14px rgba(71, 85, 105, 0.2);
      border: 1px solid #64748b;
    }
    .button:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 25px rgba(71, 85, 105, 0.3);
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    }
    .button-success { 
      background: linear-gradient(135deg, #059669 0%, #047857 100%); 
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
      border: 1px solid #10b981;
    }
    .button-success:hover { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.35);
    }
    .button-warning { 
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%); 
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
      border: 1px solid #f59e0b;
    }
    .button-error { 
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
      border: 1px solid #ef4444;
    }
    
    /* Enhanced Product Images */
    .product-image { 
      width: 64px; 
      height: 64px; 
      border-radius: 12px; 
      object-fit: cover; 
      display: block; 
      box-shadow: 0 4px 8px rgba(15, 23, 42, 0.1);
      border: 1px solid #e2e8f0;
    }
    .product-placeholder { 
      width: 64px; 
      height: 64px; 
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
      border-radius: 12px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 12px; 
      color: #64748b; 
      font-weight: 600; 
      border: 2px dashed #cbd5e1;
    }
    .product-details { padding-left: 16px; }
    .product-name { 
      font-weight: 600; 
      font-size: 16px; 
      color: #0f172a; 
      margin-bottom: 4px; 
      line-height: 1.4;
    }
    .product-price { 
      color: #64748b; 
      font-size: 14px; 
      font-weight: 500;
    }
    
    /* Modern Status Badges */
    .status-badge { 
      display: inline-block; 
      padding: 8px 16px; 
      border-radius: 24px; 
      font-size: 12px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 0.6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .status-pending { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%); 
      color: #92400e; 
      border: 1px solid #f59e0b;
    }
    .status-confirmed { 
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
      color: #065f46; 
      border: 1px solid #10b981;
    }
    .status-processing { 
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); 
      color: #1e40af; 
      border: 1px solid #3b82f6;
    }
    .status-failed { 
      background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%); 
      color: #991b1b; 
      border: 1px solid #ef4444;
    }
    
    /* Enhanced Process Steps */
    .process-steps { margin-top: 20px; }
    .process-step { 
      display: flex; 
      align-items: flex-start; 
      gap: 20px; 
      margin-bottom: 24px; 
      padding: 20px; 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
      border-radius: 16px; 
      border-left: 4px solid #64748b;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
    }
    .process-step:last-child { margin-bottom: 0; }
    .step-number { 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: black; 
      font-weight: bold; 
      font-size: 18px; 
      flex-shrink: 0; 
      margin-top: 4px;
      box-shadow: 0 4px 8px rgba(71, 85, 105, 0.2);
    }
    .step-content { flex: 1; }
    .step-title { 
      font-weight: 700; 
      color: #0f172a; 
      font-size: 17px; 
      margin-bottom: 6px; 
      letter-spacing: -0.2px;
    }
    .step-description { 
      color: #475569; 
      font-size: 15px; 
      line-height: 1.6; 
    }
    .step-highlight { 
      color: #dc2626; 
      font-weight: 700; 
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #fca5a5;
    }
    
    /* Modern Footer Design */
    .footer { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
      padding: 40px 32px; 
      text-align: center; 
      border-top: 1px solid #e2e8f0; 
      position: relative;
    }
    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
    }
    .footer-content { max-width: 520px; margin: 0 auto; }
    .footer h4 { 
      font-size: 18px; 
      font-weight: 700; 
      color: #1e293b; 
      margin-bottom: 16px; 
      letter-spacing: -0.3px;
    }
    .footer p { 
      font-size: 14px; 
      color: #64748b; 
      margin-bottom: 10px; 
      line-height: 1.6; 
    }
    .footer-links { margin-top: 20px; }
    .footer-links a { 
      color: #475569; 
      text-decoration: none; 
      margin: 0 12px; 
      font-size: 14px; 
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .footer-links a:hover { color: #1e293b; }
    .company-info { 
      margin-top: 24px; 
      padding-top: 20px; 
      border-top: 1px solid #e2e8f0; 
      font-size: 12px; 
      color: #94a3b8;
      line-height: 1.5;
    }
    
    /* Alert Boxes */
    .alert { 
      padding: 20px; 
      border-radius: 12px; 
      margin: 20px 0; 
      border-left: 4px solid;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .alert-warning { 
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
      border-left-color: #f59e0b; 
      color: #92400e;
    }
    .alert-error { 
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
      border-left-color: #ef4444; 
      color: #991b1b;
    }
    .alert-info { 
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
      border-left-color: #0284c7; 
      color: #0c4a6e;
    }
    
    /* Responsive Design */
    @media only screen and (max-width: 640px) {
      .email-wrapper { padding: 16px 8px; }
      .email-container { border-radius: 16px; }
      .header { padding: 32px 20px; }
      .header h1 { font-size: 26px; }
      .section { margin: 20px; padding: 24px; }
      .table td, .table th { padding: 12px 16px; font-size: 14px; }
      .button { 
        display: block; 
        margin: 20px auto; 
        max-width: 280px; 
        padding: 14px 24px;
      }
      .product-image, .product-placeholder { width: 56px; height: 56px; }
      .process-step { 
        flex-direction: column; 
        gap: 16px; 
        padding: 16px;
      }
      .step-number { align-self: flex-start; }
      .footer { padding: 32px 20px; }
    }
  </style>
`;

export class EmailService {
  // Helper method to send emails with nodemailer (fully configurable)
  private static async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      console.log(`📧 Attempting to send email to: ${params.to}`);

      const info = await transporter.sendMail({
        from: `"${COMPANY_NAME}" <${process.env.FROM_EMAIL || 'noreply@symbolstores.com'}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || params.subject, // Fallback to subject if no text provided
      });

      console.log("✅ Email sent successfully:", info.messageId);
      return { success: true, data: info };
    } catch (error) {
      console.error("❌ Email send error:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // ✅ NEW: Payment failure email method
  static async sendPaymentFailedEmail(data: PaymentFailureEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending payment failure email to ${data.customerEmail} for order ${data.orderId}`);

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Issue - Order ${data.orderId}</title>
          ${getProfessionalEmailStyles()}
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header header-error">
                <div class="header-content">
                  ${getCompanyLogoHtml()}
                  <h1>Payment Issue</h1>
                  <p>We encountered an issue with your payment</p>
                </div>
              </div>
              
              <div class="email-content">
                <div class="section section-error">
                  <h2>Payment Failed</h2>
                  <p>Hello <strong>${data.customerName}</strong>,</p>
                  <p>We were unable to process your payment for order <strong>${data.orderId}</strong>.</p>
                </div>

                <div class="alert alert-error">
                  <h4 style="margin-bottom: 8px; font-size: 16px;">⚠️ Issue Details:</h4>
                  <p style="margin: 0; font-weight: 600;">${data.reason}</p>
                </div>

                <div class="section">
                  <h3>Order Information</h3>
                  <table class="table">
                    <tr><td><strong>Order ID</strong></td><td style="font-family: 'SF Mono', Monaco, monospace; color: #dc2626;">${data.orderId}</td></tr>
                    <tr><td><strong>Amount</strong></td><td><strong style="color: #dc2626; font-size: 16px;">₦${data.amount.toLocaleString()}</strong></td></tr>
                    <tr><td><strong>Status</strong></td><td><span class="status-badge status-failed">Payment Failed</span></td></tr>
                  </table>
                </div>

                <div class="section section-info">
                  <h3>What happens next?</h3>
                  <div class="process-steps">
                    <div class="process-step">
                      <div class="step-number">1</div>
                      <div class="step-content">
                        <div class="step-title">Order Status</div>
                        <div class="step-description">Your order has been marked as <span class="step-highlight">failed</span></div>
                      </div>
                    </div>
                    <div class="process-step">
                      <div class="step-number">2</div>
                      <div class="step-content">
                        <div class="step-title">No Charges</div>
                        <div class="step-description">No payment has been charged to your account</div>
                      </div>
                    </div>
                    <div class="process-step">
                      <div class="step-number">3</div>
                      <div class="step-content">
                        <div class="step-title">Inventory Released</div>
                        <div class="step-description">Any reserved items have been released back to inventory</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section section-warning">
                  <h3>How to proceed:</h3>
                  <ol style="padding-left: 20px; line-height: 1.8; color: #374151;">
                    <li><strong>Retry Payment:</strong> Try paying again using the button below</li>
                    <li><strong>Check Payment Details:</strong> Ensure your card has sufficient funds and details are correct</li>
                    <li><strong>Contact Support:</strong> If the issue persists, please contact our support team</li>
                  </ol>
                </div>

                <div style="text-align: center; margin: 32px;">
                  <a href="${data.retryLink}" class="button button-error">
                    🔄 Retry Payment
                  </a>
                  <p style="font-size: 14px; color: #6b7280; margin-top: 12px;">Click here to try your payment again</p>
                </div>
              </div>

              <div class="footer">
                <div class="footer-content">
                  <h4>Need Help?</h4>
                  <p>Contact our support team at <a href="mailto:${data.supportEmail}" style="color: #475569;">${data.supportEmail}</a></p>
                  <p>We're here to help resolve any payment issues you may have.</p>
                  
                  <div class="company-info">
                    This email was sent because a payment attempt was made for order ${data.orderId}.<br>
                    If you did not attempt this payment, please contact support immediately.<br>
                    © 2024 Symbol Stores. Professional e-commerce solutions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        SYMBOL STORES - PAYMENT ISSUE
        =============================

        Hello ${data.customerName},

        We were unable to process your payment for order ${data.orderId}.

        Order Details:
        - Order ID: ${data.orderId}
        - Amount: ₦${data.amount.toLocaleString()}
        - Issue: ${data.reason}

        What happens next?
        - Your order has been marked as failed
        - No payment has been charged to your account
        - Any reserved items have been released back to inventory

        How to proceed:
        1. Retry Payment: ${data.retryLink}
        2. Check that your payment method has sufficient funds
        3. Contact support at ${data.supportEmail} if issues persist

        Best regards,
        The Symbol Stores Team
      `;

      const result = await this.sendEmail({
        to: data.customerEmail,
        subject: `Payment Issue - Order ${data.orderId}`,
        html: emailHtml,
        text: emailText,
      });

      if (result.success) {
        console.log(`✅ Payment failure email sent successfully to ${data.customerEmail}`);
        return { success: true };
      } else {
        console.error(`❌ Failed to send payment failure email: ${result.error}`);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error sending payment failure email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ✅ UPDATED: Bank transfer instructions with nodemailer
  static async sendBankTransferInstructions(data: BankTransferInstructionsData) {
    try {
      console.log("📧 Sending bank transfer instructions email to:", data.customerEmail);

      const totals = ensureCalculatedTotalsForEmail(data);

      const itemsHtml = data.items
        .map((item) => {
          const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
          const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
            <tr>
              <td style="padding: 16px;">
                <div style="display: flex; align-items: center;">
                  ${item.imageURL
                    ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                    : `<div class="product-placeholder">IMG</div>`
                  }
                  <div class="product-details">
                    <div class="product-name">${item.itemName}</div>
                    <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
                  </div>
                </div>
              </td>
              <td style="text-align: center; padding: 16px; font-weight: 600;">${itemQuantity}</td>
              <td style="text-align: right; padding: 16px; font-weight: 700; color: #0f172a;">₦${itemTotal.toLocaleString()}</td>
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
                    <tr><td><strong>Account Number</strong></td><td style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-weight: 700; color: #1e40af; font-size: 16px;">${data.bankDetails.accountNumber}</td></tr>
                    <tr><td><strong>Account Name</strong></td><td>${data.bankDetails.accountName}</td></tr>
                    <tr class="total-row"><td><strong>Amount to Transfer</strong></td><td><strong style="color: #dc2626; font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                  </table>
                </div>

                <div class="alert alert-warning">
                  <h4 style="margin-bottom: 12px;">💡 Payment Instructions</h4>
                  <ol style="padding-left: 20px; line-height: 1.8; margin: 0;">
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
                      <tr class="total-row"><td><strong>Final Total</strong></td><td></td><td style="text-align: right;"><strong style="font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                    </tbody>
                  </table>
                  
                  ${totals.isFreeShipping ? `
                    <div class="alert alert-info">
                      <p style="color: #065f46; font-weight: 600; margin: 0;">🎉 Congratulations! You qualified for FREE shipping by spending over ₦${FREE_SHIPPING_THRESHOLD.toLocaleString()}!</p>
                    </div>
                  ` : ""}
                </div>

                <div style="text-align: center; margin: 40px 32px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/order-success?orderId=${data.orderId}" class="button">
                    Submit Transaction Reference
                  </a>
                  <p style="font-size: 14px; color: #64748b; margin-top: 12px;">Click here after completing your bank transfer</p>
                </div>
              </div>

              <div class="footer">
                <div class="footer-content">
                  <h4>Need Help?</h4>
                  <p>Email: <a href="mailto:symbolstores45@gmail.com" style="color: #475569;">symbolstores45@gmail.com</a></p>
                  <p>WhatsApp: <a href="https://wa.me/2348123456789" style="color: #475569;">+234 812 345 6789</a></p>
                  
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

      const result = await this.sendEmail({
        to: data.customerEmail,
        subject: `Payment Instructions - Order ${data.orderId} (₦${totals.finalTotal.toLocaleString()})`,
        html,
      });

      if (result.success) {
        console.log("✅ Bank transfer instructions email sent successfully");
      } else {
        console.error("❌ Failed to send bank transfer instructions:", result.error);
      }

      return { success: result.success, data: result.data, error: result.error };
    } catch (error) {
      console.error("❌ Failed to send bank transfer instructions:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ✅ UPDATED: Admin notification with nodemailer
  static async sendAdminNotification(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("📧 Sending admin notification for order:", orderData.orderId);

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
          const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
          const itemTotal = itemPrice * itemQuantity;
          return `
            <tr>
              <td style="padding: 16px;">
                <div style="display: flex; align-items: center;">
                  ${item.imageURL
                    ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                    : `<div class="product-placeholder">IMG</div>`
                  }
                  <div class="product-details">
                    <div class="product-name">${item.itemName}</div>
                    <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
                  </div>
                </div>
              </td>
              <td style="text-align: center; padding: 16px; font-weight: 600;">${itemQuantity}</td>
              <td style="text-align: right; padding: 16px; font-weight: 700; color: #0f172a;">₦${itemTotal.toLocaleString()}</td>
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
              <div class="header ${isBankTransfer ? 'header-warning' : 'header-success'}">
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
                    <tr><td><strong>Email</strong></td><td><a href="mailto:${orderData.customerEmail}" style="color: #475569;">${orderData.customerEmail}</a></td></tr>
                    <tr><td><strong>Phone</strong></td><td><a href="tel:${orderData.customerPhone}" style="color: #475569;">${orderData.customerPhone || "Not provided"}</a></td></tr>
                    <tr><td><strong>Payment Method</strong></td><td><span class="status-badge ${isBankTransfer ? 'status-pending' : 'status-processing'}">${isBankTransfer ? "Bank Transfer" : "Flutterwave"}</span></td></tr>
                    <tr class="total-row"><td><strong>Order Value</strong></td><td><strong style="color: #dc2626; font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
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
                      <tr class="total-row"><td><strong>Grand Total</strong></td><td></td><td style="text-align: right;"><strong style="font-size: 18px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
                    </tbody>
                  </table>
                </div>

                <div style="text-align: center; margin: 40px 32px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}" class="button">
                    View Full Order Details
                  </a>
                  <p style="font-size: 14px; color: #64748b; margin-top: 12px;">Access admin dashboard for complete order management</p>
                </div>

                ${orderData.orderNotes ? `
                  <div class="section section-info">
                    <h4>Customer Notes</h4>
                    <div class="alert alert-info">
                      <p style="margin: 0; font-style: italic;">"${orderData.orderNotes}"</p>
                    </div>
                  </div>
                ` : ""}
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

      const result = await this.sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@symbolstores.com",
        subject: `New Order ${orderData.orderId} - ₦${totals.finalTotal.toLocaleString()} - ${orderData.customerName}`,
        html,
      });

      if (result.success) {
        console.log("✅ Admin notification email sent successfully");
      } else {
        console.error("❌ Failed to send admin notification email:", result.error);
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error("❌ Admin email service error:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ✅ UPDATED: Bank transfer confirmation with nodemailer
  static async sendBankTransferConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("📧 Sending bank transfer confirmation email");

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
          const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
            <tr>
              <td style="padding: 16px;">
                <div style="display: flex; align-items: center;">
                  ${item.imageURL
                    ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                    : `<div class="product-placeholder">IMG</div>`
                  }
                  <div class="product-details">
                    <div class="product-name">${item.itemName}</div>
                    <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
                  </div>
                </div>
              </td>
              <td style="text-align: center; padding: 16px; font-weight: 600;">${itemQuantity}</td>
              <td style="text-align: right; padding: 16px; font-weight: 700; color: #0f172a;">₦${itemTotal.toLocaleString()}</td>
            </tr>`;
        })
        .join("");

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
              <div class="header header-success">
                <div class="header-content">
                  ${getCompanyLogoHtml()}
                  <h1>Payment Verified!</h1>
                  <p>Order ${orderData.orderId} confirmed</p>
                </div>
              </div>
              
              <div class="email-content">
                <div class="section section-success" style="text-align: center;">
                  <h2 style="color: #065f46;">Thank you ${orderData.customerName}!</h2>
                  <p style="font-size: 17px; margin: 16px 0;">Your bank transfer has been successfully verified and your order is now confirmed. We're excited to get your items ready for delivery!</p>
                  <span class="status-badge status-confirmed">Payment Verified</span>
                </div>

                <div class="section">
                  <h3>Order Summary</h3>
                  <table class="table">
                    <tr><td><strong>Order ID</strong></td><td style="font-family: 'SF Mono', Monaco, monospace; color: #059669;">${orderData.orderId}</td></tr>
                    <tr><td><strong>Payment Method</strong></td><td><span class="status-badge status-confirmed">Bank Transfer</span></td></tr>
                    <tr><td><strong>Order Date</strong></td><td>${new Date().toLocaleDateString('en-NG')}</td></tr>
                  </table>
                  
                  <table class="table" style="margin-top: 16px;">
                    <tr><td><strong>Subtotal (Items)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                    <tr><td><strong>Shipping</strong></td><td style="text-align: right; font-weight: 600; color: ${totals.isFreeShipping ? '#059669' : '#374151'};">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                    <tr><td><strong>Tax (0.01%)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                    <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong style="color: #059669; font-size: 20px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
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

                <div style="text-align: center; margin: 40px 32px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button button-success">
                    Track Your Order
                  </a>
                  <p style="font-size: 14px; color: #64748b; margin-top: 12px;">Monitor your order status and delivery progress</p>
                </div>
              </div>

              <div class="footer">
                <div class="footer-content">
                  <h4>Need Assistance?</h4>
                  <p>Email: <a href="mailto:symbolstores45@gmail.com" style="color: #475569;">symbolstores45@gmail.com</a></p>
                  <p>WhatsApp: <a href="https://wa.me/2348123456789" style="color: #475569;">+234 812 345 6789</a></p>
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

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject: `Payment Verified - Order ${orderData.orderId} (₦${totals.finalTotal.toLocaleString()})`,
        html,
      });

      if (result.success) {
        console.log("✅ Bank transfer confirmation email sent successfully");
      } else {
        console.error("❌ Failed to send bank transfer confirmation email:", result.error);
      }

      return { success: result.success, data: result.data, error: result.error };
    } catch (error) {
      console.error("❌ Bank transfer confirmation email service error:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ✅ UPDATED: Regular order confirmation with nodemailer
  static async sendOrderConfirmation(orderData: OrderData) {
    try {
      const totals = ensureCalculatedTotalsForEmail(orderData);
      console.log("📧 Sending order confirmation email to:", orderData.customerEmail);

      const itemsHtml = orderData.items
        .map((item) => {
          const itemPrice = typeof item.amount === "number" && !isNaN(item.amount) ? item.amount : 0;
          const itemQuantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1;
          const itemTotal = itemPrice * itemQuantity;

          return `
            <tr>
              <td style="padding: 16px;">
                <div style="display: flex; align-items: center;">
                  ${item.imageURL
                    ? `<img src="${item.imageURL}" alt="${item.itemName}" class="product-image">`
                    : `<div class="product-placeholder">IMG</div>`
                  }
                  <div class="product-details">
                    <div class="product-name">${item.itemName}</div>
                    <div class="product-price">₦${itemPrice.toLocaleString()} each</div>
                  </div>
                </div>
              </td>
              <td style="text-align: center; padding: 16px; font-weight: 600;">${itemQuantity}</td>
              <td style="text-align: right; padding: 16px; font-weight: 700; color: #0f172a;">₦${itemTotal.toLocaleString()}</td>
            </tr>`;
        })
        .join("");

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
              <div class="header header-success">
                <div class="header-content">
                  ${getCompanyLogoHtml()}
                  <h1>Order Confirmed!</h1>
                  <p>Order ${orderData.orderId} • ₦${totals.finalTotal.toLocaleString()}</p>
                </div>
              </div>
              
              <div class="email-content">
                <div class="section section-success" style="text-align: center;">
                  <h2 style="color: #065f46;">Thank you ${orderData.customerName}!</h2>
                  <p style="font-size: 17px; margin: 16px 0;">Your payment has been successfully received and your order is now being processed. We appreciate your business!</p>
                  <span class="status-badge status-confirmed">Order Confirmed</span>
                </div>

                <div class="section">
                  <h3>Order Details</h3>
                  <table class="table">
                    <tr><td><strong>Order ID</strong></td><td style="font-family: 'SF Mono', Monaco, monospace; color: #059669;">${orderData.orderId}</td></tr>
                    <tr><td><strong>Payment Method</strong></td><td><span class="status-badge ${paymentMethod === 'Bank Transfer' ? 'status-pending' : 'status-processing'}">${paymentMethod}</span></td></tr>
                    <tr><td><strong>Order Date</strong></td><td>${new Date().toLocaleDateString('en-NG')}</td></tr>
                    <tr><td><strong>Customer</strong></td><td>${orderData.customerName} (${orderData.customerEmail})</td></tr>
                  </table>
                  
                  <table class="table" style="margin-top: 16px;">
                    <tr><td><strong>Subtotal (Items)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.totalAmountItemsOnly.toLocaleString()}</td></tr>
                    <tr><td><strong>Shipping</strong></td><td style="text-align: right; font-weight: 600; color: ${totals.isFreeShipping ? '#059669' : '#374151'};">${totals.isFreeShipping ? "FREE" : "₦" + totals.shippingCost.toLocaleString()}</td></tr>
                    <tr><td><strong>Tax (0.01%)</strong></td><td style="text-align: right; font-weight: 600;">₦${totals.taxAmount.toLocaleString()}</td></tr>
                    <tr class="total-row"><td><strong>Total Paid</strong></td><td style="text-align: right;"><strong style="color: #059669; font-size: 20px;">₦${totals.finalTotal.toLocaleString()}</strong></td></tr>
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

                <div style="text-align: center; margin: 40px 32px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button button-success">
                    Track Your Order
                  </a>
                  <p style="font-size: 14px; color: #64748b; margin-top: 12px;">Monitor your order status and delivery progress</p>
                </div>
              </div>

              <div class="footer">
                <div class="footer-content">
                  <h4>Need Help?</h4>
                  <p>Email: <a href="mailto:symbolstores45@gmail.com" style="color: #475569;">symbolstores45@gmail.com</a></p>
                  <p>WhatsApp: <a href="https://wa.me/2348123456789" style="color: #475569;">+234 812 345 6789</a></p>
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

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject: `Order Confirmed ${orderData.orderId} - ₦${totals.finalTotal.toLocaleString()}`,
        html,
      });

      if (result.success) {
        console.log("✅ Order confirmation email sent successfully");
      } else {
        console.error("❌ Failed to send order confirmation email:", result.error);
      }

      return { success: result.success, data: result.data, error: result.error };
    } catch (error) {
      console.error("❌ Email service error:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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