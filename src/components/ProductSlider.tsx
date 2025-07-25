// src/components/ProductSlider.tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  itemName: string;
  category: string;
  subcategory: string;
  brand: string;
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


export default function ProductSlider({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-4 pb-16">
      <div className="max-w-[1400] mx-auto px-4">
         <div className="flex justify-between items-center mt-16 mb-6">
            <h2 className="text-[16px] sm:text-[22px] font-meduim text-gray-800 relative">
              Related Products
            </h2>
            <a
              href="#"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              View All <span>➔</span>
            </a>
          </div>

          <div className="relative mb-6">
            <span className="relative z-10 block w-[25%] h-1 mt-1 bg-blue-400 rounded-full"></span>
            <span className="absolute left-[0%] top-[40%] block w-[100%] h-0.5 bg-gray-100 mb-1 rounded-full"></span>
          </div>

        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          loop={true}
          spaceBetween={16}
          speed={800}
          breakpoints={{
            350: { slidesPerView: 2 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className='items-stretch'>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
