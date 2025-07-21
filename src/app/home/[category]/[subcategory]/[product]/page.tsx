// src/app/home/[category]/[subcategory]/[product]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import ProductSlider from "@/components/ProductSlider";
import { useProducts } from "../../../../../lib/hooks/useProducts";

// ✅ FIXED: Updated interface to handle Promise params
interface ProductDetailsProps {
  params: Promise<{
    category: string;
    subcategory: string;
    product: string;
  }>;
}

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  features: string[];
  amount: number;
  originalPrice?: number;
  status: string;
  sku: string;
  warranty?: string;
  imageURL: string;
  images: string[];
  inStock: boolean;
  slug: string;
  tags: string[];
}

export default function ProductDetails({ params }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showWishlistMessage, setShowWishlistMessage] = useState(false);
  const [showCartMessage, setShowCartMessage] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{
    category: string;
    subcategory: string;
    product: string;
  } | null>(null);

  // Context integrations
  const { addToCart, formatPrice } = useCart();

  // Wishlist integration with error handling
  let wishlistHook;
  try {
    wishlistHook = useWishlist();
  } catch (error) {
    console.error("Wishlist context not available:", error);
    wishlistHook = {
      toggleWishlist: () => console.log("Wishlist not available"),
      isInWishlist: () => false,
    };
  }

  const { toggleWishlist, isInWishlist } = wishlistHook;
  const { products, loading: productsLoading } = useProducts();

  // Get wishlist status for current product
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const relatedProducts = products
    .filter(
      (p) =>
        p.slug !== resolvedParams?.product && p.category === product?.category
    )
    .slice(0, 6);

  // ✅ FIXED: Properly handle Promise params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setResolvedParams(resolved);
      } catch (error) {
        console.error("Error resolving params:", error);
        setError("Failed to load product parameters");
      }
    };
    resolveParams();
  }, [params]);

  // Fetch product from Firebase using slug
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, "products");
        const productQuery = query(
          productsCollection,
          where("slug", "==", resolvedParams.product)
        );

        const querySnapshot = await getDocs(productQuery);

        if (querySnapshot.empty) {
          setError("Product not found");
          return;
        }

        const productDoc = querySnapshot.docs[0];
        const productData = {
          id: productDoc.id,
          ...productDoc.data(),
        } as Product;

        setProduct(productData);
        console.log("Fetched product:", productData);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams]);

  const breadcrumbs = product
    ? [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: product.category, href: `/shop?category=${product.category}` },
        {
          name: product.subcategory,
          href: `/shop?category=${product.category}&subcategory=${product.subcategory}`,
        },
        { name: product.itemName, href: "#" },
      ]
    : [];

  const handleQuantityChange = (type: "increase" | "decrease") => {
    if (type === "increase") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrease" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product?.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    // Add to cart - loop for quantity
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

    // Reset quantity after adding to cart
    setQuantity(1);

    // Show success message
    setShowCartMessage(true);
    setTimeout(() => {
      setShowCartMessage(false);
    }, 3000);
  };

  // Updated wishlist toggle function
  const handleWishlistToggle = () => {
    if (!product) {
      console.log("No product available");
      return;
    }

    console.log("Toggling wishlist for product:", product.id);
    console.log("Current wishlist status:", isWishlisted);

    try {
      toggleWishlist({
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

      // Show feedback message
      setShowWishlistMessage(true);
      setTimeout(() => {
        setShowWishlistMessage(false);
      }, 3000);

      console.log("Wishlist toggled successfully");
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      alert("Failed to update wishlist. Please try again.");
    }
  };

  // Safe image getter
  const getCurrentImage = () => {
    if (product?.images && product.images.length > 0) {
      return (
        product.images[selectedImage] || product.images[0] || product.imageURL
      );
    }
    return product?.imageURL || "";
  };

  // Loading state
  if (loading || !resolvedParams) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <a
              href="/shop"
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      {/* Success Messages */}
      {showCartMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Added {quantity} x {product.itemName} to cart!
          </div>
        </div>
      )}

      {showWishlistMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            {isWishlisted ? `Added to wishlist!` : `Removed from wishlist!`}
          </div>
        </div>
      )}

      <div className="w-full max-w-[1400px] mx-auto">
        <div className="min-h-[100%] pb-8 pt-8">
          {/* Breadcrumb with Home Icon */}
          <div className="w-[95%] overflow-x-auto py-3 px-4 mr-4">
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

          {/* Main Product Section */}
          <div className="w-full mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side - Images (Thumbnails + Main Image) */}
              <div className="flex gap-4">
                {/* Thumbnail Images - Vertical Stack on Left */}
                {product.images && product.images.length > 1 && (
                  <div className="flex flex-col gap-2 w-20 sm:w-40">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`bg-white border rounded-lg p-2 hover:border-blue-300 transition-colors ${
                          selectedImage === index
                            ? "border-blue-500"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="relative h-16 sm:h-32 w-full">
                          <Image
                            src={image}
                            alt={`${product.itemName} view ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="200px"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg border-2 contain border-blue-200 p-4 h-full">
                    <div className="relative h-96 lg:h-[100%] w-full">
                      <Image
                        src={getCurrentImage()}
                        alt={product.itemName}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100%, 50%"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Product Info */}
              <div className="space-y-6 h-fit">
                {/* Product Title & Status */}
                <div>
                  <h1 className="text-2xl sm:text-3xl text-gray-900 mb-2">
                    {product.itemName}
                  </h1>
                  <span
                    className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${
                      product.inStock
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="text-2xl sm:text-4xl text-gray-900 mb-4">
                    {formatPrice(product.amount)}
                  </div>
                  {product.originalPrice &&
                    product.originalPrice > product.amount && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                          SAVE{" "}
                          {formatPrice(product.originalPrice - product.amount)}
                        </span>
                      </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-[10px]  sm:text-[14px]">
                    <div>
                      <span className="font-medium text-gray-700">Brand:</span>
                      <span className="ml-2 text-gray-900">
                        {product.brand}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Category:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {product.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">SKU:</span>
                      <span className="ml-2 text-gray-900">{product.sku}</span>
                    </div>
                  </div>

                  {product.warranty && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        Warranty:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {product.warranty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-[15px]  sm:text-[18px]">
                    Description
                  </h3>
                  <p className="text-gray-700 text-[10px]  sm:text-[14px] leading-relaxed max-h-[150px] overflow-y-auto">
                    {product.description}
                  </p>
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Key Features
                    </h3>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-gray-700 text-sm flex items-start"
                        >
                          <span className="text-red-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quantity & Action Buttons */}
                <div className="space-y-4">
                  {/* Action Buttons */}
                  <div className="flex space-x-4 relative">
                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange("decrease")}
                          disabled={quantity <= 1}
                          className="px-2 py-1 text-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-2 border-red-500 mx-1 text-center min-w-[40px] rounded">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange("increase")}
                          className="px-2 py-1 text-lg font-bold hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Buy Now Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className={` py-3 px-6 rounded-lg font-semibold transition-colors ${
                        product.inStock
                          ? "bg-[#FF0000] text-white hover:bg-orange-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </button>

                    {/* Wishlist Button - Same as ProductCard */}
                    <button
                      onClick={handleWishlistToggle}
                      className="px-6 py-3 border border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:scale-105"
                      title={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      {/* Same SVG as ProductCard */}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Slider */}
      {!productsLoading && relatedProducts.length > 0 && (
        <div className="mx-auto">
          <ProductSlider products={relatedProducts} />
        </div>
      )}

      <Footer />
    </div>
  );
}