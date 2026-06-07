"use client";

import { useState, Fragment } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { Plus, Edit, Trash2, Package, Search, Boxes, ChevronRight, ChevronDown, History, Check, AlertTriangle } from "lucide-react";

type PageTab = "katalog" | "stok";

export default function DemoProductsPage() {
  const { products, deleteProduct, stockMovements } = useDemo();
  const [activeTab, setActiveTab] = useState<PageTab>("katalog");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [toast, setToast] = useState("");

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
    setToast("Produk berhasil dihapus");
    setTimeout(() => setToast(""), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat && !p.is_archived;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const totalLevels = products.length; // single-unit demo products = 1 level each
  const multiLevelCount = 0; // demo products are single-unit

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 animate-in slide-in-from-top fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white ${toast.includes("berhasil") ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" />{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Produk & Stok</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light">Kelola katalog produk dan stok barang</p>
        </div>
        {activeTab === "katalog" && (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#FF5F03] text-white text-sm font-medium rounded-lg cursor-not-allowed opacity-60">
            <Plus className="w-4 h-4" />Tambah Produk
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#EDEADE] p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("katalog")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${activeTab === "katalog" ? "bg-[#FF5F03] text-white shadow-sm" : "text-[#072C2C]/60 hover:text-[#072C2C]"}`}
        >
          <Package className="w-4 h-4" />Katalog
        </button>
        <button
          onClick={() => setActiveTab("stok")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${activeTab === "stok" ? "bg-[#FF5F03] text-white shadow-sm" : "text-[#072C2C]/60 hover:text-[#072C2C]"}`}
        >
          <Boxes className="w-4 h-4" />Stok & Mutasi
        </button>
      </div>

      {/* Tab: Katalog */}
      {activeTab === "katalog" && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total SKU</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{products.length}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Multi Satuan</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{multiLevelCount} produk</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Tingkatan</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{totalLevels}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Kategori</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{categories.length}</p>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-[#D9D6C8] flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[160px] bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, SKU..."
                  className="bg-transparent outline-none text-xs w-full text-[#111827] placeholder-[#9CA3AF]"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5 text-[11px] text-[#4B5563] outline-none cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#D9D6C8]">
                    <th className="w-[30px] px-2 py-2 bg-[#EDEADE]"></th>
                    <th className="text-left px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Produk</th>
                    <th className="text-left px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">SKU</th>
                    <th className="text-left px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Kategori</th>
                    <th className="text-left px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Tingkatan</th>
                    <th className="text-right px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Stok</th>
                    <th className="text-left px-2.5 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-[#9CA3AF] text-sm">Tidak ada produk</td></tr>
                  )}
                  {filtered.map((p) => {
                    const stockVal = p.stock || 0;
                    const minStock = p.min_stock || 0;
                    const stockStatus = stockVal <= 0 ? "habis" : stockVal <= minStock ? "menipis" : "aman";
                    const levelColors = ["bg-[#072C2C]/10 text-[#072C2C]", "bg-[#FF5F03]/10 text-[#FF5F03]", "bg-[#D97706]/10 text-[#D97706]"];

                    return (
                      <Fragment key={p.id}>
                        <tr className={`border-b border-[#D9D6C8] hover:bg-[#FAFAF8] transition-colors ${stockStatus === "habis" ? "bg-[#FEF2F2]/50" : stockStatus === "menipis" ? "bg-[#FFFBEB]/50" : ""}`}>
                          <td className="px-2 py-2">
                            {/* No expand for demo single-unit products */}
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="font-medium text-[#111827]">{p.name}</div>
                            {p.expiry_date && (() => {
                              const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
                              if (days < 0) return <div className="text-[9px] font-bold text-[#DC2626] mt-0.5 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Exp: kadaluarsa {Math.abs(days)}h lalu</div>;
                              if (days <= 30) return <div className="text-[9px] font-bold text-amber-500 mt-0.5 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Exp: {days} hari lagi</div>;
                              return <div className="text-[9px] text-[#9CA3AF] mt-0.5">Exp: {new Date(p.expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })}</div>;
                            })()}
                          </td>
                          <td className="px-2.5 py-2 font-mono text-[11px] text-[#9CA3AF]">{p.sku || "\u2014"}</td>
                          <td className="px-2.5 py-2">
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded">{p.category || "\u2014"}</span>
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="flex gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${levelColors[0]}`}>{p.unit}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono font-bold text-[11px] ${stockStatus === "habis" ? "text-[#DC2626]" : stockStatus === "menipis" ? "text-[#D97706]" : "text-[#072C2C]"}`}>
                                  {stockVal} {p.unit || ""}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${stockStatus === "habis" ? "bg-[#DC2626] text-white" : stockStatus === "menipis" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#ECFDF5] text-[#16A34A]"}`}>
                                  {stockStatus === "habis" ? "HABIS" : stockStatus === "menipis" ? "MENIPIS" : "AMAN"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="flex gap-1">
                              <button className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-not-allowed opacity-40 text-[#9CA3AF]" title="Edit (disabled in demo)">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button onClick={() => setDeleteTarget(p)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#FEF2F2] hover:border-[#fecaca] hover:text-[#DC2626] text-[#9CA3AF]">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Katalog */}
            <div className="md:hidden px-3 py-2 space-y-2">
              {filtered.length === 0 && <div className="text-center py-6 text-[#9CA3AF] text-sm">Tidak ada produk</div>}
              {filtered.map((p) => {
                const stockVal = p.stock || 0;
                const stockStatus = stockVal <= 0 ? "habis" : stockVal <= (p.min_stock || 0) ? "menipis" : "aman";
                return (
                  <div key={p.id} className={`bg-white border rounded-xl p-3.5 space-y-2 ${stockStatus === "habis" ? "border-[#fecaca]" : stockStatus === "menipis" ? "border-[#fde68a]" : "border-[#D9D6C8]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111827] text-sm">{p.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] font-mono">{p.sku || "\u2014"} · {p.category}</p>
                        {p.expiry_date && (() => {
                          const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
                          if (days < 0) return <p className="text-[9px] font-bold text-[#DC2626] mt-0.5 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Kadaluarsa {Math.abs(days)} hari lalu</p>;
                          if (days <= 30) return <p className="text-[9px] font-bold text-amber-500 mt-0.5 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Exp {days} hari lagi</p>;
                          return <p className="text-[9px] text-[#9CA3AF] mt-0.5">Exp: {new Date(p.expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })}</p>;
                        })()}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${stockStatus === "habis" ? "bg-[#DC2626] text-white" : stockStatus === "menipis" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#ECFDF5] text-[#16A34A]"}`}>
                        {stockStatus === "habis" ? "HABIS" : stockStatus === "menipis" ? "MENIPIS" : "AMAN"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#072C2C]/10 text-[#072C2C]">{p.unit}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#072C2C]">{stockVal} {p.unit}</span>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-[#D9D6C8]">
                      <button className="flex-1 py-1.5 text-[11px] font-medium text-[#1D4ED8] bg-[#EFF6FF] rounded-lg cursor-not-allowed opacity-50">Edit</button>
                      <button onClick={() => setDeleteTarget(p)} className="flex-1 py-1.5 text-[11px] font-medium text-[#DC2626] bg-[#FEF2F2] rounded-lg cursor-pointer">Hapus</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">
              Menampilkan {filtered.length} dari {products.length} produk
            </div>
          </div>

          {/* Panduan Multi Satuan */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg">
            <div className="px-3.5 py-2.5 border-b border-[#D9D6C8]">
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Panduan Multi Satuan</div>
            </div>
            <div className="p-3.5 text-[11px] text-[#4B5563] leading-relaxed space-y-2.5">
              <div className="flex items-start gap-2">
                <div className="w-[18px] h-[18px] rounded-full bg-[#072C2C] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">1</div>
                <div><strong>Level 1 (Terbesar)</strong> — misal <em>Slop</em> isi 10 bungkus</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-[18px] h-[18px] rounded-full bg-[#FF5F03] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">2</div>
                <div><strong>Level 2 (Tengah)</strong> — misal <em>Bungkus</em> isi 12 batang</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-[18px] h-[18px] rounded-full bg-[#D97706] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">3</div>
                <div><strong>Level 3 (Terkecil)</strong> — misal <em>Batang</em> (satuan eceran)</div>
              </div>
              <div className="bg-[#EDEADE] border border-[#D9D6C8] rounded p-2.5 text-[10px] text-[#9CA3AF] mt-2">
                Stok & harga tiap level dihitung otomatis dari konversi. Klik di baris produk untuk melihat detail.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab: Stok & Mutasi */}
      {activeTab === "stok" && (
        <>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] text-white text-sm font-medium rounded-lg cursor-not-allowed opacity-60">
              <Plus className="w-4 h-4" />Stok Masuk
            </button>
          </div>

          {/* KPI Stok */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Aman</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{products.filter(p => p.stock > p.min_stock).length}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Menipis</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#D97706] mt-1">{products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Habis</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#DC2626] mt-1">{products.filter(p => p.stock <= 0).length}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Mutasi</p>
              <p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{stockMovements.length}</p>
            </div>
          </div>

          {/* Ringkasan Stok Table */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg">
            <div className="px-3.5 py-2.5 border-b border-[#D9D6C8] flex items-center justify-between">
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Ringkasan Stok</div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#D9D6C8]">
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kategori</th>
                    <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Stok</th>
                    <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Min</th>
                    <th className="text-center px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const status = getStockStatus(p.stock, p.min_stock);
                    return (
                      <tr key={p.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                        <td className="px-3 py-2">
                          <p className="font-medium text-[#111827]">{p.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{p.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-[#4B5563]">{p.category}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{p.stock} {p.unit}</td>
                        <td className="px-3 py-2 text-right text-[#9CA3AF]">{p.min_stock}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${status === "safe" ? "bg-[#ECFDF5] text-[#16A34A]" : status === "warning" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#DC2626] text-white"}`}>
                            {status === "safe" ? "Aman" : status === "warning" ? "Menipis" : "Habis"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile stok cards */}
            <div className="md:hidden px-3 py-2 space-y-2">
              {products.map(p => {
                const status = getStockStatus(p.stock, p.min_stock);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#D9D6C8]">
                    <div>
                      <p className="font-medium text-sm text-[#111827]">{p.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">{p.stock} {p.unit}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${status === "safe" ? "bg-[#ECFDF5] text-[#16A34A]" : status === "warning" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#DC2626] text-white"}`}>
                        {status === "safe" ? "Aman" : status === "warning" ? "Menipis" : "Habis"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riwayat Mutasi Stok */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg">
            <div className="px-3.5 py-2.5 border-b border-[#D9D6C8] flex items-center gap-2">
              <History className="w-4 h-4 text-[#072C2C]/50" />
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Riwayat Mutasi Stok</div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#D9D6C8]">
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Tanggal</th>
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                    <th className="text-center px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Tipe</th>
                    <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Jumlah</th>
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-[#9CA3AF] text-sm">Belum ada mutasi stok</td></tr>
                  )}
                  {stockMovements.slice(0, 50).map((m: any) => {
                    const typeBadge = m.type === "in"
                      ? "bg-[#ECFDF5] text-[#16A34A]"
                      : m.type === "out"
                      ? "bg-[#DC2626] text-white"
                      : m.type === "adjustment"
                      ? "bg-[#FEF3C7] text-[#D97706]"
                      : "bg-blue-50 text-blue-700"; // opname
                    const typeLabel = m.type === "in"
                      ? "Masuk"
                      : m.type === "out"
                      ? "Keluar"
                      : m.type === "adjustment"
                      ? "Koreksi"
                      : "Opname";
                    return (
                      <tr key={m.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                        <td className="px-3 py-2 text-[#4B5563]">{formatDate(m.created_at)}</td>
                        <td className="px-3 py-2 font-medium text-[#111827]">{m.product_name}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${typeBadge}`}>{typeLabel}</span>
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${m.type === "in" ? "text-[#16A34A]" : m.type === "out" ? "text-[#DC2626]" : "text-[#072C2C]"}`}>
                          {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity} {m.unit}
                        </td>
                        <td className="px-3 py-2 text-[#9CA3AF] max-w-[200px] truncate">{m.notes || "\u2014"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile mutasi cards */}
            <div className="md:hidden px-3 py-2 space-y-2">
              {stockMovements.length === 0 && <div className="text-center py-6 text-[#9CA3AF] text-sm">Belum ada mutasi stok</div>}
              {stockMovements.slice(0, 50).map((m: any) => {
                const typeLabel = m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : m.type === "adjustment" ? "Koreksi" : "Opname";
                const typeBadge = m.type === "in"
                  ? "bg-[#ECFDF5] text-[#16A34A]"
                  : m.type === "out"
                  ? "bg-[#DC2626] text-white"
                  : m.type === "adjustment"
                  ? "bg-[#FEF3C7] text-[#D97706]"
                  : "bg-blue-50 text-blue-700";
                return (
                  <div key={m.id} className="flex items-start justify-between p-3 bg-[#FAFAF8] rounded-lg border border-[#D9D6C8]">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#111827]">{m.product_name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{formatDate(m.created_at)} · {m.notes || "\u2014"}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className={`font-mono font-bold text-sm ${m.type === "in" ? "text-[#16A34A]" : m.type === "out" ? "text-[#DC2626]" : "text-[#072C2C]"}`}>
                        {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity} {m.unit}
                      </p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${typeBadge}`}>{typeLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {stockMovements.length > 50 && (
              <div className="px-3 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">
                Menampilkan 50 dari {stockMovements.length} mutasi
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-[#DC2626]" />
            </div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus Produk?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.name} akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-[#4B5563] text-white font-medium text-sm rounded-xl cursor-pointer">Batal</button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl cursor-pointer">
                <Trash2 className="w-4 h-4" />Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
