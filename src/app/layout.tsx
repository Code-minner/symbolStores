// src/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { CartProvider } from "@/lib/CartContext";
import { WishlistProvider } from "@/lib/WishlistContext";
import "../styles/globals.css";
import "swiper/css";
import "swiper/css/navigation";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "SymbolStore - Premium Electronics & Home Appliances",
  description:
    "Shop the latest electronics, home appliances, and gadgets at unbeatable prices. Fast delivery, secure payments, and top-quality products — all in one store.",
  icons: {
    icon: "/assets/SymbolStoreicon.jpg",
  },
  openGraph: {
    title: "SymbolStore - Shop Smart, Live Better",
    description:
      "Discover high-quality electronics, home appliances, and accessories at affordable prices. Enjoy fast shipping and secure checkout every time.",
    url: "https://your-domain.com", // Replace with your actual site URL
    siteName: "SymbolStore",
    images: [
      {
        url: "https://your-domain.com/assets/og-image.jpg", // Hosted on your own site
        width: 1200,
        height: 630,
        alt: "SymbolStore Online Shopping Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>{children}</CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
