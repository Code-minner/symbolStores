"use client";

import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/pagination";

const HeroCarousel = () => {

    const router = useRouter(); 

  const slides = [
    {
      id: 1,
      image: "/assets/image 33.png",
      alt: "Premium Electronics Collection",
    },
    {
      id: 2,
      image:
        "/assets/modern-white-chest-freezer-sleek-efficient-storage-solution 1.png",
      alt: "Modern White Chest Freezer",
    },
    {
      id: 3,
      image: "/assets/gen.png",
      alt: "Symbol Store Featured Product",
    },
    { id: 4, image: "/assets/microwave.png", alt: "microwave" },
    { id: 5, image: "/assets/washing machine.png", alt: "washing" },
    { id: 6, image: "/assets/audiobass.png", alt: "Best Sellers" },
  ];
  

  return (
    // ✅ ULTRA-AGGRESSIVE: Outer boundary that absolutely prevents any overflow
    <div
      className="w-full overflow-hidden"
      style={{ position: "relative", maxWidth: "100vw" }}
    >
      {/* ✅ FIXED: Desktop full-width, mobile keeps padding */}
      <div className="w-full px-2 sm:px-4 lg:px-0 py-12 relative overflow-hidden">
        <div className="w-full max-w-[calc(100vw-48px)] sm:max-w-[calc(100vw-64px)] md:max-w-[calc(100vw-80px)] lg:max-w-full xl:max-w-full mx-auto overflow-hidden">
          {/* ✅ SIMPLIFIED: Clean wrapper without position conflicts */}
          <div className="w-full max-w-full overflow-hidden">
            <div className="w-full overflow-x-hidden">
              <Swiper
                modules={[Pagination, Autoplay]}
                // ✅ FIXED: Zero spacing for single slides to prevent partial preview
                slidesPerView={1} // Default: 1 slide for mobile
                spaceBetween={0} // Zero spacing to prevent partial preview
                breakpoints={{
                  // Mobile: 1 slide ONLY (no spacing to prevent partial preview)
                  320: {
                    slidesPerView: 1,
                    spaceBetween: 0,
                  },
                  // Large mobile: 1 slide ONLY (no spacing)
                  480: {
                    slidesPerView: 1,
                    spaceBetween: 0,
                  },
                  // Tablet: 2 slides (add spacing back)
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 0,
                  },
                  // Desktop: 3 slides (add spacing back)
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 0,
                  },
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                // ✅ FIXED: Prevent left shifting and positioning issues
                loop={true}
                watchOverflow={true}
                allowTouchMove={true}
                resistanceRatio={0}
                centeredSlides={false}
                centerInsufficientSlides={false}
                className="hero-carousel-swiper"
                style={{
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    {/* ✅ FIXED: Better centering for image container */}
                    <div className="w-full h-full flex justify-between items-center px-1">
                      <div className="w-full max-w-[100%] sm:max-w-[100%] lg:max-w-[90%] bg-gray-100 rounded-[20px] shadow-lg overflow-hidden mb-8 py-16  flex flex-col relative">
                        {/* Image Section - ✅ FIXED: Better image positioning */}
                        <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] bg-gray-100 overflow-hidden flex items-center justify-center">
                          <Image
                            src={slide.image}
                            alt={slide.alt}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 30vw"
                            priority={slide.id <= 3} // Prioritize first 3 images
                          />
                        </div>

                        {/* Bottom Bar with Button */}
                        <div className="w-[90%]  backdrop-blur-sm px-4 py-2 sm:py-3 flex border border-gray-200 justify-end absolute rounded-[10px]  bottom-[25px] right-[15px] ">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-1 sm:py-2 rounded-[4px] transition-colors duration-200 whitespace-nowrap"
                            onClick={() => router.push("/shop")}
                          >
                            SHOP WITH US
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Overflow prevention + margin elimination */}
        <style jsx global>{`
          /* ✅ GLOBAL OVERFLOW PREVENTION + MARGIN RESET */
          body {
            overflow-x: hidden !important;
          }

          /* ✅ ELIMINATE: Any inherited margins */
          .hero-carousel-swiper {
            overflow: hidden !important;
            width: 100% !important;
            max-width: 100% !important;
            position: relative !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            /* ✅ RESET: Any inherited spacing */
            padding: 0 !important;
          }

          .hero-carousel-swiper * {
            box-sizing: border-box !important;
          }

          .hero-carousel-swiper .swiper-wrapper {
            align-items: stretch !important;
            box-sizing: border-box !important;
            max-width: 100% !important;
            /* ✅ ULTRA-TIGHT: Prevent any wrapper overflow */
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .hero-carousel-swiper .swiper-slide {
            height: auto !important;
            display: flex !important;
            align-items: stretch !important;
            flex-shrink: 0 !important;
            position: relative !important;
            overflow: hidden !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            /* ✅ ULTRA-TIGHT: Constrain slides even more */
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 2px !important;
          }

          .hero-carousel-swiper .swiper-slide > div {
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          .hero-carousel-swiper .swiper-pagination {
            margin-top: 40px !important;
            position: relative !important;
            text-align: center !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }

          .hero-carousel-swiper .swiper-pagination-bullet {
            background: rgba(156, 163, 175, 0.4) !important;
            width: 10px !important;
            height: 10px !important;
            margin: 0 4px !important;
            transition: all 0.3s ease !important;
            opacity: 1 !important;
          }

          .hero-carousel-swiper .swiper-pagination-bullet-active {
            background: #ef4444 !important;
            transform: scale(1.2) !important;
          }

          /* ✅ ULTRA-TIGHT: Even more aggressive viewport calculations */
          @media (max-width: 479px) {
            .hero-carousel-swiper {
              max-width: calc(100vw - 48px) !important;
            }
          }

          @media (min-width: 480px) and (max-width: 767px) {
            .hero-carousel-swiper {
              max-width: calc(100vw - 64px) !important;
            }
          }

          @media (min-width: 768px) and (max-width: 1023px) {
            .hero-carousel-swiper {
              max-width: calc(100vw - 80px) !important;
            }
          }

          @media (min-width: 1024px) {
            .hero-carousel-swiper {
              max-width: 1380px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default HeroCarousel;
