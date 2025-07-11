import Image from "next/image";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="flex flex-col w-full m-auto min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-8 w-full">
        <h1 className="text-red-500 text-lg md:text-2xl font-bold mb-4">Symbolstore</h1>
      </main>
      <footer className="text-center py-4 bg-white border-t mt-auto">Footer content here</footer>
    </div>
  );
}
