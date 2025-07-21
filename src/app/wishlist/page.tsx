"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/lib/WishlistContext";
import { useCart } from "@/lib/CartContext";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductSlider from "@/components/ProductSlider";
import { db } from "@/lib/firebase"; // Adjust path if needed
import { collection, getDocs } from "firebase/firestore";

export default function WishlistPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    wishlistItems,
    removeFromWishlist,
    clearWishlist,
    isLoading: wishlistLoading,
    syncStatus,
  } = useWishlist();

  const { addToCart, formatPrice, toggleCart } = useCart();

  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth?redirect=/wishlist");
        return;
      }

      if (user && userData === null && !authLoading) {
        console.warn("User authenticated but no user document found");
        router.push("/auth?redirect=/wishlist&message=account_not_found");
        return;
      }
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");

      if (message === "account_not_found") {
        alert("Your account was not found. Please sign in again.");
      } else if (message === "authentication_required") {
        alert(
          "Authentication required. Please sign in to access your wishlist."
        );
      }
    }
  }, []);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Wishlist", href: "#" },
  ];

  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {};
    wishlistItems.forEach((item) => {
      if (!quantities[item.id]) {
        initialQuantities[item.id] = 1;
      }
    });
    setQuantities((prev) => ({ ...prev, ...initialQuantities }));
  }, [wishlistItems]);

  const handleQuantityChange = (
    itemId: string,
    type: "increase" | "decrease"
  ) => {
    setQuantities((prev) => {
      const currentQty = prev[itemId] || 1;
      if (type === "increase") {
        return { ...prev, [itemId]: currentQty + 1 };
      } else if (type === "decrease" && currentQty > 1) {
        return { ...prev, [itemId]: currentQty - 1 };
      }
      return prev;
    });
  };

  const handleAddToCart = async (item: any) => {
    if (!item.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    const quantity = quantities[item.id] || 1;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: item.id,
        itemName: item.itemName,
        category: item.category,
        subcategory: item.subcategory,
        brand: item.brand,
        amount: item.amount,
        originalPrice: item.originalPrice,
        imageURL: item.imageURL,
        slug: item.slug,
        inStock: item.inStock,
        sku: item.sku,
        warranty: item.warranty,
      });
    }

    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    toggleCart();
  };

  const [products, setProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(true);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const fetchedProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  fetchProducts();
}, []);

  const getProductUrl = (item: any) => {
    return `/home/${item.category
      .toLowerCase()
      .replace(/\s+/g, "-")}/${item.subcategory
      .toLowerCase()
      .replace(/\s+/g, "-")}/${item.slug}`;
  };

  if (authLoading || wishlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading
              ? "Checking authentication..."
              : "Loading your wishlist..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user || (user && userData === null && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-700 mb-4">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start adding products to your wishlist by clicking the heart icon
              on any product you love!
            </p>
            <Link
              href="/shop"
              className="bg-red-500 text-white px-8 py-3 rounded-full hover:bg-red-600 transition-colors inline-block"
            >
              Start Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1400px] mx-auto px-4">
          {syncStatus === "syncing" && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Syncing your wishlist...
              </div>
            </div>
          )}

          {syncStatus === "error" && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-md mb-4 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Sync failed. Your changes are saved locally.
              </div>
            </div>
          )}

          {syncStatus === "user_not_found" && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Account not found. Redirecting to login...
              </div>
            </div>
          )}

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

          <div className="flex justify-between items-center mb-8 mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Wishlist ({wishlistItems.length})
              </h1>
            </div>

            {wishlistItems.length > 0 && (
              <button
                onClick={async () => {
                  if (
                    confirm(
                      "Are you sure you want to clear your entire wishlist?"
                    )
                  ) {
                    await clearWishlist();
                  }
                }}
                className="text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                style={{
                  boxSizing: "border-box",
                  margin: 0,
                  width: "280px",
                  height: "420px",
                  backgroundColor: "#fff",
                  padding: "10px",
                  border: "1px solid #E4E7E9",
                  borderRadius: "3px",
                  fontFamily: "Arial, sans-serif",
                  color: "#1f2937",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: "200px",
                    marginBottom: "10px",
                    flexShrink: 0,
                  }}
                >
                  <Link href={getProductUrl(item)}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                      }}
                      onMouseOver={(e) => {
                        const img = e.currentTarget.querySelector(
                          "img"
                        ) as HTMLImageElement;
                        if (img) {
                          img.style.transform = "scale(1.1)";
                          img.style.filter = "brightness(0.95)";
                        }
                      }}
                      onMouseOut={(e) => {
                        const img = e.currentTarget.querySelector(
                          "img"
                        ) as HTMLImageElement;
                        if (img) {
                          img.style.transform = "scale(1)";
                          img.style.filter = "brightness(1)";
                        }
                      }}
                    >
                      <Image
                        src={item.imageURL}
                        alt={item.itemName}
                        fill
                        sizes="280px"
                        style={{
                          objectFit: "cover",
                          transition: "transform 0.3s ease, filter 0.3s ease",
                        }}
                      />
                    </div>
                  </Link>

                  <button
                    onClick={async () => await removeFromWishlist(item.id)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "18px",
                      fontWeight: "bold",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.8)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.7)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Remove from wishlist"
                  >
                    <svg
                      width="18"
                      height="20"
                      viewBox="0 0 18 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17 3.71322H2.33333L3.66667 18.3167H14.3333L15.6667 3.71322H1M9 7.36409V14.6658M12.3333 7.36409L11.6667 14.6658M5.66667 7.36409L6.33333 14.6658M6.33333 3.71322L7 1.2793H11L11.6667 3.71322"
                        stroke="#1E1E1E"
                        strokeWidth="1.56"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {(!item.inStock ||
                    (item.originalPrice &&
                      item.originalPrice > item.amount)) && (
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: !item.inStock ? "#9CA3AF" : "#EE5858",
                        color: "rgb(255, 255, 255)",
                        padding: "4px 8px",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        borderRadius: "5px",
                      }}
                    >
                      {!item.inStock
                        ? "Out of Stock"
                        : item.originalPrice && item.originalPrice > item.amount
                        ? "Sale"
                        : ""}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#EE5858",
                        backgroundColor: "#D8262670",
                        borderRadius: "100px",
                        padding: "4px 8px",
                        marginBottom: "8px",
                        display: "inline-block",
                      }}
                    >
                      {item.subcategory}
                    </span>

                    <Link href={getProductUrl(item)}>
                      <h2
                        style={{
                          fontSize: "1rem",
                          fontWeight: "400",
                          margin: "8px 0",
                          cursor: "pointer",
                          textDecoration: "none",
                          color: "inherit",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: "1.2",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.color = "#EE5858")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.color = "inherit")
                        }
                      >
                        {item.itemName}
                      </h2>
                    </Link>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        margin: "10px 0",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#1f2937",
                            margin: 0,
                          }}
                        >
                          {formatPrice(item.amount)}
                        </p>
                        {item.originalPrice &&
                          item.originalPrice > item.amount && (
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "#6B7280",
                                textDecoration: "line-through",
                                marginTop: "2px",
                                margin: 0,
                              }}
                            >
                              {formatPrice(item.originalPrice)}
                            </p>
                          )}
                      </div>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          backgroundColor: item.inStock ? "#10B981" : "#EF4444",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        height: "48px",
                        marginTop: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, "decrease")
                          }
                          disabled={(quantities[item.id] || 1) <= 1}
                          style={{
                            padding: "2.5px 6px",
                            fontSize: "1.125rem",
                            fontWeight: "bold",
                            background: "none",
                            cursor:
                              (quantities[item.id] || 1) <= 1
                                ? "not-allowed"
                                : "pointer",
                            borderRadius: "4px",
                            border: "none",
                            opacity: (quantities[item.id] || 1) <= 1 ? 0.5 : 1,
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            padding: "3px 6px",
                            border: "2px solid #FF0000",
                            margin: "0 2px",
                            textAlign: "center",
                            borderRadius: "4px",
                            minWidth: "30px",
                          }}
                        >
                          {quantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, "increase")
                          }
                          style={{
                            padding: "2.5px 6px",
                            fontSize: "1.125rem",
                            fontWeight: "bold",
                            background: "none",
                            cursor: "pointer",
                            borderRadius: "4px",
                            border: "none",
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                        style={{
                          flex: 1,
                          padding: "12px",
                          border: `1px solid ${
                            item.inStock ? "#FF0000" : "#9CA3AF"
                          }`,
                          color: item.inStock ? "#FF0000" : "#9CA3AF",
                          fontWeight: "bold",
                          background: "#ffffff",
                          borderRadius: "100px",
                          cursor: item.inStock ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                          fontSize: "0.7rem",
                          height: "40px",
                        }}
                        onMouseOver={(e) => {
                          if (item.inStock) {
                            e.currentTarget.style.backgroundColor = "#FF0000";
                            e.currentTarget.style.color = "white";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (item.inStock) {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.color = "#FF0000";
                          }
                        }}
                      >
                        {item.inStock ? "ADD TO CART" : "OUT OF STOCK"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {wishlistItems.length > 0 && (
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/shop"
                  className="bg-gray-500 text-white px-8 py-3 rounded-full hover:bg-gray-600 transition-colors"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={async () => {
                    let totalItems = 0;
                    wishlistItems.forEach((item) => {
                      if (item.inStock) {
                        const quantity = quantities[item.id] || 1;
                        for (let i = 0; i < quantity; i++) {
                          addToCart({
                            id: item.id,
                            itemName: item.itemName,
                            category: item.category,
                            subcategory: item.subcategory,
                            brand: item.brand,
                            amount: item.amount,
                            originalPrice: item.originalPrice,
                            imageURL: item.imageURL,
                            slug: item.slug,
                            inStock: item.inStock,
                            sku: item.sku,
                            warranty: item.warranty,
                          });
                        }
                        totalItems += quantity;
                      }
                    });
                    const resetQuantities: { [key: string]: number } = {};
                    wishlistItems.forEach((item) => {
                      resetQuantities[item.id] = 1;
                    });
                    setQuantities(resetQuantities);
                    toggleCart();
                    alert(`Added ${totalItems} items to cart!`);
                  }}
                  className="bg-red-500 text-white px-8 py-3 rounded-full hover:bg-red-600 transition-colors"
                >
                  Add All to Cart
                </button>
              </div>
            </div>
          )}
        </div>
        <ProductSlider products={products} />
      </div>
      

      <Footer />
    </div>
  );
}
