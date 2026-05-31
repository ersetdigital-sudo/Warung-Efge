"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StockPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/products");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-[#072C2C]/50">Mengalihkan ke Produk & Stok...</p>
    </div>
  );
}
