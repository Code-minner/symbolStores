// src/components/ProductGrid.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

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

// Fisher-Yates shuffle algorithm for true randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ProductGrid() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // Increased for better performance

  // Randomize products once when loaded - use useMemo to prevent re-shuffling on every render
  const randomizedProducts = useMemo(() => {
    if (allProducts.length === 0) return [];
    return shuffleArray(allProducts);
  }, [allProducts]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // SPEED OPTIMIZATION 1: Fetch recent products first for faster initial load
        const recentProductsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(50) // Load first 50 products quickly
        );

        const snapshot = await getDocs(recentProductsQuery);
        const recentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // Set initial data immediately for fast display
        setAllProducts(recentData);
        setLoading(false);

        // SPEED OPTIMIZATION 2: Load remaining products in background
        const allProductsQuery = query(collection(db, "products"));
        const allSnapshot = await getDocs(allProductsQuery);
        const allData = allSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // Update with all products (this will trigger randomization)
        setAllProducts(allData);

      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(randomizedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = randomizedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SPEED OPTIMIZATION 3: Improved loading skeleton
  if (loading) {
    return (
      <section className="my-10">
        <div className="flex justify-between items-center mt-16 mb-6">
          <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
        </div>

        <div className="relative mb-6">
          <span className="relative z-10 block w-[20%] h-1 mt-1 bg-gray-200 rounded-full animate-pulse"></span>
          <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-1"></div>
              <div className="bg-gray-200 h-5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="my-10">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF3A00] text-white px-6 py-3 rounded-full hover:bg-[#E63400] transition-colors min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (randomizedProducts.length === 0) {
    return (
      <section className="my-10">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No products found</div>
          <p className="text-gray-400">Check back later for new products!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="my-10">
      <div className="flex justify-between items-center mt-16 mb-6">
        <h2 className="text-[16px] sm:text-[22px] font-medium text-gray-800 relative">
          Products
          {/* Show total count */}
          <span className="text-sm text-gray-500 ml-2">({randomizedProducts.length} items)</span>
        </h2>
        <a
          href="/shop"
          className="text-sm text-blue-500 hover:underline flex items-center gap-1 min-h-[32px] px-2 py-1"
        >
          View All <span>➔</span>
        </a>
      </div>

      <div className="relative mb-6">
        <span className="relative z-10 block w-[20%] h-1 mt-1 bg-blue-400 rounded-full"></span>
        <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
      </div>

      {/* Product Grid - IMPROVED SPACING */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-8">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination - IMPROVED SPACING */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap px-2">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className={`px-2 sm:px-4 py-2 rounded-full border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white text-[#FF3A00] hover:bg-gray-50 border-gray-300 hover:border-[#FF3A00]"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.9294 11.5322H4.20074"
                stroke="currentColor"
                strokeWidth="1.42988"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.6352 5.09766L4.20074 11.5321L10.6352 17.9666"
                stroke="currentColor"
                strokeWidth="1.42988"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-gray-400 min-w-[32px] text-center"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => goToPage(page as number)}
                className={`px-2 sm:px-4 py-2 rounded-full border transition-colors min-w-[40px] h-[40px] flex items-center justify-center text-sm sm:text-base ${
                  currentPage === page
                    ? "bg-[#FF3A00] text-white border-[#FF3A00]"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-[#FF3A00] hover:text-[#FF3A00]"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next Button */}
          <button
            onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-2 sm:px-4 py-2 rounded-full border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white text-[#FF3A00] hover:bg-gray-50 border-gray-300 hover:border-[#FF3A00]"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.37152 11.5322H20.1002"
                stroke="currentColor"
                strokeWidth="1.42988"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.6657 5.09766L20.1002 11.5321L13.6657 17.9666"
                stroke="currentColor"
                strokeWidth="1.42988"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}