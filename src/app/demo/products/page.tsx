"use client";

import { useState } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { Package, Search, Plus, AlertTriangle, Archive, Trash2 } from "lucide-react";

export default function DemoProductsPage() {
  const { products, deleteProduct } = useDemo();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat && !p.is_archived;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Produk & Stok</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light">{filtered.length} produk aktif</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#D9D6C8] rounded-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Cari nama, SKU, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-[#9CA3AF]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#D9D6C8] rounded-lg text-sm cursor-pointer"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9D6C8] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EDEADE]">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Produk</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">SKU</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Harga Jual</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Stok</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE8]">
              {filtered.map((p) => {
                const isLow = p.stock <= p.min_stock;
                const isEmpty = p.stock <= 0;
                return (
                  <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[#111827] text-[12px]">{p.name}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{p.category}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#4B5563] font-mono hidden sm:table-cell">{p.sku}</td>
                    <td className="px-3 py-2.5 text-right text-[12px] font-bold text-[#072C2C] font-mono">{formatCurrency(p.selling_price)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[12px] font-bold font-mono ${isEmpty ? "text-[#DC2626]" : isLow ? "text-[#D97706]" : "text-[#072C2C]"}`}>
                        {p.stock}
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] ml-0.5">{p.unit}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isEmpty ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#fecaca] rounded">Habis</span>
                      ) : isLow ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#fde68a] rounded">Menipis</span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#bbf7d0] rounded">Aman</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-[#9CA3AF] hover:text-[#DC2626] transition-colors cursor-pointer"
                        title="Hapus (demo)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-[#9CA3AF] text-sm">Tidak ada produk ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
