"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProducts, getTransactions } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TabType = "penjualan" | "produk" | "kasir" | "stok";

export default function ReportsPage() {
  const [tab, setTab] = useState<TabType>("penjualan");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
    getProducts().then(setProducts);
  }, []);

  // === PENJUALAN DATA ===
  const totalSales = transactions.reduce((s, t) => s + (t.total || 0), 0);
  const totalTrx = transactions.length;
  const avgTrx = totalTrx > 0 ? Math.round(totalSales / totalTrx) : 0;

  // Daily chart data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    transactions.forEach(t => {
      const d = new Date(t.created_at);
      const day = days[d.getDay()];
      map[day] = (map[day] || 0) + (t.total || 0);
    });
    return days.slice(1).concat(days[0]).map(d => ({ name: d, total: Math.round((map[d] || 0) / 1000) }));
  }, [transactions]);

  // Payment method breakdown
  const pmData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => { const m = t.payment_method || "cash"; map[m] = (map[m] || 0) + 1; });
    const total = transactions.length || 1;
    return [
      { name: "Tunai", value: Math.round(((map.cash || 0) / total) * 100), color: "#FF5F03" },
      { name: "QRIS", value: Math.round(((map.qris || 0) / total) * 100), color: "#072C2C" },
      { name: "Transfer", value: Math.round(((map.transfer || 0) / total) * 100), color: "#D97706" },
      { name: "EDC", value: Math.round(((map.edc || 0) / total) * 100), color: "#16A34A" },
    ].filter(p => p.value > 0);
  }, [transactions]);

  // === PRODUK DATA ===
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sold: number; rev: number }> = {};
    transactions.forEach(t => {
      (t.transaction_items || []).forEach((i: any) => {
        const k = i.product_name || "?";
        if (!map[k]) map[k] = { name: k, sold: 0, rev: 0 };
        map[k].sold += i.quantity || 0;
        map[k].rev += i.subtotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.rev - a.rev).slice(0, 10);
  }, [transactions]);

  // === KASIR DATA ===
  const kasirData = useMemo(() => {
    const map: Record<string, { name: string; trx: number; total: number }> = {};
    transactions.forEach(t => {
      const k = t.cashier || "Unknown";
      if (!map[k]) map[k] = { name: k, trx: 0, total: 0 };
      map[k].trx++;
      map[k].total += t.total || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // === STOK DATA ===
  const stokAman = products.filter(p => p.stock > p.min_stock).length;
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length;
  const stokHabis = products.filter(p => p.stock <= 0).length;

  const tabs: { id: TabType; label: string }[] = [
    { id: "penjualan", label: "Penjualan" },
    { id: "produk", label: "Produk" },
    { id: "kasir", label: "Kasir" },
    { id: "stok", label: "Stok" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Laporan</h1>
          <p className="text-[10px] text-[#9CA3AF]">Analisis penjualan, produk, kasir & stok</p>
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
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Penjualan</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalSales)}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Transaksi</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{totalTrx}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Rata-rata / Trx</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{formatCurrency(avgTrx)}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Metode Terpopuler</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{pmData[0]?.name || "–"}</p></div>
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
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Metode Bayar</p></div>
              <div className="p-4 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pmData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={3} stroke="#fff">{pmData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-4 pb-3 space-y-2">
                {pmData.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-[#4B5563] flex-1">{p.name}</span>
                    <div className="flex-[2] h-1 rounded-full bg-[#EDEADE] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color }} /></div>
                    <span className="font-mono font-bold text-[11px] min-w-[24px] text-right">{p.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB PRODUK ═══ */}
      {tab === "produk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total SKU</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{products.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Unit Terjual</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{topProducts.reduce((s, p) => s + p.sold, 0).toLocaleString("id-ID")}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Produk Terlaris</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{topProducts[0]?.name || "–"}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Habis</p><p className="font-[Oswald] text-[20px] font-semibold text-[#DC2626] mt-1">{stokHabis} produk</p></div>
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
        </div>
      )}

      {/* ═══ TAB KASIR ═══ */}
      {tab === "kasir" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Kasir</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{kasirData.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Transaksi Terbanyak</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{kasirData[0]?.name || "–"}</p><p className="text-[9px] text-[#9CA3AF]">{kasirData[0]?.trx || 0} transaksi</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Pendapatan Tertinggi</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{formatCurrency(kasirData[0]?.total || 0)}</p><p className="text-[9px] text-[#9CA3AF]">{kasirData[0]?.name || "–"}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Omzet Kasir</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{formatCurrency(kasirData.reduce((s, k) => s + k.total, 0))}</p></div>
          </div>
          <Card>
            <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Kinerja Per Kasir</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-[#D9D6C8]">
                  <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kasir</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Transaksi</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Total Penjualan</th>
                  <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Rata-rata</th>
                </tr></thead>
                <tbody>
                  {kasirData.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[#9CA3AF]">Belum ada data</td></tr>}
                  {kasirData.map(k => (
                    <tr key={k.name} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-[#072C2C] rounded-full flex items-center justify-center text-white text-[9px] font-bold">{k.name[0]}</div><span className="font-medium">{k.name}</span></div></td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{k.trx}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[#16A34A]">{formatCurrency(k.total)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[#9CA3AF]">{formatCurrency(k.trx > 0 ? Math.round(k.total / k.trx) : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ TAB STOK ═══ */}
      {tab === "stok" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total SKU</p><p className="font-[Oswald] text-[20px] font-semibold text-[#072C2C] mt-1">{products.length}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Aman</p><p className="font-[Oswald] text-[20px] font-semibold text-[#16A34A] mt-1">{stokAman}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Menipis</p><p className="font-[Oswald] text-[20px] font-semibold text-[#D97706] mt-1">{stokMenipis}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase">Stok Habis</p><p className="font-[Oswald] text-[20px] font-semibold text-[#DC2626] mt-1">{stokHabis}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
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
            {/* Stok distribution */}
            <Card>
              <div className="px-4 py-3 border-b border-[#D9D6C8]"><p className="font-[Oswald] text-xs font-semibold text-[#072C2C] uppercase tracking-wider">Distribusi Stok</p></div>
              <div className="p-4 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={[{ name: "Aman", value: stokAman, color: "#16A34A" }, { name: "Menipis", value: stokMenipis, color: "#D97706" }, { name: "Habis", value: stokHabis, color: "#DC2626" }]} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={3} stroke="#fff">{[{ color: "#16A34A" }, { color: "#D97706" }, { color: "#DC2626" }].map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-4 pb-3 space-y-2">
                {[{ name: "Aman", value: stokAman, color: "#16A34A" }, { name: "Menipis", value: stokMenipis, color: "#D97706" }, { name: "Habis", value: stokHabis, color: "#DC2626" }].map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                    <span className="text-[#4B5563] flex-1">{s.name}</span>
                    <span className="font-mono font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
