"use client";

import { useState, useMemo } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { ClipboardCheck, CheckCircle, AlertTriangle, RefreshCw, Save, Search, Check, X } from "lucide-react";

type OpnameStatus = "pending" | "match" | "diff";
type FilterType = "all" | "pending" | "checked" | "diff";

interface OpnameRow {
  systemStock: number;
  actualStock: string;
  status: OpnameStatus;
}

export default function DemoStockPage() {
  const { products } = useDemo();

  const [opname, setOpname] = useState<Record<string, OpnameRow>>(() => {
    const rows: Record<string, OpnameRow> = {};
    products.forEach((p) => {
      rows[p.id] = { systemStock: p.stock, actualStock: "", status: "pending" };
    });
    return rows;
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = () => {
    const rows: Record<string, OpnameRow> = {};
    products.forEach((p) => {
      rows[p.id] = { systemStock: p.stock, actualStock: "", status: "pending" };
    });
    setOpname(rows);
    setExpandedId(null);
    showToast("Data opname direset", "success");
  };

  const handleMatch = (id: string) => {
    setOpname((prev) => ({
      ...prev,
      [id]: { ...prev[id], actualStock: String(prev[id].systemStock), status: "match" },
    }));
    setExpandedId(null);
  };

  const handleOpenDiff = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleActualChange = (id: string, value: string) => {
    const sys = opname[id]?.systemStock ?? 0;
    const actual = Number(value);
    const status: OpnameStatus = value === "" ? "pending" : actual === sys ? "match" : "diff";
    setOpname((prev) => ({
      ...prev,
      [id]: { ...prev[id], actualStock: value, status },
    }));
  };

  const handleConfirmDiff = (id: string) => {
    const row = opname[id];
    if (!row || row.actualStock === "") return;
    setExpandedId(null);
  };

  const handleReset = (id: string) => {
    setOpname((prev) => ({
      ...prev,
      [id]: { ...prev[id], actualStock: "", status: "pending" },
    }));
    setExpandedId(null);
  };

  const handleSave = () => {
    const checkedRows = Object.entries(opname).filter(([, r]) => r.status !== "pending");
    if (checkedRows.length === 0) {
      showToast("Belum ada produk yang dicek", "error");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      showToast(`${checkedRows.length} produk berhasil disimpan`, "success");
      setOpname((prev) => {
        const next = { ...prev };
        for (const [id, row] of checkedRows) {
          const actual = Number(row.actualStock);
          next[id] = { systemStock: actual, actualStock: String(actual), status: "match" };
        }
        return next;
      });
      setSaving(false);
    }, 600);
  };

  // Computed
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);
  const checkedCount = Object.values(opname).filter((r) => r.status !== "pending").length;
  const diffCount = Object.values(opname).filter((r) => r.status === "diff").length;
  const pendingCount = products.length - checkedCount;
  const progressPct = products.length > 0 ? Math.round((checkedCount / products.length) * 100) : 0;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const row = opname[p.id];
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCategory || p.category === filterCategory;
      const matchStatus =
        filterStatus === "all" ? true :
        filterStatus === "pending" ? row?.status === "pending" :
        filterStatus === "checked" ? (row?.status === "match" || row?.status === "diff") :
        filterStatus === "diff" ? row?.status === "diff" : true;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, opname, search, filterCategory, filterStatus]);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed z-[9999] top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white animate-in slide-in-from-top-2 ${toast.type === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Stock Opname</h1>
          <p className="text-[10px] text-[#9CA3AF]">Hitung stok fisik, bandingkan dengan sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-2 border border-[#D9D6C8] rounded-lg text-[#9CA3AF] hover:text-[#072C2C] hover:border-[#072C2C]/30 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || checkedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Menyimpan..." : `Simpan (${checkedCount})`}
          </button>
        </div>
      </div>

      {/* Sticky Progress */}
      <div className="sticky top-0 z-10 bg-[#EDEADE] -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-[#D9D6C8] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#072C2C]">{checkedCount} / {products.length} Produk Selesai</span>
            <span className="text-[10px] text-[#9CA3AF]">{progressPct}%</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />{pendingCount} belum</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]" />{checkedCount - diffCount} cocok</span>
            {diffCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626]" />{diffCount} selisih</span>}
          </div>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden border border-[#D9D6C8]">
          <div className="h-full bg-[#16A34A] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm cursor-pointer focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2">
        {([
          { id: "all", label: "Semua", count: products.length },
          { id: "pending", label: "Belum Dicek", count: pendingCount },
          { id: "checked", label: "Sudah Dicek", count: checkedCount },
          { id: "diff", label: "Ada Selisih", count: diffCount },
        ] as { id: FilterType; label: string; count: number }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
              filterStatus === f.id
                ? "bg-[#FF5F03] text-white"
                : "bg-white border border-[#D9D6C8] text-[#4B5563] hover:border-[#FF5F03]/40"
            }`}
          >
            {f.label}
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              filterStatus === f.id ? "bg-white/20 text-white" : "bg-[#EDEADE] text-[#9CA3AF]"
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Product Cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#9CA3AF]">Tidak ada produk ditemukan</div>
        )}
        {filtered.map((product) => {
          const row = opname[product.id];
          if (!row) return null;
          const diff = row.actualStock !== "" ? Number(row.actualStock) - row.systemStock : null;
          const isExpanded = expandedId === product.id;

          return (
            <div
              key={product.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                row.status === "match" ? "border-[#16A34A]/30 bg-[#F0FDF4]/30" :
                row.status === "diff" ? "border-[#DC2626]/30 bg-[#FEF2F2]/30" :
                "border-[#E5E3DC]"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Status dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  row.status === "match" ? "bg-[#16A34A]" :
                  row.status === "diff" ? "bg-[#DC2626]" :
                  "bg-[#D9D6C8]"
                }`} />

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#072C2C] truncate">{product.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{product.category} · Stok sistem: <strong className="text-[#072C2C]">{product.stock} {product.unit}</strong></p>
                </div>

                {/* Action buttons or result */}
                {row.status === "pending" ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleMatch(product.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#16A34A] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#15803D] transition-all hover:scale-[1.02] active:scale-[0.97]"
                    >
                      <Check className="w-3.5 h-3.5" />Cocok
                    </button>
                    <button
                      onClick={() => handleOpenDiff(product.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#FF5F03] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#e05500] transition-all hover:scale-[1.02] active:scale-[0.97]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />Selisih
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {row.status === "match" && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                        <CheckCircle className="w-4 h-4" />Cocok
                      </span>
                    )}
                    {row.status === "diff" && diff !== null && (
                      <span className={`text-sm font-bold font-mono ${diff > 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                    <button
                      onClick={() => handleReset(product.id)}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer rounded-md hover:bg-red-50 transition-colors"
                      title="Reset"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded diff input */}
              {isExpanded && row.status === "pending" && (
                <div className="px-4 pb-4 pt-1 border-t border-[#F0EEE8]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1 block">Stok Aktual ({product.unit})</label>
                      <input
                        type="number"
                        min="0"
                        value={row.actualStock}
                        onChange={(e) => handleActualChange(product.id, e.target.value)}
                        autoFocus
                        placeholder={String(product.stock)}
                        className="w-full px-4 py-3 text-lg font-bold font-mono text-[#072C2C] border-2 border-[#FF5F03]/30 rounded-xl focus:outline-none focus:border-[#FF5F03] focus:ring-2 focus:ring-[#FF5F03]/20 text-center"
                      />
                    </div>
                    {row.actualStock !== "" && (
                      <div className="text-center flex-shrink-0">
                        <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold">Selisih</p>
                        <p className={`text-lg font-black font-mono ${
                          Number(row.actualStock) - product.stock === 0 ? "text-[#16A34A]" :
                          Number(row.actualStock) - product.stock > 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                        }`}>
                          {Number(row.actualStock) - product.stock >= 0 ? "+" : ""}{Number(row.actualStock) - product.stock}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfirmDiff(product.id)}
                    disabled={row.actualStock === ""}
                    className="mt-3 w-full py-2.5 bg-[#FF5F03] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-[#e05500] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Konfirmasi
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom save bar (mobile) */}
      {checkedCount > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#16A34A] text-white text-sm font-bold rounded-xl shadow-xl cursor-pointer disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Menyimpan..." : `Simpan Opname (${checkedCount} produk)`}
          </button>
        </div>
      )}
    </div>
  );
}
