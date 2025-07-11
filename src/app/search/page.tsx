// src/app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

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
  tags: string[];
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all products
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
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    const filtered = products.filter(product => {
      const searchableFields = [
        product.itemName,
        product.brand,
        product.category,
        product.subcategory,
        product.description,
        ...(product.tags || [])
      ].join(' ').toLowerCase();

      return searchableFields.includes(searchTerm);
    });

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductUrl = (product: Product) => {
    // Using your /home/[category]/[subcategory]/[product] structure
    return `/home/${product.category.toLowerCase().replace(/\s+/g, '-')}/${product.subcategory.toLowerCase().replace(/\s+/g, '-')}/${product.slug}`;
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching products...</p>
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
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
          
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Search Results
            </h1>
            {searchQuery && (
              <div className="mb-4">
                <p className="text-gray-600 text-lg">
                  Results for: <span className="font-semibold text-black">"{searchQuery}"</span>
                </p>
                <p className="text-gray-500">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
          </div>

          {/* Search Results */}
          {!searchQuery.trim() ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Enter a search term</h3>
              <p className="text-gray-500">Use the search bar above to find products</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8c.968 0 1.899.17 2.767.477" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                Try different keywords or browse our categories
              </p>
              <div className="space-x-4">
                <Link 
                  href="/shop" 
                  className="inline-block bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Search Suggestions */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Samsung', 'TV', 'Generator', 'Freezer', 'Air Conditioner'].map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${term}`}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
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
                      {product.originalPrice && product.originalPrice > product.amount && (
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
                        <span>{highlightSearchTerm(product.brand, searchQuery)}</span>
                        <span>•</span>
                        <span>{highlightSearchTerm(product.category, searchQuery)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(product.amount)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.amount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          product.inStock 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.status}
                        </div>
                      </div>

                      {product.warranty && (
                        <div className="mt-2 text-xs text-gray-500">
                          📋 {product.warranty}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}