"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, Package, Users, Truck } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { transactions, products, customers, suppliers, monthlySalesData, topProducts } from "@/data/mock-data";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ReportType = "sales" | "profit" | "products" | "debts";

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const reports = [
    { id: "sales" as ReportType, label: "Penjualan", icon: TrendingUp },
    { id: "profit" as ReportType, label: "Laba Rugi", icon: DollarSign },
    { id: "products" as ReportType, label: "Produk", icon: Package },
    { id: "debts" as ReportType, label: "Hutang", icon: Users },
  ];

  const totalSales = transactions.reduce((s, t) => s + t.total, 0);
  const totalCOGS = transactions.reduce((s, t) => s + t.items.reduce((is, item) => { const p = products.find(pr => pr.id === item.productId); return is + (p?.costPrice || 0) * item.quantity; }, 0), 0);
  const grossProfit = totalSales - totalCOGS;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Laporan</h1><p className="text-sm text-gray-500 mt-1">Analisis keuangan dan performa toko</p></div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {reports.map((r) => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeReport === r.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <r.icon className="w-4 h-4" />{r.label}
          </button>
        ))}
      </div>

      {activeReport === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Penjualan</p><p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalSales)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Rata-rata Transaksi</p><p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalSales / transactions.length)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Transaksi</p><p className="text-xl font-bold text-purple-600 mt-1">{formatNumber(transactions.length)}</p></div>
          </div>
          <Card><CardHeader><h3 className="text-base font-semibold">Penjualan Bulanan</h3></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlySalesData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} /><YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} /><Tooltip formatter={(value: any) => [formatCurrency(value), "Penjualan"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} /><Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        </div>
      )}


      {activeReport === "profit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Pendapatan</p><p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalSales)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">HPP (Modal)</p><p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalCOGS)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Laba Kotor</p><p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(grossProfit)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Margin</p><p className="text-xl font-bold text-purple-600 mt-1">{(grossProfit / totalSales * 100).toFixed(1)}%</p></div>
          </div>
          <Card><CardHeader><h3 className="text-base font-semibold">Ringkasan Laba Rugi</h3></CardHeader><CardContent><div className="space-y-3">
            {[{ name: "Pendapatan", value: totalSales, color: "#3b82f6" }, { name: "HPP", value: totalCOGS, color: "#ef4444" }, { name: "Laba Kotor", value: grossProfit, color: "#22c55e" }].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm font-medium">{item.name}</span></div><span className="text-sm font-bold" style={{ color: item.color }}>{formatCurrency(item.value)}</span></div>
            ))}
          </div></CardContent></Card>
        </div>
      )}

      {activeReport === "products" && (
        <div className="space-y-6">
          <Card><CardHeader><h3 className="text-base font-semibold">Produk Terlaris</h3></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} /><YAxis axisLine={false} tickLine={false} fontSize={12} /><Tooltip formatter={(value: any) => [formatNumber(value), "Terjual"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} /><Bar dataKey="sold" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardHeader><h3 className="text-base font-semibold">Produk Lambat Terjual</h3></CardHeader><CardContent className="p-0"><div className="divide-y divide-gray-100">{products.slice(-5).reverse().map((p) => <div key={p.id} className="flex items-center justify-between px-5 py-3"><div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-gray-500">Stok: {p.stock} {p.unit}</p></div><Badge variant="warning">Lambat</Badge></div>)}</div></CardContent></Card>
        </div>
      )}

      {activeReport === "debts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-red-500" /><p className="text-sm text-gray-500">Hutang Pelanggan</p></div><p className="text-2xl font-bold text-red-600">{formatCurrency(customers.reduce((s,c) => s+c.debt, 0))}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2 mb-2"><Truck className="w-5 h-5 text-orange-500" /><p className="text-sm text-gray-500">Hutang ke Supplier</p></div><p className="text-2xl font-bold text-orange-600">{formatCurrency(suppliers.reduce((s,sup) => s+sup.debt, 0))}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><h3 className="text-base font-semibold">Hutang Pelanggan</h3></CardHeader><CardContent className="p-0"><div className="divide-y divide-gray-100">{customers.filter(c=>c.debt>0).sort((a,b)=>b.debt-a.debt).map(c=><div key={c.id} className="flex items-center justify-between px-5 py-3"><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.phone}</p></div><p className="text-sm font-bold text-red-600">{formatCurrency(c.debt)}</p></div>)}</div></CardContent></Card>
            <Card><CardHeader><h3 className="text-base font-semibold">Hutang Supplier</h3></CardHeader><CardContent className="p-0"><div className="divide-y divide-gray-100">{suppliers.filter(s=>s.debt>0).sort((a,b)=>b.debt-a.debt).map(s=><div key={s.id} className="flex items-center justify-between px-5 py-3"><div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-gray-500">{s.phone}</p></div><p className="text-sm font-bold text-orange-600">{formatCurrency(s.debt)}</p></div>)}</div></CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}
