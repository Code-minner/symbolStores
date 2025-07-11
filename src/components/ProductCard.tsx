// src/components/ProductCard.tsx - Fixed duplicate padding issue
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  amount: number;
  originalPrice?: number;
  status: string;
  sku: string;
  warranty?: string;
  imageURL: string;
  images: string[];
  inStock: boolean;
  slug: string;
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  isTopRated?: boolean;
}

export default function ProductCard({ product, showAddToCart = true, isTopRated = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart, formatPrice, toggleCart } = useCart();

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    // Add the specified quantity to cart
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        itemName: product.itemName,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        amount: product.amount,
        originalPrice: product.originalPrice,
        imageURL: product.imageURL,
        slug: product.slug,
        inStock: product.inStock,
        sku: product.sku,
        warranty: product.warranty,
      });
    }

    // Reset quantity and show cart
    setQuantity(1);
    toggleCart();
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
    console.log(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist: ${product.itemName}`);
  };

  const getProductUrl = () => {
    return `/home/${product.category.toLowerCase().replace(/\s+/g, '-')}/${product.subcategory.toLowerCase().replace(/\s+/g, '-')}/${product.slug}`;
  };

  return (
    <div style={{
      boxSizing: 'border-box',
      margin: 0,
      maxWidth: '250px',
      backgroundColor: '#fff',
      padding: '0px 10px 10px', // Fixed - removed duplicate padding
      border: '1px solid #E4E7E9',
      borderRadius: '3px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937'
    }}>
      {/* Image Container */}
      <div style={{ position: 'relative' }}>
        <Link href={getProductUrl()}>
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <Image
              src={product.imageURL}
              alt={product.itemName}
              fill
              style={{
                objectFit: 'cover',
                borderRadius: '10px',
                backgroundColor: 'gray'
              }}
              sizes="250px"
            />
          </div>
        </Link>
        
        {/* Badge */}
        {(isTopRated || !product.inStock || (product.originalPrice && product.originalPrice > product.amount)) && (
          <span style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: !product.inStock ? '#9CA3AF' : '#EE5858',
            color: 'rgb(255, 255, 255)',
            padding: '4px 8px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            borderRadius: '5px'
          }}>
            {!product.inStock ? 'Out of Stock' : 
             (product.originalPrice && product.originalPrice > product.amount) ? 'Sale' :
             isTopRated ? 'Top Rated' : ''}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div>
        {/* Category */}
        <span style={{
          fontSize: '0.875rem',
          color: '#EE5858',
          backgroundColor: '#D8262670',
          borderRadius: '100px',
          padding: '4px 8px',
          marginBottom: '10px',
          display: 'inline-block',
          marginTop: '10px'
        }}>
          {product.subcategory}
        </span>

        {/* Title */}
        <Link href={getProductUrl()}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '400',
            margin: '10px 0',
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit'
          }} 
          onMouseOver={(e) => e.currentTarget.style.color = '#EE5858'}
          onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>
            {product.itemName}
          </h2>
        </Link>

        {/* Price Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '10px 0'
        }}>
          <div>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {formatPrice(product.amount)}
            </p>
            {product.originalPrice && product.originalPrice > product.amount && (
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                textDecoration: 'line-through',
                marginTop: '2px'
              }}>
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
          
          {/* Heart Icon */}
          <button
            onClick={toggleWishlist}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <svg 
              style={{ width: '20px', height: '20px' }} 
              viewBox="0 0 14 12" 
              fill={isWishlisted ? "#EE5858" : "none"} 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.36627 1C2.50717 1 1 2.46358 1 4.26892C1 7.53783 4.97831 10.5096 7.12048 11.2008C9.26265 10.5096 13.241 7.53783 13.241 4.26892C13.241 2.46358 11.7338 1 9.8747 1C8.73629 1 7.72947 1.54888 7.12048 2.38899C6.81002 1.95969 6.39764 1.60933 5.91822 1.36755C5.43881 1.12578 4.90647 0.999704 4.36627 1Z"
                stroke={isWishlisted ? "#EE5858" : "black"} 
                strokeWidth="1.3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quantity and Add to Cart Section */}
      {showAddToCart && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Quantity Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <button
              onClick={() => handleQuantityChange('decrease')}
              disabled={quantity <= 1}
              style={{
                padding: '2.5px 6px',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                background: 'none',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                border: 'none',
                opacity: quantity <= 1 ? 0.5 : 1
              }}
            >
              -
            </button>
            <span style={{
              padding: '3px 6px',
              border: '2px solid #FF0000',
              margin: '0 2px',
              textAlign: 'center',
              borderRadius: '4px',
              minWidth: '30px'
            }}>
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange('increase')}
              style={{
                padding: '2.5px 6px',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                background: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                border: 'none'
              }}
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            style={{
              flex: 1,
              padding: '12px',
              border: `1px solid ${product.inStock ? '#FF0000' : '#9CA3AF'}`,
              color: product.inStock ? '#FF0000' : '#9CA3AF',
              fontWeight: 'bold',
              background: '#ffffff',
              borderRadius: '100px',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = '#FF0000';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseOut={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#FF0000';
              }
            }}
          >
            {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
          </button>
        </div>
      )}
    </div>
  );
}