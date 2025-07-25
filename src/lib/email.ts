// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    amount: number;
  }>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    sortCode?: string;
  };
  orderNotes?: string;
}

export class EmailService {
  static async sendBankTransferInstructions(orderData: OrderData) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'orders@yourstore.com',
        to: [orderData.customerEmail],
        subject: `Bank Transfer Instructions - Order ${orderData.orderId}`,
        html: this.generateBankTransferEmail(orderData),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }

  static async sendOrderConfirmation(orderData: OrderData) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'orders@yourstore.com',
        to: [orderData.customerEmail],
        subject: `Order Confirmation - ${orderData.orderId}`,
        html: this.generateOrderConfirmationEmail(orderData),
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }

  static async sendAdminNotification(orderData: OrderData) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'orders@yourstore.com',
        to: [process.env.ADMIN_EMAIL || 'admin@yourstore.com'],
        subject: `New Bank Transfer Order - ${orderData.orderId}`,
        html: this.generateAdminNotificationEmail(orderData),
      });

      if (error) {
        console.error('Admin email error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Admin email service error:', error);
      return { success: false, error };
    }
  }

  private static generateBankTransferEmail(orderData: OrderData): string {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.amount * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bank Transfer Instructions</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${process.env.NEXT_PUBLIC_APP_NAME || 'Your Store'}</h1>
          <h2 style="color: #059669; margin: 0;">Bank Transfer Instructions</h2>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1e40af;">Order Details</h3>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Customer:</strong> ${orderData.customerName}</p>
          <p><strong>Total Amount:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">₦${orderData.amount.toLocaleString()}</span></p>
        </div>

        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">Bank Transfer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Account Name:</td>
              <td style="padding: 8px 0;">${orderData.bankDetails.accountName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Account Number:</td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 16px; font-weight: bold;">${orderData.bankDetails.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Bank:</td>
              <td style="padding: 8px 0;">${orderData.bankDetails.bankName}</td>
            </tr>
            ${orderData.bankDetails.sortCode ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Sort Code:</td>
              <td style="padding: 8px 0;">${orderData.bankDetails.sortCode}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
              <td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: bold;">₦${orderData.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Reference:</td>
              <td style="padding: 8px 0; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${orderData.orderId}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">Important Instructions:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Please use <strong>${orderData.orderId}</strong> as your transfer reference/description</li>
            <li>Transfer the exact amount: <strong>₦${orderData.amount.toLocaleString()}</strong></li>
            <li>Your order will be confirmed within 24 hours of payment</li>
            <li>Keep your transfer receipt for reference</li>
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3>Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td style="padding: 12px 8px; border-top: 2px solid #e5e7eb;" colspan="2">Total</td>
                <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #dc2626;">₦${orderData.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${orderData.orderNotes ? `
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin-top: 0;">Order Notes:</h4>
          <p style="margin: 0;">${orderData.orderNotes}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin-bottom: 10px;">Need help? Contact us:</p>
          <p style="margin: 0;">
            <a href="mailto:support@yourstore.com" style="color: #2563eb;">support@yourstore.com</a> | 
            <a href="tel:+2348012345678" style="color: #2563eb;">+234 801 234 5678</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateOrderConfirmationEmail(orderData: OrderData): string {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.amount * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${process.env.NEXT_PUBLIC_APP_NAME || 'Your Store'}</h1>
          <h2 style="color: #059669; margin: 0;">Order Confirmed!</h2>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h3 style="margin-top: 0; color: #065f46;">Thank you ${orderData.customerName}!</h3>
          <p style="margin: 0;">Your payment has been received and your order is being processed.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1e40af;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Payment Method:</strong> Bank Transfer</p>
          <p><strong>Total Amount:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">₦${orderData.amount.toLocaleString()}</span></p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3>Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1e40af;">What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>We're preparing your order for shipment</li>
            <li>You'll receive a tracking number once shipped</li>
            <li>Estimated delivery: 3-5 business days</li>
            <li>We'll notify you of any updates</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Track Your Order
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin-bottom: 10px;">Questions about your order?</p>
          <p style="margin: 0;">
            <a href="mailto:support@yourstore.com" style="color: #2563eb;">support@yourstore.com</a> | 
            <a href="tel:+2348012345678" style="color: #2563eb;">+234 801 234 5678</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateAdminNotificationEmail(orderData: OrderData): string {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 4px; border-bottom: 1px solid #eee;">${item.itemName}</td>
        <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.amount * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Bank Transfer Order</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">🚨 New Bank Transfer Order</h2>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0;">Order: ${orderData.orderId}</h3>
          <p><strong>Amount:</strong> ₦${orderData.amount.toLocaleString()}</p>
          <p><strong>Customer:</strong> ${orderData.customerName}</p>
          <p><strong>Email:</strong> ${orderData.customerEmail}</p>
          <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p><strong>Action Required:</strong> Monitor bank account for incoming transfer with reference: <code>${orderData.orderId}</code></p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}" 
           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Order Details
        </a>
      </body>
      </html>
    `;
  }
}