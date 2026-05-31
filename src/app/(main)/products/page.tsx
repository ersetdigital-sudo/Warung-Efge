"use client";

import { useState, useEffect, Fragment } from "react";
import { Plus, Edit, Trash2, Package, ChevronRight, ChevronDown, Search, History, Boxes } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { getProductsWithUnits, deleteProduct, getStockMovements } from "@/lib/db";

type PageTab = "katalog" | "stok";

export default function ProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PageTab>("katalog");
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [toast, setToast] = useState("");
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => { loadProducts(); }, []);
  const loadProducts = async () => {
    const data = await getProductsWithUnits();
    setProducts(data);
    const movs = await getStockMovements();
    setMovements(movs);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    await loadProducts();
    setDeleteTarget(null);
    setToast("Produk berhasil dihapus");
    setTimeout(() => setToast(""), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const multiLevelCount = products.filter(p => (p.product_units || []).length > 1).length;
  const totalLevels = products.reduce((s, p) => s + (p.product_units || []).length, 0);

  return (
    <div className="space-y-4">
      {toast && <div className="fixed z-[9999] top-4 right-4 animate-in slide-in-from-top fade-in duration-200"><div className="px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#DC2626]">{toast}</div></div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Produk & Stok</h1><p className="text-[10px] text-[#9CA3AF] font-light">Kelola katalog produk dan stok barang</p></div>
        {activeTab === "katalog" && <Link href="/products/tambah"><Button><Plus className="w-4 h-4" />Tambah Produk</Button></Link>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#EDEADE] p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab("katalog")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${activeTab === "katalog" ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/60 hover:text-[#072C2C]"}`}>
          <Package className="w-4 h-4" />Katalog
        </button>
        <button onClick={() => setActiveTab("stok")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${activeTab === "stok" ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/60 hover:text-[#072C2C]"}`}>
          <Boxes className="w-4 h-4" />Stok & Mutasi
        </button>
      </div>

      {/* Tab: Katalog */}
      {activeTab === "katalog" && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total SKU</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{products.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Multi Satuan</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{multiLevelCount} produk</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Tingkatan</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{totalLevels}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Kategori</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{categories.length}</p></div>
          </div>

          {/* Table */}
          <Card>
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-[#D9D6C8] flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[160px] bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, SKU..." className="bg-transparent outline-none text-xs w-full text-[#111827] placeholder-[#9CA3AF]" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5 text-[11px] text-[#4B5563] outline-none cursor-pointer">
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#9CA3AF] text-sm">Tidak ada produk</td></tr>}
              {filtered.map((p) => {
                const units = (p.product_units || []).sort((a: any, b: any) => a.level - b.level);
                const baseUnit = units[0];
                const isOpen = expandedRows.has(p.id);
                const levelColors = ["bg-[#072C2C]/10 text-[#072C2C]", "bg-[#FF5F03]/10 text-[#FF5F03]", "bg-[#D97706]/10 text-[#D97706]"];
                return (
                  <Fragment key={p.id}>
                    <tr className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-2 py-2">
                        {units.length > 1 && <button onClick={() => toggleExpand(p.id)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#EDEADE]">
                          {isOpen ? <ChevronDown className="w-3 h-3 text-[#072C2C]" /> : <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />}
                        </button>}
                      </td>
                      <td className="px-2.5 py-2"><div className="font-medium text-[#111827]">{p.name}</div></td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-[#9CA3AF]">{p.sku || "—"}</td>
                      <td className="px-2.5 py-2"><Badge variant="info">{p.category || "—"}</Badge></td>
                      <td className="px-2.5 py-2"><div className="flex gap-1 flex-wrap">{units.map((u: any, i: number) => <span key={u.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${levelColors[i] || levelColors[0]}`}>{u.name}</span>)}</div></td>
                      <td className="px-2.5 py-2 text-right font-mono font-bold text-[11px]">{baseUnit ? `${baseUnit.stock} ${baseUnit.name}` : `${p.stock || 0} ${p.unit || ""}`}</td>
                      <td className="px-2.5 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => router.push(`/products/edit/${p.id}`)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#EFF6FF] hover:border-[#bfdbfe] hover:text-[#1D4ED8] text-[#9CA3AF]"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => setDeleteTarget(p)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#FEF2F2] hover:border-[#fecaca] hover:text-[#DC2626] text-[#9CA3AF]"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                    {/* Expand Row */}
                    {isOpen && units.length > 1 && (
                      <tr className="bg-[#FAFAF8] border-b border-[#D9D6C8]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {units.map((u: any, i: number) => {
                              const margin = u.buy_price > 0 ? Math.round((u.sell_price - u.buy_price) / u.sell_price * 100) : 0;
                              const nextUnit = units[i + 1];
                              const borderColor = ["border-t-[#072C2C]", "border-t-[#FF5F03]", "border-t-[#D97706]"][i] || "";
                              return (
                                <div key={u.id} className={`bg-white border border-[#D9D6C8] rounded p-3 border-t-[3px] ${borderColor}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-[#111827]">{u.name}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${levelColors[i]}`}>Level {u.level}</span>
                                  </div>
                                  <p className="text-[10px] text-[#9CA3AF] mb-2">{u.conversion ? `1 ${u.name} = ${u.conversion} ${nextUnit?.name || "unit"}` : "Satuan terkecil"}</p>
                                  <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between"><span className="text-[#9CA3AF]">Harga Beli</span><span className="font-mono font-bold text-[#DC2626]">{formatCurrency(u.buy_price)}</span></div>
                                    <div className="flex justify-between"><span className="text-[#9CA3AF]">Harga Jual</span><span className="font-mono font-bold text-[#16A34A]">{formatCurrency(u.sell_price)}</span></div>
                                    <div className="flex justify-between"><span className="text-[#9CA3AF]">Margin</span><span className={`font-mono font-bold ${margin >= 20 ? "text-[#16A34A]" : margin >= 10 ? "text-[#D97706]" : "text-[#DC2626]"}`}>{margin}%</span></div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-[#D9D6C8] flex justify-between text-[11px]"><span className="text-[#9CA3AF]">Stok</span><span className="font-mono font-bold">{u.stock} {u.name}</span></div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">Menampilkan {filtered.length} dari {products.length} produk</div>
      </Card>

      {/* Panduan Multi Satuan */}
      <Card>
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
            💡 Stok & harga tiap level dihitung otomatis dari konversi. Klik ▶ di baris produk untuk melihat detail.
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Tab: Stok & Mutasi */}
      {activeTab === "stok" && (
        <>
          {/* KPI Stok */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Aman</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{products.filter(p => p.stock > p.min_stock).length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Menipis</p><p className="font-[Oswald] text-[22px] font-semibold text-[#D97706] mt-1">{products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Habis</p><p className="font-[Oswald] text-[22px] font-semibold text-[#DC2626] mt-1">{products.filter(p => p.stock <= 0).length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Mutasi</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{movements.length}</p></div>
          </div>

          {/* Stock Overview Table */}
          <Card>
            <div className="px-3.5 py-2.5 border-b border-[#D9D6C8] flex items-center justify-between">
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Ringkasan Stok</div>
            </div>
            <div className="overflow-x-auto">
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
                        <td className="px-3 py-2"><p className="font-medium text-[#111827]">{p.name}</p><p className="text-[10px] text-[#9CA3AF]">{p.sku}</p></td>
                        <td className="px-3 py-2 text-[#4B5563]">{p.category}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{p.stock} {p.unit}</td>
                        <td className="px-3 py-2 text-right text-[#9CA3AF]">{p.min_stock}</td>
                        <td className="px-3 py-2 text-center"><Badge variant={status === "safe" ? "success" : status === "warning" ? "warning" : "danger"}>{status === "safe" ? "Aman" : status === "warning" ? "Menipis" : "Habis"}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Riwayat Mutasi */}
          <Card>
            <div className="px-3.5 py-2.5 border-b border-[#D9D6C8] flex items-center gap-2">
              <History className="w-4 h-4 text-[#072C2C]/50" />
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Riwayat Mutasi Stok</div>
            </div>
            <div className="overflow-x-auto">
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
                  {movements.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#9CA3AF] text-sm">Belum ada mutasi stok</td></tr>}
                  {movements.slice(0, 50).map((m: any) => (
                    <tr key={m.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                      <td className="px-3 py-2 text-[#4B5563]">{formatDate(m.created_at)}</td>
                      <td className="px-3 py-2 font-medium text-[#111827]">{m.product_name}</td>
                      <td className="px-3 py-2 text-center"><Badge variant={m.type === "in" ? "success" : m.type === "out" ? "danger" : "warning"}>{m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Koreksi"}</Badge></td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${m.type === "in" ? "text-[#16A34A]" : m.type === "out" ? "text-[#DC2626]" : "text-[#072C2C]"}`}>{m.type === "in" ? "+" : "-"}{m.quantity} {m.unit}</td>
                      <td className="px-3 py-2 text-[#9CA3AF] max-w-[200px] truncate">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {movements.length > 50 && <div className="px-3 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">Menampilkan 50 dari {movements.length} mutasi</div>}
          </Card>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus Produk?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.name} akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-[#4B5563] text-white font-medium text-sm rounded-xl cursor-pointer">Batal</button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl cursor-pointer"><Trash2 className="w-4 h-4" />Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
