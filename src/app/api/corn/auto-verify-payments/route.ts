// src/app/api/cron/auto-verify-payments/route.ts
// This runs automatically every 15 minutes to check for payments that can be auto-verified

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request (add your cron secret)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 Starting automatic payment verification cron job...');
  
  try {
    let verifiedCount = 0;
    let processedCount = 0;
    const results = [];

    // Find orders that have been pending for at least 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const pendingQuery = query(
      collection(db, 'bankTransferOrders'),
      where('verificationMethod', '==', 'pending_manual'),
      where('referenceSubmittedAt', '<=', thirtyMinutesAgo.toISOString())
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    console.log(`🔍 Found ${pendingSnapshot.docs.length} orders to re-evaluate`);

    for (const orderDoc of pendingSnapshot.docs) {
      const orderData = orderDoc.data();
      processedCount++;
      
      console.log(`📝 Re-evaluating order: ${orderData.orderId}`);
      
      try {
        // Re-run enhanced auto-verification with more lenient criteria
        const verification = await checkDelayedAutoVerification(
          orderData.transactionReference, 
          orderData.amount,
          orderData.referenceSubmittedAt
        );
        
        if (verification.canAutoVerify && verification.confidence >= 85) {
          console.log(`✅ Auto-verifying order: ${orderData.orderId} (${verification.confidence}% confidence)`);
          
          // Update order as verified
          await updateDoc(doc(db, 'bankTransferOrders', orderDoc.id), {
            paymentVerified: true,
            verificationMethod: 'auto_delayed',
            verifiedAt: new Date().toISOString(),
            status: 'confirmed',
            verificationNotes: `Delayed auto-verification: ${verification.reason}`,
            autoVerificationConfidence: verification.confidence,
            updatedAt: new Date().toISOString()
          });
          
          // Send customer confirmation
          await sendCustomerConfirmation(orderData);
          
          // Send admin notification
          await sendAdminAutoVerificationNotification({
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            amount: orderData.amount,
            transactionReference: orderData.transactionReference,
            verificationMethod: `Delayed auto-verification (${verification.confidence}% confidence)`,
            confidence: verification.confidence
          });
          
          verifiedCount++;
          results.push({
            orderId: orderData.orderId,
            action: 'verified',
            confidence: verification.confidence,
            reason: verification.reason
          });
        } else {
          console.log(`⏳ Order ${orderData.orderId} still requires manual verification (${verification.confidence}% confidence)`);
          results.push({
            orderId: orderData.orderId,
            action: 'still_pending',
            confidence: verification.confidence,
            reason: verification.reason
          });
        }
      } catch (orderError) {
        console.error(`❌ Error processing order ${orderData.orderId}:`, orderError);
        results.push({
          orderId: orderData.orderId,
          action: 'error',
          error: orderError instanceof Error ? orderError.message : 'Unknown error'
        });
      }
    }
    
    console.log(`🎉 Auto-verification complete: ${verifiedCount}/${processedCount} orders verified`);
    
    // Send summary email to admin if any orders were processed
    if (processedCount > 0) {
      await sendAdminCronSummary({
        processed: processedCount,
        verified: verifiedCount,
        remaining: processedCount - verifiedCount,
        results: results
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto-verification complete`,
      stats: {
        processed: processedCount,
        verified: verifiedCount,
        remaining: processedCount - verifiedCount
      },
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Auto-verification cron error:', error);
    
    // Send error notification to admin
    await sendAdminCronError(error);
    
    return NextResponse.json({
      success: false,
      error: 'Auto-verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enhanced auto-verification with time-based improvements (more lenient after waiting)
async function checkDelayedAutoVerification(
  transactionReference: string, 
  amount: number,
  submittedAt: string
): Promise<{ canAutoVerify: boolean; reason: string; confidence: number }> {
  
  try {
    let confidence = 0;
    let reasons = [];

    // 1. Reference format validation (more lenient after waiting period)
    const validFormats = [
      { pattern: /^FT\d{12,18}$/i, confidence: 95, bank: "First Bank/GTB" },
      { pattern: /^NIP\d{12,15}$/i, confidence: 92, bank: "NIP Transfer" },
      { pattern: /^\d{12,20}$/, confidence: 88, bank: "Standard Numeric" },
      { pattern: /^[A-Z]{2,4}\d{10,15}$/i, confidence: 90, bank: "Bank Code Format" },
      { pattern: /^TXN\d{12,15}$/i, confidence: 93, bank: "Transaction Format" },
      { pattern: /^REF\d{12,15}$/i, confidence: 89, bank: "Reference Format" },
      { pattern: /^UBA\d{10,15}$/i, confidence: 94, bank: "UBA Format" },
      { pattern: /^ZEN\d{10,15}$/i, confidence: 91, bank: "Zenith Format" },
      { pattern: /^ACC\d{10,15}$/i, confidence: 89, bank: "Access Format" },
      { pattern: /^GTB\d{10,15}$/i, confidence: 95, bank: "GTBank Format" },
      { pattern: /^FCM\d{10,15}$/i, confidence: 92, bank: "FCMB Format" }
    ];

    const matchedFormat = validFormats.find(format => format.pattern.test(transactionReference));
    
    if (matchedFormat) {
      confidence += matchedFormat.confidence;
      reasons.push(`Valid ${matchedFormat.bank} format`);
    } else {
      // More lenient for delayed verification - accept reasonable looking references
      if (/^[A-Z0-9]{8,25}$/i.test(transactionReference)) {
        confidence += 75; // Lower but acceptable
        reasons.push('Acceptable reference format after waiting period');
      } else {
        return { 
          canAutoVerify: false, 
          reason: 'Invalid reference format even after waiting period',
          confidence: 0
        };
      }
    }

    // 2. Time-based confidence boost (customer waited longer)
    const submittedTime = new Date(submittedAt);
    const waitingMinutes = Math.floor((Date.now() - submittedTime.getTime()) / (1000 * 60));
    
    if (waitingMinutes >= 240) { // 4+ hours waiting
      confidence += 20;
      reasons.push(`Customer waited ${Math.floor(waitingMinutes/60)} hours - high patience indicator`);
    } else if (waitingMinutes >= 120) { // 2+ hours waiting
      confidence += 15;
      reasons.push(`Customer waited ${Math.floor(waitingMinutes/60)} hours`);
    } else if (waitingMinutes >= 60) { // 1+ hour waiting
      confidence += 10;
      reasons.push(`Customer waited ${waitingMinutes} minutes`);
    } else if (waitingMinutes >= 30) { // 30+ minutes waiting
      confidence += 8;
      reasons.push('Reasonable waiting period');
    }

    // 3. Amount-based scoring (more lenient for delayed verification)
    if (amount <= 100000) {
      confidence += 15;
      reasons.push('Low-risk amount (≤ ₦100k)');
    } else if (amount <= 300000) {
      confidence += 12; // More lenient than initial verification
      reasons.push('Medium amount - acceptable risk after waiting');
    } else if (amount <= 500000) {
      confidence += 8; // More lenient
      reasons.push('Higher amount - monitored risk');
    } else if (amount <= 1000000) {
      confidence += 5; // Even high amounts get some consideration after waiting
      reasons.push('High amount - requires careful consideration');
    }

    // 4. Reference quality scoring
    const refLength = transactionReference.length;
    const hasLettersAndNumbers = /[A-Za-z]/.test(transactionReference) && /\d/.test(transactionReference);
    
    if (refLength >= 12 && refLength <= 20 && hasLettersAndNumbers) {
      confidence += 12;
      reasons.push('High-quality reference format');
    } else if (refLength >= 10 && refLength <= 25) {
      confidence += 8;
      reasons.push('Acceptable reference format');
    } else if (refLength >= 8) {
      confidence += 5;
      reasons.push('Minimum acceptable reference length');
    }

    // 5. Pattern recognition bonus
    if (/^(FT|NIP|TXN|REF|UBA|ZEN|ACC|GTB|FCM)/.test(transactionReference)) {
      confidence += 5;
      reasons.push('Known Nigerian bank prefix');
    }

    // 6. Nigerian banking context
    const now = new Date();
    const isBusinessHours = (now.getHours() >= 8 && now.getHours() <= 17 && now.getDay() >= 1 && now.getDay() <= 5);
    
    if (isBusinessHours) {
      confidence += 8;
      reasons.push('Processing during business hours');
    } else if (waitingMinutes >= 120) {
      confidence += 5;
      reasons.push('Off-hours but customer waited long enough');
    }

    // 7. Final decision logic (more lenient thresholds for delayed verification)
    const minConfidence = 85;
    
    if (confidence >= minConfidence) {
      return { 
        canAutoVerify: true, 
        reason: reasons.join('; '),
        confidence: Math.min(confidence, 100)
      };
    }

    // Special case: very long waiting periods with reasonable amounts
    if (waitingMinutes >= 360 && amount <= 200000 && confidence >= 75) { // 6+ hours waiting, ≤ ₦200k
      return {
        canAutoVerify: true,
        reason: `Extended waiting period override: ${reasons.join('; ')}`,
        confidence: Math.min(confidence + 10, 100)
      };
    }

    return { 
      canAutoVerify: false, 
      reason: `Confidence: ${confidence}% (need ${minConfidence}%+): ${reasons.join('; ')}`,
      confidence
    };

  } catch (error) {
    console.error('Error in delayed auto-verification:', error);
    return { 
      canAutoVerify: false, 
      reason: 'Verification system error',
      confidence: 0
    };
  }
}

// Send customer confirmation (reuse from main verification)
async function sendCustomerConfirmation(orderData: any) {
  try {
    const { EmailService } = await import('@/lib/email');
    
    const emailData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      amount: orderData.amount,
      items: orderData.items.map((item: any) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        amount: item.amount,
        imageURL: item.imageURL
      })),
      bankDetails: orderData.bankDetails
    };

    await EmailService.sendBankTransferConfirmation(emailData);
    console.log('✅ Customer confirmation email sent after delayed verification');
  } catch (error) {
    console.error('❌ Failed to send customer confirmation after delayed verification:', error);
  }
}

// Send admin notification for delayed auto-verification
async function sendAdminAutoVerificationNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  transactionReference: string;
  verificationMethod: string;
  confidence: number;
}) {
  try {
    const { resend } = await import('@/lib/email');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Delayed Auto-Verification - ${data.orderId}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ Payment Auto-Verified (Delayed)</h2>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">Order Automatically Verified After Waiting Period</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
          <p><strong>Transaction Reference:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${data.transactionReference}</code></p>
          <p><strong>Verification Method:</strong> ${data.verificationMethod}</p>
          <p><strong>Final Confidence Score:</strong> ${data.confidence}%</p>
        </div>

        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; color: #1e40af;">✅ Actions Completed by Cron Job</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✅ Payment verified using delayed criteria</li>
            <li>✅ Order status updated to "confirmed"</li>
            <li>✅ Customer confirmation email sent</li>
            <li>✅ Order ready for processing</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${data.orderId}" 
              style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View Order & Begin Processing
          </a>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: `Symbol Stores System <${process.env.FROM_EMAIL || 'system@symbolstores.com'}>`,
      to: [process.env.ADMIN_EMAIL || 'admin@symbolstores.com'],
      subject: `[DELAYED AUTO-VERIFIED] #${data.orderId} - ₦${data.amount.toLocaleString()}`,
      html
    });

    console.log('✅ Admin delayed auto-verification notification sent');
  } catch (error) {
    console.error('❌ Failed to send admin delayed auto-verification notification:', error);
  }
}

// Send cron job summary to admin
async function sendAdminCronSummary(data: {
  processed: number;
  verified: number;
  remaining: number;
  results: any[];
}) {
  try {
    const { resend } = await import('@/lib/email');
    
    const verifiedOrders = data.results.filter(r => r.action === 'verified');
    const pendingOrders = data.results.filter(r => r.action === 'still_pending');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Auto-Verification Cron Summary</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">🤖 Auto-Verification Cron Job Summary</h2>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af;">Processing Summary</h3>
          <p><strong>Orders Processed:</strong> ${data.processed}</p>
          <p><strong>Orders Verified:</strong> ${data.verified}</p>
          <p><strong>Orders Still Pending:</strong> ${data.remaining}</p>
          <p><strong>Success Rate:</strong> ${data.processed > 0 ? Math.round((data.verified / data.processed) * 100) : 0}%</p>
        </div>

        ${verifiedOrders.length > 0 ? `
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; color: #065f46;">✅ Verified Orders (${verifiedOrders.length})</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${verifiedOrders.map(order => `
              <li>${order.orderId} - ${order.confidence}% confidence</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        ${pendingOrders.length > 0 ? `
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; color: #92400e;">⏳ Still Pending (${pendingOrders.length})</h4>
          <p>These orders still require manual verification:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${pendingOrders.map(order => `
              <li>${order.orderId} - ${order.confidence}% confidence</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
              style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View Admin Dashboard
          </a>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: `Symbol Stores System <${process.env.FROM_EMAIL || 'system@symbolstores.com'}>`,
      to: [process.env.ADMIN_EMAIL || 'admin@symbolstores.com'],
      subject: `[CRON SUMMARY] Auto-Verification: ${data.verified}/${data.processed} orders processed`,
      html
    });

    console.log('✅ Admin cron summary sent');
  } catch (error) {
    console.error('❌ Failed to send admin cron summary:', error);
  }
}

// Send cron error notification
async function sendAdminCronError(error: any) {
  try {
    const { resend } = await import('@/lib/email');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Auto-Verification Cron Error</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">❌ Auto-Verification Cron Job Error</h2>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #7f1d1d;">Error Details</h3>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><strong>Stack:</strong> <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'No stack trace'}</pre></p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; color: #92400e;">⚠️ Action Required</h4>
          <p>The automatic payment verification cron job has failed. Please:</p>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Check the admin dashboard for pending payments</li>
            <li>Verify payments manually if needed</li>
            <li>Check the server logs for more details</li>
            <li>Consider running the cron job manually</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
              style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Check Admin Dashboard
          </a>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: `Symbol Stores System <${process.env.FROM_EMAIL || 'system@symbolstores.com'}>`,
      to: [process.env.ADMIN_EMAIL || 'admin@symbolstores.com'],
      subject: `[CRON ERROR] Auto-Verification Job Failed`,
      html
    });

    console.log('✅ Admin cron error notification sent');
  } catch (emailError) {
    console.error('❌ Failed to send admin cron error notification:', emailError);
  }
}

// POST endpoint for manual trigger (testing purposes)
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication check here
  console.log('🔧 Manual trigger of auto-verification cron job');
  return GET(request);
}