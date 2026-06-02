"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { TrendingUp, Download, Plus, Trash2, Wallet, Receipt, Calculator, AlertTriangle, Package, Users, ShoppingCart, BarChart3, DollarSign, Boxes } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProducts, getTransactions, getExpenses, addExpense, updateExpense, deleteExpense } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TabType = "penjualan" | "produk" | "kasir" | "stok" | "keuangan";
type DateFilter = "today" | "7days" | "30days" | "month" | "3months" | "6months" | "1year" | "custom";

export default function ReportsPage() {
  const [tab, setTab] = useState<TabType>("penjualan");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddExp, setShowAddExp] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    getTransactions().then(setTransactions);
    getProducts().then(setProducts);
    getExpenses(currentMonth).then(setExpenses);
  }, []);

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      if (dateFilter === "today") {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "7days") {
        const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "30days") {
        const start = new Date(now); start.setDate(now.getDate() - 29); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= start;
      } else if (dateFilter === "3months") {
        const start = new Date(now); start.setMonth(now.getMonth() - 3); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "6months") {
        const start = new Date(now); start.setMonth(now.getMonth() - 6); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "1year") {
        const start = new Date(now); start.setFullYear(now.getFullYear() - 1); start.setHours(0, 0, 0, 0);
        return d >= start;
      } else if (dateFilter === "custom") {
        const from = customFrom ? new Date(customFrom) : new Date(0);
        const to = customTo ? new Date(customTo + "T23:59:59") : new Date();
        return d >= from && d <= to;
      }
      return true;
    });
  }, [transactions, dateFilter, customFrom, customTo]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    if (showDateDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDateDropdown]);

  const dateFilterLabel = (): string => {
    if (dateFilter === "today") return "Hari Ini";
    if (dateFilter === "7days") return "7 Hari Terakhir";
    if (dateFilter === "30days") return "30 Hari Terakhir";
    if (dateFilter === "month") return "Bulan Ini";
    if (dateFilter === "3months") return "3 Bulan Terakhir";
    if (dateFilter === "6months") return "6 Bulan Terakhir";
    if (dateFilter === "1year") return "1 Tahun Terakhir";
    if (dateFilter === "custom" && customFrom && customTo) {
      const f = new Date(customFrom).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      const t = new Date(customTo).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${f} — ${t}`;
    }
    return "Pilih Periode";
  };

  // === PENJUALAN DATA ===
  const totalSales = filteredTransactions.reduce((s, t) => s + (t.total || 0), 0);
  const totalTrx = filteredTransactions.length;
  const avgTrx = totalTrx > 0 ? Math.round(totalSales / totalTrx) : 0;

  // Daily chart data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    filteredTransactions.forEach(t => {
      const d = new Date(t.created_at);
      const day = days[d.getDay()];
      map[day] = (map[day] || 0) + (t.total || 0);
    });
    return days.slice(1).concat(days[0]).map(d => ({ name: d, total: Math.round((map[d] || 0) / 1000) }));
  }, [filteredTransactions]);

  // Payment method breakdown
  const pmData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => { const m = t.payment_method || "cash"; map[m] = (map[m] || 0) + 1; });
    const total = filteredTransactions.length || 1;
    return [
      { name: "Tunai", value: Math.round(((map.cash || 0) / total) * 100), color: "#FF5F03" },
      { name: "QRIS", value: Math.round(((map.qris || 0) / total) * 100), color: "#072C2C" },
      { name: "Transfer", value: Math.round(((map.transfer || 0) / total) * 100), color: "#D97706" },
      { name: "EDC", value: Math.round(((map.edc || 0) / total) * 100), color: "#16A34A" },
    ].filter(p => p.value > 0);
  }, [filteredTransactions]);

  // === PRODUK DATA ===
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sold: number; rev: number }> = {};
    filteredTransactions.forEach(t => {
      (t.transaction_items || []).forEach((i: any) => {
        const k = i.product_name || "?";
        if (!map[k]) map[k] = { name: k, sold: 0, rev: 0 };
        map[k].sold += i.quantity || 0;
        map[k].rev += i.subtotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.sold - a.sold).slice(0, 10);
  }, [filteredTransactions]);

  // === KASIR DATA ===
  const kasirData = useMemo(() => {
    const map: Record<string, { name: string; trx: number; total: number }> = {};
    filteredTransactions.forEach(t => {
      const k = t.cashier || "Unknown";
      if (!map[k]) map[k] = { name: k, trx: 0, total: 0 };
      map[k].trx++;
      map[k].total += t.total || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  // === STOK DATA ===
  const stokAman = products.filter(p => p.stock > p.min_stock).length;
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length;
  const stokHabis = products.filter(p => p.stock <= 0).length;
  const expiredSoon = products.filter(p => p.expiry_date && Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000) <= 30).length;

  const tabs: { id: TabType; label: string }[] = [
    { id: "penjualan", label: "Penjualan" },
    { id: "produk", label: "Produk" },
    { id: "kasir", label: "Kasir" },
    { id: "stok", label: "Stok" },
    { id: "keuangan", label: "Keuangan" },
  ];

  return (
    <div className="space-y-4">
      {/* Header + Date Filter Dropdown */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Laporan</h1>
          <p className="text-[10px] text-[#9CA3AF]">Analisis penjualan, produk, kasir & stok</p>
        </div>
        {/* Date Filter Button + Dropdown */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            onClick={() => setShowDateDropdown(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D9D6C8] rounded-lg shadow-sm hover:border-[#FF5F03]/50 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#FF5F03]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[11px] font-semibold text-[#072C2C] whitespace-nowrap">{dateFilterLabel()}</span>
            <svg className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${showDateDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {showDateDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E5E3DC] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Presets */}
              <div className="py-1.5">
                {([
                  { id: "today", label: "Hari Ini" },
                  { id: "7days", label: "7 Hari Terakhir" },
                  { id: "30days", label: "30 Hari Terakhir" },
                  { id: "month", label: "Bulan Ini" },
                  { id: "3months", label: "3 Bulan Terakhir" },
                  { id: "6months", label: "6 Bulan Terakhir" },
                  { id: "1year", label: "1 Tahun Terakhir" },
                ] as { id: DateFilter; label: string }[]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setDateFilter(f.id); setShowDateDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[12px] font-medium cursor-pointer transition-colors ${dateFilter === f.id ? "bg-[#FF5F03]/10 text-[#FF5F03] font-bold border-l-[3px] border-l-[#FF5F03]" : "text-[#072C2C] hover:bg-[#FAFAF8]"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Divider + Custom Range */}
              <div className="border-t border-[#F0EEE8] px-4 py-3 space-y-2.5">
                <p className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Custom Range</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="flex-1 px-2.5 py-2 border border-[#E5E3DC] rounded-lg text-[11px] text-[#072C2C] focus:outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20"
                  />
                  <span className="text-[10px] text-[#9CA3AF]">—</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="flex-1 px-2.5 py-2 border border-[#E5E3DC] rounded-lg text-[11px] text-[#072C2C] focus:outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20"
                  />
                </div>
                <button
                  onClick={() => { if (customFrom && customTo) { setDateFilter("custom"); setShowDateDropdown(false); } }}
                  disabled={!customFrom || !customTo}
                  className="w-full py-2 bg-[#FF5F03] text-white text-[11px] font-bold rounded-lg hover:bg-[#e05500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#D9D6C8] p-1 rounded-md w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-sm text-[11px] font-medium cursor-pointer transition-all ${tab === t.id ? "bg-[#072C2C] text-white font-semibold" : "text-[#4B5563] hover:text-[#072C2C]"}`}>{t.label}</button>
        ))}
      </div>

      {/* ═══ TAB PENJUALAN ═══ */}
      {tab === "penjualan" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Penjualan</p><Wallet className="w-4 h-4 text-[#FF5F03]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{formatCurrency(totalSales)}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Transaksi</p><Receipt className="w-4 h-4 text-[#072C2C]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{totalTrx}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Rata-rata / Trx</p><Calculator className="w-4 h-4 text-[#16A34A]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{formatCurrency(avgTrx)}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Metode Terpopuler</p><ShoppingCart className="w-4 h-4 text-[#D97706]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{pmData[0]?.name || "–"}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            {/* Chart */}
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Penjualan Per Hari (ribuan)</p></div>
              <div className="p-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,44,44,0.05)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} tickFormatter={v => `${v}rb`} />
                    <Tooltip formatter={(v) => [`Rp ${v}rb`, "Penjualan"]} contentStyle={{ backgroundColor: "#072C2C", border: "none", borderRadius: "5px", fontSize: "11px" }} labelStyle={{ color: "rgba(255,255,255,.5)" }} itemStyle={{ color: "#fff", fontWeight: 700 }} />
                    <Bar dataKey="total" fill="#FF5F03" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            {/* Payment methods */}
            {/* Distribusi Per Jam */}
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Distribusi Per Jam</p><p className="text-[9px] text-[#9CA3AF]">Rata-rata transaksi</p></div>
              <div className="p-4 h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const hourMap: Record<number, number> = {};
                    filteredTransactions.forEach(t => { const h = new Date(t.created_at).getHours(); hourMap[h] = (hourMap[h] || 0) + 1; });
                    return Array.from({ length: 16 }, (_, i) => i + 6).map(h => ({ hour: `${String(h).padStart(2, "0")}`, trx: hourMap[h] || 0 }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,44,44,0.05)" vertical={false} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={9} tick={{ fill: "#9CA3AF" }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{ fill: "#9CA3AF" }} hide />
                    <Tooltip formatter={(v: any) => [`${v} transaksi`, ""]} contentStyle={{ backgroundColor: "#072C2C", border: "none", borderRadius: "5px", fontSize: "11px" }} labelStyle={{ color: "rgba(255,255,255,.5)" }} itemStyle={{ color: "#fff", fontWeight: 700 }} />
                    <Bar dataKey="trx" radius={[3, 3, 0, 0]}>
                      {Array.from({ length: 16 }, (_, i) => i + 6).map((h, i) => {
                        const hourMap: Record<number, number> = {};
                        filteredTransactions.forEach(t => { const hr = new Date(t.created_at).getHours(); hourMap[hr] = (hourMap[hr] || 0) + 1; });
                        const val = hourMap[h] || 0;
                        const maxVal = Math.max(...Object.values(hourMap), 1);
                        return <Cell key={i} fill={val >= maxVal * 0.7 ? "#FF5F03" : val >= maxVal * 0.4 ? "rgba(255,95,3,0.4)" : "rgba(7,44,44,0.1)"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Time period summary */}
              <div className="px-4 pb-3 space-y-1.5">
                {(() => {
                  const pagi = filteredTransactions.filter(t => { const h = new Date(t.created_at).getHours(); return h >= 6 && h < 12; }).length;
                  const siang = filteredTransactions.filter(t => { const h = new Date(t.created_at).getHours(); return h >= 12 && h < 17; }).length;
                  const sore = filteredTransactions.filter(t => { const h = new Date(t.created_at).getHours(); return h >= 17 && h < 22; }).length;
                  const total = Math.max(pagi + siang + sore, 1);
                  return [
                    { label: "Pagi 06–12", value: pagi, pct: Math.round((pagi / total) * 100), color: "#FF5F03" },
                    { label: "Siang 12–17", value: siang, pct: Math.round((siang / total) * 100), color: "#072C2C" },
                    { label: "Sore 17–22", value: sore, pct: Math.round((sore / total) * 100), color: "#D97706" },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-2 text-[11px]">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-[#4B5563] flex-1">{p.label}</span>
                      <div className="flex-[2] h-1 rounded-full bg-[#EDEADE] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} /></div>
                      <span className="font-mono font-bold text-[11px] min-w-[24px] text-right">{p.pct}%</span>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB PRODUK ═══ */}
      {tab === "produk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total SKU</p><Package className="w-4 h-4 text-[#FF5F03]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{products.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Unit Terjual</p><TrendingUp className="w-4 h-4 text-[#072C2C]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{topProducts.reduce((s, p) => s + p.sold, 0).toLocaleString("id-ID")}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Produk Terlaris</p><BarChart3 className="w-4 h-4 text-[#16A34A]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{topProducts[0]?.name || "–"}</p><p className="text-[9px] text-[#9CA3AF]">{topProducts[0]?.sold || 0} unit terjual</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Habis</p><AlertTriangle className="w-4 h-4 text-[#DC2626]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#DC2626]">{stokHabis} produk</p></div>
          </div>
          <Card>
            <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Performa Produk</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-[#D9D6C8]">
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">#</th>
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Terjual</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Pendapatan</th>
                </tr></thead>
                <tbody>
                  {topProducts.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[#9CA3AF]">Belum ada data</td></tr>}
                  {topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                      <td className="px-3 py-2 font-mono text-[#9CA3AF]">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{p.sold}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[#16A34A]">{formatCurrency(p.rev)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Produk Mendekati Expired */}
          {(() => {
            const today = new Date();
            const expiring = products.filter(p => p.expiry_date).map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) })).filter(p => p.daysLeft <= 30).sort((a, b) => a.daysLeft - b.daysLeft);
            if (expiring.length === 0) return null;
            return (
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8]"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#D97706]" /><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Produk Mendekati Expired</p></div><p className="text-[9px] text-[#9CA3AF] mt-0.5">Produk yang expired dalam 30 hari ke depan</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead><tr className="border-b border-[#D9D6C8]">
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Tanggal Expired</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Sisa Hari</th>
                      <th className="text-center px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                    </tr></thead>
                    <tbody>
                      {expiring.map(p => (
                        <tr key={p.id} className={`border-b border-[#D9D6C8] ${p.daysLeft <= 0 ? "bg-[#FEF2F2]/50" : p.daysLeft <= 7 ? "bg-[#FFFBEB]/50" : ""}`}>
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-[#4B5563]">{formatDate(p.expiry_date)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{p.daysLeft <= 0 ? "EXPIRED" : `${p.daysLeft} hari`}</td>
                          <td className="px-3 py-2 text-center"><Badge variant={p.daysLeft <= 0 ? "danger" : p.daysLeft <= 7 ? "warning" : "info"}>{p.daysLeft <= 0 ? "Expired" : p.daysLeft <= 7 ? "Segera" : "Mendekati"}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ═══ TAB KASIR ═══ */}
      {tab === "kasir" && (
        <div className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Kasir Aktif</p><Users className="w-4 h-4 text-[#FF5F03]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{kasirData.length} kasir</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Transaksi Terbanyak</p><Receipt className="w-4 h-4 text-[#072C2C]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{kasirData[0]?.name || "–"}</p><p className="text-[9px] text-[#9CA3AF]">{kasirData[0]?.trx || 0} transaksi</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Pendapatan Tertinggi</p><Wallet className="w-4 h-4 text-[#16A34A]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{formatCurrency(kasirData[0]?.total || 0)}</p><p className="text-[9px] text-[#9CA3AF]">{kasirData[0]?.name || "–"}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Omzet</p><DollarSign className="w-4 h-4 text-[#D97706]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{formatCurrency(kasirData.reduce((s, k) => s + k.total, 0))}</p></div>
          </div>

          {/* Chart + Ringkasan Shift */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
            {/* Bar chart per kasir */}
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Perbandingan Kinerja Kasir</p><p className="text-[9px] text-[#9CA3AF]">Total penjualan per kasir</p></div>
              <div className="p-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kasirData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,44,44,0.05)" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} tickFormatter={v => `${Math.round(v/1000)}rb`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#4B5563" }} width={80} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), "Total"]} contentStyle={{ backgroundColor: "#072C2C", border: "none", borderRadius: "5px", fontSize: "11px" }} labelStyle={{ color: "rgba(255,255,255,.5)" }} itemStyle={{ color: "#fff", fontWeight: 700 }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {kasirData.map((_, i) => <Cell key={i} fill={["#FF5F03", "#072C2C", "#16A34A", "#D97706", "#8B5CF6"][i % 5]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Ringkasan per kasir */}
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Ringkasan Kasir</p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-[#D9D6C8]">
                    <th className="text-left px-3 py-1.5 bg-[#EDEADE] text-[9px] font-semibold text-[#9CA3AF] uppercase">Kasir</th>
                    <th className="text-right px-2 py-1.5 bg-[#EDEADE] text-[9px] font-semibold text-[#9CA3AF] uppercase">Trx</th>
                    <th className="text-right px-2 py-1.5 bg-[#EDEADE] text-[9px] font-semibold text-[#9CA3AF] uppercase">Total</th>
                  </tr></thead>
                  <tbody>
                    {kasirData.map((k, i) => (
                      <tr key={k.name} className="border-b border-[#D9D6C8]">
                        <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: ["#FF5F03", "#072C2C", "#16A34A", "#D97706"][i % 4] }}>{k.name.split(" ").map(w => w[0]).join("")}</div><span className="font-medium text-[11px]">{k.name}</span></div></td>
                        <td className="px-2 py-2 text-right font-mono font-bold">{k.trx}</td>
                        <td className="px-2 py-2 text-right font-mono font-bold text-[#16A34A] text-[10px]">{formatCurrency(k.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Log Transaksi Per Kasir */}
          <Card>
            <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Log Transaksi Per Kasir</p><p className="text-[9px] text-[#9CA3AF]">Semua aktivitas</p></div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-[#D9D6C8]">
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">#</th>
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kasir</th>
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Tanggal & Waktu</th>
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Metode</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Total</th>
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                </tr></thead>
                <tbody>
                  {filteredTransactions.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#9CA3AF]">Belum ada data</td></tr>}
                  {filteredTransactions.slice(0, 12).map((t, i) => {
                    const pm = t.payment_method || "cash";
                    const pmConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
                      cash: { label: "Tunai", bg: "bg-green-50", text: "text-green-700", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" },
                      qris: { label: "QRIS", bg: "bg-blue-50", text: "text-blue-700", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h3v3h-3v-3zm-3-3h3v3h-3v-3zm3 0h3v3h-3v-3z" },
                      transfer: { label: "Transfer", bg: "bg-purple-50", text: "text-purple-700", icon: "M3 10h18M3 6h18M3 14h18M3 18h18" },
                      edc: { label: "EDC", bg: "bg-amber-50", text: "text-amber-700", icon: "M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm4 4h12m-12 4h8" },
                    };
                    const cfg = pmConfig[pm] || pmConfig.cash;
                    return (
                      <tr key={t.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                        <td className="px-3 py-2 font-mono text-[#9CA3AF] text-[10px]">{t.transaction_number}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-[#FF5F03] to-[#e05500] rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                              {(t.cashier || "?").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-medium text-[#072C2C]">{t.cashier || "–"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-[#4B5563]">{t.created_at ? `${formatDate(t.created_at)} ${new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "–"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cfg.icon} /></svg>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[#072C2C]">{formatCurrency(t.total)}</td>
                        <td className="px-3 py-2"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-600"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Selesai</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#F0EEE8]">
              {filteredTransactions.length === 0 && (
                <p className="text-center py-8 text-[#9CA3AF] text-sm">Belum ada data</p>
              )}
              {filteredTransactions.slice(0, 12).map((t) => {
                const pmLabel = t.payment_method === "cash" ? "💵 Tunai" : t.payment_method === "qris" ? "📱 QRIS" : t.payment_method === "transfer" ? "🏦 Transfer" : "💳 EDC";
                return (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-[#FF5F03] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {(t.cashier || "?")[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#072C2C] truncate">{t.cashier || "–"}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{t.created_at ? `${formatDate(t.created_at)} · ${new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "–"}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] font-bold text-[#072C2C] font-mono">{formatCurrency(t.total)}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{pmLabel}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">Menampilkan {Math.min(12, filteredTransactions.length)} dari {filteredTransactions.length} log</div>
          </Card>
        </div>
      )}

      {/* ═══ TAB STOK ═══ */}
      {tab === "stok" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total SKU</p><Boxes className="w-4 h-4 text-[#072C2C]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{products.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Aman</p><Package className="w-4 h-4 text-[#16A34A]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#16A34A]">{stokAman}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Menipis / Habis</p><AlertTriangle className="w-4 h-4 text-[#D97706]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#D97706]">{stokMenipis + stokHabis}</p><p className="text-[9px] text-[#9CA3AF]">{stokMenipis} menipis · {stokHabis} habis</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#8B5CF6]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Mau Kadaluarsa</p><AlertTriangle className="w-4 h-4 text-[#8B5CF6]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#8B5CF6]">{expiredSoon}</p><p className="text-[9px] text-[#9CA3AF]">dalam 30 hari</p></div>
          </div>

          <div className="space-y-3">
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Status Stok Semua Produk</p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b border-[#D9D6C8]">
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                    <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kategori</th>
                    <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Stok</th>
                    <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Min</th>
                    <th className="text-center px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                  </tr></thead>
                  <tbody>
                    {products.sort((a, b) => (a.stock / (a.min_stock || 1)) - (b.stock / (b.min_stock || 1))).map(p => {
                      const s = p.stock <= 0 ? "habis" : p.stock <= p.min_stock ? "menipis" : "aman";
                      return (
                        <tr key={p.id} className={`border-b border-[#D9D6C8] hover:bg-[#FAFAF8] ${s === "habis" ? "bg-[#FEF2F2]/30" : s === "menipis" ? "bg-[#FFFBEB]/30" : ""}`}>
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-[#9CA3AF]">{p.category}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{p.stock} {p.unit}</td>
                          <td className="px-3 py-2 text-right text-[#9CA3AF]">{p.min_stock}</td>
                          <td className="px-3 py-2 text-center"><Badge variant={s === "habis" ? "danger" : s === "menipis" ? "warning" : "success"}>{s === "habis" ? "Habis" : s === "menipis" ? "Menipis" : "Aman"}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Tabel Kadaluarsa di tab Stok */}
          {(() => {
            const now = Date.now();
            const expiring = products
              .filter(p => p.expiry_date)
              .map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.expiry_date).getTime() - now) / 86400000) }))
              .filter(p => p.daysLeft <= 60)
              .sort((a, b) => a.daysLeft - b.daysLeft);
            if (expiring.length === 0) return null;
            return (
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Produk Mendekati Kadaluarsa</p>
                    <p className="text-[9px] text-[#9CA3AF]">Dalam 60 hari ke depan</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead><tr className="border-b border-[#D9D6C8]">
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Produk</th>
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kategori</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Stok</th>
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Tgl Exp</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Sisa Hari</th>
                      <th className="text-center px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                    </tr></thead>
                    <tbody>
                      {expiring.map(p => (
                        <tr key={p.id} className={`border-b border-[#D9D6C8] hover:bg-[#FAFAF8] ${p.daysLeft <= 0 ? "bg-[#FEF2F2]/40" : p.daysLeft <= 7 ? "bg-[#FFFBEB]/40" : ""}`}>
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-[#9CA3AF]">{p.category}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{p.stock} {p.unit}</td>
                          <td className="px-3 py-2 text-[#4B5563]">{formatDate(p.expiry_date)}</td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${p.daysLeft <= 0 ? "text-[#DC2626]" : p.daysLeft <= 7 ? "text-amber-600" : "text-[#D97706]"}`}>
                            {p.daysLeft <= 0 ? "EXPIRED" : `${p.daysLeft}h`}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={p.daysLeft <= 0 ? "danger" : p.daysLeft <= 7 ? "warning" : "info"}>
                              {p.daysLeft <= 0 ? "Expired" : p.daysLeft <= 7 ? "Segera" : "Mendekati"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ═══ TAB KEUANGAN ═══ */}
      {tab === "keuangan" && (() => {
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        // HPP = total harga beli dari semua item terjual
        const totalHPP = filteredTransactions.reduce((s, t) => {
          return s + (t.transaction_items || []).reduce((si: number, item: any) => {
            const prod = products.find(p => p.id === item.product_id);
            return si + ((prod?.cost_price || 0) * (item.quantity || 0));
          }, 0);
        }, 0);
        const totalPengeluaran = totalExpenses + totalHPP;
        const labaBersih = totalSales - totalPengeluaran;
        const handleAddExp = async () => {
          if (!newExpName || !newExpAmount) return;
          const expMonth = newExpDate ? newExpDate.substring(0, 7) : currentMonth;
          await addExpense({ name: newExpName, amount: Number(newExpAmount), month: expMonth, date: newExpDate });
          setNewExpName(""); setNewExpAmount(""); setNewExpDate(new Date().toISOString().split("T")[0]); setShowAddExp(false);
          getExpenses(currentMonth).then(setExpenses);
        };
        const handleDeleteExp = async (id: string) => {
          if (!confirm("Hapus biaya ini?")) return;
          await deleteExpense(id);
          getExpenses(currentMonth).then(setExpenses);
        };
        const handleUpdateExp = async (id: string, newAmount: string) => {
          await updateExpense(id, Number(newAmount) || 0);
          getExpenses(currentMonth).then(setExpenses);
        };
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Pendapatan</p><TrendingUp className="w-4 h-4 text-[#16A34A]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{formatCurrency(totalSales)}</p></div>
              <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Pengeluaran</p><DollarSign className="w-4 h-4 text-[#DC2626]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#DC2626]">{formatCurrency(totalPengeluaran)}</p><p className="text-[9px] text-[#9CA3AF]">HPP + Operasional</p></div>
              <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Laba Bersih</p><Wallet className="w-4 h-4 text-[#FF5F03]" /></div><p className={`font-[Oswald] text-[20px] font-semibold ${labaBersih >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatCurrency(labaBersih)}</p></div>
              <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Margin</p><Calculator className="w-4 h-4 text-[#072C2C]" /></div><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C]">{totalSales > 0 ? Math.round((labaBersih / totalSales) * 100) : 0}%</p></div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
              {/* Pendapatan vs Pengeluaran - Area Chart */}
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Pendapatan vs Pengeluaran</p><p className="text-[9px] text-[#9CA3AF]">Perbandingan harian</p></div>
                <div className="p-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
                      const dayMap: Record<string, number> = {};
                      filteredTransactions.forEach(t => { const d = new Date(t.created_at); dayMap[days[d.getDay() === 0 ? 6 : d.getDay() - 1]] = (dayMap[days[d.getDay() === 0 ? 6 : d.getDay() - 1]] || 0) + (t.total || 0); });
                      const dailyExp = totalPengeluaran > 0 ? Math.round(totalPengeluaran / 30) : 0;
                      return days.map(d => ({ name: d, pendapatan: Math.round((dayMap[d] || 0) / 1000), pengeluaran: Math.round(dailyExp / 1000) }));
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,44,44,0.05)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} tickFormatter={v => `${v}rb`} />
                      <Tooltip formatter={(v: any, name: any) => [`Rp ${v}rb`, name === "pendapatan" ? "Pendapatan" : "Pengeluaran"]} contentStyle={{ backgroundColor: "#072C2C", border: "none", borderRadius: "5px", fontSize: "11px" }} labelStyle={{ color: "rgba(255,255,255,.5)" }} itemStyle={{ color: "#fff", fontWeight: 700 }} />
                      <Bar dataKey="pendapatan" fill="#16A34A" radius={[3, 3, 0, 0]} name="pendapatan" />
                      <Bar dataKey="pengeluaran" fill="#DC2626" radius={[3, 3, 0, 0]} name="pengeluaran" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              {/* Komposisi Biaya donut */}
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Komposisi Biaya</p><p className="text-[9px] text-[#9CA3AF]">Breakdown pengeluaran</p></div>
                <div className="p-4 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={[{ name: "HPP Barang", value: totalHPP }, ...expenses.map(e => ({ name: e.name, value: e.amount }))]} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={3} stroke="#fff">{[totalHPP, ...expenses.map(e => e.amount)].map((_, i) => <Cell key={i} fill={["#072C2C", "#FF5F03", "#D97706", "#16A34A", "#8B5CF6", "#9CA3AF"][i % 6]} />)}</Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="px-4 pb-3 space-y-2">
                  {[{ name: "HPP Barang Dagangan", amount: totalHPP }, ...expenses].map((e, i) => {
                    const pct = totalPengeluaran > 0 ? Math.round((e.amount / totalPengeluaran) * 100) : 0;
                    const color = ["#072C2C", "#FF5F03", "#D97706", "#16A34A", "#8B5CF6", "#9CA3AF"][i % 6];
                    return (
                      <div key={e.name + i} className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                        <span className="text-[#4B5563] flex-1 truncate">{e.name}</span>
                        <div className="flex-[2] h-1 rounded-full bg-[#EDEADE] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
                        <span className="font-mono font-bold text-[11px] min-w-[24px] text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Laporan Laba Rugi */}
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Laporan Laba Rugi</p><p className="text-[9px] text-[#9CA3AF]">Bulan {currentMonth}</p></div>
                <div className="divide-y divide-[#D9D6C8]">
                  <div className="flex justify-between px-4 py-2 bg-[#EDEADE] text-[10px] font-bold text-[#9CA3AF] uppercase">Pendapatan</div>
                  <div className="flex justify-between px-4 py-2.5 text-xs"><span>Penjualan Bersih</span><span className="font-mono font-bold text-[#16A34A]">+ {formatCurrency(totalSales)}</span></div>
                  <div className="flex justify-between px-4 py-2 bg-[#EDEADE] text-[10px] font-bold text-[#9CA3AF] uppercase">Harga Pokok Penjualan</div>
                  <div className="flex justify-between px-4 py-2.5 text-xs"><span>HPP Barang Dagangan</span><span className="font-mono font-bold text-[#DC2626]">− {formatCurrency(totalHPP)}</span></div>
                  <div className="flex justify-between px-4 py-2.5 text-xs bg-[#EDEADE] font-bold"><span>Laba Kotor</span><span className="font-mono font-bold text-[#072C2C]">{formatCurrency(totalSales - totalHPP)}</span></div>
                  <div className="flex justify-between px-4 py-2 bg-[#EDEADE] text-[10px] font-bold text-[#9CA3AF] uppercase">Biaya Operasional</div>
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between px-4 py-2 text-xs group">
                      <span>{exp.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#DC2626]">− {formatCurrency(exp.amount)}</span>
                        <button onClick={() => handleDeleteExp(exp.id)} className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer transition-opacity"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  {/* Add new */}
                  {showAddExp ? (
                    <div className="px-4 py-3 bg-[#FFFBEB] space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input value={newExpName} onChange={e => setNewExpName(e.target.value)} placeholder="Nama biaya" className="px-3 py-2 text-xs border border-[#D9D6C8] rounded-lg focus:outline-none focus:border-[#FF5F03]" />
                        <input value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} type="number" placeholder="Nominal" className="px-3 py-2 text-xs font-mono border border-[#D9D6C8] rounded-lg focus:outline-none focus:border-[#FF5F03]" />
                        <input value={newExpDate} onChange={e => setNewExpDate(e.target.value)} type="date" className="px-3 py-2 text-xs border border-[#D9D6C8] rounded-lg focus:outline-none focus:border-[#FF5F03]" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddExp} className="px-3 py-1.5 bg-[#072C2C] text-white text-[10px] font-bold rounded cursor-pointer">Tambah</button>
                        <button onClick={() => setShowAddExp(false)} className="px-3 py-1.5 border border-[#D9D6C8] text-[10px] rounded cursor-pointer">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 cursor-pointer text-xs text-[#9CA3AF] hover:text-[#FF5F03] flex items-center gap-1" onClick={() => setShowAddExp(true)}>
                      <Plus className="w-3 h-3" />Tambah biaya baru
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3 bg-[#EDEADE] font-bold border-t-2 border-[#072C2C]">
                    <span className="font-[Oswald] text-sm">LABA BERSIH</span>
                    <span className={`font-[Oswald] text-base ${labaBersih >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatCurrency(labaBersih)}</span>
                  </div>
                </div>
              </Card>

              {/* Rekap Metode Bayar */}
              <Card>
                <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Rekap Metode Pembayaran</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead><tr className="border-b border-[#D9D6C8]">
                      <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Metode</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Trx</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Total</th>
                      <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">%</th>
                    </tr></thead>
                    <tbody>
                      {pmData.map(p => {
                        const trxCount = filteredTransactions.filter(t => (t.payment_method === "cash" && p.name === "Tunai") || (t.payment_method === "qris" && p.name === "QRIS") || (t.payment_method === "transfer" && p.name === "Transfer") || (t.payment_method === "edc" && p.name === "EDC")).length;
                        const pmTotal = filteredTransactions.filter(t => (t.payment_method === "cash" && p.name === "Tunai") || (t.payment_method === "qris" && p.name === "QRIS") || (t.payment_method === "transfer" && p.name === "Transfer") || (t.payment_method === "edc" && p.name === "EDC")).reduce((s, t) => s + (t.total || 0), 0);
                        return (
                          <tr key={p.name} className="border-b border-[#D9D6C8]">
                            <td className="px-3 py-2"><Badge variant="info">{p.name}</Badge></td>
                            <td className="px-3 py-2 text-right font-mono">{trxCount}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[#16A34A]">{formatCurrency(pmTotal)}</td>
                            <td className="px-3 py-2 text-right font-mono">{p.value}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-[#EDEADE] font-bold">
                        <td className="px-3 py-2 text-xs">Total</td>
                        <td className="px-3 py-2 text-right font-mono">{totalTrx}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#16A34A]">{formatCurrency(totalSales)}</td>
                        <td className="px-3 py-2 text-right font-mono">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
