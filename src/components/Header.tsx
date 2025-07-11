// src/components/Header.tsx - Fixed Cart Context Error
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCart } from "@/lib/CartContext";

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  amount: number;
  imageURL: string;
  slug: string;
  inStock: boolean;
}

export default function Header() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Cart integration with error handling
  let cart = null;
  try {
    cart = useCart();
  } catch (error) {
    // Cart context not available, continue without cart functionality
    console.warn("Cart context not available:", error);
  }

  // Fallback functions when cart is not available
  const safeFormatPrice = (price: number) => {
    if (cart && cart.formatPrice) {
      return cart.formatPrice(price);
    }
    // Fallback formatting
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const safeToggleCart = () => {
    if (cart && cart.toggleCart) {
      cart.toggleCart();
    } else {
      // Fallback behavior - could redirect to cart page or show message
      router.push('/cart');
    }
  };

  const safeTotalItems = cart && cart.state ? cart.state.totalItems : 0;

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
        const productsSnapshot = await getDocs(productsQuery);
        
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setAllProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Search products as user types
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const searchTerm = search.toLowerCase().trim();
    
    const filtered = allProducts.filter(product => {
      const searchableFields = [
        product.itemName,
        product.brand,
        product.category,
        product.subcategory
      ].join(' ').toLowerCase();

      return searchableFields.includes(searchTerm);
    }).slice(0, 8); // Limit to 8 results for dropdown

    setSearchResults(filtered);
    setShowSearchResults(true);
    setIsSearching(false);
  }, [search, allProducts]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim() && searchResults.length > 0) {
      // Navigate to first result or show all results
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setShowSearchResults(false);
    }
  };

  const handleProductClick = (product: Product) => {
    const productUrl = `/home/${product.category.toLowerCase().replace(/\s+/g, '-')}/${product.subcategory.toLowerCase().replace(/\s+/g, '-')}/${product.slug}`;
    router.push(productUrl);
    setShowSearchResults(false);
    setSearch("");
  };

  const categories = [
    "All Categories",
    "Home & Kitchen",
    "Furniture",
    "TV",
    "Generator",
    "Freezers",
    "Microwave",
    "Air Conditioner",
    "Blender",
    "Audio Bass",
    "Others"
  ];

  const categorySubItems: { [key: string]: string[] } = {
    "Home & Kitchen": ["Toast", "Air Fryer", "Electric Kettle", "Griller", "Hotplate", "Hand Mixer", "Vacuum Cleaner", "Slow Juicer", "Jug Kettle", "Coffee Maker", "Sandwich Maker", "Mixer Grinder"],
    "Furniture": ["Sofa", "Dining Table", "Bed", "Wardrobe", "Chair", "Desk"],
    "TV": ["LED TV", "OLED TV", "Smart TV", "4K TV"],
    "Generator": ["Petrol Generator", "Diesel Generator", "Gas Generator"],
    "Freezers": ["Chest Freezer", "Upright Freezer", "Mini Freezer"],
    "Microwave": ["Solo Microwave", "Grill Microwave", "Convection Microwave"],
    "Air Conditioner": ["Split AC", "Window AC", "Portable AC"],
    "Blender": ["Hand Blender", "Stand Blender", "Smoothie Blender"],
    "Audio Bass": ["Speakers", "Headphones", "Sound Bar"],
    "Others": ["Accessories", "Parts", "Tools"]
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleCategoryClick = (category: string, subCategory?: string) => {
    if (category === "All Categories") {
      router.push('/shop');
      return;
    }

    // Navigate to category or subcategory pages
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    if (subCategory) {
      const subcategorySlug = subCategory.toLowerCase().replace(/\s+/g, '-');
      router.push(`/shop/categories/${categorySlug}/${subcategorySlug}`);
    } else {
      router.push(`/shop/categories/${categorySlug}`);
    }
  };

  return (
    <header className="bg-white w-full">
      {/* Top Header */}
      <div className="w-full px-4 py-4 lg:mx-auto" style={{ backgroundColor: "var(--header_background)" }}>
        <div className="flex items-center max-w-[1400] m-auto justify-between gap-4 py-2">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-black">
            <div className="flex items-center cursor-pointer">
              <Image src="/assets/SymbolStoreLogo.png" alt="Logo" width={100} height={50} />
            </div>
          </Link>

          {/* Search */}
          <div className="hidden sm:block w-[100%] max-w-[70%] m-auto relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex border border-gray-300 rounded-full overflow-hidden">
              <div className="flex items-center px-3 bg-white text-gray-500">
                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z" fill="#626262" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search For Products"
                className="flex-1 px-3 py-4 text-lg text-black placeholder-[#626262] focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (search.trim() && searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              <button type="submit" className="px-3 py-2 bg-[#FF0000] text-white hover:bg-red-700 transition-colors">
                Search
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
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
                            {safeFormatPrice(product.amount)}
                          </p>
                        </div>
                        {!product.inStock && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    ))}
                    {searchResults.length >= 8 && (
                      <div className="p-3 text-center border-t border-gray-200">
                        <button
                          onClick={() => {
                            router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
                            setShowSearchResults(false);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          View all results for "{search}"
                        </button>
                      </div>
                    )}
                  </>
                ) : search.trim() && (
                  <div className="p-4 text-center text-gray-500">
                    <p>No products found for "{search}"</p>
                    <Link 
                      href="/shop"
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                      onClick={() => setShowSearchResults(false)}
                    >
                      Browse all products
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <Link href="/wishlist" className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer">
              <Icon icon="icon-park-outline:like" className="w-6 h-6" />
              <span className="head_span">Wishlist</span>
            </Link>
            
            {/* Cart Icon with Count */}
            <button 
              onClick={safeToggleCart}
              className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer relative"
            >
              <div className="relative">
                <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.67969 13.2456C5.09343 13.2456 5.49065 13.4101 5.7832 13.7026C6.07557 13.9951 6.24016 14.3916 6.24023 14.8052C6.24023 15.2189 6.07576 15.6161 5.7832 15.9087C5.49065 16.2012 5.09341 16.3657 4.67969 16.3657C4.26616 16.3656 3.86961 16.201 3.57715 15.9087C3.28459 15.6161 3.12012 15.2189 3.12012 14.8052C3.12026 13.9396 3.81412 13.2458 4.67969 13.2456ZM12.4805 13.2456C12.894 13.2457 13.2906 13.4102 13.583 13.7026C13.8754 13.9951 14.04 14.3916 14.04 14.8052C14.04 15.2189 13.8756 15.6161 13.583 15.9087C13.2906 16.2011 12.894 16.3656 12.4805 16.3657C12.0668 16.3657 11.6695 16.2012 11.377 15.9087C11.0844 15.6161 10.9199 15.2189 10.9199 14.8052C10.9201 13.9395 11.6148 13.2456 12.4805 13.2456ZM3.28418 2.32568H12.3789C12.1672 2.80734 12.037 3.33291 12.0068 3.88525H4.00879L5.84961 7.78564H11.7002L12.54 6.27393C12.7589 6.67821 13.0391 7.04412 13.3662 7.36182L12.7139 8.54248C12.4486 9.01807 11.9335 9.34521 11.3486 9.34521H5.53809L4.83594 10.6167L4.8125 10.7104C4.8125 10.7622 4.83355 10.8116 4.87012 10.8481C4.90668 10.8846 4.95615 10.9058 5.00781 10.9058H14.04V12.4653H4.67969C4.26606 12.4652 3.86963 12.3008 3.57715 12.0083C3.28467 11.7158 3.1202 11.3194 3.12012 10.9058C3.12012 10.6328 3.19062 10.3751 3.30762 10.1567L4.36816 8.24561L1.55957 2.32568H0V0.765137H2.55078L3.28418 2.32568Z" fill="#1E1E1E" />
                </svg>
                
                {/* Cart Count Badge */}
                {safeTotalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {safeTotalItems > 99 ? '99+' : safeTotalItems}
                  </span>
                )}
              </div>
              <span className="head_span">Cart</span>
            </button>
            
            <Link href="/account" className="flex items-center gap-[8px] hover:text-red-500 cursor-pointer">
              <Icon icon="ph:user-bold" className="w-[16] h-[16]" />
              <span className="head_span">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Nav - Categories */}
      <div className="">
        <div className="w-full px-4 lg:max-w-[1400] m-auto lg:mx-auto">

          {/* Mobile Layout */}
          <div className="sm:hidden flex items-center justify-between py-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Search - Same as desktop but smaller */}
            <div className="flex-1 max-w-[80%] mx-4 relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="flex border border-gray-300 rounded-full overflow-hidden">
                <div className="flex items-center px-3 bg-white text-gray-500">
                  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.28394 0.351624C8.56605 0.1711 9.87355 0.300392 11.0955 0.728577C12.3172 1.15675 13.4185 1.8714 14.3074 2.81256C15.1963 3.75384 15.8472 4.89443 16.2048 6.13873C16.5625 7.3831 16.6165 8.69522 16.363 9.9649C16.1096 11.2345 15.5558 12.425 14.7478 13.4366L18.0574 16.7462C18.2214 16.916 18.3123 17.1439 18.3103 17.3799C18.3083 17.616 18.2135 17.8419 18.0466 18.0089C17.8797 18.1758 17.6538 18.2704 17.4177 18.2725C17.1816 18.2746 16.9538 18.1836 16.7839 18.0196L13.4744 14.71C12.2819 15.6628 10.8445 16.2597 9.32788 16.4317C7.81131 16.6036 6.27658 16.3442 4.90112 15.6827C3.52562 15.021 2.36483 13.9837 1.55249 12.6915C0.740138 11.3991 0.309194 9.90348 0.309326 8.37701C0.309484 7.08234 0.619179 5.80645 1.21362 4.65631C1.80812 3.50611 2.67015 2.51463 3.72632 1.76569C4.78226 1.01702 6.00218 0.53217 7.28394 0.351624ZM8.41479 2.07233C7.58689 2.07233 6.76659 2.23597 6.00171 2.5528C5.23701 2.86958 4.5421 3.33375 3.95679 3.91901C3.37137 4.50442 2.90642 5.20003 2.5896 5.96491C2.27291 6.72962 2.11012 7.54932 2.11011 8.37701C2.11011 9.20491 2.27277 10.0252 2.5896 10.7901C2.90642 11.5549 3.37142 12.2497 3.95679 12.835C4.5421 13.4203 5.23699 13.8844 6.00171 14.2012C6.76659 14.5181 7.58689 14.6817 8.41479 14.6817C10.0867 14.6816 11.6906 14.0173 12.8728 12.835C14.055 11.6527 14.7185 10.0489 14.7185 8.37701C14.7185 6.70507 14.055 5.10127 12.8728 3.91901C11.6906 2.73678 10.0867 2.0724 8.41479 2.07233ZM8.41479 3.87408C9.60882 3.87414 10.754 4.34827 11.5984 5.19244C12.4429 6.03692 12.9177 7.18275 12.9177 8.37701C12.9177 9.57131 12.4429 10.7171 11.5984 11.5616C10.754 12.4058 9.60886 12.8799 8.41479 12.8799C7.22052 12.8799 6.07472 12.406 5.23022 11.5616C4.38572 10.7171 3.91187 9.57131 3.91187 8.37701C3.91189 7.18275 4.38574 6.03692 5.23022 5.19244C6.07471 4.34804 7.22056 3.87408 8.41479 3.87408Z" fill="#626262" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search For Products"
                  className="flex-1 px-3 py-4 text-lg text-black placeholder-[#626262] focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="px-3 py-2 bg-[#FF0000] text-white hover:bg-red-700 transition-colors">
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center py-3 text-lg font-bold gap-4 text-gray-700 justify-between overflow-x-auto">
            {categories.map((category, index) => (
              <div
                key={index}
                className="whitespace-nowrap font-medium cursor-pointer px-6 py-2 rounded-full hover:text-white transition-colors duration-300"
                onClick={() => handleCategoryClick(category)}
                style={{
                  backgroundColor: "var(--header_background)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--secondary_color)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--header_background)")
                }
              >
                {category}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Categories Dropdown Menu - Same as before */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative top-[120px] left-[35%] transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 sm:hidden w-[90%] max-w-md">
            <div className="flex max-h-96 overflow-hidden rounded-lg">
              <div className="w-[40%] border-r border-gray-200 overflow-y-auto">
                {Object.entries(categorySubItems).map(([category, subItems]) => (
                  <div key={category}>
                    <button
                      onClick={() => {
                        if (subItems.length > 0) {
                          toggleCategory(category);
                        } else {
                          handleCategoryClick(category);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-3 py-3 text-left border-b border-gray-100 hover:bg-gray-50 ${expandedCategory === category ? 'bg-gray-50' : ''}`}
                    >
                      <span className="font-medium text-gray-800 text-sm">{category}</span>
                      {subItems.length > 0 && (
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="w-[60%] overflow-y-auto">
                {expandedCategory && categorySubItems[expandedCategory]?.length > 0 && (
                  <div className="p-4">
                    {categorySubItems[expandedCategory].map((subItem, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleCategoryClick(expandedCategory, subItem);
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left py-2 text-gray-600 hover:text-black text-sm"
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}