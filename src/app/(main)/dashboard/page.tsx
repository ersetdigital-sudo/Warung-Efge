"use client";

import { ShoppingCart, TrendingUp, Receipt, AlertTriangle, Users, Truck } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { dashboardStats, salesChartData, topProducts, products, customers, suppliers } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function DashboardPage() {
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald]">Dashboard</h1>
        <p className="text-sm text-[#072C2C]/60 mt-1">Ringkasan aktivitas toko hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Penjualan Hari Ini" value={formatCurrency(dashboardStats.todaySales)} icon={ShoppingCart} trend="+12% dari kemarin" trendUp={true} color="blue" />
        <StatCard title="Omzet Bulanan" value={formatCurrency(dashboardStats.monthlyRevenue)} icon={TrendingUp} trend="+8% dari bulan lalu" trendUp={true} color="green" />
        <StatCard title="Total Transaksi" value={formatNumber(dashboardStats.totalTransactions)} icon={Receipt} color="purple" />
        <StatCard title="Stok Menipis" value={`${dashboardStats.lowStockProducts} produk`} icon={AlertTriangle} color="yellow" />
        <StatCard title="Hutang Pelanggan" value={formatCurrency(dashboardStats.customerDebt)} icon={Users} color="red" />
        <StatCard title="Hutang Supplier" value={formatCurrency(dashboardStats.supplierDebt)} icon={Truck} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Grafik Penjualan Minggu Ini</h3></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5F03" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FF5F03" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#072C2C10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#072C2C99" }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fill: "#072C2C99" }} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), "Penjualan"]} contentStyle={{ borderRadius: "12px", border: "1px solid #072C2C15", boxShadow: "0 4px 12px rgba(7,44,44,0.1)" }} />
                  <Area type="monotone" dataKey="sales" stroke="#FF5F03" strokeWidth={2.5} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Produk Terlaris</h3></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#072C2C10" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#072C2C99" }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={11} width={120} tick={{ fill: "#072C2C99" }} />
                  <Tooltip formatter={(value) => [formatNumber(value as number), "Terjual"]} contentStyle={{ borderRadius: "12px", border: "1px solid #072C2C15", boxShadow: "0 4px 12px rgba(7,44,44,0.1)" }} />
                  <Bar dataKey="sold" fill="#072C2C" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#072C2C]">Stok Menipis</h3>
              <Badge variant="danger">{lowStockProducts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#072C2C]/5">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-[#072C2C]">{product.name}</p>
                    <p className="text-xs text-[#072C2C]/50">Min: {product.minStock} {product.unit}</p>
                  </div>
                  <Badge variant={product.stock <= 0 ? "danger" : "warning"}>{product.stock} {product.unit}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Hutang Pelanggan</h3></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#072C2C]/5">
              {customers.filter((c) => c.debt > 0).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-[#072C2C]">{customer.name}</p>
                    <p className="text-xs text-[#072C2C]/50">{customer.phone}</p>
                  </div>
                  <p className="text-sm font-bold text-[#DC2626]">{formatCurrency(customer.debt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-base font-semibold text-[#072C2C]">Hutang Supplier</h3></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#072C2C]/5">
              {suppliers.filter((s) => s.debt > 0).map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-[#072C2C]">{supplier.name}</p>
                    <p className="text-xs text-[#072C2C]/50">{supplier.phone}</p>
                  </div>
                  <p className="text-sm font-bold text-[#D97706]">{formatCurrency(supplier.debt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
