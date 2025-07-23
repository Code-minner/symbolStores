// src/lib/ProductsCache.ts - Fixed cache with NO storage quota issues
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// In src/lib/ProductsCache.ts - UPDATE THIS INTERFACE:
export interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  features?: string[];  // ✅ ADD THIS LINE
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
  tags?: string[];
}

// 🔥 CACHE CONFIGURATION
const PRODUCTS_CACHE_KEY = 'products-lite'; // Updated key name
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Global memory cache (unlimited size)
let globalProductsCache: {
  data: Product[];
  timestamp: number;
} | null = null;

// Cache statistics for debugging
let cacheStats = {
  totalLoads: 0,
  firebaseLoads: 0,
  memoryHits: 0,
  sessionHits: 0
};

// 🔥 Helper: Create lightweight version for sessionStorage (80% smaller!)
const createLiteProduct = (product: Product) => ({
  id: product.id,
  itemName: product.itemName,
  category: product.category,
  subcategory: product.subcategory,
  brand: product.brand,
  amount: product.amount,
  originalPrice: product.originalPrice,
  status: product.status,
  sku: product.sku,
  imageURL: product.imageURL,
  inStock: product.inStock,
  slug: product.slug,
  createdAt: product.createdAt
  // Skip: description, images array, warranty, tags (saves 80% space)
});

// 🔥 Helper: Expand lite product back to full product
const expandLiteProduct = (liteProduct: any): Product => ({
  ...liteProduct,
  description: '', // Will be empty but won't cause errors
  images: [liteProduct.imageURL], // Use main image as fallback
  warranty: '', // Will be empty but won't cause errors
  tags: [] // Will be empty but won't cause errors
});

/**
 * 🚀 MAIN FUNCTION: Get all products with smart caching (NO QUOTA ERRORS!)
 * This is used by ALL components (Shop, ProductGrid, Header, Search)
 */
export async function getAllProducts(): Promise<Product[]> {
  cacheStats.totalLoads++;

  try {
    // 1. ⚡ Check memory cache first (INSTANT, unlimited size)
    if (globalProductsCache && Date.now() - globalProductsCache.timestamp < CACHE_DURATION) {
      console.log("⚡ Memory cache hit - INSTANT!", {
        products: globalProductsCache.data.length,
        age: Math.round((Date.now() - globalProductsCache.timestamp) / 1000) + 's'
      });
      cacheStats.memoryHits++;
      return globalProductsCache.data;
    }

    // 2. 📦 Check lite sessionStorage cache (VERY FAST, quota-safe)
    try {
      const sessionCached = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
      const sessionTime = sessionStorage.getItem(PRODUCTS_CACHE_KEY + '-time');
      
      if (sessionCached && sessionTime && Date.now() - parseInt(sessionTime) < CACHE_DURATION) {
        console.log("📦 Session cache hit - Very fast!");
        const liteProducts = JSON.parse(sessionCached);
        
        // Expand lite products back to full products
        const expandedProducts = liteProducts.map(expandLiteProduct);
        
        // Update memory cache for future instant access
        globalProductsCache = {
          data: expandedProducts,
          timestamp: Date.now()
        };
        
        cacheStats.sessionHits++;
        return expandedProducts;
      }
    } catch (storageError) {
      console.warn("📦 Session storage failed, will use memory cache only:", storageError);
      // Continue to Firebase fetch - app still works fine
    }

    // 3. 🔍 Fetch from Firebase (ONLY when needed)
    console.log("🔍 Loading ALL products from Firebase - this will be cached for 10 minutes");
    cacheStats.firebaseLoads++;
    
    const productsCollection = collection(db, "products");
    const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
    const productsSnapshot = await getDocs(productsQuery);

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    console.log(`✅ Loaded ${products.length} products from Firebase - caching everywhere!`);

    // 4. 🔥 Save to memory cache (unlimited space)
    globalProductsCache = {
      data: products,
      timestamp: Date.now()
    };

    // 5. 📦 Try to save lite version to sessionStorage (graceful failure)
    try {
      const liteProducts = products.map(createLiteProduct);
      sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(liteProducts));
      sessionStorage.setItem(PRODUCTS_CACHE_KEY + '-time', Date.now().toString());
      
      const sizeKB = Math.round(JSON.stringify(liteProducts).length / 1024);
      console.log(`✅ Cached ${liteProducts.length} products in lite format (${sizeKB}KB vs full ${Math.round(JSON.stringify(products).length / 1024)}KB)`);
    } catch (storageError) {
      console.warn("📦 Storage quota exceeded, using memory cache only:", storageError);
      // App continues to work perfectly with just memory cache
    }

    return products;

  } catch (error) {
    console.error("❌ Error loading products:", error);
    throw new Error("Failed to load products. Please try again.");
  }
}

/**
 * 🔍 SEARCH FUNCTION: Search ALL products instantly
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const allProducts = await getAllProducts();
  
  if (!searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  return allProducts.filter(product => {
    const searchableFields = [
      product.itemName,
      product.brand,
      product.category,
      product.subcategory,
      product.description || '', // Handle empty descriptions
      product.sku,
      ...(product.tags || []) // Handle empty tags
    ].join(' ').toLowerCase();

    return searchableFields.includes(term);
  });
}

/**
 * 🏷️ FILTER FUNCTIONS: Filter by category/brand instantly
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const allProducts = await getAllProducts();
  return allProducts.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  const allProducts = await getAllProducts();
  return allProducts.filter(product => 
    product.brand.toLowerCase() === brand.toLowerCase()
  );
}

/**
 * 🔄 PAGINATION HELPER: Get products with pagination
 */
export async function getProductsPaginated(page: number = 1, limit: number = 12): Promise<{
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}> {
  const allProducts = await getAllProducts();
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    products: allProducts.slice(startIndex, endIndex),
    totalPages: Math.ceil(allProducts.length / limit),
    currentPage: page,
    totalProducts: allProducts.length
  };
}

/**
 * 🎲 UTILITY: Get randomized products (for ProductGrid)
 */
export async function getRandomizedProducts(limit?: number): Promise<Product[]> {
  const allProducts = await getAllProducts();
  const shuffled = shuffleArray(allProducts);
  return limit ? shuffled.slice(0, limit) : shuffled;
}

/**
 * 🧹 CACHE MANAGEMENT
 */
export function clearProductsCache(): void {
  globalProductsCache = null;
  try {
    sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
    sessionStorage.removeItem(PRODUCTS_CACHE_KEY + '-time');
  } catch (error) {
    console.warn("Could not clear session storage:", error);
  }
  console.log("🧹 Products cache cleared");
}

export function getCacheStats() {
  return {
    ...cacheStats,
    currentCacheSize: globalProductsCache?.data.length || 0,
    cacheAge: globalProductsCache ? 
      Math.round((Date.now() - globalProductsCache.timestamp) / 1000) : 0,
    isMemoryCached: !!globalProductsCache,
    isSessionCached: (() => {
      try {
        return !!sessionStorage.getItem(PRODUCTS_CACHE_KEY);
      } catch {
        return false;
      }
    })(),
    memoryUsageMB: globalProductsCache ? 
      Math.round(JSON.stringify(globalProductsCache.data).length / 1024 / 1024 * 100) / 100 : 0
  };
}

/**
 * 🎲 UTILITY: Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 🔧 DEBUG: Log cache performance
 */
export function logCachePerformance(): void {
  const stats = getCacheStats();
  console.table({
    'Total Requests': cacheStats.totalLoads,
    'Firebase Loads': cacheStats.firebaseLoads,
    'Memory Hits': cacheStats.memoryHits,
    'Session Hits': cacheStats.sessionHits,
    'Cache Hit Rate': `${Math.round(((cacheStats.memoryHits + cacheStats.sessionHits) / cacheStats.totalLoads) * 100)}%`,
    'Memory Usage': `${stats.memoryUsageMB}MB`,
    'Products Cached': stats.currentCacheSize,
    'Cache Age': `${stats.cacheAge}s`
  });
}