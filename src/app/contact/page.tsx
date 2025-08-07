"use client";

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ======================================================
// CONTACT PAGE CONTENT COMPONENT
// Complete contact page with store info and contact form
// ======================================================

const ContactContent = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage('Thank you for your message! We will get back to you soon.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setSubmitMessage(`Error: ${errorData.message || 'Failed to send message. Please try again.'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitMessage('Error: Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contact Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
        
        {/* Working Days */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Working Days</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between items-center">
              <span className="font-medium">Monday - Friday:</span>
              <span>8:00 AM - 6:30 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Saturday:</span>
              <span>8:00 AM - 6:30 PM</span>
            </div>
          </div>
        </section>

        {/* Store Addresses */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Store Addresses</h2>
          <p className="text-gray-600 mb-4">Our address information</p>
          
          <div className="space-y-6">
            {/* LG Showrooms */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">LG SHOWROOM</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Km 3 East West Road By Rumuosi Junction, opposite St Gabriel Catholic Church Port Harcourt
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">LG SHOWROOM</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  No 9 Owerri Road opposite old St Patrick's hospital and Maternity Off Ogui junction/ Presidential Rd Asata Enugu
                </p>
              </div>
            </div>

            {/* HISSENSE Showrooms */}
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-900 mb-2">HISSENSE SHOWROOM</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Nawfia Plaza KM 6 East west road portharcourt by Omega House Rumuodara Portharcourt
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-900 mb-2">HISSENSE SHOWROOM</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  No 506 Ikwere Road by Rumuosi Junction Portharcourt
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Numbers */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Numbers</h2>
          <div className="space-y-2">
            <a 
              href="tel:+2348098657771" 
              className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">+234 809 865 7771</span>
            </a>
            <a 
              href="tel:+2348181377296" 
              className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">+234 818 137 7296</span>
            </a>
          </div>
        </section>
      </div>

      {/* Contact Form Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">We Love to Hear From You</h2>
        <p className="text-gray-600 mb-6">Send us a message and we'll respond as soon as possible.</p>

        {submitMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitMessage.startsWith('Error:') 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <p className={submitMessage.startsWith('Error:') ? 'text-red-800' : 'text-green-800'}>
              {submitMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your email address"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              placeholder="Tell us how we can help you..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Message'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            You can also reach us directly at{" "}
            <a href="mailto:contact@symbolstores.com" className="text-blue-600 hover:text-blue-800 underline">
              contact@symbolstores.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// MAIN APP COMPONENT
// The Header and Footer components have been added.
// ======================================================

export default function App() {
  // Breadcrumbs data - update as needed for your routing
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen font-sans w-full max-w-[1400px] mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="w-[95%] overflow-x-auto py-3 pr-4 mr-4 mb-6">
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
        
        <ContactContent />
      </div>
      <Footer />
    </>
  );
}