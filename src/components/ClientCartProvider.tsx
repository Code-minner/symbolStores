// src/components/ClientCartProvider.tsx - SSR Safe Cart Provider
"use client";

import { useState, useEffect } from 'react';
import { CartProvider } from '@/lib/CartContext';
import CartSidebar from '@/components/CartSidebar';

interface ClientCartProviderProps {
  children: React.ReactNode;
}

export default function ClientCartProvider({ children }: ClientCartProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show children without cart functionality during SSR
  if (!isMounted) {
    return <>{children}</>;
  }

  // Show full cart functionality on client
  return (
    <CartProvider>
      {children}
      <CartSidebar />
    </CartProvider>
  );
}