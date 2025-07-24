// src/lib/ProductsCache.ts - OPTIMIZED FOR MINIMAL FIREBASE READS
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  features?: string[];
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

// 🔥 OPTIMIZED FOR MAXIMUM READ REDUCTION
const CACHE_KEY = 'products-optimized';
const CACHE_DURATION = 60 * 60 * 1000; // 1 HOUR (was 30 min)
const EXTENDED_CACHE = 24 * 60 * 60 * 1000; // 24 HOURS fallback
const BACKGROUND_REFRESH_TIME = 45 * 60 * 1000; // Refresh after 45 min

let memoryCache: Product[] | null = null;
let cacheTimestamp = 0;
let loadingInProgress = false;

// 📊 PERFORMANCE TRACKING
let performanceStats = {
  totalRequests: 0,
  firebaseReads: 0,
  memoryHits: 0,
  sessionHits: 0,
  backgroundRefreshes: 0,
  lastFirebaseQuery: 0,
  cacheSavingsPercent: 0
};

// 🗜️ LIGHTWEIGHT COMPRESSION (keeps reliability, saves space)
function compressForStorage(products: Product[]) {
  return products.map(p => ({
    i: p.id,
    n: p.itemName,
    c: p.category,
    s: p.subcategory,
    b: p.brand,
    d: p.description,
    f: p.features?.slice(0, 3) || [], // Keep top 3 features
    a: p.amount,
    o: p.originalPrice,
    st: p.status,
    sk: p.sku,
    w: p.warranty || '',
    img: p.imageURL,
    ins: p.inStock,
    sl: p.slug,
    cr: p.createdAt,
    t: p.tags?.slice(0, 2) || [] // Keep top 2 tags
  }));
}

function expandFromStorage(compressed: any[]): Product[] {
  return compressed.map(c => ({
    id: c.i,
    itemName: c.n,
    category: c.c,
    subcategory: c.s,
    brand: c.b,
    description: c.d,
    features: c.f,
    amount: c.a,
    originalPrice: c.o,
    status: c.st,
    sku: c.sk,
    warranty: c.w,
    imageURL: c.img,
    images: [c.img], // Use main image
    inStock: c.ins,
    slug: c.sl,
    createdAt: c.cr,
    tags: c.t
  }));
}

/**
 * 🚀 OPTIMIZED FOR MINIMAL FIREBASE READS
 */
export async function getAllProducts(): Promise<Product[]> {
  const tabId = Math.random().toString(36).substr(2, 4);
  performanceStats.totalRequests++;

  // 1. ⚡ MEMORY CACHE (INSTANT - 0ms)
  if (memoryCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log(`⚡ [${tabId}] Memory hit! Age: ${Math.round((Date.now() - cacheTimestamp)/1000/60)}min`);
    performanceStats.memoryHits++;
    
    // 🔄 BACKGROUND REFRESH (keeps cache fresh without user delay)
    if (Date.now() - cacheTimestamp > BACKGROUND_REFRESH_TIME) {
      setTimeout(() => backgroundRefresh(), 2000);
    }
    
    return memoryCache;
  }

  // 2. 📦 SESSION CACHE (FAST - ~5ms)
  const sessionResult = trySessionCache(tabId);
  if (sessionResult) {
    performanceStats.sessionHits++;
    return sessionResult;
  }

  // 3. 🔍 FIREBASE (ONLY when absolutely necessary)
  return await performFirebaseLoad(tabId);
}

/**
 * 📦 TRY SESSION CACHE
 */
function trySessionCache(tabId: string): Product[] | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cacheTime = sessionStorage.getItem(CACHE_KEY + '-time');
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      
      // Use even slightly old cache to avoid Firebase reads
      if (age < EXTENDED_CACHE) {
        console.log(`📦 [${tabId}] Session hit! Age: ${Math.round(age/1000/60)}min`);
        
        const compressed = JSON.parse(cached);
        const products = expandFromStorage(compressed);
        
        // Update memory cache
        memoryCache = products;
        cacheTimestamp = parseInt(cacheTime);
        
        // Schedule background refresh if getting old
        if (age > BACKGROUND_REFRESH_TIME) {
          setTimeout(() => backgroundRefresh(), 3000);
        }
        
        return products;
      } else {
        // Clear expired cache
        sessionStorage.removeItem(CACHE_KEY);
        sessionStorage.removeItem(CACHE_KEY + '-time');
      }
    }
  } catch (error) {
    console.warn(`⚠️ [${tabId}] Session cache corrupted, clearing:`, error);
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_KEY + '-time');
  }
  
  return null;
}

/**
 * 🔍 FIREBASE LOAD (with simple tab coordination)
 */
async function performFirebaseLoad(tabId: string): Promise<Product[]> {
  // Simple coordination - wait briefly if another tab is loading
  if (loadingInProgress) {
    console.log(`⏱️ [${tabId}] Another tab loading, waiting briefly...`);
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (memoryCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.log(`✅ [${tabId}] Cache appeared while waiting!`);
        return memoryCache;
      }
    }
  }

  loadingInProgress = true;
  
  try {
    console.log(`🔍 [${tabId}] FIREBASE QUERY - will cache for 1+ hour to minimize future reads`);
    performanceStats.firebaseReads++;
    performanceStats.lastFirebaseQuery = Date.now();
    
    const productsCollection = collection(db, "products");
    const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
    const productsSnapshot = await getDocs(productsQuery);

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    console.log(`✅ [${tabId}] Loaded ${products.length} products - caching aggressively!`);

    // Cache everywhere for maximum read reduction
    await cacheAggressively(products);
    
    // Update performance stats
    performanceStats.cacheSavingsPercent = performanceStats.totalRequests > 0 ? 
      Math.round((1 - performanceStats.firebaseReads / performanceStats.totalRequests) * 100) : 0;

    console.log(`📊 [${tabId}] Read reduction: ${performanceStats.cacheSavingsPercent}% - Next query avoided for 1+ hour!`);

    return products;

  } catch (error) {
    console.error(`❌ [${tabId}] Firebase query failed:`, error);
    
    // 🆘 EMERGENCY: Try any old cache to avoid complete failure
    const emergency = tryEmergencyCache();
    if (emergency) {
      console.log(`🆘 [${tabId}] Using emergency cache to avoid failure`);
      return emergency;
    }
    
    throw new Error("Failed to load products. Please try again.");
  } finally {
    loadingInProgress = false;
  }
}

/**
 * 🔥 AGGRESSIVE CACHING (minimize future Firebase reads)
 */
async function cacheAggressively(products: Product[]): Promise<void> {
  const now = Date.now();
  
  // Memory cache (per tab, instant access)
  memoryCache = products;
  cacheTimestamp = now;

  // Session cache (cross-tab, persistent)
  try {
    const compressed = compressForStorage(products);
    const originalSize = JSON.stringify(products).length;
    const compressedSize = JSON.stringify(compressed).length;
    const savings = Math.round((1 - compressedSize/originalSize) * 100);
    
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(compressed));
    sessionStorage.setItem(CACHE_KEY + '-time', now.toString());
    
    console.log(`💾 Cached ${products.length} products (${savings}% compression) - 1+ hour cache duration`);
  } catch (storageError) {
    console.warn("Storage failed (quota?), using memory cache only:", storageError);
  }
}

/**
 * 🔄 BACKGROUND REFRESH (keeps cache fresh without user delays)
 */
async function backgroundRefresh(): Promise<void> {
  // Don't refresh if we just did a Firebase query
  if (Date.now() - performanceStats.lastFirebaseQuery < 5 * 60 * 1000) return;
  
  // Don't refresh if another tab is loading
  if (loadingInProgress) return;

  try {
    console.log("🔄 Background refresh starting (silent, no user delay)...");
    performanceStats.backgroundRefreshes++;
    
    const productsCollection = collection(db, "products");
    const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
    const productsSnapshot = await getDocs(productsQuery);

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    await cacheAggressively(products);
    console.log("✅ Background refresh complete - cache silently updated!");
    
  } catch (error) {
    console.warn("🔄 Background refresh failed (not critical):", error);
  }
}

/**
 * 🆘 EMERGENCY FALLBACK
 */
function tryEmergencyCache(): Product[] | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const compressed = JSON.parse(cached);
      return expandFromStorage(compressed);
    }
  } catch (error) {
    console.warn("Emergency cache failed:", error);
  }
  return null;
}

// 🔍 ALL OTHER FUNCTIONS (use cache, no additional Firebase reads)
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const allProducts = await getAllProducts(); // Cache hit - no Firebase read
  if (!searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  return allProducts.filter(product => {
    const searchableFields = [
      product.itemName || '',
      product.brand || '',
      product.category || '',
      product.subcategory || '',
      product.description || '',
      product.sku || '',
      ...(product.tags || [])
    ].join(' ').toLowerCase();

    return searchableFields.includes(term);
  });
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const allProducts = await getAllProducts(); // Cache hit - no Firebase read
  return allProducts.filter(product => 
    product.category?.toLowerCase() === category.toLowerCase()
  );
}

export async function getProductsByBrand(brand: string): Promise<Product[]> {
  const allProducts = await getAllProducts(); // Cache hit - no Firebase read
  return allProducts.filter(product => 
    product.brand?.toLowerCase() === brand.toLowerCase()
  );
}

export async function getProductsPaginated(page: number = 1, limit: number = 12): Promise<{
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}> {
  const allProducts = await getAllProducts(); // Cache hit - no Firebase read
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    products: allProducts.slice(startIndex, endIndex),
    totalPages: Math.ceil(allProducts.length / limit),
    currentPage: page,
    totalProducts: allProducts.length
  };
}

export async function getRandomizedProducts(limit?: number): Promise<Product[]> {
  const allProducts = await getAllProducts(); // Cache hit - no Firebase read
  
  const shuffled = [...allProducts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return limit ? shuffled.slice(0, limit) : shuffled;
}

// 📊 PERFORMANCE MONITORING
export function getPerformanceStats() {
  // ✅ FIXED: Changed variable name to match the property name being used
  const minutesSinceLastFirebaseQuery = performanceStats.lastFirebaseQuery > 0 ? 
    Math.round((Date.now() - performanceStats.lastFirebaseQuery) / 1000 / 60) : 0;

  return {
    ...performanceStats,
    cacheAge: memoryCache ? Math.round((Date.now() - cacheTimestamp) / 1000 / 60) + ' minutes' : 'No cache',
    minutesSinceLastFirebaseQuery, // ✅ Now matches the variable name
    estimatedReadsSaved: performanceStats.totalRequests - performanceStats.firebaseReads,
    nextRefreshIn: memoryCache ? 
      Math.max(0, Math.round((CACHE_DURATION - (Date.now() - cacheTimestamp)) / 1000 / 60)) + ' min' : 'Now'
  };
}

export function logPerformance(): void {
  console.table(getPerformanceStats());
}

// 🔧 UTILITIES
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function clearProductsCache(): void {
  memoryCache = null;
  cacheTimestamp = 0;
  loadingInProgress = false;
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_KEY + '-time');
  console.log("🧹 All caches cleared - next load will query Firebase");
}

export const forceRefreshProducts = async (): Promise<Product[]> => {
  clearProductsCache();
  return await getAllProducts();
};

export const getCacheStats = getPerformanceStats;