// src/app/layout.tsx - Fixed SSR Issue
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientCartProvider from '@/components/ClientCartProvider';
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SymbolStore - Your Electronics Store",
  description: "Shop the latest electronics, home appliances, and more at great prices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientCartProvider>
          {children}
        </ClientCartProvider>
      </body>
    </html>
  );
}