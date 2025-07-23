// src/components/ProductGrid.tsx - Using Shared ProductsCache (Super Clean!)
"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getRandomizedProducts, Product } from "@/lib/ProductsCache"; // 🔥 Clean import!

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // 🔥 SUPER CLEAN: One line to get randomized products with caching!
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🚀 ONE LINE! All caching handled automatically
        const randomizedProducts = await getRandomizedProducts();
        setProducts(randomizedProducts);

      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(products.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  if (products.length === 0) {
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
      {/* Section Header */}
      <div className="flex justify-between items-center mt-16 mb-6">
        <h2 className="text-[16px] sm:text-[22px] font-medium text-gray-800 relative">
          Products
          <span className="text-sm text-gray-500 ml-2">({products.length} items)</span>
        </h2>
        <a
          href="/shop"
          className="text-sm text-blue-500 hover:underline flex items-center gap-1 min-h-[32px] px-2 py-1"
        >
          View All <span>➔</span>
        </a>
      </div>

      {/* Decorative Line */}
      <div className="relative mb-6">
        <span className="relative z-10 block w-[20%] h-1 mt-1 bg-blue-400 rounded-full"></span>
        <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-8">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
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
            <svg width="20" height="20" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.9294 11.5322H4.20074" stroke="currentColor" strokeWidth="1.42988" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.6352 5.09766L4.20074 11.5321L10.6352 17.9666" stroke="currentColor" strokeWidth="1.42988" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400 min-w-[32px] text-center">
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
            <svg width="20" height="20" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.37152 11.5322H20.1002" stroke="currentColor" strokeWidth="1.42988" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.6657 5.09766L20.1002 11.5321L13.6657 17.9666" stroke="currentColor" strokeWidth="1.42988" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}