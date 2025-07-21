"use client";

// src/app/shop/page.tsx - Main Shop Page with Pagination and Brand Support

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  amount: number;
  originalPrice?: number;
  status: string;
  sku: string;
  warranty?: string;
  imageURL: string;
  images: string[];
  inStock: boolean;
  slug: string;
  createdAt: any;
}

interface Filters {
  selectedBrands: string[];
  selectedSubcategories: string[];
  selectedPriceRange: string;
  inStockOnly: boolean;
  discountOnly: boolean;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12); // Number of products per page

  // Fixed brand list - show all these brands regardless of current inventory
  const allBrands = [
    "Samsung", "LG", "Sony", "Panasonic", "Hisense", "TCL", "Haier", 
    "Thermocool", "Scanfrost", "Nexus", "Bruhm", "Midea", "Kenstar",
    "Binatone", "Philips", "Bosch", "Whirlpool", "Electrolux", "Sharp",
    "Toshiba", "Grundig", "Polystar", "Century", "Maxi", "Others", "ELEPAQ",
    "Snowtec", "Gotv", "Bunatone"
  ];

  // Get query parameters - ✅ ADDED BRAND PARAMETER
  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const searchParam = searchParams.get('search');
  const brandParam = searchParams.get('brand'); // ✅ NEW: Brand parameter

  const [filters, setFilters] = useState<Filters>({
    selectedBrands: [],
    selectedSubcategories: [],
    selectedPriceRange: 'all',
    inStockOnly: false,
    discountOnly: false
  });

  // Price ranges
  const priceRanges = [
    { id: 'all', label: 'All Price', min: 0, max: Infinity },
    { id: 'under-150k', label: 'Under 150k', min: 0, max: 150000 },
    { id: '150k-200k', label: '150k to 200k', min: 150000, max: 200000 },
    { id: '200k-500k', label: '200k to 500k', min: 200000, max: 500000 },
    { id: '500k-800k', label: '500k to 800k', min: 500000, max: 800000 },
    { id: '800k-1m', label: '800k to 1m', min: 800000, max: 1000000 },
    { id: '1m-10m', label: '1m to 10m', min: 1000000, max: 10000000 },
  ];

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const productsCollection = collection(db, "products");
        const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
        const productsSnapshot = await getDocs(productsQuery);

        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setAllProducts(productsData);

        // Extract unique subcategories from all products
        const subcategories = [...new Set(productsData.map(p => p.subcategory))].filter(Boolean).sort();
        setAvailableSubcategories(subcategories);

      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please check your internet connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ NEW: Auto-select brand from URL parameter
  useEffect(() => {
    if (brandParam && allBrands.includes(brandParam)) {
      setFilters(prev => ({
        ...prev,
        selectedBrands: [brandParam]
      }));
    }
  }, [brandParam]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, categoryParam, subcategoryParam, searchParam, brandParam]);

  // Filtered brands based on search - using fixed brand list
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) {
      return allBrands;
    }
    return allBrands.filter(brand => 
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [allBrands, brandSearch]);

  // Apply all filters including URL parameters
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // URL Parameter Filters (from header navigation)

    // Category filter from URL
    if (categoryParam) {
      filtered = filtered.filter(product => {
        const productCategory = product.category?.toLowerCase() || '';
        const searchCategory = categoryParam.toLowerCase();
        return productCategory === searchCategory ||
          productCategory.includes(searchCategory) ||
          searchCategory.includes(productCategory);
      });
    }

    // Subcategory filter from URL
    if (subcategoryParam) {
      filtered = filtered.filter(product => {
        const productSubcategory = product.subcategory?.toLowerCase() || '';
        const searchSubcategory = subcategoryParam.toLowerCase();
        return productSubcategory === searchSubcategory ||
          productSubcategory.includes(searchSubcategory) ||
          searchSubcategory.includes(productSubcategory);
      });
    }

    // Search filter from URL
    if (searchParam) {
      const searchTerm = searchParam.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const searchableFields = [
          product.itemName,
          product.brand,
          product.category,
          product.subcategory,
          product.description
        ].join(' ').toLowerCase();

        return searchableFields.includes(searchTerm);
      });
    }

    // Sidebar Filters (user-selected filters)

    // Brand filter
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(product =>
        filters.selectedBrands.includes(product.brand)
      );
    }

    // Subcategory filter (from sidebar)
    if (filters.selectedSubcategories.length > 0) {
      filtered = filtered.filter(product =>
        filters.selectedSubcategories.includes(product.subcategory)
      );
    }

    // Price range filter
    if (filters.selectedPriceRange !== 'all') {
      const selectedRange = priceRanges.find(range => range.id === filters.selectedPriceRange);
      if (selectedRange) {
        filtered = filtered.filter(product =>
          product.amount >= selectedRange.min && product.amount <= selectedRange.max
        );
      }
    }

    // In stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Discount filter
    if (filters.discountOnly) {
      filtered = filtered.filter(product =>
        product.originalPrice && product.originalPrice > product.amount
      );
    }

    return filtered;
  }, [allProducts, categoryParam, subcategoryParam, searchParam, filters, priceRanges]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Pagination helper functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of products section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | string)[] = [];
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Always include first page
    pages.push(1);

    // Add ellipsis if needed
    if (rangeStart > 2) {
      pages.push("...");
    }

    // Add range around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Add ellipsis if needed
    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }

    // Always include last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const currentAvailableSubcategories = useMemo(() => {
    let baseProducts = [...allProducts];

    // Apply URL filters first
    if (categoryParam) {
      baseProducts = baseProducts.filter(product => {
        const productCategory = product.category?.toLowerCase() || '';
        const searchCategory = categoryParam.toLowerCase();
        return productCategory === searchCategory ||
          productCategory.includes(searchCategory) ||
          searchCategory.includes(productCategory);
      });
    }

    if (searchParam) {
      const searchTerm = searchParam.toLowerCase().trim();
      baseProducts = baseProducts.filter(product => {
        const searchableFields = [
          product.itemName,
          product.brand,
          product.category,
          product.subcategory,
          product.description
        ].join(' ').toLowerCase();
        return searchableFields.includes(searchTerm);
      });
    }

    return [...new Set(baseProducts.map(p => p.subcategory))].filter(Boolean).sort();
  }, [allProducts, categoryParam, searchParam]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedBrands: checked
        ? [...prev.selectedBrands, brand]
        : prev.selectedBrands.filter(b => b !== brand)
    }));
  };

  const handleSubcategoryChange = (subcategory: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedSubcategories: checked
        ? [...prev.selectedSubcategories, subcategory]
        : prev.selectedSubcategories.filter(s => s !== subcategory)
    }));
  };

  const handlePriceRangeChange = (rangeId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedPriceRange: rangeId
    }));
  };

  // ✅ UPDATED: Clear filters function to handle URL brand parameter
  const clearFilters = () => {
    setFilters({
      selectedBrands: brandParam ? [brandParam] : [], // Keep URL brand if present
      selectedSubcategories: [],
      selectedPriceRange: 'all',
      inStockOnly: false,
      discountOnly: false
    });
    setBrandSearch("");
    setShowAllBrands(false);
    setCurrentPage(1);
  };

  // ✅ UPDATED: Dynamic breadcrumbs based on URL parameters including brand
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { name: "Home", href: "/" },
      { name: "Shop", href: "/shop" }
    ];

    // Add brand breadcrumb
    if (brandParam) {
      crumbs.push({
        name: `${brandParam} Products`,
        href: `/shop?brand=${encodeURIComponent(brandParam)}`
      });
    }

    if (categoryParam) {
      const categoryUrl = brandParam 
        ? `/shop?brand=${encodeURIComponent(brandParam)}&category=${encodeURIComponent(categoryParam)}`
        : `/shop?category=${encodeURIComponent(categoryParam)}`;
      crumbs.push({
        name: categoryParam,
        href: categoryUrl
      });
    }

    if (subcategoryParam) {
      let subcategoryUrl = `/shop?`;
      const params = [];
      if (brandParam) params.push(`brand=${encodeURIComponent(brandParam)}`);
      if (categoryParam) params.push(`category=${encodeURIComponent(categoryParam)}`);
      params.push(`subcategory=${encodeURIComponent(subcategoryParam)}`);
      subcategoryUrl += params.join('&');
      
      crumbs.push({
        name: subcategoryParam,
        href: subcategoryUrl
      });
    }

    return crumbs;
  }, [categoryParam, subcategoryParam, brandParam]);

  // ✅ UPDATED: Page title to include brand
  const pageTitle = useMemo(() => {
    if (brandParam && searchParam) {
      return `${brandParam} - Search results for "${searchParam}"`;
    }
    if (brandParam && subcategoryParam) {
      return `${brandParam} ${subcategoryParam}`;
    }
    if (brandParam && categoryParam) {
      return `${brandParam} ${categoryParam}`;
    }
    if (brandParam) {
      return `${brandParam} Products`;
    }
    if (searchParam) {
      return `Search results for "${searchParam}"`;
    }
    if (subcategoryParam) {
      return subcategoryParam;
    }
    if (categoryParam) {
      return categoryParam;
    }
    return "All Products";
  }, [categoryParam, subcategoryParam, searchParam, brandParam]);

  // ✅ UPDATED: Page subtitle to include brand context
  const pageSubtitle = useMemo(() => {
    if (brandParam && searchParam && categoryParam) {
      return `${brandParam} products in ${categoryParam}`;
    }
    if (brandParam && categoryParam) {
      return `${brandParam} products in ${categoryParam}`;
    }
    if (brandParam && searchParam) {
      return `${brandParam} products matching "${searchParam}"`;
    }
    if (brandParam) {
      return "All categories";
    }
    if (searchParam && categoryParam) {
      return `in ${categoryParam}`;
    }
    if (subcategoryParam && categoryParam) {
      return `in ${categoryParam}`;
    }
    if (searchParam) {
      return "in all categories";
    }
    return "";
  }, [categoryParam, subcategoryParam, searchParam, brandParam]);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
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
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-6">

          {/* Mobile Filter Backdrop */}
          {showMobileFilters && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

          {/* Mobile Filter Sidebar */}
          {showMobileFilters && (
            <div className="lg:hidden fixed top-0 left-0 h-full w-[80%] bg-white shadow-xl z-50 transform transition-transform duration-300">
              <div className="flex flex-col h-full">
                {/* Mobile Filter Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: "var(--header_background)" }}>
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Filter Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Clear All Filters Button */}
                  <div className="mb-6">
                    <button 
                      onClick={clearFilters}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>

                  {/* Brands Filter */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Brands</h4>
                    {/* Brand Search Bar */}
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Search For Brands"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z" fill="#626262" />
                        </svg>
                      </div>
                    </div>

                    {/* Brand List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {filteredBrands
                        .slice(0, showAllBrands ? filteredBrands.length : 10)
                        .map(brand => (
                          <label key={brand} className="flex items-center cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={filters.selectedBrands.includes(brand)}
                                onChange={(e) => handleBrandChange(brand, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.selectedBrands.includes(brand)
                                  ? 'bg-orange-500 border-orange-500'
                                  : 'border-gray-300 group-hover:border-orange-400'
                                }`}>
                                {filters.selectedBrands.includes(brand) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                              {brand}
                            </span>
                          </label>
                        ))}
                    </div>

                    {/* View More Link */}
                    {filteredBrands.length > 10 && (
                      <button
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="text-sm text-orange-600 hover:text-orange-700 mt-3 font-medium"
                      >
                        {showAllBrands ? '← View less' : `View more (${filteredBrands.length - 10} more)`}
                      </button>
                    )}
                  </div>

                  {/* Subcategories Filter */}
                  {!subcategoryParam && currentAvailableSubcategories.length > 1 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Subcategories</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {currentAvailableSubcategories.map(subcategory => (
                          <label key={subcategory} className="flex items-center cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={filters.selectedSubcategories.includes(subcategory)}
                                onChange={(e) => handleSubcategoryChange(subcategory, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.selectedSubcategories.includes(subcategory) 
                                  ? 'bg-orange-500 border-orange-500' 
                                  : 'border-gray-300 group-hover:border-orange-400'
                                }`}>
                                {filters.selectedSubcategories.includes(subcategory) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                              {subcategory}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range Filter */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h4>
                    <div className="space-y-3">
                      {priceRanges.map((range) => (
                        <label key={range.id} className="flex items-center cursor-pointer group">
                          <div className="relative">
                            <input
                              type="radio"
                              name="mobilePriceRange"
                              value={range.id}
                              checked={filters.selectedPriceRange === range.id}
                              onChange={() => handlePriceRangeChange(range.id)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.selectedPriceRange === range.id
                                ? 'border-orange-500 bg-white'
                                : 'border-gray-300 group-hover:border-orange-400'
                              }`}>
                              {filters.selectedPriceRange === range.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                              )}
                            </div>
                          </div>
                          <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                            {range.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* In Stock Only Filter */}
                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.inStockOnly}
                          onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.inStockOnly
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300 group-hover:border-orange-400'
                          }`}>
                          {filters.inStockOnly && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                        In Stock Only
                      </span>
                    </label>
                  </div>

                  {/* Discount Filter */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Discount</h4>
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.discountOnly}
                          onChange={(e) => setFilters(prev => ({ ...prev, discountOnly: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.discountOnly
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300 group-hover:border-orange-400'
                          }`}>
                          {filters.discountOnly && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                        Show Only Discount
                      </span>
                    </label>
                  </div>
                </div>

                {/* Mobile Filter Footer */}
                <div className="border-t p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <nav className="flex items-center space-x-2 text-sm text-gray-600 overflow-x-auto">
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center whitespace-nowrap">
                    {index > 0 && <span className="text-gray-400 mx-2">›</span>}
                    <Link
                      href={item.href}
                      className={`hover:text-blue-600 ${index === breadcrumbs.length - 1
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600'
                        }`}
                    >
                      {item.name}
                    </Link>
                  </div>
                ))}
              </nav>
              
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-full lg:w-[24rem] lg:flex-shrink-0">
              <div className="rounded-lg shadow-sm border p-4 lg:p-6 lg:sticky lg:top-6" style={{ backgroundColor: "var(--header_background)" }}>

                {/* Filter Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Brands</h3>
                </div>

                {/* Clear All Filters Button */}
                <div className="mb-4">
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>

                {/* Brands Filter */}
                <div className="mb-6">
                  {/* Brand Search Bar */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search For Brands"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z" fill="#626262" />
                      </svg>
                    </div>
                  </div>

                  {/* Brand List - Show first 10 by default */}
                  <div className="space-y-3 overflow-y-auto">
                    {filteredBrands
                      .slice(0, showAllBrands ? filteredBrands.length : 10)
                      .map(brand => (
                        <label key={brand} className="flex items-center cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={filters.selectedBrands.includes(brand)}
                              onChange={(e) => handleBrandChange(brand, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.selectedBrands.includes(brand)
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-300 group-hover:border-orange-400'
                              }`}>
                              {filters.selectedBrands.includes(brand) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="ml-3 text-lg text-gray-700 group-hover:text-gray-900">
                            {brand}
                          </span>
                        </label>
                      ))}
                  </div>

                  {/* View More Link - Show if more than 10 brands */}
                  {filteredBrands.length > 10 && (
                    <button
                      onClick={() => setShowAllBrands(!showAllBrands)}
                      className="text-sm text-orange-600 hover:text-orange-700 mt-3 font-medium"
                    >
                      {showAllBrands ? '← View less' : `View more (${filteredBrands.length - 10} more)`}
                    </button>
                  )}
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Price Range</h4>
                  <div className="space-y-3">
                    {priceRanges.map((range) => (
                      <label key={range.id} className="flex items-center cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="desktopPriceRange"
                            value={range.id}
                            checked={filters.selectedPriceRange === range.id}
                            onChange={() => handlePriceRangeChange(range.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.selectedPriceRange === range.id
                              ? 'border-orange-500 bg-white'
                              : 'border-gray-300 group-hover:border-orange-400'
                            }`}>
                            {filters.selectedPriceRange === range.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            )}
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* In Stock Only Filter */}
                <div className="mb-6">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.inStockOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.inStockOnly
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300 group-hover:border-orange-400'
                        }`}>
                        {filters.inStockOnly && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                      In Stock Only
                    </span>
                  </label>
                </div>

                {/* Discount Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Discount</h4>
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.discountOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, discountOnly: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filters.discountOnly
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300 group-hover:border-orange-400'
                        }`}>
                        {filters.discountOnly && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                      Show Only Discount
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Content - Products */}
            <div className="flex-1 min-w-0">

              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
                {pageSubtitle && (
                  <p className="text-gray-600 mb-2">{pageSubtitle}</p>
                )}
                
                {/* Results count */}
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                  {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>

              {/* Subcategory Quick Links - Only show if in category view */}
              {categoryParam && !subcategoryParam && currentAvailableSubcategories.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Browse by Subcategory</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentAvailableSubcategories.map((subcategory) => (
                      <Link
                        key={subcategory}
                        href={`/shop?category=${encodeURIComponent(categoryParam)}&subcategory=${encodeURIComponent(subcategory)}`}
                        className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm hover:border-orange-300 hover:text-orange-600 transition-colors"
                      >
                        {subcategory}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Grid */}
              {currentProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <svg className="w-16 h-16 lg:w-24 lg:h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H6a1 1 0 00-1 1v1h16z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    {brandParam && searchParam
                      ? `No ${brandParam} products found for "${searchParam}"`
                      : brandParam
                        ? `No ${brandParam} products found`
                        : searchParam
                          ? `No products found for "${searchParam}"`
                          : categoryParam || subcategoryParam
                            ? `No products found in this category`
                            : "Try adjusting your filters to see more products"
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {(filters.selectedBrands.length > 0 || filters.selectedSubcategories.length > 0 || filters.inStockOnly || filters.discountOnly) && (
                      <button
                        onClick={clearFilters}
                        className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <Link
                      href="/shop"
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-center"
                    >
                      Browse All Products
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
                    {currentProducts.map((product, index) => (
                      <div key={product.id} className="flex justify-center">
                        <ProductCard
                          product={product}
                          isTopRated={index < 3}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-8">
                      {/* Previous Button */}
                      <button
                        onClick={() => goToPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-full border transition-colors ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            : "bg-white text-[#FF3A00] hover:bg-gray-50 border-gray-300 hover:border-[#FF3A00]"
                        }`}
                      >
                        <svg
                          width="24"
                          height="23"
                          viewBox="0 0 24 23"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="rotate-180"
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

                      {/* Page Numbers */}
                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-3 py-2 text-gray-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => goToPage(page as number)}
                            className={`px-4 py-2 rounded-full border transition-colors min-w-[40px] h-[40px] flex items-center justify-center ${
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
                        className={`px-4 py-2 rounded-full border transition-colors ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            : "bg-white text-[#FF3A00] hover:bg-gray-50 border-gray-300 hover:border-[#FF3A00]"
                        }`}
                      >
                        <svg
                          width="24"
                          height="23"
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}