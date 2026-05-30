"use client";

import { useState } from "react";
import { Plus, Eye, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, getPaymentStatusLabel } from "@/lib/utils";
import { purchases, suppliers, products } from "@/data/mock-data";
import { Purchase } from "@/types";

export default function PurchasesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const columns = [
    { key: "id", label: "No. PO", render: (item: Purchase) => <span className="font-mono text-sm font-medium">{item.id}</span> },
    { key: "supplierName", label: "Supplier", sortable: true },
    { key: "date", label: "Tanggal", sortable: true, render: (item: Purchase) => <span className="text-sm text-gray-500">{formatDate(item.date)}</span> },
    { key: "totalAmount", label: "Total", sortable: true, render: (item: Purchase) => <span className="font-medium">{formatCurrency(item.totalAmount)}</span> },
    { key: "paidAmount", label: "Dibayar", render: (item: Purchase) => <span className="text-gray-600">{formatCurrency(item.paidAmount)}</span> },
    { key: "status", label: "Status", render: (item: Purchase) => <Badge variant={item.status === "paid" ? "success" : item.status === "partial" ? "warning" : "danger"}>{getPaymentStatusLabel(item.status)}</Badge> },
    { key: "actions", label: "Aksi", render: (item: Purchase) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewingPurchase(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Eye className="w-4 h-4" /></button>
        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 cursor-pointer"><Printer className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald]">Pembelian</h1><p className="text-sm text-[#072C2C]/60 mt-1">Kelola pembelian barang dari supplier</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Buat Pembelian</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-4"><p className="text-sm text-[#072C2C]/60">Total Pembelian</p><p className="text-2xl font-bold text-[#072C2C] mt-1">{purchases.length}</p></div>
        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-4"><p className="text-sm text-[#072C2C]/60">Total Nilai</p><p className="text-2xl font-bold text-[#072C2C] mt-1">{formatCurrency(purchases.reduce((s, p) => s + p.totalAmount, 0))}</p></div>
        <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-4"><p className="text-sm text-[#072C2C]/60">Belum Lunas</p><p className="text-2xl font-bold text-[#D97706] mt-1">{purchases.filter((p) => p.status !== "paid").length}</p></div>
      </div>
      <Card><CardContent><DataTable columns={columns} data={purchases} searchPlaceholder="Cari nomor PO atau supplier..." searchKeys={["id", "supplierName"]} /></CardContent></Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Buat Pembelian Baru" size="xl">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Pilih Supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="border-t border-gray-100 pt-4"><h4 className="text-sm font-semibold text-gray-900 mb-3">Item Pembelian</h4>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5"><select className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"><option value="">Pilih Produk</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="col-span-2"><input type="number" placeholder="Qty" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="col-span-2"><select className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"><option>Pcs</option><option>Dus</option><option>Pak</option></select></div>
              <div className="col-span-2"><input type="number" placeholder="Harga" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="col-span-1"><Button size="sm">+</Button></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} type="button">Batal</Button>
            <Button type="button" onClick={() => setShowAddModal(false)}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingPurchase} onClose={() => setViewingPurchase(null)} title="Detail Pembelian" size="lg">
        {viewingPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">No. PO</p><p className="text-sm font-mono font-medium">{viewingPurchase.id}</p></div>
              <div><p className="text-xs text-gray-500">Tanggal</p><p className="text-sm font-medium">{formatDate(viewingPurchase.date)}</p></div>
              <div><p className="text-xs text-gray-500">Supplier</p><p className="text-sm font-medium">{viewingPurchase.supplierName}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={viewingPurchase.status === "paid" ? "success" : "warning"}>{getPaymentStatusLabel(viewingPurchase.status)}</Badge></div>
            </div>
            <div className="border-t pt-4"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Produk</th><th className="px-3 py-2 text-center text-xs">Qty</th><th className="px-3 py-2 text-right text-xs">Harga</th><th className="px-3 py-2 text-right text-xs">Subtotal</th></tr></thead><tbody className="divide-y divide-gray-100">{viewingPurchase.items.map((item, idx) => <tr key={idx}><td className="px-3 py-2">{item.productName}</td><td className="px-3 py-2 text-center">{item.quantity} {item.unit}</td><td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td><td className="px-3 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td></tr>)}</tbody><tfoot className="border-t"><tr><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{formatCurrency(viewingPurchase.totalAmount)}</td></tr></tfoot></table></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
