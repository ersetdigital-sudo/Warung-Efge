"use client";

import { useMemo } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Wallet, Receipt, Users } from "lucide-react";

export default function DemoReportsPage() {
  const { transactions, products, customers, suppliers } = useDemo();

  const stats = useMemo(() => {
    const totalSales = transactions.reduce((s, t) => s + (t.total || 0), 0);
    const totalTrx = transactions.length;
    const totalCustomerDebt = customers.reduce((s, c) => s + (c.debt || 0), 0);
    const totalSupplierDebt = suppliers.reduce((s, c) => s + (c.debt || 0), 0);
    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.stock <= p.min_stock).length;

    // Revenue by payment method
    const byMethod: Record<string, number> = {};
    for (const t of transactions) {
      const m = t.payment_method || "other";
      byMethod[m] = (byMethod[m] || 0) + (t.total || 0);
    }

    return { totalSales, totalTrx, totalCustomerDebt, totalSupplierDebt, totalProducts, lowStock, byMethod };
  }, [transactions, products, customers, suppliers]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Laporan</h1>
        <p className="text-[10px] text-[#9CA3AF] font-light">Ringkasan data demo</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 border-l-[3px] border-l-[#FF5F03]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#FF5F03]" />
            <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Penjualan</span>
          </div>
          <div className="font-[Oswald] text-lg font-bold text-[#072C2C]">{formatCurrency(stats.totalSales)}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">{stats.totalTrx} transaksi</div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 border-l-[3px] border-l-[#072C2C]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#072C2C]" />
            <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Total Produk</span>
          </div>
          <div className="font-[Oswald] text-lg font-bold text-[#072C2C]">{stats.totalProducts}</div>
          <div className="text-[10px] text-[#DC2626] mt-1">{stats.lowStock} stok menipis</div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 border-l-[3px] border-l-[#D97706]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#D97706]" />
            <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Piutang Pelanggan</span>
          </div>
          <div className="font-[Oswald] text-lg font-bold text-[#072C2C]">{formatCurrency(stats.totalCustomerDebt)}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">{customers.filter(c => c.debt > 0).length} pelanggan</div>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 border-l-[3px] border-l-[#DC2626]">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-[#DC2626]" />
            <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Hutang Supplier</span>
          </div>
          <div className="font-[Oswald] text-lg font-bold text-[#072C2C]">{formatCurrency(stats.totalSupplierDebt)}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">{suppliers.filter(s => s.debt > 0).length} supplier</div>
        </div>
      </div>

      {/* Revenue by method */}
      <div className="bg-white border border-[#D9D6C8] rounded-lg p-4">
        <h2 className="font-[Oswald] text-[12px] font-semibold text-[#072C2C] uppercase tracking-wider mb-3">Pendapatan per Metode Bayar</h2>
        <div className="space-y-2.5">
          {Object.entries(stats.byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
            const pct = stats.totalSales > 0 ? Math.round((amount / stats.totalSales) * 100) : 0;
            const label = method === "cash" ? "Tunai" : method === "qris" ? "QRIS" : method === "transfer" ? "Transfer" : method === "hutang" ? "Hutang" : method;
            const color = method === "cash" ? "#FF5F03" : method === "qris" ? "#072C2C" : method === "transfer" ? "#D97706" : "#DC2626";
            return (
              <div key={method} className="flex items-center gap-3">
                <span className="w-16 text-[11px] font-medium text-[#4B5563]">{label}</span>
                <div className="flex-1 h-5 bg-[#EDEADE] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-[11px] font-bold text-[#072C2C] font-mono w-24 text-right">{formatCurrency(amount)}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
