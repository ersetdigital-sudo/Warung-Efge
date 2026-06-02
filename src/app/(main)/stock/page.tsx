"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, CheckCircle, AlertTriangle, RefreshCw, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { addStockMovement } from "@/lib/db";

interface ProductUnit {
  id: string;
  level: number;
  name: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  selling_price: number;
  product_units: ProductUnit[];
}

interface OpnameRow {
  productId: string;
  systemStock: number;
  actualStock: string; // string so input can be empty
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [opname, setOpname] = useState<Record<string, OpnameRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, product_units(*)")
      .order("name");
    if (error) {
      console.error("loadProducts error:", error);
      showToast("Gagal memuat produk", "error");
      setLoading(false);
      return;
    }
    const prods: Product[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      category: p.category || "Lain-lain",
      stock: Number(p.stock) || 0,
      unit: p.unit || "Pcs",
      selling_price: Number(p.selling_price) || 0,
      product_units: (p.product_units || []).map((u: any) => ({
        id: u.id,
        level: u.level,
        name: u.name,
        stock: Number(u.stock) || 0,
      })),
    }));
    setProducts(prods);
    // Initialise opname rows with empty actual stock
    const rows: Record<string, OpnameRow> = {};
    prods.forEach((p) => {
      rows[p.id] = { productId: p.id, systemStock: p.stock, actualStock: "" };
    });
    setOpname(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleActualChange = (productId: string, value: string) => {
    setOpname((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], actualStock: value },
    }));
  };

  // Only rows where actual stock has been entered
  const dirtyRows = Object.values(opname).filter((r) => r.actualStock !== "");

  const getDiff = (row: OpnameRow): number | null => {
    if (row.actualStock === "") return null;
    return Number(row.actualStock) - row.systemStock;
  };

  const handleSave = async () => {
    if (dirtyRows.length === 0) {
      showToast("Belum ada stok yang diinput", "error");
      return;
    }
    setSaving(true);
    try {
      for (const row of dirtyRows) {
        const diff = getDiff(row);
        if (diff === null) continue;
        const actual = Number(row.actualStock);
        // Update product stock
        await supabase
          .from("products")
          .update({ stock: actual, updated_at: new Date().toISOString() })
          .eq("id", row.productId);
        // Insert stock movement
        const sign = diff >= 0 ? `+${diff}` : `${diff}`;
        await addStockMovement({
          product_id: row.productId,
          type: "opname",
          quantity: diff,
          notes: `Stock opname: selisih ${sign}`,
          created_at: new Date().toISOString(),
        });
      }
      showToast(`${dirtyRows.length} produk berhasil disimpan`, "success");
      // Reload fresh data
      loadProducts();
    } catch (err) {
      console.error("handleSave error:", err);
      showToast("Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  const filtered = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Summary KPIs
  const enteredCount = dirtyRows.length;
  const discrepancies = dirtyRows.filter((r) => getDiff(r) !== 0).length;
  const totalDiff = dirtyRows.reduce((sum, r) => sum + (getDiff(r) ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF5F03] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#072C2C]/50">Memuat data produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed z-[9999] top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white animate-in slide-in-from-top-2 ${
            toast.type === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#072C2C] flex items-center justify-center shadow-lg">
            <ClipboardList className="w-6 h-6 text-[#EDEADE]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide leading-tight">
              Stock Opname
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              Input stok aktual dan bandingkan dengan stok sistem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#072C2C]/60 hover:text-[#072C2C] border border-[#D9D6C8] rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving || enteredCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Simpan Opname
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Produk",
            value: products.length,
            sub: "dalam sistem",
            color: "border-l-[#072C2C]",
          },
          {
            label: "Sudah Diinput",
            value: enteredCount,
            sub: `dari ${products.length} produk`,
            color: "border-l-[#FF5F03]",
          },
          {
            label: "Ada Selisih",
            value: discrepancies,
            sub: "produk perlu koreksi",
            color: discrepancies > 0 ? "border-l-[#DC2626]" : "border-l-[#16A34A]",
          },
          {
            label: "Total Selisih",
            value: totalDiff >= 0 ? `+${totalDiff}` : `${totalDiff}`,
            sub: "unit (aktual vs sistem)",
            color: totalDiff === 0 ? "border-l-[#16A34A]" : "border-l-[#D97706]",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] ${kpi.color}`}
          >
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className="text-xl font-bold text-[#072C2C] font-[Oswald] mt-1">{kpi.value}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama produk / SKU..."
          className="flex-1 px-4 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9D6C8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EDEADE]">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Produk
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide hidden md:table-cell">
                  Kategori
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Stok Sistem
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Stok Aktual
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Selisih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE8]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-[#9CA3AF]">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const row = opname[product.id];
                  const diff = row ? getDiff(row) : null;
                  const hasInput = row?.actualStock !== "";

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-[#FAFAF8] transition-colors ${
                        hasInput && diff !== 0 ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Product info */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#072C2C] text-sm leading-tight">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                            {product.sku}
                          </p>
                        )}
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-[#072C2C]/60">{product.category}</span>
                      </td>
                      {/* System stock */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-[#072C2C]">
                          {product.stock}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF] ml-1">{product.unit}</span>
                      </td>
                      {/* Actual input */}
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row?.actualStock ?? ""}
                          onChange={(e) => handleActualChange(product.id, e.target.value)}
                          placeholder="—"
                          className="w-20 px-2 py-1.5 border border-[#D9D6C8] rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03] transition-all"
                        />
                      </td>
                      {/* Diff */}
                      <td className="px-4 py-3 text-right">
                        {diff === null ? (
                          <span className="text-[#9CA3AF] text-xs">—</span>
                        ) : diff === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sesuai
                          </span>
                        ) : (
                          <span
                            className={`text-sm font-bold ${
                              diff > 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {enteredCount > 0 && (
          <div className="px-4 py-3 bg-[#EDEADE] border-t border-[#D9D6C8] flex items-center justify-between">
            <p className="text-xs text-[#072C2C]/60">
              {enteredCount} dari {products.length} produk telah diinput
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Opname ({enteredCount})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-[#FFF8F5] border border-[#FFD9C5] rounded-xl p-4 text-xs text-[#CC4400] space-y-1">
        <p className="font-bold text-[#FF5F03] mb-1.5">📋 Cara penggunaan Stock Opname</p>
        <p>1. Input jumlah stok aktual yang ada di toko pada kolom "Stok Aktual"</p>
        <p>2. Kolom "Selisih" akan otomatis menampilkan perbedaan dengan stok sistem</p>
        <p>3. Klik <strong>Simpan Opname</strong> untuk memperbarui stok dan mencatat riwayat penyesuaian</p>
      </div>
    </div>
  );
}
