"use client";

import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Package, Users, Truck } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { products, customers, suppliers, monthlySalesData, topProducts } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ReportType = "sales" | "profit" | "products" | "debts";
type PeriodType = "week" | "month" | "3month" | "6month" | "year";

// SVG Icons
function IconWallet() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5F03" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M16 14h2"/><path d="M6 2h8l4 4"/></svg>; }
function IconTrend() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function IconReceipt() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#072C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h4"/></svg>; }
function IconMoneyIn() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5F03" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12l4-4 4 4"/></svg>; }
function IconBox() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8L12 2 3 8v8l9 6 9-6V8z"/><path d="M12 22V12"/><path d="M12 12L3 8"/><path d="M12 12l9-4"/></svg>; }
function IconCheckCircle() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>; }
function IconPie() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#072C2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v10l7 4"/></svg>; }

// Simulated multipliers per period
const periodMultipliers: Record<string, number> = { week: 0.25, month: 1, "3month": 3.1, "6month": 6.4, year: 12.8 };

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [period, setPeriod] = useState<PeriodType>("month");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentYear = new Date().getFullYear();

  const reports = [
    { id: "sales" as ReportType, label: "Penjualan", icon: TrendingUp },
    { id: "profit" as ReportType, label: "Laba Rugi", icon: DollarSign },
    { id: "products" as ReportType, label: "Produk", icon: Package },
    { id: "debts" as ReportType, label: "Hutang", icon: Users },
  ];

  const periods: { id: PeriodType; label: string }[] = [
    { id: "week", label: "Minggu Ini" },
    { id: "month", label: "Bulan Ini" },
    { id: "3month", label: "3 Bulan" },
    { id: "6month", label: "6 Bulan" },
    { id: "year", label: "Tahun Ini" },
  ];

  // Simulate data based on period/month selection
  const multiplier = useMemo(() => {
    if (selectedMonth) {
      // Different months have different simulated performance
      const monthIdx = selectedMonth.month;
      const monthFactors = [0.8, 0.9, 0.85, 1.1, 1.0, 1.2, 0.95, 0.88, 1.05, 1.15, 1.3, 1.4];
      return monthFactors[monthIdx];
    }
    return periodMultipliers[period] || 1;
  }, [period, selectedMonth]);

  const baseSales = 4820000;
  const baseTransactions = 347;
  const totalSales = Math.round(baseSales * multiplier);
  const totalTransactions = Math.round(baseTransactions * multiplier);
  const avgTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
  const totalCOGS = Math.round(totalSales * 0.62);
  const grossProfit = totalSales - totalCOGS;
  const marginPct = totalSales > 0 ? (grossProfit / totalSales * 100) : 0;
  const profitPer100 = Math.round(marginPct);

  // Simulated chart data based on period
  const chartData = useMemo(() => {
    if (selectedMonth) {
      const days = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
      return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
        name: `${i * 4 + 1}`,
        sales: Math.round((baseSales / 7) * (0.7 + Math.random() * 0.6)),
      }));
    }
    const factor = multiplier;
    return monthlySalesData.map(d => ({ ...d, sales: Math.round(d.sales * (factor / 6)) }));
  }, [multiplier, selectedMonth]);

  // Simulated product data
  const simProductData = useMemo(() => {
    return topProducts.map(p => ({
      ...p,
      sold: Math.round(p.sold * multiplier),
      revenue: Math.round(p.revenue * multiplier),
    }));
  }, [multiplier]);

  const totalProductRevenue = simProductData.reduce((s, p) => s + p.revenue, 0);
  const horizontalProductData = simProductData.map(p => ({ ...p, contribution: ((p.revenue / totalProductRevenue) * 100).toFixed(1) }));

  const getMarginLabel = () => {
    if (marginPct >= 20) return { text: "Margin sehat ✓", color: "text-[#16A34A]" };
    if (marginPct >= 10) return { text: "Margin cukup", color: "text-[#D97706]" };
    return { text: "Margin tipis ⚠️", color: "text-[#DC2626]" };
  };

  // Active period label for display
  const activePeriodLabel = selectedMonth ? `${monthNames[selectedMonth.month]} ${selectedMonth.year}` : periods.find(p => p.id === period)?.label || "";

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Laporan</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Analisis keuangan dan performa toko</p></div>

      {/* Period Filter */}
      <div className="relative flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {periods.map((p) => (
          <button key={p.id} onClick={() => { setPeriod(p.id); setSelectedMonth(null); setShowMonthPicker(false); }} className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${period === p.id && !selectedMonth ? "bg-[#FF5F03] text-white" : "bg-white border border-[#D9D6C8] text-[#072C2C]/60 hover:border-[#FF5F03]/40 hover:text-[#072C2C]"}`}>
            {p.label}
          </button>
        ))}
        <button onClick={() => setShowMonthPicker(!showMonthPicker)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${selectedMonth ? "bg-[#FF5F03] text-white" : "bg-white border border-[#D9D6C8] text-[#072C2C]/60 hover:border-[#FF5F03]/40 hover:text-[#072C2C]"}`}>
          📅 {selectedMonth ? `${monthNames[selectedMonth.month].slice(0,3)} ${selectedMonth.year}` : "Pilih Bulan"}
        </button>
        {showMonthPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
            <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-[#D9D6C8] rounded-lg shadow-xl p-3 w-[280px] sm:w-[300px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={() => setPickerYear(Math.max(currentYear - 2, pickerYear - 1))} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#EDEADE] cursor-pointer text-[#072C2C]/60 text-sm font-bold">←</button>
                <span className="text-sm font-bold text-[#072C2C]">{pickerYear}</span>
                <button onClick={() => setPickerYear(Math.min(currentYear, pickerYear + 1))} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#EDEADE] cursor-pointer text-[#072C2C]/60 text-sm font-bold">→</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {monthNames.map((name, idx) => {
                  const isSelected = selectedMonth?.month === idx && selectedMonth?.year === pickerYear;
                  return (
                    <button key={idx} onClick={() => { setSelectedMonth({ month: idx, year: pickerYear }); setPeriod("month"); setShowMonthPicker(false); }} className={`py-2 px-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${isSelected ? "bg-[#FF5F03] text-white" : "text-[#072C2C]/70 hover:bg-[#FF5F03]/10 hover:text-[#FF5F03]"}`}>
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs - grid on mobile, not scrollable */}
      <div className="grid grid-cols-4 sm:flex sm:gap-1 bg-[#072C2C]/5 rounded-md p-1">
        {reports.map((r) => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3 lg:px-4 py-2 rounded text-[11px] sm:text-xs lg:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${activeReport === r.id ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/50 hover:text-[#072C2C]/80"}`}>
            <r.icon className="w-4 h-4" /><span className="hidden sm:inline">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Period indicator */}
      <p className="text-[10px] text-[#9CA3AF]">Menampilkan data: <span className="font-semibold text-[#072C2C]">{activePeriodLabel}</span></p>

      {/* TAB PENJUALAN */}
      {activeReport === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#FF5F03]">
              <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Penjualan</p><IconWallet /></div>
              <p className="font-[Oswald] text-[20px] lg:text-[24px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalSales)}</p>
              <p className="text-[10px] text-[#16A34A] font-medium mt-0.5">▲ 12% dari periode lalu</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]">
              <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Rata-rata Transaksi</p><IconTrend /></div>
              <p className="font-[Oswald] text-[20px] lg:text-[24px] font-semibold text-[#16A34A] mt-1">{formatCurrency(avgTransaction)}</p>
              <p className="text-[10px] text-[#16A34A] font-medium mt-0.5">▲ 4% dari periode lalu</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]">
              <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Transaksi</p><IconReceipt /></div>
              <p className="font-[Oswald] text-[20px] lg:text-[24px] font-semibold text-[#072C2C] mt-1">{formatNumber(totalTransactions)}</p>
              <p className="text-[10px] text-[#16A34A] font-medium mt-0.5">▲ 8% dari periode lalu</p>
            </div>
          </div>
          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Penjualan {activePeriodLabel}</h3></CardHeader><CardContent><div className="h-56 lg:h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} /><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(1)}jt`} /><Tooltip formatter={(value) => [formatCurrency(value as number), "Penjualan"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} cursor={{ fill: "transparent" }} /><Bar dataKey="sales" fill="#FF5F03" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        </div>
      )}

      {/* TAB LABA RUGI */}
      {activeReport === "profit" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#FF5F03]">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Pendapatan</p><IconMoneyIn /></div>
              <p className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalSales)}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#DC2626]">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Biaya Modal</p><IconBox /></div>
              <p className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(totalCOGS)}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#16A34A]">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Keuntungan</p><IconCheckCircle /></div>
              <p className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#16A34A] mt-1">{formatCurrency(grossProfit)}</p>
            </div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#072C2C]">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Margin</p><IconPie /></div>
              <p className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] mt-1">{marginPct.toFixed(1)}%</p>
              <p className={`text-[9px] font-medium mt-0.5 ${getMarginLabel().color}`}>{getMarginLabel().text}</p>
            </div>
          </div>
          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Breakdown Pendapatan</h3></CardHeader><CardContent>
            <div className="space-y-3">
              <div className="w-full h-8 rounded-md overflow-hidden flex">
                <div className="h-full bg-[#DC2626] flex items-center justify-center" style={{ width: `${(totalCOGS / totalSales * 100).toFixed(1)}%` }}><span className="text-[9px] lg:text-[10px] font-bold text-white">Modal</span></div>
                <div className="h-full bg-[#16A34A] flex items-center justify-center" style={{ width: `${(grossProfit / totalSales * 100).toFixed(1)}%` }}><span className="text-[9px] lg:text-[10px] font-bold text-white">Untung</span></div>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#DC2626] font-medium">{formatCurrency(totalCOGS)} ({(totalCOGS / totalSales * 100).toFixed(0)}%)</span>
                <span className="text-[#16A34A] font-medium">{formatCurrency(grossProfit)} ({(grossProfit / totalSales * 100).toFixed(0)}%)</span>
              </div>
              <p className="text-[11px] text-[#072C2C]/60 text-center border-t border-[#D9D6C8] pt-3">Dari setiap <span className="font-bold">Rp 100</span>, <span className="font-bold text-[#16A34A]">Rp {profitPer100}</span> adalah keuntungan</p>
            </div>
          </CardContent></Card>
        </div>
      )}

      {/* TAB PRODUK */}
      {activeReport === "products" && (
        <div className="space-y-4">
          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Produk Terlaris</h3></CardHeader><CardContent>
            <div className="h-52 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horizontalProductData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={10} width={100} />
                  <Tooltip formatter={(value) => [formatNumber(value as number), "Terjual"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="sold" fill="#FF5F03" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>

          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Detail Produk Terlaris</h3></CardHeader><CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[400px]">
              <thead><tr className="border-b border-[#D9D6C8]">
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-3 py-2 bg-[#EDEADE] uppercase tracking-wider">No</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-3 py-2 bg-[#EDEADE] uppercase tracking-wider">Produk</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-right px-3 py-2 bg-[#EDEADE] uppercase tracking-wider">Terjual</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-right px-3 py-2 bg-[#EDEADE] uppercase tracking-wider">Pendapatan</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-right px-3 py-2 bg-[#EDEADE] uppercase tracking-wider">%</th>
              </tr></thead>
              <tbody>{horizontalProductData.map((p, idx) => (
                <tr key={p.name} className={`border-b border-[#D9D6C8] last:border-b-0 ${idx % 2 === 1 ? "bg-[#EDEADE]/30" : ""}`}>
                  <td className="px-3 py-2.5 font-bold text-[#072C2C]/50">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-[#072C2C]">{p.name}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{formatNumber(p.sold)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-[#16A34A]">{formatCurrency(p.revenue)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{p.contribution}%</td>
                </tr>
              ))}</tbody>
            </table>
            </div>
          </CardContent></Card>

          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Produk Lambat Terjual</h3></CardHeader><CardContent className="p-0">
            {products.slice(-5).reverse().map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between px-3.5 py-3 border-b border-[#D9D6C8] last:border-b-0 ${idx % 2 === 1 ? "bg-[#EDEADE]/30" : ""}`}>
                <div><p className="text-sm font-medium text-[#072C2C]">{p.name}</p><p className="text-[10px] text-[#9CA3AF]">Stok: {p.stock} {p.unit}</p></div>
                <span className="text-[11px] font-mono font-bold text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded">{Math.floor(Math.random() * 8) + 2} terjual</span>
              </div>
            ))}
          </CardContent></Card>

          <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Peringatan Expired</h3></CardHeader><CardContent className="p-0">
            {[
              { name: "Susu Indomilk 1L", stock: 3, unit: "Kotak", expiry: "2026-05-20", daysLeft: -11 },
              { name: "Kopi Kapal Api 165g", stock: 5, unit: "Bungkus", expiry: "2026-06-15", daysLeft: 15 },
              { name: "Minyak Goreng Bimoli 2L", stock: 8, unit: "Botol", expiry: "2026-07-20", daysLeft: 50 },
            ].map((item, idx) => {
              const isExpired = item.daysLeft < 0;
              const isUrgent = item.daysLeft >= 0 && item.daysLeft <= 30;
              const bgClass = isExpired ? "bg-[#FEF2F2]" : isUrgent ? "bg-[#FFFBEB]" : "bg-[#F0FDF4]";
              const labelClass = isExpired ? "text-[#DC2626] bg-[#DC2626]/10" : isUrgent ? "text-[#D97706] bg-[#D97706]/10" : "text-[#16A34A] bg-[#16A34A]/10";
              const label = isExpired ? "🔴 Segera Tarik" : isUrgent ? "🟡 Perlu Perhatian" : "🟢 Pantau Stok";
              return (
                <div key={idx} className={`flex items-center justify-between px-3.5 py-3 border-b border-[#D9D6C8] last:border-b-0 ${bgClass}`}>
                  <div><p className="text-sm font-medium text-[#072C2C]">{item.name}</p><p className="text-[10px] text-[#9CA3AF]">Stok: {item.stock} {item.unit} · Exp: {new Date(item.expiry).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                  <div className="text-right"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${labelClass}`}>{label}</span><p className="text-[9px] text-[#9CA3AF] mt-0.5">{isExpired ? `${Math.abs(item.daysLeft)} hari lewat` : `${item.daysLeft} hari lagi`}</p></div>
                </div>
              );
            })}
          </CardContent></Card>
        </div>
      )}

      {/* TAB HUTANG */}
      {activeReport === "debts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-[#DC2626]" /><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Hutang Pelanggan</p></div><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626]">{formatCurrency(customers.reduce((s,c) => s+c.debt, 0))}</p></div>
            <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><div className="flex items-center gap-2 mb-1"><Truck className="w-4 h-4 text-[#D97706]" /><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Hutang ke Supplier</p></div><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706]">{formatCurrency(suppliers.reduce((s,sup) => s+sup.debt, 0))}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Hutang Pelanggan</h3></CardHeader><CardContent className="p-0"><div>{customers.filter(c=>c.debt>0).sort((a,b)=>b.debt-a.debt).map((c, idx)=><div key={c.id} className={`flex items-center justify-between px-3.5 py-3 border-b border-[#D9D6C8] last:border-b-0 ${idx % 2 === 1 ? "bg-[#EDEADE]/30" : ""}`}><div><p className="text-sm font-medium text-[#072C2C]">{c.name}</p><p className="text-[10px] text-[#9CA3AF]">{c.phone}</p></div><p className="text-sm font-bold text-[#DC2626] font-mono">{formatCurrency(c.debt)}</p></div>)}</div></CardContent></Card>
            <Card><CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Hutang Supplier</h3></CardHeader><CardContent className="p-0"><div>{suppliers.filter(s=>s.debt>0).sort((a,b)=>b.debt-a.debt).map((s, idx)=><div key={s.id} className={`flex items-center justify-between px-3.5 py-3 border-b border-[#D9D6C8] last:border-b-0 ${idx % 2 === 1 ? "bg-[#EDEADE]/30" : ""}`}><div><p className="text-sm font-medium text-[#072C2C]">{s.name}</p><p className="text-[10px] text-[#9CA3AF]">{s.phone}</p></div><p className="text-sm font-bold text-[#D97706] font-mono">{formatCurrency(s.debt)}</p></div>)}</div></CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}
