// src/lib/hooks/useProducts.ts (Debug Version)
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  features: string[];
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🚀 useProducts hook started");
    
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔥 Firebase db object:", db);
        console.log("📁 Attempting to fetch from 'products' collection...");
        
        // First, try to get collection without ordering
        const productsCollection = collection(db, "products");
        console.log("📋 Collection reference:", productsCollection);
        
        // Try without orderBy first to see if that's the issue
        console.log("📊 Fetching documents without ordering...");
        const simpleQuery = await getDocs(productsCollection);
        console.log("📄 Raw query result:", simpleQuery);
        console.log("📊 Number of documents found:", simpleQuery.size);
        
        if (simpleQuery.empty) {
          console.log("❌ No documents found in collection");
          setError("No products found in database");
          setProducts([]);
          return;
        }
        
        // Log first document to check structure
        const firstDoc = simpleQuery.docs[0];
        console.log("📄 First document ID:", firstDoc.id);
        console.log("📄 First document data:", firstDoc.data());
        
        // Try with orderBy
        console.log("📊 Now trying with orderBy...");
        const q = query(collection(db, "products"), orderBy("itemName"));
        const querySnapshot = await getDocs(q);
        
        console.log("📊 Ordered query size:", querySnapshot.size);
        
        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`📄 Processing doc ${doc.id}:`, data);
          
          return {
            id: doc.id,
            ...data,
          };
        }) as Product[];

        console.log("✅ Successfully processed products:", items.length);
        console.log("📦 First few products:", items.slice(0, 2));
        
        setProducts(items);
        
      } catch (error) {
        console.error("❌ Error fetching products:", error);
        console.error("❌ Error type:", typeof error);
        console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
        
        // More specific error handling
        if (error instanceof Error) {
          if (error.message.includes("Missing or insufficient permissions")) {
            setError("Permission denied - check Firestore security rules");
          } else if (error.message.includes("Failed to get document")) {
            setError("Network error - check internet connection");
          } else {
            setError(`Firebase error: ${error.message}`);
          }
        } else {
          setError("Unknown error occurred");
        }
      } finally {
        setLoading(false);
        console.log("🏁 useProducts hook completed");
      }
    }

    fetchProducts();
  }, []);

  // Debug log current state
  useEffect(() => {
    console.log("📊 Hook state update:", { 
      productsCount: products.length, 
      loading, 
      error 
    });
  }, [products, loading, error]);

  return { products, loading, error };
}

// Alternative simpler version for testing
export function useProductsSimple() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log("🧪 Testing simple fetch...");
        const snapshot = await getDocs(collection(db, "products"));
        console.log("🧪 Simple fetch result:", snapshot.size, "documents");
        
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log("🧪 Simple data:", data);
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error("🧪 Simple fetch error:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}