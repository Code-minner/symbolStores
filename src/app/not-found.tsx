"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div>
      <Header />
      <div className="w-full max-w-[800px] m-auto px-4 mb-20">
        <div className="flex flex-col items-center text-center justify-center">
          <div className="w-full max-w-[500px] mb-6">
            <Image
              src="/assets/404img.png"
              alt="404 Illustration"
              width={500}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>

          <h1 className="text-2xl md:text-5xl font-bold mt-2 mb-4">
            404, Page not found
          </h1>
          <p className="text-gray-600 text-[14px]  sm:text-[18px] leading-normal  mt-2 max-w-[600px]">
            Something went wrong. It looks like the link is broken or the page
            has been removed.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => router.back()}
              className="bg-red-500 text-white text-[12px]  sm:text-[18px] px-6 py-3  sm:px-8 sm:py-6 rounded flex items-center gap-2 hover:bg-red-600 transition"
            >
              ← Go Back
            </button>
            <Link
              href="/"
              className="bg-white text-red-500 border border-red-500 text-[14px]  sm:text-[18px] px-6 py-3  sm:px-8 sm:py-6 rounded flex items-center gap-2 hover:bg-red-500 hover:text-white transition"
            >
              <svg
                className="mr-[3px]"
                width="18"
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
              </svg>{" "}
              Go to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
