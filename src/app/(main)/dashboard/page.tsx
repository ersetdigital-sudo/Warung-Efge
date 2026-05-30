"use client";

import { useState } from "react";
import { TrendingUp, Receipt, AlertTriangle, Wallet, ArrowRight, CheckCircle2, XCircle, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { dashboardStats, salesChartData, topProducts, products, transactions } from "@/data/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type PeriodType = "today" | "week" | "month";

const paymentMethodData = [
  { name: "Tunai", value: 48, color: "#FF5F03" },
  { name: "QRIS", value: 34, color: "#072C2C" },
  { name: "Transfer", value: 18, color: "#D97706" },
];

const activities = [
  { id: 1, type: "success", title: "Transaksi #2847 selesai", time: "2 mnt lalu", detail: "Tunai", amount: 47590 },
  { id: 2, type: "warning", title: "Detergen Rinso stok kritis", time: "14 mnt lalu", detail: "3 pcs", amount: null },
  { id: 3, type: "success", title: "Transaksi #2846 selesai", time: "19 mnt lalu", detail: "QRIS", amount: 28000 },
  { id: 4, type: "success", title: "Transaksi #2845 selesai", time: "31 mnt lalu", detail: "Transfer", amount: 112000 },
  { id: 5, type: "danger", title: "Transaksi #2844 dibatalkan", time: "45 mnt lalu", detail: "Void", amount: null },
  { id: 6, type: "warning", title: "Sambal ABC 275ml menipis", time: "1 jam lalu", detail: "6 pcs", amount: null },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>("week");
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const avgTransaction = dashboardStats.totalTransactions > 0 ? dashboardStats.todaySales / dashboardStats.totalTransactions : 0;

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return "Kritis";
    if (stock <= minStock) return "Menipis";
    return "Aman";
  };

  const getStockVariant = (stock: number, minStock: number): "success" | "warning" | "danger" => {
    if (stock <= 0) return "danger";
    if (stock <= minStock) return "warning";
    return "success";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Dashboard</h1>
          <p className="text-sm text-[#072C2C]/50 mt-0.5">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center bg-white rounded-xl border border-[#072C2C]/10 p-1">
          {([["today", "Hari Ini"], ["week", "Minggu Ini"], ["month", "Bulan Ini"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${period === key ? "bg-[#072C2C] text-white" : "text-[#072C2C]/60 hover:text-[#072C2C]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Total Pendapatan</p>
            <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-md flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+12%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[#072C2C]">{formatCurrency(dashboardStats.todaySales).replace("Rp", "Rp ")}</p>
            <Wallet className="w-5 h-5 text-[#072C2C]/30" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Total Transaksi</p>
            <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-md flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+8%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[#072C2C]">{formatNumber(transactions.length * 69)}</p>
            <Receipt className="w-5 h-5 text-[#072C2C]/30" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Rata-rata / Transaksi</p>
            <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-md flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+4%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[#072C2C]">{formatCurrency(avgTransaction).replace("Rp", "Rp ")}</p>
            <Receipt className="w-5 h-5 text-[#072C2C]/30" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Stok Menipis</p>
            <span className="text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-md flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[#072C2C]">{lowStockProducts.length} produk</p>
            <AlertTriangle className="w-5 h-5 text-[#D97706]/60" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#072C2C]/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#072C2C] uppercase tracking-wider">Pendapatan Harian</h3>
              <p className="text-xs text-[#072C2C]/50 mt-0.5">7 hari terakhir · ribuan rupiah</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#072C2C]/60 bg-[#EDEADE] rounded-lg hover:bg-[#072C2C]/10 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" />Ekspor
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#072C2C" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#072C2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#072C2C08" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#072C2C80" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} tick={{ fill: "#072C2C60" }} dx={-5} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), "Pendapatan"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #072C2C15", boxShadow: "0 8px 24px rgba(7,44,44,0.12)", fontSize: "13px" }}
                  labelStyle={{ fontWeight: 600, color: "#072C2C" }}
                />
                <Area type="monotone" dataKey="sales" stroke="#072C2C" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ r: 4, fill: "#072C2C", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#FF5F03", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Donut */}
        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#072C2C] uppercase tracking-wider">Metode Bayar</h3>
            <p className="text-xs text-[#072C2C]/50 mt-0.5">Minggu ini</p>
          </div>
          <div className="h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {paymentMethodData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-[#072C2C]/70">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#EDEADE] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-sm font-bold text-[#072C2C]">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#072C2C]/10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#072C2C]/5">
            <div>
              <h3 className="text-sm font-bold text-[#072C2C] uppercase tracking-wider">Produk Terlaris</h3>
              <p className="text-xs text-[#072C2C]/50 mt-0.5">Penjualan minggu ini</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-[#FF5F03] hover:text-[#e55503] cursor-pointer">
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#072C2C]/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Terjual</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Pendapatan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#072C2C]/50 uppercase tracking-wider">Tren</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#072C2C]/5">
                {topProducts.map((product, idx) => {
                  const productData = products.find((p) => p.name.includes(product.name.split(" ")[0]));
                  const status = productData ? getStockStatus(productData.stock, productData.minStock) : "Aman";
                  const variant = productData ? getStockVariant(productData.stock, productData.minStock) : "success";
                  // Simple sparkline data
                  const trendUp = idx < 3;
                  return (
                    <tr key={product.name} className="hover:bg-[#EDEADE]/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#EDEADE] rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-[#072C2C]/60">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#072C2C]">{product.name}</p>
                            <p className="text-xs text-[#072C2C]/50">{productData?.category || "Lain-lain"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[#072C2C]">{formatNumber(product.sold)} {productData?.unit?.toLowerCase() || "pcs"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[#072C2C]">{formatCurrency(product.revenue)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={variant}>{status}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <svg width="60" height="24" viewBox="0 0 60 24" className="overflow-visible">
                          <path
                            d={trendUp ? "M0,20 L10,16 L20,18 L30,12 L40,8 L50,10 L60,4" : "M0,4 L10,8 L20,6 L30,12 L40,16 L50,14 L60,20"}
                            fill="none"
                            stroke={trendUp ? "#16A34A" : "#DC2626"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-[#072C2C]/10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#072C2C]/5">
            <div>
              <h3 className="text-sm font-bold text-[#072C2C] uppercase tracking-wider">Aktivitas Terkini</h3>
              <p className="text-xs text-[#072C2C]/50 mt-0.5">Update hari ini</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-[#16A34A]">
              <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="divide-y divide-[#072C2C]/5 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 px-6 py-3.5">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "success" ? "bg-[#16A34A]/10" : activity.type === "warning" ? "bg-[#D97706]/10" : "bg-[#DC2626]/10"}`}>
                  {activity.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
                  {activity.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />}
                  {activity.type === "danger" && <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#072C2C]">{activity.title}</p>
                  <p className="text-xs text-[#072C2C]/50 mt-0.5">{activity.time} · {activity.detail}</p>
                </div>
                {activity.amount && (
                  <span className="text-sm font-bold text-[#072C2C] whitespace-nowrap">{formatCurrency(activity.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
