// app/api/contact/route.ts - MIGRATED TO ZEPTOMAIL
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Contact API called');
  
  try {
    // Check if ZeptoMail credentials exist
    if (!process.env.ZEPTOMAIL_USER || !process.env.ZEPTOMAIL_PASS) {
      console.error('❌ ZEPTOMAIL credentials not found in environment variables');
      return NextResponse.json(
        { message: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    console.log('✅ ZeptoMail credentials found');
    console.log('📧 Email config:', {
      fromEmail: process.env.FROM_EMAIL || 'contact@symbolstores.com',
      adminEmail: process.env.ADMIN_EMAIL || 'not set',
      companyName: process.env.COMPANY_NAME || 'Symbol Stores'
    });

    const body: ContactFormData = await request.json();
    const { firstName, lastName, email, phone, message } = body;
    
    console.log('📝 Form data received:', { firstName, lastName, email, phone, messageLength: message.length });

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !message) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed');

    // Send notification email to business
    console.log('📧 Attempting to send business notification email...');
    const businessEmailResult = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Symbol Stores'}" <${process.env.FROM_EMAIL || 'contact@symbolstores.com'}>`,
      to: process.env.ADMIN_EMAIL || 'contact@symbolstores.com',
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> 
              <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
            </p>
            <p style="margin: 8px 0;"><strong>Phone:</strong> 
              <a href="tel:${phone}" style="color: #2563eb;">${phone}</a>
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>This message was sent from the Symbolstores contact form.</p>
            <p>Respond within 24 hours for best customer service.</p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Business email sent successfully:', businessEmailResult.messageId);

    // Send confirmation email to customer
    console.log('📧 Attempting to send customer confirmation email...');
    const customerEmailResult = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Symbol Stores'}" <${process.env.FROM_EMAIL || 'contact@symbolstores.com'}>`,
      to: email, // Send to the actual customer email
      subject: `Thank you for contacting ${process.env.COMPANY_NAME || 'Symbolstores'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Symbolstores</h1>
            <p style="color: #6b7280; margin: 5px 0;">Your Technology Partner</p>
          </div>
          
          <h2 style="color: #1f2937;">Thank you for your message!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">Dear ${firstName},</p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            We have received your message and appreciate you taking the time to contact us. 
            Our team will review your inquiry and get back to you within 24 hours.
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Your message:</strong></p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              "${message.replace(/\n/g, '<br>')}"
            </div>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">Visit Our Showrooms:</h3>
            <div style="margin-bottom: 15px;">
              <p style="margin: 5px 0; color: #1f2937;"><strong>LG Showrooms:</strong></p>
              <p style="margin: 3px 0; color: #4b5563; font-size: 14px;">📍 Km 3 East West Road By Rumuosi Junction, Port Harcourt</p>
              <p style="margin: 3px 0; color: #4b5563; font-size: 14px;">📍 No 9 Owerri Road, Asata Enugu</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #1f2937;"><strong>HISSENSE Showrooms:</strong></p>
              <p style="margin: 3px 0; color: #4b5563; font-size: 14px;">📍 Nawfia Plaza KM 6 East west road, Rumuodara Port Harcourt</p>
              <p style="margin: 3px 0; color: #4b5563; font-size: 14px;">📍 No 506 Ikwere Road by Rumuosi Junction, Port Harcourt</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #4b5563; margin: 10px 0;">
              <strong>Contact Us:</strong><br>
              📞 <a href="tel:+2348098657771" style="color: #2563eb;">+234 809 865 7771</a> | 
              <a href="tel:+2348181377296" style="color: #2563eb;">+234 818 137 7296</a><br>
              ✉️ <a href="mailto:contact@symbolstores.com" style="color: #2563eb;">contact@symbolstores.com</a>
            </p>
            
            <p style="color: #4b5563; margin: 10px 0;">
              <strong>Working Hours:</strong><br>
              Monday - Saturday: 8:00 AM - 6:30 PM
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>The Symbolstores Team</strong>
            </p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Customer email sent successfully:', customerEmailResult.messageId);
    console.log('🎉 All emails sent successfully');

    return NextResponse.json(
      { 
        message: 'Message sent successfully! We will get back to you within 24 hours.',
        businessEmailId: businessEmailResult.messageId,
        customerEmailId: customerEmailResult.messageId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in contact API:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('credential')) {
        console.error('🔑 Authentication error');
        return NextResponse.json(
          { message: 'Email service authentication error' },
          { status: 500 }
        );
      }
      if (error.message.includes('SMTP') || error.message.includes('connection')) {
        console.error('🌐 SMTP connection error');
        return NextResponse.json(
          { message: 'Email service connection error' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.error('⏰ Rate limit error');
        return NextResponse.json(
          { message: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        message: 'Failed to send message. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}