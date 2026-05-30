"use client";

import { useState } from "react";
import { TrendingUp, Receipt, AlertTriangle, Wallet, ArrowRight, Check, X, Download, Search, Bell, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { salesChartData, topProducts, products } from "@/data/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line } from "recharts";

type PeriodType = "today" | "week" | "month";

const paymentMethodData = [
  { name: "Tunai", value: 48, color: "#FF5F03" },
  { name: "QRIS", value: 34, color: "#072C2C" },
  { name: "Transfer", value: 18, color: "#D97706" },
];

const activities = [
  { id: 1, type: "success", icon: "check", title: "Transaksi #2847 selesai", meta: "2 mnt lalu · Tunai", amount: "Rp 47.500" },
  { id: 2, type: "warning", icon: "alert", title: "Sunlight 400ml stok kritis", meta: "14 mnt lalu · 3 pcs", amount: "" },
  { id: 3, type: "success", icon: "check", title: "Transaksi #2846 selesai", meta: "19 mnt lalu · QRIS", amount: "Rp 28.000" },
  { id: 4, type: "info", icon: "check", title: "Transaksi #2845 selesai", meta: "31 mnt lalu · Transfer", amount: "Rp 112.000" },
  { id: 5, type: "danger", icon: "x", title: "Transaksi #2844 dibatalkan", meta: "45 mnt lalu · Void", amount: "" },
  { id: 6, type: "warning", icon: "alert", title: "Sambal ABC 275ml menipis", meta: "1 jam lalu · 8 pcs", amount: "" },
];

const topProductsData = [
  { emoji: "🍜", name: "Indomie Goreng", cat: "Beras & Mie", sold: "246 pcs", rev: "Rp 861rb", status: "Aman", statusType: "g", trend: [40, 60, 45, 80, 70, 90, 85] },
  { emoji: "🫙", name: "Aqua 600ml", cat: "Minuman", sold: "198 btl", rev: "Rp 792rb", status: "Aman", statusType: "g", trend: [50, 55, 60, 50, 70, 80, 75] },
  { emoji: "🌾", name: "Beras Premium 5kg", cat: "Beras & Mie", sold: "87 kg", rev: "Rp 652rb", status: "Menipis", statusType: "a", trend: [90, 70, 60, 75, 50, 55, 60] },
  { emoji: "🫒", name: "Minyak Goreng 2L", cat: "Minyak & Bumbu", sold: "72 btl", rev: "Rp 448rb", status: "Aman", statusType: "g", trend: [30, 45, 40, 55, 50, 60, 58] },
  { emoji: "🍬", name: "Gula Pasir 1kg", cat: "Minyak & Bumbu", sold: "61 kg", rev: "Rp 232rb", status: "Kritis", statusType: "r", trend: [80, 60, 50, 40, 45, 35, 30] },
];

// Convert salesChartData for the combined bar+line chart
const chartData = salesChartData.map(d => ({ ...d, salesK: d.sales / 1000 }));

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 22;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>("week");

  const dotColors: Record<string, string> = { success: "bg-[#F0FDF4] text-[#16A34A]", warning: "bg-[#FFFBEB] text-[#D97706]", danger: "bg-[#FEF2F2] text-[#DC2626]", info: "bg-[#EFF6FF] text-[#1D4ED8]" };
  const statusColors: Record<string, string> = { g: "#16A34A", a: "#D97706", r: "#DC2626" };
  const pillClasses: Record<string, string> = { g: "bg-[#F0FDF4] text-[#16A34A] border-[#bbf7d0]", a: "bg-[#FFFBEB] text-[#D97706] border-[#fde68a]", r: "bg-[#FEF2F2] text-[#DC2626] border-[#fecaca]" };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Dashboard</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light hidden sm:block">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center border border-[#D9D6C8] rounded overflow-hidden">
          {([["today", "Hari ini"], ["week", "Minggu ini"], ["month", "Bulan ini"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2 lg:px-3 py-[5px] text-[10px] lg:text-[11px] font-medium cursor-pointer transition-all border-r border-[#D9D6C8] last:border-r-0 min-h-[36px] ${period === key ? "bg-[#072C2C] text-white font-semibold" : "bg-white text-[#4B5563] hover:bg-[#EDEADE]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#FF5F03]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total pendapatan</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#16A34A] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+12%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight">Rp 4,82jt</span>
            <Wallet className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#072C2C]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total transaksi</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#16A34A] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+8%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight">347</span>
            <Receipt className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#D97706]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Rata-rata / transaksi</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#16A34A] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+4%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight">Rp 13,9rb</span>
            <Calculator className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#DC2626]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok menipis</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#DC2626] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight">5 produk</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Mid Row: Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-2.5">
        {/* Revenue Chart */}
        <div className="bg-white border border-[#D9D6C8] rounded-md">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#D9D6C8]">
            <div>
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Pendapatan Harian</div>
              <div className="text-[10px] text-[#9CA3AF] font-light mt-px">7 hari terakhir · ribuan rupiah</div>
            </div>
            <button className="flex items-center gap-1 text-[10px] text-[#9CA3AF] font-medium px-2 py-1 border border-[#D9D6C8] rounded cursor-pointer hover:text-[#4B5563] hover:border-[#B8B4A2] transition-colors">
              <Download className="w-3 h-3" />Ekspor
            </button>
          </div>
          <div className="p-3.5 pb-2.5">
            <div className="h-[150px] lg:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,44,44,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF" }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9CA3AF", fontFamily: "Ubuntu Mono" }} tickFormatter={(v) => `${v}rb`} />
                  <Tooltip
                    formatter={(value) => [`Rp ${value}rb`, "Pendapatan"]}
                    contentStyle={{ backgroundColor: "#072C2C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "5px", padding: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }}
                    itemStyle={{ color: "#fff", fontWeight: 700, fontFamily: "Ubuntu Mono" }}
                  />
                  <Bar dataKey="salesK" fill="rgba(7,44,44,0.06)" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="salesK" stroke="#FF5F03" strokeWidth={2} dot={{ r: 4, fill: "#fff", stroke: "#FF5F03", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#FF5F03", stroke: "#fff", strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-[#D9D6C8] rounded-md">
          <div className="px-3.5 py-2.5 border-b border-[#D9D6C8]">
            <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Metode Bayar</div>
            <div className="text-[10px] text-[#9CA3AF] font-light mt-px">Minggu ini</div>
          </div>
          <div className="p-3.5 pb-1.5">
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={3} stroke="#fff">
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Legend */}
          <div className="px-3.5 py-2.5 border-t border-[#D9D6C8] space-y-[7px]">
            {paymentMethodData.map((item) => (
              <div key={item.name} className="flex items-center gap-[7px] text-[11px]">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#4B5563] flex-1">{item.name}</span>
                <div className="flex-[2] h-[3px] rounded-full bg-[#EDEADE] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                </div>
                <span className="text-[11px] font-bold text-[#111827] font-mono min-w-[26px] text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Table + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-2.5">
        {/* Products Table */}
        <div className="bg-white border border-[#D9D6C8] rounded-md">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#D9D6C8]">
            <div>
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Produk Terlaris</div>
              <div className="text-[10px] text-[#9CA3AF] font-light mt-px">Penjualan minggu ini</div>
            </div>
            <button className="flex items-center gap-1 text-[10px] text-[#9CA3AF] font-medium px-2 py-1 border border-[#D9D6C8] rounded cursor-pointer hover:text-[#4B5563] hover:border-[#B8B4A2] transition-colors">
              Lihat semua <ArrowRight className="w-[11px] h-[11px]" />
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-[12px] min-w-[500px]">
            <thead>
              <tr>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-2.5 py-1.5 bg-[#EDEADE] border-b border-[#D9D6C8] uppercase tracking-wider">Produk</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-2.5 py-1.5 bg-[#EDEADE] border-b border-[#D9D6C8] uppercase tracking-wider">Terjual</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-2.5 py-1.5 bg-[#EDEADE] border-b border-[#D9D6C8] uppercase tracking-wider hidden sm:table-cell">Pendapatan</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-2.5 py-1.5 bg-[#EDEADE] border-b border-[#D9D6C8] uppercase tracking-wider">Status</th>
                <th className="text-[10px] font-semibold text-[#9CA3AF] text-left px-2.5 py-1.5 bg-[#EDEADE] border-b border-[#D9D6C8] uppercase tracking-wider hidden md:table-cell">Tren</th>
              </tr>
            </thead>
            <tbody>
              {topProductsData.map((p) => (
                <tr key={p.name} className="border-b border-[#D9D6C8] last:border-b-0 hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EDEADE] border border-[#D9D6C8] flex items-center justify-center text-[14px] flex-shrink-0">{p.emoji}</div>
                      <div>
                        <div className="text-[12px] font-medium text-[#111827]">{p.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-light">{p.cat}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[11px]">{p.sold}</td>
                  <td className="px-2.5 py-2 font-mono text-[11px] font-bold text-[#16A34A] hidden sm:table-cell">{p.rev}</td>
                  <td className="px-2.5 py-2">
                    <span className={`text-[9px] font-bold font-mono px-[7px] py-[2px] rounded border ${pillClasses[p.statusType]} tracking-wide`}>{p.status}</span>
                  </td>
                  <td className="px-2.5 py-2 hidden md:table-cell">
                    <MiniSparkline data={p.trend} color={statusColors[p.statusType]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-[#D9D6C8] rounded-md">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#D9D6C8]">
            <div>
              <div className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider">Aktivitas Terkini</div>
              <div className="text-[10px] text-[#9CA3AF] font-light mt-px">Update hari ini</div>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-bold text-[#16A34A] font-mono tracking-wider">
              <span className="w-[5px] h-[5px] rounded-full bg-[#16A34A] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="px-3.5 py-1">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 py-2 border-b border-[#D9D6C8] last:border-b-0">
                <div className={`w-[26px] h-[26px] rounded flex items-center justify-center flex-shrink-0 ${dotColors[a.type]}`}>
                  {a.icon === "check" && <Check className="w-[13px] h-[13px]" />}
                  {a.icon === "alert" && <AlertTriangle className="w-[13px] h-[13px]" />}
                  {a.icon === "x" && <X className="w-[13px] h-[13px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-[#111827] truncate">{a.title}</div>
                  <div className="text-[10px] text-[#9CA3AF] font-light">{a.meta}</div>
                </div>
                {a.amount && <span className="text-[11px] font-bold text-[#16A34A] font-mono flex-shrink-0">{a.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
