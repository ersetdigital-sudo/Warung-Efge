"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, Receipt, AlertTriangle, Wallet, ArrowRight, Check, X, Download, Search, Bell, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getProducts, getTransactions, getCustomers, getSuppliers } from "@/lib/db";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line } from "recharts";

type PeriodType = "today" | "week" | "month";

// Animated number component
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = display.toLocaleString("id-ID");
  return <span>{prefix}{formatted}{suffix}</span>;
}

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
  const [stats, setStats] = useState({ totalSales: 0, totalTransactions: 0, lowStockCount: 0, avgTransaction: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [products, setProductsData] = useState<any[]>([]);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    const [prods, trxs] = await Promise.all([getProducts(), getTransactions()]);

    const totalSales = trxs.reduce((s: number, t: any) => s + (t.total || 0), 0);
    const totalTransactions = trxs.length;
    const avgTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
    const lowStock = prods.filter((p: any) => p.stock <= p.min_stock);

    setStats({ totalSales, totalTransactions, lowStockCount: lowStock.length, avgTransaction });
    setLowStockProducts(lowStock.slice(0, 5));
    setRecentTransactions(trxs);
    setProductsData(prods);
  };

  const dotColors: Record<string, string> = { success: "bg-[#F0FDF4] text-[#16A34A]", warning: "bg-[#FFFBEB] text-[#D97706]", danger: "bg-[#FEF2F2] text-[#DC2626]", info: "bg-[#EFF6FF] text-[#1D4ED8]" };
  const statusColors: Record<string, string> = { g: "#16A34A", a: "#D97706", r: "#DC2626" };
  const pillClasses: Record<string, string> = { g: "bg-[#F0FDF4] text-[#16A34A] border-[#bbf7d0]", a: "bg-[#FFFBEB] text-[#D97706] border-[#fde68a]", r: "bg-[#FEF2F2] text-[#DC2626] border-[#fecaca]" };

  // Generate chart data from real transactions grouped by day
  const chartData = useMemo(() => {
    if (recentTransactions.length === 0) return [{ name: "Belum ada", salesK: 0 }];
    const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const dailyMap: Record<string, number> = {};
    for (const trx of recentTransactions) {
      const date = new Date(trx.created_at);
      const day = dayLabels[date.getDay()];
      dailyMap[day] = (dailyMap[day] || 0) + (trx.total || 0);
    }
    // Show all 7 days, fill 0 for days without transactions
    return dayLabels.slice(1).concat(dayLabels[0]).map(name => ({ name, salesK: Math.round((dailyMap[name] || 0) / 1000) }));
  }, [recentTransactions]);

  // Payment method breakdown from real transactions
  const paymentMethodData = useMemo(() => {
    if (recentTransactions.length === 0) return [
      { name: "Tunai", value: 0, color: "#FF5F03" },
      { name: "QRIS", value: 0, color: "#072C2C" },
      { name: "Transfer", value: 0, color: "#D97706" },
    ];
    const total = recentTransactions.length;
    const cash = recentTransactions.filter((t: any) => t.payment_method === "cash").length;
    const qris = recentTransactions.filter((t: any) => t.payment_method === "qris").length;
    const transfer = recentTransactions.filter((t: any) => t.payment_method === "transfer").length;
    return [
      { name: "Tunai", value: Math.round((cash / total) * 100), color: "#FF5F03" },
      { name: "QRIS", value: Math.round((qris / total) * 100), color: "#072C2C" },
      { name: "Transfer", value: Math.round((transfer / total) * 100), color: "#D97706" },
    ];
  }, [recentTransactions]);

  // Top products from real transaction_items
  const topProductsData = useMemo(() => {
    const salesMap: Record<string, { name: string; cat: string; sold: number; rev: number }> = {};
    for (const trx of recentTransactions) {
      for (const item of (trx.transaction_items || [])) {
        const key = item.product_name || "Unknown";
        if (!salesMap[key]) salesMap[key] = { name: key, cat: "", sold: 0, rev: 0 };
        salesMap[key].sold += item.quantity || 0;
        salesMap[key].rev += item.subtotal || 0;
      }
    }
    // Match category from products
    const result = Object.values(salesMap).sort((a, b) => b.rev - a.rev).slice(0, 5);
    return result.map(p => {
      const prod = products.find((pr: any) => pr.name === p.name);
      return { ...p, cat: prod?.category || "", unit: prod?.unit || "pcs", stock: prod?.stock || 0, min_stock: prod?.min_stock || 0 };
    });
  }, [recentTransactions, products]);

  // Activities from recent transactions + low stock warnings
  const activities: { id: number; type: string; icon: string; title: string; meta: string; amount: string }[] = [
    ...recentTransactions.slice(0, 4).map((t: any, i: number) => ({
      id: i,
      type: "success",
      icon: "check",
      title: `Transaksi ${t.transaction_number || "#" + (i + 1)} selesai`,
      meta: `${new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · ${t.payment_method === "cash" ? "Tunai" : t.payment_method === "transfer" ? "Transfer" : "QRIS"}`,
      amount: formatCurrency(t.total || 0),
    })),
    ...lowStockProducts.slice(0, 2).map((p: any, i: number) => ({
      id: 100 + i,
      type: "warning",
      icon: "alert",
      title: `${p.name} stok menipis`,
      meta: `${p.stock} ${p.unit} tersisa`,
      amount: "",
    })),
  ];

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
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight"><AnimatedNumber value={stats.totalSales} prefix="Rp " /></span>
            <Wallet className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#072C2C]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total transaksi</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#16A34A] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+8%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight"><AnimatedNumber value={stats.totalTransactions} /></span>
            <Receipt className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#D97706]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Rata-rata / transaksi</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#16A34A] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+4%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight"><AnimatedNumber value={stats.avgTransaction} prefix="Rp " /></span>
            <Calculator className="w-3.5 h-3.5 text-[#9CA3AF] hidden lg:block" />
          </div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 lg:p-3.5 border-l-[3px] border-l-[#DC2626]">
          <div className="flex items-center justify-between mb-1 lg:mb-2">
            <span className="text-[9px] lg:text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok menipis</span>
            <span className="flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-[#DC2626] font-mono"><TrendingUp className="w-[11px] h-[11px]" />+2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[Oswald] text-[18px] lg:text-[24px] font-semibold text-[#072C2C] tracking-tight"><AnimatedNumber value={stats.lowStockCount} suffix=" produk" /></span>
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
              {topProductsData.length === 0 ? (
                <tr><td colSpan={5} className="px-2.5 py-6 text-center text-[11px] text-[#9CA3AF]">Belum ada data penjualan</td></tr>
              ) : topProductsData.map((p: any, idx: number) => {
                const status = p.stock <= 0 ? "Habis" : p.stock <= p.min_stock ? "Menipis" : "Aman";
                const statusType = p.stock <= 0 ? "r" : p.stock <= p.min_stock ? "a" : "g";
                return (
                <tr key={p.name} className="border-b border-[#D9D6C8] last:border-b-0 hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#EDEADE] border border-[#D9D6C8] flex items-center justify-center text-[12px] font-bold text-[#072C2C]/50 flex-shrink-0">{idx + 1}</div>
                      <div>
                        <div className="text-[12px] font-medium text-[#111827]">{p.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-light">{p.cat}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[11px]">{p.sold} {p.unit}</td>
                  <td className="px-2.5 py-2 font-mono text-[11px] font-bold text-[#16A34A] hidden sm:table-cell">{formatCurrency(p.rev)}</td>
                  <td className="px-2.5 py-2">
                    <span className={`text-[9px] font-bold font-mono px-[7px] py-[2px] rounded border ${pillClasses[statusType]} tracking-wide`}>{status}</span>
                  </td>
                  <td className="px-2.5 py-2 hidden md:table-cell">
                    <span className="text-[10px] text-[#9CA3AF]">—</span>
                  </td>
                </tr>
                );
              })}
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
