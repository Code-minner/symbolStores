// src/lib/CartContext.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';

export interface CartItem {
    id: string;
    itemName: string;
    category: string;
    subcategory: string;
    brand: string;
    amount: number;
    originalPrice?: number;
    imageURL: string;
    slug: string;
    inStock: boolean;
    quantity: number;
    sku: string;
    warranty?: string;
}

// --- SHIPPING AND TAX CONSTANTS ---
export const FREE_SHIPPING_THRESHOLD = 990000.00; // ₦990,000.00
export const TAX_RATE = 0.0001; // 0.01% as a decimal
export const SHIPPING_COST = 900.00; // ₦900.00

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    isOpen: boolean;
    // New calculated fields
    shippingCost: number;
    taxAmount: number;
    finalTotal: number;
    isFreeShipping: boolean;
}

type CartAction =
    | { type: 'ADD_TO_CART'; payload: Omit<CartItem, 'quantity'> }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
    | { type: 'CLEAR_CART' }
    | { type: 'TOGGLE_CART' }
    | { type: 'CLOSE_CART' }
    | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    isOpen: false,
    shippingCost: SHIPPING_COST,
    taxAmount: 0,
    finalTotal: 0,
    isFreeShipping: false,
};

// Helper function to calculate shipping, tax, and final total
const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    
    // Calculate shipping
    const isFreeShipping = totalAmount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
    
    // Calculate tax
    const taxAmount = totalAmount * TAX_RATE;
    
    // Calculate final total
    const finalTotal = totalAmount + shippingCost + taxAmount;
    
    return {
        totalItems,
        totalAmount,
        shippingCost,
        taxAmount,
        finalTotal,
        isFreeShipping,
    };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const existingItem = state.items.find(item => item.id === action.payload.id);

            let newItems: CartItem[];
            if (existingItem) {
                newItems = state.items.map(item =>
                    item.id === action.payload.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                newItems = [...state.items, { ...action.payload, quantity: 1 }];
            }

            const calculatedTotals = calculateTotals(newItems);

            return {
                ...state,
                items: newItems,
                ...calculatedTotals,
            };
        }

        case 'REMOVE_FROM_CART': {
            const newItems = state.items.filter(item => item.id !== action.payload);
            const calculatedTotals = calculateTotals(newItems);

            return {
                ...state,
                items: newItems,
                ...calculatedTotals,
            };
        }

        case 'UPDATE_QUANTITY': {
            const newItems = state.items.map(item =>
                item.id === action.payload.id
                    ? { ...item, quantity: action.payload.quantity }
                    : item
            ).filter(item => item.quantity > 0); // Remove if quantity becomes 0 or less

            const calculatedTotals = calculateTotals(newItems);

            return {
                ...state,
                items: newItems,
                ...calculatedTotals,
            };
        }

        case 'CLEAR_CART':
            return {
                ...state,
                items: [],
                totalItems: 0,
                totalAmount: 0,
                shippingCost: SHIPPING_COST,
                taxAmount: 0,
                finalTotal: 0,
                isFreeShipping: false,
            };

        case 'TOGGLE_CART':
            return {
                ...state,
                isOpen: !state.isOpen,
            };

        case 'CLOSE_CART':
            return {
                ...state,
                isOpen: false,
            };

        case 'LOAD_CART': {
            const calculatedTotals = calculateTotals(action.payload);

            return {
                ...state,
                items: action.payload,
                ...calculatedTotals,
                isOpen: false, // Ensure cart is closed on load
            };
        }

        default:
            return state;
    }
};

interface CartContextType {
    state: CartState;
    isClient: boolean;
    addToCart: (product: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    closeCart: () => void;
    formatPrice: (price: number) => string;
    notification: string | null;
    showNotification: (message: string) => void;
    // New helper functions
    getFreeShippingRemaining: () => number;
    getShippingMessage: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const [isClient, setIsClient] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // Set client-side flag
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load cart from localStorage on mount (client-side only)
    useEffect(() => {
        if (!isClient || isInitialized) return;

        const savedCart = localStorage.getItem('shopping-cart');
        if (savedCart) {
            try {
                const cartItems = JSON.parse(savedCart);
                dispatch({ type: 'LOAD_CART', payload: cartItems });
                console.log('🛒 Cart loaded from localStorage:', cartItems.length, 'items');
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                localStorage.removeItem('shopping-cart');
            }
        }

        setIsInitialized(true);
    }, [isClient, isInitialized]);

    // Save cart to localStorage whenever items change (but not during initial load)
    useEffect(() => {
        if (!isClient || !isInitialized) return;

        try {
            if (state.items.length > 0) {
                localStorage.setItem('shopping-cart', JSON.stringify(state.items));
                console.log('💾 Cart saved to localStorage:', state.items.length, 'items');
            } else {
                localStorage.removeItem('shopping-cart');
                console.log('🗑️ Cart cleared from localStorage');
            }
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [state.items, isClient, isInitialized]);

    // Listen for cross-tab storage changes (optional - for multi-tab sync)
    useEffect(() => {
        if (!isClient) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'shopping-cart') {
                if (event.newValue) {
                    try {
                        const newCartItems = JSON.parse(event.newValue);
                        dispatch({ type: 'LOAD_CART', payload: newCartItems });
                        console.log('🔄 Cart synced from another tab');
                    } catch (error) {
                        console.error('Error syncing cart from another tab:', error);
                    }
                } else {
                    dispatch({ type: 'LOAD_CART', payload: [] });
                    console.log('🔄 Cart cleared from another tab');
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [isClient]);

    // Notification logic
    const showNotification = useCallback((message: string) => {
        setNotification(message);
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const addToCart = (product: Omit<CartItem, 'quantity'>) => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
        showNotification(`${product.itemName} added to cart!`);
    };

    const removeFromCart = (productId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
        showNotification('Item removed from cart.');
    };

    const updateQuantity = (productId: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
        if (quantity === 0) {
            showNotification('Item removed from cart.');
        }
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
        showNotification('Cart cleared.');
    };

    const toggleCart = () => {
        dispatch({ type: 'TOGGLE_CART' });
    };

    const closeCart = () => {
        dispatch({ type: 'CLOSE_CART' });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    // New helper functions
    const getFreeShippingRemaining = () => {
        if (state.isFreeShipping) return 0;
        return Math.max(0, FREE_SHIPPING_THRESHOLD - state.totalAmount);
    };

    const getShippingMessage = () => {
        if (state.isFreeShipping) {
            return "🎉 You qualify for free shipping!";
        }
        const remaining = getFreeShippingRemaining();
        return `Add ${formatPrice(remaining)} more for free shipping`;
    };

    return (
        <CartContext.Provider
            value={{
                state,
                isClient,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                toggleCart,
                closeCart,
                formatPrice,
                notification,
                showNotification,
                getFreeShippingRemaining,
                getShippingMessage,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};