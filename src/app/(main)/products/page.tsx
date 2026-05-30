"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { products as initialProducts, categories, transactions } from "@/data/mock-data";
import { Product } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productList, setProductList] = useState(initialProducts);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const hasTransactions = transactions.some(t => t.items.some(i => i.productId === deleteTarget.id));
    // Both cases: remove from view (soft delete if has transactions, hard delete if not)
    setProductList(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Produk berhasil dihapus", "success");
  };

  const filteredProducts = selectedCategory
    ? productList.filter((p) => p.category === selectedCategory)
    : productList;

  const columns = [
    { key: "name", label: "Produk", sortable: true, render: (item: Product) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
        <div><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">SKU: {item.sku}</p></div>
      </div>
    )},
    { key: "category", label: "Kategori", sortable: true, render: (item: Product) => <Badge variant="info">{item.category}</Badge> },
    { key: "costPrice", label: "Harga Modal", sortable: true, render: (item: Product) => <span className="text-gray-600">{formatCurrency(item.costPrice)}</span> },
    { key: "sellingPrice", label: "Harga Jual", sortable: true, render: (item: Product) => <span className="font-medium text-gray-900">{formatCurrency(item.sellingPrice)}</span> },
    { key: "stock", label: "Stok", sortable: true, render: (item: Product) => {
      const status = getStockStatus(item.stock, item.minStock);
      return <Badge variant={status === "safe" ? "success" : status === "warning" ? "warning" : "danger"}>{item.stock} {item.unit}</Badge>;
    }},
    { key: "actions", label: "Aksi", render: (item: Product) => (
      <div className="flex items-center gap-1">
        <button onClick={() => router.push(`/products/edit/${item.id}`)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed z-[9999] ${toast.type === "success" ? "top-4 right-4 sm:top-6 sm:right-6" : "top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto"} animate-in slide-in-from-top fade-in duration-200`}>
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white ${toast.type === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            {toast.msg}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Manajemen Produk</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola semua produk toko Anda</p></div>
        <Link href="/products/tambah"><Button><Plus className="w-4 h-4" />Tambah Produk</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedCategory("")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${!selectedCategory ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>Semua ({productList.length})</button>
        {categories.map((cat) => {
          const count = productList.filter((p) => p.category === cat.name).length;
          if (count === 0) return null;
          return <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${selectedCategory === cat.name ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>{cat.name} ({count})</button>;
        })}
      </div>

      <Card><CardContent><DataTable columns={columns} data={filteredProducts} searchPlaceholder="Cari produk, SKU, atau barcode..." searchKeys={["name", "sku", "barcode", "category"]} /></CardContent></Card>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.name} akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-[#4B5563] text-white font-medium text-sm rounded-xl cursor-pointer hover:bg-[#374151] transition-colors">Batal</button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#b91c1c] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
