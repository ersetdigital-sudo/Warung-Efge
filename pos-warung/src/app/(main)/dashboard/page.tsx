'use client';

import { ShoppingCart, TrendingUp, Receipt, AlertTriangle, Users, Truck } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { dashboardStats, salesChartData, topProducts, products, customers, suppliers } from '@/data/mock-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas toko hari ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatCurrency(dashboardStats.todaySales)}
          icon={ShoppingCart}
          trend="+12% dari kemarin"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Omzet Bulanan"
          value={formatCurrency(dashboardStats.monthlyRevenue)}
          icon={TrendingUp}
          trend="+8% dari bulan lalu"
          trendUp={true}
          color="green"
        />
        <StatCard
          title="Total Transaksi"
          value={formatNumber(dashboardStats.totalTransactions)}
          icon={Receipt}
          color="purple"
        />
        <StatCard
          title="Stok Menipis"
          value={`${dashboardStats.lowStockProducts} produk`}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Hutang Pelanggan"
          value={formatCurrency(dashboardStats.customerDebt)}
          icon={Users}
          color="red"
        />
        <StatCard
          title="Hutang Supplier"
          value={formatCurrency(dashboardStats.supplierDebt)}
          icon={Truck}
          color="indigo"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Grafik Penjualan Minggu Ini</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), 'Penjualan']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Produk Terlaris</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatNumber(value), 'Terjual']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="sold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Stok Menipis</h3>
              <Badge variant="danger">{lowStockProducts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">Min: {product.minStock} {product.unit}</p>
                  </div>
                  <Badge variant={product.stock <= 0 ? 'danger' : 'warning'}>
                    {product.stock} {product.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Debts */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Hutang Pelanggan</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {customers
                .filter((c) => c.debt > 0)
                .map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(customer.debt)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Debts */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Hutang Supplier</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {suppliers
                .filter((s) => s.debt > 0)
                .map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.phone}</p>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatCurrency(supplier.debt)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
