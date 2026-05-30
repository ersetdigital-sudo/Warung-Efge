'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, Truck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { transactions, products, customers, suppliers, monthlySalesData, topProducts } from '@/data/mock-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportType = 'sales' | 'profit' | 'products' | 'debts';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [period, setPeriod] = useState('monthly');

  const reports = [
    { id: 'sales' as ReportType, label: 'Penjualan', icon: TrendingUp },
    { id: 'profit' as ReportType, label: 'Laba Rugi', icon: DollarSign },
    { id: 'products' as ReportType, label: 'Produk', icon: Package },
    { id: 'debts' as ReportType, label: 'Hutang', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-1">Analisis keuangan dan performa toko</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
          <Button variant="outline">
            <Calendar className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeReport === report.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <report.icon className="w-4 h-4" />
            {report.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'sales' && <SalesReport />}
      {activeReport === 'profit' && <ProfitReport />}
      {activeReport === 'products' && <ProductReport />}
      {activeReport === 'debts' && <DebtReport />}
    </div>
  );
}

function SalesReport() {
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;
  const avgTransaction = totalSales / totalTransactions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Penjualan</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg"><DollarSign className="w-4 h-4 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata Transaksi</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(avgTransaction)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg"><Package className="w-4 h-4 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Transaksi</p>
              <p className="text-lg font-bold text-gray-900">{formatNumber(totalTransactions)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">Grafik Penjualan Bulanan</h3>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Penjualan']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">Transaksi Terakhir</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Pelanggan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                    <td className="px-4 py-3">{t.customerName || 'Umum'}</td>
                    <td className="px-4 py-3">{t.items.length} item</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.isDebt ? 'warning' : 'success'}>
                        {t.isDebt ? 'Bon' : t.paymentMethod}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfitReport() {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalCOGS = transactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return itemSum + (product?.costPrice || 0) * item.quantity;
    }, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : '0';

  const profitData = [
    { name: 'Pendapatan', value: totalRevenue, color: '#3b82f6' },
    { name: 'HPP', value: totalCOGS, color: '#ef4444' },
    { name: 'Laba Kotor', value: grossProfit, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Pendapatan</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">HPP (Modal)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalCOGS)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Laba Kotor</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(grossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Margin Laba</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{profitMargin}%</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">Ringkasan Laba Rugi</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profitData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: item.color }}>{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductReport() {
  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Produk Terlaris</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip formatter={(value: any) => [formatNumber(value), 'Terjual']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="sold" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Kontribusi Revenue</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProducts} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slowest Products */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">Produk Paling Lambat Terjual</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {products.slice(-5).reverse().map((product) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">Stok: {product.stock} {product.unit}</p>
                </div>
                <Badge variant="warning">Lambat</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DebtReport() {
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.debt, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.debt, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-red-500" />
            <p className="text-sm text-gray-500">Total Hutang Pelanggan</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCustomerDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">{customers.filter(c => c.debt > 0).length} pelanggan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-gray-500">Total Hutang ke Supplier</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSupplierDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">{suppliers.filter(s => s.debt > 0).length} supplier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Rekap Hutang Pelanggan</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {customers.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(customer.debt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Rekap Hutang Supplier</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {suppliers.filter(s => s.debt > 0).sort((a, b) => b.debt - a.debt).map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                    <p className="text-xs text-gray-500">{supplier.phone}</p>
                  </div>
                  <p className="text-sm font-bold text-orange-600">{formatCurrency(supplier.debt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
