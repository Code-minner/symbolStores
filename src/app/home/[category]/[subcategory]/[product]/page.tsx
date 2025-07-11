// src/app/home/[category]/[subcategory]/[product]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

interface ProductDetailsProps {
  params: Promise<{
    category: string;
    subcategory: string;
    product: string; // This is the slug
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{
    category: string;
    subcategory: string;
    product: string;
  } | null>(null);

  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
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
          ...productDoc.data()
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const breadcrumbs = product ? [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: product.category, href: `/shop?category=${product.category}` },
    { name: product.subcategory, href: `/shop?category=${product.category}&subcategory=${product.subcategory}` },
    { name: product.itemName, href: "#" }
  ] : [];

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product?.inStock) {
      alert("This product is currently out of stock");
      return;
    }
    console.log(`Added ${quantity} x ${product?.itemName} to cart`);
    alert(`Added ${quantity} x ${product?.itemName} to cart!`);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    console.log(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist: ${product?.itemName}`);
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
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-4">The product you're looking for doesn't exist or has been removed.</p>
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
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="min-h-screen">
          {/* Breadcrumb */}
          <div>
            <div className="w-full mx-auto px-4 py-3">
              <nav className="flex items-center space-x-2 text-sm text-gray-600">
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-gray-400">›</span>}
                    <a
                      href={item.href}
                      className={`hover:text-blue-600 ${index === breadcrumbs.length - 1
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600'
                        }`}
                    >
                      {item.name}
                    </a>
                  </React.Fragment>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Product Section */}
          <div className="w-full mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Left Side - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
                  <div className="relative h-96 w-full">
                    <Image
                      src={product.images[selectedImage] || product.imageURL}
                      alt={product.itemName}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`bg-white border rounded-lg p-2 hover:border-blue-300 transition-colors ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                          }`}
                      >
                        <div className="relative h-20 w-full">
                          <Image
                            src={image}
                            alt={`${product.itemName} view ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="100px"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side - Product Info */}
              <div className="space-y-6">
                {/* Product Title & Status */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {product.itemName}
                  </h1>
                  <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${
                    product.inStock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(product.amount)}
                  </div>
                  {product.originalPrice && product.originalPrice > product.amount && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        SAVE {formatPrice(product.originalPrice - product.amount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Brand:</span>
                      <span className="ml-2 text-gray-900">{product.brand}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-900">{product.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Subcategory:</span>
                      <span className="ml-2 text-gray-900">{product.subcategory}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">SKU:</span>
                      <span className="ml-2 text-gray-900">{product.sku}</span>
                    </div>
                  </div>

                  {product.warranty && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Warranty:</span>
                      <span className="ml-2 text-gray-900">{product.warranty}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="text-gray-700 text-sm flex items-start">
                          <span className="text-red-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange('decrease')}
                        className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg font-semibold"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange('increase')}
                        className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                        product.inStock
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.inStock ? 'Buy Now' : 'Out of Stock'}
                    </button>

                    <button
                      onClick={toggleWishlist}
                      className={`px-6 py-3 border rounded-lg transition-colors font-semibold ${isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {isWishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <div className="space-y-1">
                    <p>✓ Free delivery on orders over ₦50,000</p>
                    {product.warranty && <p>✓ {product.warranty} included</p>}
                    <p>✓ 30-day return policy</p>
                    <p>✓ Secure payment options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}