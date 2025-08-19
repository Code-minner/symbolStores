// src/app/search/page.tsx - Using Shared ProductsCache (Super Clean!)
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchProducts, Product } from "@/lib/ProductsCache"; // 🔥 Clean import!
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

function SearchContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Price formatting function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // 🔥 SUPER CLEAN: Search using shared cache
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // 🚀 ONE LINE! All caching handled automatically
        const results = await searchProducts(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Error searching products:", err);
        setError("Failed to search products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchQuery]);

  const getProductUrl = (product: Product) => {
    return `/home/${product.category.toLowerCase().replace(/\s+/g, "-")}/${product.subcategory.toLowerCase().replace(/\s+/g, "-")}/${product.slug}`;
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Searching products...</p>
          <p className="text-gray-500 text-sm mt-2">
            Using cached data for lightning-fast search
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Search Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/shop"
              className="block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {searchQuery && (
            <div className="mb-4">
              <p className="text-gray-600 text-lg">
                Results for:{" "}
                <span className="font-semibold text-black">
                  "{searchQuery}"
                </span>
              </p>
              <p className="text-gray-500">
                {searchResults.length} product
                {searchResults.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {!searchQuery.trim() ? (
          <div className="text-center py-16">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Enter a search term
            </h3>
            <p className="text-gray-500 mb-6">
              Use the search bar above to find products
            </p>
            <Link
              href="/shop"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-16">
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8c.968 0 1.899.17 2.767.477"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-4">
              No results found for "<strong>{searchQuery}</strong>". Try
              different keywords or browse our categories.
            </p>
            <div className="space-x-4">
              <Link
                href="/shop"
                className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                View All Products
              </Link>
              <button
                onClick={() => window.history.back()}
                className="inline-block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search Suggestions */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Samsung",
                  "TV",
                  "Generator",
                  "Freezer",
                  "Air Conditioner",
                  "LG",
                  "Sony",
                ].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={getProductUrl(product)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={product.imageURL}
                      alt={product.itemName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {product.originalPrice &&
                      product.originalPrice > product.amount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          SALE
                        </div>
                      )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
                      {highlightSearchTerm(product.itemName, searchQuery)}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span>
                        {highlightSearchTerm(product.brand, searchQuery)}
                      </span>
                      <span>•</span>
                      <span>
                        {highlightSearchTerm(product.category, searchQuery)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.amount)}
                        </span>
                        {product.originalPrice &&
                          product.originalPrice > product.amount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                      </div>

                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.inStock
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </div>
                    </div>

                    {product.warranty && (
                      <div className="mt-2 text-xs text-gray-500">
                        📋 {product.warranty}
                      </div>
                    )}

                    {/* SKU */}
                    <div className="mt-1 text-xs text-gray-400">
                      SKU: {product.sku}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Back to Shop Link */}
            <div className="text-center mt-12">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Browse All Products
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchResults() {
  return (
    <div>
      <Header />
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
