// src/app/shop/page.tsx - Complete E-commerce Layout
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

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
  priceRange: [number, number];
  inStockOnly: boolean;
  discountOnly: boolean;
  searchQuery: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState<Filters>({
    selectedBrands: [],
    priceRange: [0, 1000000],
    inStockOnly: false,
    discountOnly: false,
    searchQuery: searchQuery
  });

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, "products");
        const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
        const productsSnapshot = await getDocs(productsQuery);
        
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setProducts(productsData);
        
        // Extract unique brands
        const brands = [...new Set(productsData.map(p => p.brand))].sort();
        setAvailableBrands(brands);
        
        // Set price range based on actual product prices
        const prices = productsData.map(p => p.amount);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([Math.floor(minPrice), Math.ceil(maxPrice)]);
        
        setFilters(prev => ({
          ...prev,
          priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)]
        }));

      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters whenever products or filters change
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (filters.searchQuery.trim()) {
      const searchTerm = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.itemName.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.subcategory.toLowerCase().includes(searchTerm)
      );
    }

    // Brand filter
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(product => 
        filters.selectedBrands.includes(product.brand)
      );
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.amount >= filters.priceRange[0] && 
      product.amount <= filters.priceRange[1]
    );

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

    setFilteredProducts(filtered);
  }, [products, filters]);

  // Update search query from URL params
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchQuery: searchQuery }));
  }, [searchQuery]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedBrands: checked 
        ? [...prev.selectedBrands, brand]
        : prev.selectedBrands.filter(b => b !== brand)
    }));
  };

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  const clearFilters = () => {
    setFilters({
      selectedBrands: [],
      priceRange: priceRange,
      inStockOnly: false,
      discountOnly: false,
      searchQuery: searchQuery
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              Try Again
            </button>
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
          
          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>

                {/* Brands Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Brands</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableBrands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.selectedBrands.includes(brand)}
                          onChange={(e) => handleBrandChange(brand, e.target.checked)}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceRangeChange([Number(e.target.value), filters.priceRange[1]])}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceRangeChange([filters.priceRange[0], Number(e.target.value)])}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                    </div>
                  </div>
                </div>

                {/* In Stock Only Filter */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStockOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>

                {/* Discount Filter */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.discountOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, discountOnly: e.target.checked }))}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">On Sale</span>
                  </label>
                </div>

                {/* Active Filters Summary */}
                {(filters.selectedBrands.length > 0 || filters.inStockOnly || filters.discountOnly || filters.searchQuery) && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Active Filters:</h5>
                    <div className="space-y-1 text-xs text-gray-600">
                      {filters.searchQuery && <div>Search: "{filters.searchQuery}"</div>}
                      {filters.selectedBrands.length > 0 && (
                        <div>Brands: {filters.selectedBrands.join(', ')}</div>
                      )}
                      {filters.inStockOnly && <div>In Stock Only</div>}
                      {filters.discountOnly && <div>On Sale</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content - Products */}
            <div className="flex-1">
              
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {filters.searchQuery ? `Search Results for "${filters.searchQuery}"` : 'All Products'}
                </h1>
                <p className="text-gray-500">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  {filteredProducts.length !== products.length && ` (filtered from ${products.length})`}
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H6a1 1 0 00-1 1v1h16z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">
                    {filters.searchQuery || filters.selectedBrands.length > 0 || filters.inStockOnly || filters.discountOnly
                      ? "Try adjusting your filters to see more products"
                      : "No products available at the moment"
                    }
                  </p>
                  {(filters.selectedBrands.length > 0 || filters.inStockOnly || filters.discountOnly) && (
                    <button
                      onClick={clearFilters}
                      className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                  {filteredProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      isTopRated={index < 3} // Mark first 3 as top rated
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}