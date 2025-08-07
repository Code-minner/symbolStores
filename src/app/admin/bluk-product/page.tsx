"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Papa, { ParseResult } from "papaparse";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { clearAllProductCaches } from "@/lib/cacheUtils";

interface Product {
  itemName: string;
  amount: number;
  category: string;
  subcategory: string;
  brand: string;
  imageURL: string;
  slug: string;
  // Optional properties that may exist in uploaded JSON
  status?: string;
  features?: string[];
  tags?: string[];
  images?: string[];
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ product: Product; error: string }>;
}

export default function UploadBulkProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastFileType, setLastFileType] = useState<string>("");

  const validateProduct = (product: any): string[] => {
    const errors: string[] = [];
    const requiredFields = [
      "itemName",
      "amount",
      "category",
      "subcategory",
      "brand",
      "imageURL",
    ];

    requiredFields.forEach((field) => {
      const value = product[field];
      if (
        !value ||
        value === "" ||
        (typeof value === "string" && value.trim() === "")
      ) {
        errors.push(`Missing ${field}`);
      }
    });

    if (
      typeof product.amount !== "number" ||
      product.amount < 0 ||
      isNaN(product.amount)
    ) {
      errors.push("Amount must be a positive number");
    }

    if (product.imageURL && !isValidURL(product.imageURL.toString().trim())) {
      errors.push("Invalid image URL");
    }

    return errors;
  };

  const isValidURL = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const parseCSVData = async (file: File): Promise<Product[]> => {
    const text = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [",", "\t", "|", ";"],
        complete: (results: ParseResult<any>) => {
          try {
            const products: Product[] = results.data.map(
              (row: any, index: number) => {
                // Clean headers by removing whitespace
                const cleanRow: any = {};
                Object.keys(row).forEach((key) => {
                  const cleanKey = key.trim();
                  cleanRow[cleanKey] = row[key];
                });

                // Map CSV columns to Product interface
                // Handle common CSV header variations
                const mapField = (possibleNames: string[]) => {
                  for (const name of possibleNames) {
                    if (
                      cleanRow[name] !== undefined &&
                      cleanRow[name] !== null &&
                      cleanRow[name] !== ""
                    ) {
                      return cleanRow[name];
                    }
                  }
                  return "";
                };

                // Parse features and tags if they're comma-separated strings
                const parseArrayField = (field: any): string[] => {
                  if (Array.isArray(field)) return field;
                  if (typeof field === "string" && field.trim()) {
                    return field
                      .split(",")
                      .map((item) => item.trim())
                      .filter((item) => item);
                  }
                  return [];
                };

                return {
                  itemName: mapField([
                    "itemName",
                    "name",
                    "product_name",
                    "title",
                    "Item Name",
                    "Product Name",
                  ]),
                  amount: parseFloat(
                    mapField([
                      "amount",
                      "price",
                      "cost",
                      "Amount",
                      "Price",
                      "Cost",
                    ]) || "0"
                  ),
                  category: mapField(["category", "Category"]),
                  subcategory: mapField([
                    "subcategory",
                    "sub_category",
                    "Subcategory",
                    "Sub Category",
                  ]),
                  brand: mapField([
                    "brand",
                    "Brand",
                    "manufacturer",
                    "Manufacturer",
                  ]),
                  imageURL: mapField([
                    "imageURL",
                    "image_url",
                    "image",
                    "Image URL",
                    "Image",
                    "photo",
                  ]),
                  slug: mapField(["slug", "Slug"]) || "",
                  status: mapField([
                    "status",
                    "Status",
                    "availability",
                    "Availability",
                  ]),
                  features: parseArrayField(mapField(["features", "Features"])),
                  tags: parseArrayField(mapField(["tags", "Tags"])),
                  images: parseArrayField(
                    mapField(["images", "Images", "image_urls", "Image URLs"])
                  ),
                };
              }
            );

            resolve(products);
          } catch (error) {
            reject(
              new Error(
                "Error processing CSV data: " +
                  (error instanceof Error ? error.message : "Unknown error")
              )
            );
          }
        },
        error: (error: any) => {
          reject(new Error("CSV parsing error: " + error.message));
        },
      });
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isJSON = file.name.endsWith(".json");
    const isCSV = file.name.endsWith(".csv");

    if (!isJSON && !isCSV) {
      alert("Please upload a JSON or CSV file");
      return;
    }

    try {
      let parsedProducts: Product[] = [];

      if (isJSON) {
        // Handle JSON files
        const text = await file.text();
        const json = JSON.parse(text);

        if (!Array.isArray(json)) {
          alert("JSON file must contain an array of products");
          return;
        }

        parsedProducts = json;
        setLastFileType("JSON");
      } else if (isCSV) {
        // Handle CSV files
        parsedProducts = await parseCSVData(file);
        setLastFileType("CSV");
      }

      // Validate products
      const validProducts: Product[] = [];
      const invalidProducts: Array<{ product: any; errors: string[] }> = [];

      parsedProducts.forEach((product, index) => {
        const validationErrors = validateProduct(product);
        if (validationErrors.length === 0) {
          // Generate slug if missing
          if (!product.slug) {
            product.slug = generateSlug(product.itemName);
          }
          validProducts.push(product);
        } else {
          invalidProducts.push({
            product: { ...product, index },
            errors: validationErrors,
          });
        }
      });

      if (invalidProducts.length > 0) {
        const proceed = confirm(
          `Found ${invalidProducts.length} invalid products. Continue with ${validProducts.length} valid products?`
        );
        if (!proceed) return;
      }

      setProducts(validProducts);
      setUploadResult(null);
    } catch (err) {
      alert(
        `Invalid ${isJSON ? "JSON" : "CSV"} file. Please check the format and try again.\n\nError: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");

  const uploadToFirestore = async () => {
    if (products.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const results: UploadResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const productRef = collection(db, "products"); // Use batch processing for better performance

    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (product) => {
          try {
            // Generate slug and ID for each product
            const slug = generateSlug(product.itemName);
            const itemId = `${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // Prepare product data with additional fields

            const productData = {
              ...product,
              slug,
              inStock: product.status === "in stock",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(), // Ensure arrays are properly formatted
              features: Array.isArray(product.features) ? product.features : [],
              tags: Array.isArray(product.tags) ? product.tags : [],
              images: Array.isArray(product.images)
                ? product.images
                : [product.imageURL].filter(Boolean),
            };

            await addDoc(productRef, productData);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              product,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        })
      );

      setUploadProgress(
        Math.min(100, ((i + batchSize) / products.length) * 100)
      );
    } // NEW CODE ADDED HERE

    if (results.success > 0) {
      try {
        await clearAllProductCaches();
        console.log("Cache cleared successfully!");
      } catch (cacheError) {
        console.warn("Cache clearing failed:", cacheError);
      }
    }

    setUploading(false);
    setUploadResult(results);

    if (results.failed === 0) {
      setProducts([]);
    } // Update the final alert message to reflect the cache clearing
    alert("✅ Product upload completed and cache cleared!");
  };

  const resetUpload = () => {
    setProducts([]);
    setUploadResult(null);
    setUploadProgress(0);
    setLastFileType("");
  };

  const navigateBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div>
      <Header />
      <div className="p-6 max-w-4xl mx-auto min-h-[500px]">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <Icon
              icon="lucide:arrow-left"
              width={20}
              height={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Icon icon="lucide:upload" className="text-blue-600" />
            Bulk Product Upload
          </h2>

          {/* Introductory Text */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              📁 Quick Start Guide
            </h3>
            <p className="text-gray-700 mb-2">
              Upload hundreds of products at once using JSON or CSV files.
              Perfect for importing data from scrapers, spreadsheets, or other
              systems.
            </p>
            <div className="text-sm text-gray-600">
              <strong>Supported formats:</strong> JSON arrays, CSV files |
              <strong> Max file size:</strong> 10MB |
              <strong> Processing:</strong> Up to 1000 products per batch
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Icon
              icon="lucide:upload"
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <p className="text-lg mb-2">Drop your JSON or CSV file here or</p>
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer inline-block transition-colors">
              Choose File
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              JSON or CSV file with products data (max 10MB)
            </p>
            <details className="mt-2 text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">
                Expected CSV columns
              </summary>
              <div className="mt-1 pl-4">
                <p>
                  <strong>Required:</strong> itemName, amount, category,
                  subcategory, brand, imageURL
                </p>
                <p>
                  <strong>Optional:</strong> slug, status, features, tags,
                  images
                </p>
                <p>
                  <em>
                    Note: Column names are flexible (e.g., "name",
                    "product_name", "title" all work for itemName)
                  </em>
                </p>
              </div>
            </details>
          </div>

          {/* Help Section */}
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon
                icon="lucide:info"
                width={16}
                height={16}
                className="mt-0.5 text-blue-500"
              />
              <div>
                <p className="font-medium mb-1">💡 Pro Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • CSV files from scraping tools work best with
                    auto-detection
                  </li>
                  <li>
                    • Features and tags can be comma-separated in CSV (e.g.,
                    "feature1,feature2,feature3")
                  </li>
                  <li>
                    • Invalid products will be skipped with detailed error
                    reporting
                  </li>
                  <li>
                    • Large files are processed in batches for optimal
                    performance
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Structure Examples */}
          <div className="mt-4 space-y-3">
            <details className="bg-white border border-gray-200 rounded-lg">
              <summary className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Icon
                  icon="lucide:code"
                  width={16}
                  height={16}
                  className="text-blue-500"
                />
                JSON Structure Example
              </summary>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">
                  Your JSON file should contain an array of product objects:
                </p>
                <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                  {`[
  {
    "itemName": "iPhone 15 Pro",
    "amount": 999,
    "category": "Electronics",
    "subcategory": "Smartphones",
    "brand": "Apple",
    "imageURL": "https://example.com/iphone15.jpg",
    "slug": "iphone-15-pro",
    "status": "in stock",
    "features": ["128GB", "Pro Camera", "Titanium"],
    "tags": ["premium", "mobile", "5G"],
    "images": [
      "https://example.com/iphone15-1.jpg",
      "https://example.com/iphone15-2.jpg"
    ]
  },
  {
    "itemName": "MacBook Pro M3",
    "amount": 1999,
    "category": "Electronics", 
    "subcategory": "Laptops",
    "brand": "Apple",
    "imageURL": "https://example.com/macbook.jpg"
  }
]`}
                </pre>
                <div className="mt-2 text-xs">
                  <span className="text-red-600 font-medium">
                    Required fields:
                  </span>{" "}
                  itemName, amount, category, subcategory, brand, imageURL
                  <br />
                  <span className="text-blue-600 font-medium">
                    Optional fields:
                  </span>{" "}
                  slug, status, features, tags, images
                </div>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg">
              <summary className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Icon
                  icon="lucide:table"
                  width={16}
                  height={16}
                  className="text-green-500"
                />
                CSV Structure Example
              </summary>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">
                  Your CSV file should have these columns (flexible naming):
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs border border-gray-300 bg-white rounded">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1">
                          itemName
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          amount
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          category
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          subcategory
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          brand
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          imageURL
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          features
                        </th>
                        <th className="border border-gray-300 px-2 py-1">
                          tags
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">
                          iPhone 15 Pro
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          999
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Electronics
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Smartphones
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Apple
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          https://example.com/iphone.jpg
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          128GB,Pro Camera,Titanium
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          premium,mobile,5G
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">
                          MacBook Pro M3
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          1999
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Electronics
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Laptops
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          Apple
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          https://example.com/macbook.jpg
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          M3 Chip,16GB RAM
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          laptop,professional
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs">
                  <p>
                    <span className="text-blue-600 font-medium">
                      Flexible column names:
                    </span>
                  </p>
                  <p>
                    • <strong>itemName:</strong> name, product_name, title, Item
                    Name, Product Name
                  </p>
                  <p>
                    • <strong>amount:</strong> price, cost, Amount, Price, Cost
                  </p>
                  <p>
                    • <strong>imageURL:</strong> image_url, image, Image URL,
                    photo
                  </p>
                  <p>
                    • <strong>Arrays:</strong> Use comma-separated values for
                    features and tags
                  </p>
                </div>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg">
              <summary className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Icon
                  icon="lucide:download"
                  width={16}
                  height={16}
                  className="text-purple-500"
                />
                Download Sample Files
              </summary>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 mb-3">
                  Download sample files to get started quickly:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const sampleData = [
                        {
                          itemName: "iPhone 15 Pro",
                          amount: 999,
                          category: "Electronics",
                          subcategory: "Smartphones",
                          brand: "Apple",
                          imageURL: "https://example.com/iphone15.jpg",
                          slug: "iphone-15-pro",
                          status: "in stock",
                          features: ["128GB", "Pro Camera", "Titanium"],
                          tags: ["premium", "mobile", "5G"],
                          images: ["https://example.com/iphone15-1.jpg"],
                        },
                        {
                          itemName: "MacBook Pro M3",
                          amount: 1999,
                          category: "Electronics",
                          subcategory: "Laptops",
                          brand: "Apple",
                          imageURL: "https://example.com/macbook.jpg",
                          slug: "macbook-pro-m3",
                          status: "in stock",
                          features: ["M3 Chip", "16GB RAM"],
                          tags: ["laptop", "professional"],
                        },
                      ];
                      const blob = new Blob(
                        [JSON.stringify(sampleData, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample-products.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                  >
                    <Icon icon="lucide:file-json" width={12} height={12} />
                    Sample JSON
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = `itemName,amount,category,subcategory,brand,imageURL,status,features,tags
iPhone 15 Pro,999,Electronics,Smartphones,Apple,https://example.com/iphone15.jpg,in stock,"128GB,Pro Camera,Titanium","premium,mobile,5G"
MacBook Pro M3,1999,Electronics,Laptops,Apple,https://example.com/macbook.jpg,in stock,"M3 Chip,16GB RAM","laptop,professional"
Samsung Galaxy S24,799,Electronics,Smartphones,Samsung,https://example.com/galaxy.jpg,in stock,"256GB,AI Camera","android,mobile"`;
                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample-products.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                  >
                    <Icon
                      icon="lucide:file-spreadsheet"
                      width={12}
                      height={12}
                    />
                    Sample CSV
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Products Preview */}
          {products.length > 0 && !uploadResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:check-circle" className="text-green-500" />
                  <span className="font-semibold">
                    {products.length} products loaded
                  </span>
                  {lastFileType && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {lastFileType}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Icon icon="lucide:eye" width={16} height={16} />
                    {showPreview ? "Hide" : "Preview"}
                  </button>
                  <button
                    onClick={resetUpload}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Icon icon="lucide:x" width={16} height={16} />
                    Clear
                  </button>
                </div>
              </div>

              {showPreview && (
                <div className="max-h-64 overflow-y-auto border rounded p-3 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{product.itemName}</td>
                          <td className="p-2">{product.category}</td>
                          <td className="p-2">{product.brand}</td>
                          <td className="p-2">${product.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length > 10 && (
                    <p className="text-gray-500 text-center mt-2">
                      ...and {products.length - 10} more products
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={uploadToFirestore}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading... {Math.round(uploadProgress)}%
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:upload" width={16} height={16} />
                      Upload to Firestore
                    </>
                  )}
                </button>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {uploadResult.failed === 0 ? (
                  <Icon icon="lucide:check-circle" className="text-green-500" />
                ) : (
                  <Icon
                    icon="lucide:alert-circle"
                    className="text-yellow-500"
                  />
                )}
                {uploadResult.failed === 0
                  ? "🎉 Upload Successful!"
                  : "Upload Complete"}
              </h3>

              {uploadResult.failed === 0 && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <p className="text-green-700 font-medium">
                    Great job! All {uploadResult.success} products have been
                    successfully uploaded to your store.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-100 p-3 rounded">
                  <div className="text-2xl font-bold text-green-700">
                    {uploadResult.success}
                  </div>
                  <div className="text-green-600">Successful uploads</div>
                </div>
                <div className="bg-red-100 p-3 rounded">
                  <div className="text-2xl font-bold text-red-700">
                    {uploadResult.failed}
                  </div>
                  <div className="text-red-600">Failed uploads</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Failed Uploads:
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        • {error.product.itemName}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetUpload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Icon icon="lucide:upload" width={16} height={16} />
                  Upload More Products
                </button>
                <button
                  onClick={navigateBack}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Icon icon="lucide:arrow-left" width={16} height={16} />
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
