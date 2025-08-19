// src/components/ProductCard.tsx - Improved with Type Safety
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";

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
  inStock: boolean | string; // ✅ FIXED: Accept both types from database
  slug: string;
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  isTopRated?: boolean;
}

export default function ProductCard({
  product,
  showAddToCart = true,
  isTopRated = false,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, formatPrice, toggleCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // ✅ FIXED: Helper functions for type safety (same as details page)
  const safeBooleanValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  };

  const safeStringValue = (value: any, fallback: string = ""): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") return value;
    return String(value);
  };

  // ✅ FIXED: Safe property access
  const isInStock = safeBooleanValue(product.inStock);
  const productName = safeStringValue(product.itemName, "Unnamed Product");
  const productCategory = safeStringValue(product.category, "unknown");
  const productSubcategory = safeStringValue(product.subcategory, "Product");
  const productBrand = safeStringValue(product.brand, "Unknown Brand");
  const productSku = safeStringValue(product.sku, product.id);
  const productImageURL = safeStringValue(
    product.imageURL,
    "/placeholder-image.jpg"
  );

  // ✅ FIXED: Safe wishlist check
  const isWishlisted = isInWishlist(product.id);

  const handleQuantityChange = (type: "increase" | "decrease") => {
    if (type === "increase") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrease" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!isInStock) {
      alert("This product is currently out of stock");
      return;
    }

    // ✅ FIXED: Use safe values when adding to cart
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        itemName: productName,
        category: productCategory,
        subcategory: productSubcategory,
        brand: productBrand,
        amount: product.amount,
        originalPrice: product.originalPrice,
        imageURL: productImageURL,
        slug: safeStringValue(product.slug, product.id),
        inStock: isInStock,
        sku: productSku,
        warranty: safeStringValue(product.warranty),
      });
    }

    // Reset quantity and show cart
    setQuantity(1);
    // toggleCart();
  };

  const handleWishlistToggle = () => {
    // ✅ FIXED: Use safe values when adding to wishlist
    toggleWishlist({
      id: product.id,
      itemName: productName,
      category: productCategory,
      subcategory: productSubcategory,
      brand: productBrand,
      amount: product.amount,
      originalPrice: product.originalPrice,
      imageURL: productImageURL,
      slug: safeStringValue(product.slug, product.id),
      inStock: isInStock,
      sku: productSku,
      warranty: safeStringValue(product.warranty),
    });
  };

  const getProductUrl = () => {
    const category = productCategory.toLowerCase().replace(/\s+/g, "-");
    const subcategory = productSubcategory.toLowerCase().replace(/\s+/g, "-");
    const slug = safeStringValue(product.slug, product.id);

    return `/home/${category}/${subcategory}/${slug}`;
  };

  // ✅ FIXED: Safe price calculations
  const hasOriginalPrice =
    product.originalPrice && product.originalPrice > product.amount;

  return (
    <div
    className="max-w-full min-w-full md:min-w-[200px]  "
      style={{
        boxSizing: "border-box",
        margin: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        padding: "10px",
        border: "1px solid #E4E7E9",
        borderRadius: "3px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
      }}
    >
      {/* Image Container - Fixed Height */}
      <div
        className="h-[140px] sm:h-[150px]"
        style={{
          position: "relative",
          marginBottom: "10px",
          flexShrink: 0,
        }}
      >
        <Link href={getProductUrl()}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
            onMouseOver={(e) => {
              const img = e.currentTarget.querySelector(
                "img"
              ) as HTMLImageElement;
              if (img) {
                img.style.transform = "scale(1.1)";
                img.style.filter = "brightness(0.95)";
              }
            }}
            onMouseOut={(e) => {
              const img = e.currentTarget.querySelector(
                "img"
              ) as HTMLImageElement;
              if (img) {
                img.style.transform = "scale(1)";
                img.style.filter = "brightness(1)";
              }
            }}
          >
            {/* ✅ FIXED: Safe image loading with fallback */}
            <Image
              src={productImageURL}
              alt={`${productName} - ${productSubcategory}`}
              fill
              className="w-[100%] h-[100%] object-cover"
              style={{
                objectFit: "cover",
                transition: "transform 0.3s ease, filter 0.3s ease",
              }}
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.jpg";
              }}
            />
          </div>
        </Link>

        {/* ✅ FIXED: Badge logic with safe boolean checks */}
        {(isTopRated || !isInStock || hasOriginalPrice) && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: !isInStock ? "#9CA3AF" : "",
              color: "rgb(255, 255, 255)",
              padding: "4px 8px",
              fontSize: "0.875rem",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
          >
            {!isInStock
              ? "Out of Stock"
              : hasOriginalPrice
                ? "Sale"
                : isTopRated
                  ? ""
                  : ""}
          </span>
        )}
      </div>

      {/* Product Info Container - Flexible Height */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top Section - Category and Title */}
        <div>
          {/* Category */}
          <span
            className="text-[0.5rem] sm:text-[0.9rem]"
            style={{
              color: "#EE5858",
              backgroundColor: "#D8262670",
              borderRadius: "100px",
              padding: "4px 8px",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            {productSubcategory}
          </span>

          {/* Title - Fixed Height with Overflow */}
          <Link href={getProductUrl()}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: "400",
                margin: "8px 0 4px",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.2",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#EE5858")}
              onMouseOut={(e) => (e.currentTarget.style.color = "inherit")}
            >
              {productName}
            </h2>
          </Link>
        </div>

        {/* Bottom Section - Price and Actions */}
        <div>
          {/* Price Row - Fixed Height */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "2px 0",
            }}
          >
            <div>
              <p
                className="text-[1rem] sm:text-[1.5rem]"
                style={{
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                {formatPrice(product.amount)}
              </p>
              {/* ✅ FIXED: Safe original price display */}
              {hasOriginalPrice && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6B7280",
                    textDecoration: "line-through",
                    marginTop: "2px",
                    margin: 0,
                  }}
                >
                  {formatPrice(product.originalPrice!)}
                </p>
              )}
            </div>

            {/* Heart Icon - Updated */}
            <button
              onClick={handleWishlistToggle}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                alignSelf: "flex-start",
                transition: "transform 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.1)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                style={{ width: "20px", height: "20px" }}
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

          {/* Quantity and Add to Cart Section - Fixed Height */}
          {showAddToCart && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
                height: "48px",
                marginTop: "10px",
              }}
            >
              {/* Quantity Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => handleQuantityChange("decrease")}
                  disabled={quantity <= 1}
                  className="text-[10px] sm:text-[14px] py-[2px] px-[4px]  sm:py-[2.5px] sm:px-[5px]  "
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    background: "none",
                    cursor: quantity <= 1 ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                    border: "none",
                    opacity: quantity <= 1 ? 0.5 : 1,
                  }}
                >
                  -
                </button>
                <span
                  className="text-[8px] sm:text-[14px] py-[0px] px-[1px] min-w-[25px] max-w-[30px]  sm:py-[2.5px] sm:px-[5px]"
                  style={{
                    border: "2px solid #FF0000",
                    margin: "0 2px",
                    textAlign: "center",
                    borderRadius: "4px",
              
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange("increase")}
                  className="text-[8px] sm:text-[14px] py-[2px] px-[4px]  sm:py-[2.5px] sm:px-[5px]  "
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    background: "none",
                    cursor: "pointer",
                    borderRadius: "4px",
                    border: "none",
                  }}
                >
                  +
                </button>
              </div>

              {/* ✅ FIXED: Add to Cart Button with safe boolean check */}
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="text-[8px] sm:text-[12px] md:text-[13px] lg:text-[13px] py-2 sm:py-2 px-1 sm:px-3"
                style={{
                  flex: 1,
                  border: `1px solid ${isInStock ? "#FF0000" : "#9CA3AF"}`,
                  color: isInStock ? "#FF0000" : "#9CA3AF",
                  fontWeight: "bold",
                  background: "#ffffff",
                  borderRadius: "100px",
                  cursor: isInStock ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (isInStock) {
                    e.currentTarget.style.backgroundColor = "#FF0000";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseOut={(e) => {
                  if (isInStock) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "#FF0000";
                  }
                }}
              >
                {isInStock ? "ADD TO CART" : "OUT OF STOCK"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
