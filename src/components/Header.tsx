// src/components/Header.tsx - Using Shared ProductsCache (Much Cleaner!)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchProducts, Product } from "@/lib/ProductsCache"; // 🔥 Clean import!
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import clsx from "clsx";

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function Header() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Context integrations
  const {
    state,
    toggleCart,
    closeCart,
    updateQuantity,
    removeFromCart,
    formatPrice,
  } = useCart();
  const { wishlistCount } = useWishlist();

  // Categories configuration
  const categories = [
    "Home & Kitchen",
    "Furniture",
    "TV",
    "Generator",
    "Freezers",
    "Microwave",
    "Air Conditioner",
    "Blender",
    "Audio Bass",
    "Washing Machine",
  ];

  const categorySubItems: { [key: string]: string[] } = {
    "All Categories": [],
    "Home & Kitchen": [
      "Toast",
      "Air Fryer",
      "Electric Kettle",
      "Griller",
      "Hotplate",
      "Hand Mixer",
      "Vacuum Cleaner",
      "Slow Juicer",
      "Jug Kettle",
      "Coffee Maker",
      "Sandwich Maker",
      "Mixer Grinder",
    ],
    Furniture: ["Sofa", "Dining Table", "Bed", "Wardrobe", "Chair", "Desk"],
    TV: ["LED TV", "OLED TV", "Smart TV", "4K TV"],
    Generator: ["Petrol Generator", "Diesel Generator", "Gas Generator"],
    Freezers: ["Chest Freezer", "Upright Freezer", "Mini Freezer"],
    Microwave: ["Solo Microwave", "Grill Microwave", "Convection Microwave"],
    Extentions: ["Ac guard"],
    "Pressing Iron": ["Dry Iron", "Steam Iron"],
    Stabilizer: [],
    "Air Conditioner": ["Split AC", "Window AC", "Portable AC"],
    "Washing Machine": [
      "Front Load Washing Machine",
      "Top Load Washing Machine",
      "Automatic Washing Machine",
      "Wash and Dry",
      "Commercial Dryer",
      "Twin Tub Washing Machines",
      "Tumble Dryer",
    ],
    Stove: [
      "Table Top Gas Cooker",
      "50x50 Cookers",
      "60x60 Cookers",
      "60x90 Cookers",
      "90x60 Cookers",
      "Air Fryer",
    ],

    Blender: ["Hand Blender", "Stand Blender", "Smoothie Blender"],
    "Audio Bass": ["Speakers", "Headphones", "Sound Bar"],
    Others: ["Accessories", "Parts", "Tools"],
  };

  const categoryButtonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isMobileMenuOpen && categoryButtonRef.current) {
      const rect = categoryButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isMobileMenuOpen]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check(); // run on mount
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 🚀 SUPER CLEAN: Debounced search using shared cache
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        // 🔥 ONE LINE! All caching handled automatically
        const results = await searchProducts(searchTerm);
        setSearchResults(results.slice(0, 8)); // Show max 8 results in dropdown
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Search products as user types
  useEffect(() => {
    debouncedSearch(search);
  }, [search, debouncedSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setExpandedCategory(null);
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setShowSearchResults(false);
    }
  };

  const handleProductClick = (product: Product) => {
    const productUrl = `/home/${product.category
      .toLowerCase()
      .replace(/\s+/g, "-")}/${product.subcategory
      .toLowerCase()
      .replace(/\s+/g, "-")}/${product.slug}`;
    router.push(productUrl);
    setShowSearchResults(false);
    setSearch("");
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleCategoryClick = (category: string, subCategory?: string) => {
    if (category === "All Categories") {
      router.push("/shop");
      setIsMobileMenuOpen(false);
      return;
    }

    if (subCategory) {
      router.push(
        `/shop?category=${encodeURIComponent(
          category
        )}&subcategory=${encodeURIComponent(subCategory)}`
      );
    } else {
      router.push(`/shop?category=${encodeURIComponent(category)}`);
    }

    setIsMobileMenuOpen(false);
  };

  // Search Results Component
  const SearchResults = () => (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          {searchResults.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors"
            >
              <div className="relative w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                <Image
                  src={product.imageURL}
                  alt={product.itemName}
                  fill
                  className="object-cover rounded"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {product.itemName}
                </h4>
                <p className="text-xs text-gray-500">
                  {product.brand} • {product.category}
                </p>
                <p className="text-sm font-semibold text-red-600">
                  {formatPrice(product.amount)}
                </p>
              </div>
              {!product.inStock && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
            </div>
          ))}
          <div className="p-3 text-center border-t border-gray-200">
            <button
              onClick={() => {
                router.push(
                  `/shop?search=${encodeURIComponent(search.trim())}`
                );
                setShowSearchResults(false);
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
            >
              View all results for "{search}"
            </button>
          </div>
        </>
      ) : (
        search.trim() && (
          <div className="p-4 text-center text-gray-500">
            <p>No products found for "{search}"</p>
            <div className="mt-2 space-y-1">
              <Link
                href={`/shop?search=${encodeURIComponent(search.trim())}`}
                className="block text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                onClick={() => setShowSearchResults(false)}
              >
                Search all products
              </Link>
              <Link
                href="/shop"
                className="block text-gray-600 hover:text-gray-700 text-sm transition-colors"
                onClick={() => setShowSearchResults(false)}
              >
                Browse all categories
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );

  return (
    <header className="bg-white relative w-full">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-center text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header */}
      <div
        className="w-full px-4 py-4 lg:mx-auto"
        style={{ backgroundColor: "var(--header_background)" }}
      >
        <div className="flex items-center max-w-[1400px] relative m-auto justify-between gap-4 py-2">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-black">
            <div className="flex items-center cursor-pointer">
              <Image
                src="/assets/SymbolStoreLogo.png"
                alt="Symbol Store Logo"
                width={100}
                height={50}
                priority
              />
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div
            className="hidden sm:block w-[100%] max-w-[70%] m-auto relative"
            ref={searchRef}
          >
            <form
              onSubmit={handleSearch}
              className="flex border border-gray-300 rounded-full overflow-hidden"
            >
              <div className="flex items-center px-3 bg-white text-gray-500">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 19 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z"
                    fill="#626262"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search For Products"
                className="flex-1 px-3 py-4 text-lg text-black placeholder-[#626262] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (search.trim() && searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#FF0000] text-white hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Search
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && <SearchResults />}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4 text-sm text-gray-700">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer transition-colors"
            >
              <div className="relative">
                <Icon icon="icon-park-outline:like" className="w-6 h-6 text-black" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="head_span hidden lg:inline">Wishlist</span>
            </Link>

            {/* Cart Icon with Count */}
            <button
              onClick={toggleCart}
              className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer relative transition-colors"
              aria-label={`Cart with ${state.totalItems} items`}
            >
              <div className="relative">
                <svg
                  width="17"
                  height="15"
                  viewBox="0 0 50 51"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M40 40.5996C41.3261 40.5996 42.5979 41.1264 43.5355 42.0641C44.4732 43.0018 45 44.2735 45 45.5996C45 46.9257 44.4732 48.1975 43.5355 49.1351C42.5979 50.0728 41.3261 50.5996 40 50.5996C38.6739 50.5996 37.4021 50.0728 36.4645 49.1351C35.5268 48.1975 35 46.9257 35 45.5996C35 42.8246 37.225 40.5996 40 40.5996ZM0 0.599609H8.175L10.525 5.59961H47.5C48.163 5.59961 48.7989 5.863 49.2678 6.33184C49.7366 6.80068 50 7.43657 50 8.09961C50 8.52461 49.875 8.94961 49.7 9.34961L40.75 25.5246C39.9 27.0496 38.25 28.0996 36.375 28.0996H17.75L15.5 32.1746L15.425 32.4746C15.425 32.6404 15.4908 32.7993 15.6081 32.9166C15.7253 33.0338 15.8842 33.0996 16.05 33.0996H45V38.0996H15C13.6739 38.0996 12.4021 37.5728 11.4645 36.6351C10.5268 35.6975 10 34.4257 10 33.0996C10 32.2246 10.225 31.3996 10.6 30.6996L14 24.5746L5 5.59961H0V0.599609ZM15 40.5996C16.3261 40.5996 17.5979 41.1264 18.5355 42.0641C19.4732 43.0018 20 44.2735 20 45.5996C20 46.9257 19.4732 48.1975 18.5355 49.1351C17.5979 50.0728 16.3261 50.5996 15 50.5996C13.6739 50.5996 12.4021 50.0728 11.4645 49.1351C10.5268 48.1975 10 46.9257 10 45.5996C10 42.8246 12.225 40.5996 15 40.5996ZM37.5 23.0996L44.45 10.5996H12.85L18.75 23.0996H37.5Z"
                    fill="black"
                  />
                </svg>
                {state.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {state.totalItems > 99 ? "99+" : state.totalItems}
                  </span>
                )}
              </div>
              <span className="head_span hidden lg:inline">Cart</span>
            </button>

            {/* Account */}
            <Link
              href="/dashboard"
              className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer transition-colors"
            >
              <Icon icon="ph:user-bold" className="w-6 h-6 text-black" />
              <span className="head_span hidden lg:inline">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200">
        <div className="w-full px-4 lg:max-w-[1400px] relative m-auto lg:mx-auto">
          {/* Mobile Layout */}
          <div className="w-full sm:hidden flex items-center justify-between py-4">
            {/* Hamburger Menu Button --------------------------------------------------------------------------------- */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Mobile Search */}
            <div className="flex-1 max-w-[85%] mx-4 relative">
              <form
                onSubmit={handleSearch}
                className="flex items-center border border-gray-300 rounded-full overflow-hidden h-10"
              >
                <div className="flex items-center px-3 bg-white text-gray-500">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z"
                      fill="#626262"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 min-w-0 px-2 py-3 text-sm text-black placeholder-[#626262] focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    if (search.trim() && searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                />

                <button
                  type="submit"
                  className="px-3 py-2 text-sm bg-[#FF0000] text-white hover:bg-red-700 transition-colors h-12"
                >
                  Go
                </button>
              </form>

              {/* Mobile Search Results */}
              {showSearchResults && <SearchResults />}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center py-3 text-lg relative font-bold gap-4 text-gray-700 justify-between overflow-x-auto">
            {/* Hamburger Menu Button */}
            <button
              ref={categoryButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <div
                className="whitespace-nowrap font-medium cursor-pointer px-6 py-2 rounded-full hover:text-white transition-all duration-300"
                style={{ backgroundColor: "var(--header_background)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--secondary_color)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--header_background)")
                }
              >
                All Categories
              </div>
            </button>
            {categories.map((category, index) => (
              <div
                key={index}
                className="whitespace-nowrap font-medium cursor-pointer px-6 py-2 rounded-full hover:text-white transition-all duration-300"
                onClick={() => handleCategoryClick(category)}
                style={{ backgroundColor: "var(--header_background)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--secondary_color)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--header_background)")
                }
              >
                {category}
              </div>
            ))}
          </nav>
        </div>
      </div>
      {/* Mobile Categories Dropdown Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="block relative max-w-[1400px] inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={clsx(
              "absolute bg-white rounded-lg shadow-2xl z-50 w-[90%] max-w-md",
              isMobile ? "left-1/2 -translate-x-1/2 top-[140px]" : ""
            )}
            style={
              !isMobile
                ? {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    position: "absolute",
                  }
                : undefined
            }
          >
            <div className="flex max-h-96 overflow-hidden rounded-lg">
              <div className="w-[40%] border-r border-gray-200 overflow-y-auto">
                {Object.entries(categorySubItems).map(
                  ([category, subItems]) => (
                    <div key={category}>
                      <button
                        onClick={() => {
                          if (subItems.length > 0) {
                            toggleCategory(category);
                          } else {
                            handleCategoryClick(category);
                          }
                        }}
                        className={`flex items-center justify-between w-full px-3 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          expandedCategory === category ? "bg-gray-50" : ""
                        }`}
                      >
                        <span className="font-medium text-gray-800 text-sm">
                          {category}
                        </span>
                        {subItems.length > 0 && (
                          <svg
                            width="7"
                            height="6"
                            viewBox="0 0 7 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6.43945 5.93945L0.530362 11.5686L0.530362 0.310288L6.43945 5.93945Z"
                              fill="#1E1E1E"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="w-[60%] overflow-y-auto">
                {expandedCategory &&
                  categorySubItems[expandedCategory]?.length > 0 && (
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                        {expandedCategory}
                      </h4>
                      {categorySubItems[expandedCategory].map(
                        (subItem, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleCategoryClick(expandedCategory, subItem);
                            }}
                            className="block w-full text-left py-2 text-gray-600 hover:text-red-500 text-sm transition-colors"
                          >
                            {subItem}
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cart Sidebar */}
      {state.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={closeCart}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Shopping Cart ({state.totalItems})
                </h3>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {state.items.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"
                      />
                    </svg>
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Link
                      href="/shop"
                      onClick={closeCart}
                      className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors inline-block"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                          <Image
                            src={item.imageURL}
                            alt={item.itemName}
                            fill
                            className="object-cover rounded"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.itemName}
                          </h4>
                          <p className="text-xs text-gray-500">{item.brand}</p>
                          <p className="text-sm font-semibold text-red-600">
                            {formatPrice(item.amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="p-1 hover:bg-gray-100 transition-colors"
                              aria-label="Decrease quantity"
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
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <span className="px-3 py-1 text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1 hover:bg-gray-100 transition-colors"
                              aria-label="Increase quantity"
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
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            aria-label="Remove item"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {state.items.length > 0 && (
                <div className="border-t p-4 space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {formatPrice(state.totalAmount)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        router.push("/cart");
                        closeCart();
                      }}
                      className="w-full bg-white border border-gray-300 text-gray-800 py-3 rounded-full hover:bg-gray-50 transition-colors font-medium"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={() => {
                        router.push("/checkout");
                        closeCart();
                      }}
                      className="w-full bg-red-500 text-white py-3 rounded-full hover:bg-red-600 transition-colors font-medium"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
