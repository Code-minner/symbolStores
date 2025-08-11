// ===================================================================
// CLEANED: src/app/page.tsx (Removed all hidden sections and problematic styles)
// ===================================================================
"use client";

import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import CustomHeroCarousel from "@/components/HeroCarousel";
import { useEffect, useState } from "react";
import { getAllProducts } from "@/lib/ProductsCache";

// Define the Brand interface
interface Brand {
  id: string;
  name: string;
  logo: string;
  href: string;
}

// ✅ FIXED: Define Product interface for proper typing
interface Product {
  id: string;
  [key: string]: any; // For other product properties from Firestore
}

const productSub = [
  {
    id: 1,
    title: "Kohler SPG-K16 Silent or Soundproof Diesel Generator",
    price: "₦11,513,000",
    image: "/assets/Soundproof Diesel Generator.png",
    href: "/home/generator/sound-proof-generator-set/Q16Kohler-SPG-K16-Silent-or-Soundproof-Diesel-Generator9w",
  },
  {
    id: 2,
    title: "Hisense 045DR 45L Single Door Refrigerator",
    price: "113,800.00",
    image: "/assets/tophisense.png",
    href: "/home/refrigerators/single-door-refrigerator/4d8Hisense-045DR-45L-Single-Door-Refrigeratorzd",
  },
  {
    id: 3,
    title: "Hisense WM753-WSQB 7.5KG Top Load Twin Tub Washing Machine",
    price: "₦152,600.00",
    image: "/assets/washer.png",
    href: "/home/home-&-kitchen/top-load-washing-machine/6UpHisense-WM753-WSQB-7-5KG-Top-Load-Twin-Tub-Washing-MachineVw",
  },
];

const brands: Brand[] = [
  {
    id: "1",
    name: "Hisense",
    logo: "/assets/Group 4103.png",
    href: "/shop?brand=Hisense",
  },
  {
    id: "2",
    name: "Snowtec",
    logo: "/assets/Group 4110.png",
    href: "/shop?brand=Snowtec",
  },
  {
    id: "3",
    name: "Panasonic",
    logo: "/assets/Group 4106.png",
    href: "/shop?brand=Panasonic",
  },
  {
    id: "4",
    name: "LG",
    logo: "/assets/Group 4108.png",
    href: "/shop?brand=LG",
  },
  {
    id: "5",
    name: "Gotv",
    logo: "/assets/Group 4112.png",
    href: "/shop?brand=Gotv",
  },
  {
    id: "6",
    name: "Bunatone",
    logo: "/assets/Group 4104.png",
    href: "/shop?brand=Bunatone",
  },
];

export default function Home() {
  // ✅ FIXED: Properly type the products state
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };
    load();
  }, []);

  return (
    <div className="w-full">
      <Header />
      {/* ✅ FIXED: Proper centering without mr-16 */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="w-full overflow-hidden relative">
          {/* Heading */}
          <div>
            <h1 className="text-[25px] sm:text-[45px] w-full font-bold max-w-[300px] sm:max-w-[600px] mx-auto block text-center leading-snug break-words">
              Smart. Safe. Built for Your Home
            </h1>
          </div>
          {/* Hero Carousel */}
          <div className="w-full overflow-x-hidden relative">
            <CustomHeroCarousel />
          </div>
        </div>

        {/* Qualities About Us */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 px-4 sm:px-8 py-8 rounded-[30px] bg-gray-100">
          {/* Fast Shipping */}
          <div className="flex flex-col sm:flex-row items-center gap-4 px-2 py-4 sm:px-6 sm:py-6 h-auto sm:h-[140px] rounded-[30px] bg-white text-center sm:text-left">
            <Image
              src="/assets/vehicle_15630466 2.png"
              alt="Fast Shipping"
              width={50}
              height={50}
              className="object-cover w-[50px] sm:w-[80px]"
              priority
            />
            <div>
              <h3 className="text-[12px] sm:text-[16px] font-medium mb-2">
                Fast Shipping
              </h3>
              <p className="text-[10px] sm:text-[14px]">
                Free shipping for all orders over N99,000
              </p>
            </div>
          </div>

          {/* Return Policy */}
          <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-6 h-auto sm:h-[140px] rounded-[30px] bg-white text-center sm:text-left">
            <Image
              src="/assets/Vector.png"
              alt="Return Policy"
              width={40}
              height={40}
              className="object-cover w-[30px] sm:w-[40px]"
              priority
            />
            <div>
              <h3 className="text-[12px] sm:text-[16px] font-medium mb-2">
                Return Policy
              </h3>
              <p className="text-[10px] sm:text-[14px]">
                No worries whatsoever.
              </p>
            </div>
          </div>

          {/* 24/7 Support */}
          <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-6 h-auto sm:h-[140px] rounded-[30px] bg-white text-center sm:text-left">
            <Image
              src="/assets/Vector (1).png"
              alt="24/7 Support"
              width={40}
              height={40}
              className="object-cover w-[30px] sm:w-[40px]"
              priority
            />
            <div>
              <h3 className="text-[12px] sm:text-[16px] font-medium mb-2">
                24/7 Support
              </h3>
              <p className="text-[10px] sm:text-[14px]">
                Friendly 24/7 customer support
              </p>
            </div>
          </div>

          {/* Secure Payment */}
          <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-6 h-auto sm:h-[140px] rounded-[30px] bg-white text-center sm:text-left">
            <Image
              src="/assets/Vector (2).png"
              alt="Secure Payment"
              width={50}
              height={40}
              className="object-cover w-[35px] sm:w-[50px]"
              priority
            />
            <div>
              <h3 className="text-[12px] sm:text-[17px] font-medium mb-2">
                Secure Payment
              </h3>
              <p className="text-[10px] sm:text-[13px]">
                We possess SSL / Secure Certificate
              </p>
            </div>
          </div>
        </div>

        <main className="">
          <ProductGrid />
        </main>
        {/* Top rated section */}
        <div>
          <div className="flex justify-between items-center mt-16 mb-6">
            <h2 className="text-[16px] sm:text-[22px] font-medium text-gray-800 relative">
              Top Rated
            </h2>
            <a
              href="#"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <span>➔</span>
            </a>
          </div>

          <div className="relative mb-6">
            <span className="relative z-10 block w-[20%] h-1 mt-1 bg-blue-400 rounded-full"></span>
            <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productSub.map((productSub) => (
              <div
                key={productSub.id}
                className="border-2 border-transparent hover:border-[#FF0000] transition rounded-lg p-4 relative group"
              >
                <Link
                  key={productSub.id}
                  href={productSub.href}
                  className="flex flex-col items-center group w-full"
                >
                  {/* Image */}
                  <div className="relative w-full h-60 sm:h-80 mb-4">
                    <Image
                      src={productSub.image}
                      alt={productSub.title}
                      fill
                      className="object-contain"
                    />

                    {/* Icons */}
                    <div className="absolute right-2 bottom-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="bg-white-0 text-[14px] px-4 py-2 border-2 border-[#FF0000] text-[#FF0000]  rounded-full shadow hover:bg-[#FF0000] hover:text-white transition">
                        View More
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-cols-2 justify-between gap-8">
                    {/* Title */}
                    <p className="text-[12px] sm:text-[14px] text-gray-700 mb-1">
                      {productSub.title}
                    </p>

                    {/* Price */}
                    <p className="text-[14px] sm:text-[16px] font-bold text-gray-900">
                      {productSub.price}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ VISIBLE: popular brands section (removed hidden class) */}
        <div className="block overflow-hidden">
          <div className="flex justify-between items-center mt-16 mb-6">
            <h2 className="text-[16px] sm:text-[22px] font-medium text-gray-800 relative">
              Popular Brands
            </h2>
            <a
              href="#"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <span>➔</span>
            </a>
          </div>

          <div className="relative mb-6">
            <span className="relative z-10 block w-[20%] h-1 mt-1 bg-blue-400 rounded-full"></span>
            <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
          </div>

          {/* ✅ FIXED: Brands Container with overflow protection */}
          <div className="w-full overflow-hidden mt-4">
            <div className="w-full max-w-[1380px] mx-auto overflow-hidden">
              {/* ✅ GRID: No scrolling, responsive grid layout */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 px-4">
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={brand.href}
                    className="flex flex-col items-center group w-full"
                  >
                    <div className="w-full max-w-[90px] sm:max-w-[120px] md:max-w-[200px] lg:max-w-[300px] aspect-square rounded-full bg-white border flex items-center justify-center hover:border-[#FF3A00] hover:shadow-lg transition-all duration-300 group-hover:scale-105 relative overflow-hidden mx-auto">
                      <div className="relative w-[70%] h-[70%]">
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 80px, (max-width: 768px) 90px, (max-width: 1024px) 200px, 300px"
                        />
                      </div>
                    </div>
                    <p className="text-center text-xs md:text-sm text-gray-600 mt-2 group-hover:text-[#FF3A00] transition-colors truncate w-full">
                      {brand.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          {/* Hot Deals Section */}

          <div className="flex justify-between items-center mt-16 mb-6">
            <h2 className="text-[16px] sm:text-[22px] font-medium text-gray-800 relative">
              Hot Deals
            </h2>
            <a
              href="#"
              className="text-sm text-[#FF0000] hover:underline flex items-center gap-1"
            >
              View All <span>➔</span>
            </a>
          </div>

          <div className="relative mb-6">
            <span className="relative z-10 block w-[20%] h-1 mt-1 bg-[#FF0000] rounded-full"></span>
            <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
          </div>

          <div className="grid grid-cols-[100%] md:grid-cols-[65%_35%] gap-4 py-8 mt-16">
            <div>
              {/* mobile view */}

              <div className="grid grid-cols-[50%_50%] gap-4 block sm:hidden ">
                <div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="relative w-full h-[150px]">
                      <Image
                        src="/assets/image 14.png"
                        alt="Deals of the Day"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="relative w-full h-[150px]">
                      <Image
                        src="/assets/image 15.png"
                        alt="Deals of the Day"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative w-[100%] h-[150px] sm:h-[30vh]">
                    <Image
                      src="/assets/image 13.png"
                      alt="Deals of the Day"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                </div>
                <div className="relative w-full h-[350px]  mb-4">
                  <Image
                    src="/assets/image 12.png"
                    alt="Deals of the Day"
                    fill
                    className="object-scale"
                  />
                </div>
              </div>

              {/* desktop view */}
              <div className="hidden sm:flex justify-between items-center mt-4 mb-6">
                <div className="relative w-full h-[200px] sm:h-[300px] mb-4">
                  <Image
                    src="/assets/image 14.png"
                    alt="Deals of the Day"
                    fill
                    className="object-scale object-top"
                  />
                </div>
                <div className="relative w-full h-[200px] sm:h-[300px] mb-4">
                  <Image
                    src="/assets/image 15.png"
                    alt="Deals of the Day"
                    fill
                    className="object-scale object-top"
                  />
                </div>

                <div className="relative w-full h-[200px] hidden sm:block sm:h-[300px]  mb-4">
                  <Image
                    src="/assets/image 13.png"
                    alt="Deals of the Day"
                    fill
                    className="object-scale object-top"
                  />
                </div>
              </div>

              <div className="bg-gray-100 p-8 rounded-[30px]">
                <h2 className="w-full sm:max-w-[90%] text-[14px] sm:text-[22px] leading-snug font-medium text-gray-800 mb-4">
                  Hisense H670SMIB-WD 514L Black Glass (Side By Side)
                  Refrigerator With Door Opening Alarm
                </h2>

                <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-end">
                  <ul className="text-[10px] sm:text-[14px]">
                    <li>
                      Feature Specification Capacity - 514 L (335 L fridge / 177
                      L freezer)
                    </li>
                    <li>Energy Efficiency - A+, ~412 kWh/year</li>
                    <li>Cooling - Frost‑free, Multi‑Air Flow</li>
                    <li>Modes - Super‑Cool, Super‑Freeze, Holiday, etc.</li>
                    <li>Water / Ice Feature - 2L reservoir, twist ice maker</li>
                    <li>Alarm - Door‑opening alarm</li>
                    <li>Dimensions - 910×641×1780 mm</li>
                    <li>Noise Level - ≤ 43 dB</li>
                    <li>Warranty - 36–48 month</li>
                  </ul>

                  <div>
                    <h2 className="text-[18px] mb-4">₦ 1,140,000</h2>
                    <button className="bg-[#FF0000] text-[14px] px-4 py-2 border-2 border-[#FF0000] text-[#fff]  rounded-lg shadow hover:bg-[#FF0000] hover:text-white transition">
                      View More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block w-full sm:h-100%">
              <Image
                src="/assets/image 12.png"
                alt="Deals of the Day"
                fill
                className="object-contain object-top"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
