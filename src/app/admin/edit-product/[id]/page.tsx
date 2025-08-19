"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { clearAllProductCaches } from "@/lib/cacheUtils";

type FormDataType = {
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  features: string;
  tags: string;
  amount: string;
  originalPrice: string;
  status: string;
  sku: string;
  warranty: string;
};

export default function EditProductPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [formData, setFormData] = useState<FormDataType>({
    itemName: "",
    category: "",
    subcategory: "",
    brand: "",
    description: "",
    features: "",
    tags: "",
    amount: "",
    originalPrice: "",
    status: "in stock",
    sku: "",
    warranty: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState("");

  // Categories and subcategories (updated from database)
  const categories = [
    "Generator",
    "Audio Bass",
    "Microwave",
    "Stove",
    "Washing Machine",
    "Air conditioner",
    "Freezers",
    "Refrigerators",
    "TVs",
    "Gotv",
    "WATER DISPENSER",
    "BLENDER",
    "YAM PONDER",
    "DISH WASHER",
    "stabilizer",
    "Fornitures",
    "Fan's",
    "Home & Kitchen",
    "Pressing Iron",
    "Extensions",
  ];

  const categorySubItems: { [key: string]: string[] } = {
    Generator: [
      "Sound proof generator set",
      "Manual starter",
      "Electric and manual starter",
    ],
    "Audio Bass": [
      "Mini Hi-Fi System",
      "Wireless Speakers",
      "Sound Bars",
      "DVD Player",
      "AV Receiver Systems",
      "Home Theatre Systems",
      "Rechargeable Speaker System",
    ],
    Microwave: [],
    Stove: [
      "Table Top Gas Cooker",
      "50x50 Cookers",
      "60x60 cookers",
      "60x90 Cookers",
      "90x60 Cookers",
      "Air Fryer",
    ],
    "Washing Machine": [
      "Front Load Washing Machine",
      "Top Load Washing Machine",
      "Automatic Washing Machine",
      "Wash and Dry",
      "Commercial Dryer",
      "Twin Tub Washing Machines",
      "Tumble Dryer",
    ],
    "Air conditioner": [
      "Portable Air Conditioner",
      "Inverter Air Conditioner",
      "Floor Standing Air Conditioner",
      "Split Air Conditioner",
    ],
    Freezers: ["Standing Freezer", "Chest Freezer", "Deep Freezer"],
    Refrigerators: [
      "InstaView Door In Door Refrigerator",
      "Door In Door Refrigerator",
      "Side By Side Refrigerator",
      "Bottom Freezer Refrigerator",
      "Top Freezer Refrigerator",
      "Single Door Refrigerator",
      "Double Door Refrigerator",
    ],
    TVs: [
      "Signature TV",
      "Laser TV",
      "QNED TV",
      "OLED TV",
      "NanoCell TV",
      "QLED TV",
      "ULED TV",
      "UHD TV",
      "Smart TV",
      "LED TV",
      "FHD",
    ],
    Gotv: [],
    "WATER DISPENSER": [],
    BLENDER: [],
    "YAM PONDER": [],
    "DISH WASHER": [],
    stabilizer: [],
    Fornitures: [],
    "Fan's": ["Rechargeable Fan", "Ceiling Fan", "Standing Fan", "Wall Fan"],
    "Home & Kitchen": [
      "Toaster",
      "Air Fryer",
      "Electric Kettle",
      "Griller",
      "Hotplate",
      "Hand Mixer",
      "Vacuum Cleaner",
      "Slow Juicer",
      "Jug Kettle",
      "COFFEE MAKER",
      "SandwichMaker",
      "MIXER GRINDER",
    ],
    "Pressing Iron": ["Dry Iron", "Steam Iron"],
    Extensions: ["Ac guard"],
  };

  const brands = [
    "Haier Thermocool",
    "Hisense",
    "Bruhm",
    "LG",
    "DAIKIN",
    "KENWOOD",
    "Binatone",
    "Panasonic",
    "Scanfrost",
    "GOtv",
    "Sony",
    "SUMEC",
    "GREE",
    "Midea",
    "MAXI",
    "Samsung",
    "Huawei",
    "Aeon",
    "Toshiba",
    "KENSTAR",
    "TCL",
    "Royal",
    "Rite-Tek",
    "SYINIX",
    "INFINIX",
    "DELTA",
    "TRANE",
    "Beko",
    "F&D",
    "HOME FLOWER",
    "Havells",
    "OX",
    "Century",
    "Nexus",
    "Nature Power",
    "Navkar",
    "D-MARC",
    "Sonik",
    "Enkor",
    "Saisho",
    "Firman",
    "Power Deluxe",
    "Itel Safer",
    "VBT-AX",
    "APC",
    "ZVT",
    "Sollatek",
    "TBK BIANCO",
    "Tigmax",
    "ELEPAQ",
    "KEMAGE",
    "Others",
  ];

  // Check admin access and load product
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      if (!userData?.isAdmin) {
        router.push("/");
        return;
      }
      loadProduct();
    }
  }, [user, userData, authLoading, router, productId]);

  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, "products", productId));

      if (!productDoc.exists()) {
        alert("Product not found!");
        router.push("/admin/dashboard");
        return;
      }

      const productData = productDoc.data();

      // Populate form with existing data
      setFormData({
        itemName: productData.itemName || "",
        category: productData.category || "",
        subcategory: productData.subcategory || "",
        brand: productData.brand || "",
        description: productData.description || "",
        features: Array.isArray(productData.features)
          ? productData.features.join("\n")
          : "",
        tags: Array.isArray(productData.tags)
          ? productData.tags.join(", ")
          : "",
        amount: productData.amount?.toString() || "",
        originalPrice: productData.originalPrice?.toString() || "",
        status: productData.status || "in stock",
        sku: productData.sku || "",
        warranty: productData.warranty || "",
      });

      // Set existing images
      if (productData.images && Array.isArray(productData.images)) {
        setExistingImages(productData.images);
      } else if (productData.imageURL) {
        setExistingImages([productData.imageURL]);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      alert("Error loading product data");
      router.push("/admin/dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToCloudinary = async (image: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );
    formData.append(
      "cloud_name",
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear subcategory when category changes
    if (name === "category") {
      setFormData((prev) => ({ ...prev, subcategory: "" }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files).slice(0, 3);

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`);
        return;
      }
    }

    try {
      setCurrentUpload("Processing images...");

      const compressedFiles = [];
      for (const file of selected) {
        const compressed = await compressImage(file);
        compressedFiles.push(compressed);
      }

      setImages(compressedFiles);
      setCurrentUpload("");
    } catch (error) {
      console.error("Error processing images:", error);
      alert("Error processing images. Please try again.");
      setCurrentUpload("");
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.itemName.trim()) {
      alert("Product name is required");
      return false;
    }

    if (!formData.category) {
      alert("Category is required");
      return false;
    }

    if (!formData.subcategory) {
      alert("Subcategory is required");
      return false;
    }

    if (!formData.brand) {
      alert("Brand is required");
      return false;
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 10
    ) {
      alert("Product description is required (minimum 10 characters)");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Valid selling price is required");
      return false;
    }

    if (existingImages.length === 0 && images.length === 0) {
      alert("At least one product image is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setUploadProgress(0);
    setCurrentUpload("Updating product...");

    try {
      let finalImageURLs = [...existingImages];

      // Upload new images if any
      if (images.length > 0) {
        setCurrentUpload("Uploading new images...");

        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          try {
            setCurrentUpload(`Uploading image ${i + 1} of ${images.length}...`);
            setUploadProgress((i / images.length) * 80);

            const downloadURL = await uploadToCloudinary(image);
            finalImageURLs.push(downloadURL);
          } catch (uploadError: any) {
            console.error(`Upload failed for image ${i + 1}:`, uploadError);

            const skipImage = confirm(
              `Image ${i + 1} failed to upload.\n\nClick OK to skip this image and continue, or Cancel to stop.`
            );

            if (!skipImage) {
              throw new Error("Upload stopped by user");
            }
          }
        }
      }

      setUploadProgress(90);
      setCurrentUpload("Saving product updates...");

      // Convert features and tags
      const featuresArray = formData.features
        .split("\n")
        .filter((feature) => feature.trim() !== "")
        .map((feature) => feature.trim());

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      const updateData = {
        itemName: formData.itemName.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        brand: formData.brand,
        description: formData.description.trim(),
        features: featuresArray,
        tags: tagsArray,
        amount: parseFloat(formData.amount),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : null,
        status: formData.status,
        warranty: formData.warranty.trim() || null,
        imageURL: finalImageURLs[0], // Main image
        images: finalImageURLs, // All images
        inStock: formData.status === "in stock",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "products", productId), updateData);
      setUploadProgress(90);
      setCurrentUpload("Product updated successfully!");

      // ✅ ADD THIS: Clear cache so changes show immediately
      try {
        setCurrentUpload("Clearing cache...");
        await clearAllProductCaches();
        setUploadProgress(100);
        setCurrentUpload("Cache cleared!");
      } catch (cacheError) {
        console.warn("Cache clearing failed:", cacheError);
        // Don't fail the whole operation if cache clearing fails
      }

      alert("✅ Product updated and cache cleared!");
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Error updating product:", err);
      alert(
        "❌ Error: " +
          (err.message || "Something went wrong. Please try again.")
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentUpload("");
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="py-16 px-4 bg-gray-50 min-h-screen">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-red-500">Edit Product</h1>
            <div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Product Images <span className="text-red-500">*</span>
              </h3>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Current Images ({existingImages.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImages.map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="relative border rounded-lg overflow-hidden group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Current ${idx + 1}`}
                          className="object-cover w-full h-32"
                        />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                        <button
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="fileInput"
                  disabled={loading}
                />
                <label
                  htmlFor="fileInput"
                  className={`cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-2 font-medium">
                    Add more images
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum 3 additional images
                  </p>
                </label>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{currentUpload}</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {images.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    New Images ({images.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative border rounded-lg overflow-hidden group"
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`New ${idx + 1}`}
                          className="object-cover w-full h-32"
                        />
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          New
                        </span>
                        <button
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Section - Same as add product but with pre-filled values */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-6 text-gray-800">
                Product Information
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    placeholder="e.g., Samsung 43 Inch 4K Smart LED TV"
                    onChange={handleChange}
                    value={formData.itemName}
                    required
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      onChange={handleChange}
                      value={formData.category}
                      required
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subcategory"
                      onChange={handleChange}
                      value={formData.subcategory}
                      required
                      disabled={!formData.category || loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Subcategory</option>
                      {formData.category &&
                        categorySubItems[formData.category]?.map((subcat) => (
                          <option key={subcat} value={subcat}>
                            {subcat}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Brand & SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="brand"
                      onChange={handleChange}
                      value={formData.brand}
                      required
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU (Product Code)
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black bg-gray-50"
                      placeholder="Product SKU"
                      readOnly
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Provide a detailed description..."
                    rows={4}
                    onChange={handleChange}
                    value={formData.description}
                    required
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Key Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Features{" "}
                    <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    name="features"
                    placeholder="List key features, one per line"
                    rows={4}
                    onChange={handleChange}
                    value={formData.features}
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      placeholder="200000"
                      onChange={handleChange}
                      value={formData.amount}
                      required
                      min="0"
                      step="100"
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (₦){" "}
                      <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      placeholder="250000"
                      onChange={handleChange}
                      value={formData.originalPrice}
                      min="0"
                      step="100"
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Status & Warranty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      onChange={handleChange}
                      value={formData.status}
                      required
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="in stock">In Stock</option>
                      <option value="out of stock">Out Of Stock</option>
                      <option value="limited stock">Limited Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="warranty"
                      placeholder="1 Year Warranty"
                      onChange={handleChange}
                      value={formData.warranty}
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="smart tv, samsung, 43 inch, led"
                    onChange={handleChange}
                    value={formData.tags}
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate tags with commas
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Updating Product...
                      </span>
                    ) : (
                      "Update Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
