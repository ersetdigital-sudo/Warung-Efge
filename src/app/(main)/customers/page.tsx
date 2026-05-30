"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { customers, transactions } from "@/data/mock-data";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<Customer | null>(null);
  const totalDebt = customers.reduce((s, c) => s + c.debt, 0);

  const columns = [
    { key: "name", label: "Nama", sortable: true, render: (item: Customer) => <button onClick={() => setViewingCustomer(item)} className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{item.name}</button> },
    { key: "phone", label: "Telepon", render: (item: Customer) => <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" />{item.phone}</div> },
    { key: "address", label: "Alamat", render: (item: Customer) => <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="truncate">{item.address || "-"}</span></div> },
    { key: "debt", label: "Hutang", sortable: true, render: (item: Customer) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${item.debt > 0 ? "text-red-600" : "text-green-600"}`}>{item.debt > 0 ? formatCurrency(item.debt) : "Lunas"}</span>
        {item.debt > 0 && <button onClick={() => setShowPayDebt(item)} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium cursor-pointer">Bayar</button>}
      </div>
    )},
    { key: "actions", label: "Aksi", render: (item: Customer) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setEditingCustomer(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        <button className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pelanggan</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola data pelanggan dan hutang</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Tambah Pelanggan</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pelanggan</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{customers.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Punya Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{customers.filter(c => c.debt > 0).length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(totalDebt)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Lunas</p><p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{customers.filter(c => c.debt === 0).length}</p></div>
      </div>
      <Card><CardContent><DataTable columns={columns} data={customers} searchPlaceholder="Cari pelanggan..." searchKeys={["name", "phone", "address"]} /></CardContent></Card>

      <Modal isOpen={showAddModal || !!editingCustomer} onClose={() => { setShowAddModal(false); setEditingCustomer(null); }} title={editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"} size="md">
        <form className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input type="text" defaultValue={editingCustomer?.name} placeholder="Nama lengkap" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label><input type="text" defaultValue={editingCustomer?.phone} placeholder="08xx-xxxx-xxxx" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea defaultValue={editingCustomer?.address} placeholder="Alamat" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} type="button">Batal</Button>
            <Button type="button" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }}>Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="Detail Pelanggan" size="lg">
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Telepon</p><p className="text-sm font-medium">{viewingCustomer.phone}</p></div>
              <div><p className="text-xs text-gray-500">Alamat</p><p className="text-sm font-medium">{viewingCustomer.address || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Hutang</p><p className={`text-sm font-bold ${viewingCustomer.debt > 0 ? "text-red-600" : "text-green-600"}`}>{viewingCustomer.debt > 0 ? formatCurrency(viewingCustomer.debt) : "Lunas"}</p></div>
              <div><p className="text-xs text-gray-500">Terdaftar</p><p className="text-sm font-medium">{formatDate(viewingCustomer.createdAt)}</p></div>
            </div>
            <div className="border-t pt-4"><h4 className="text-sm font-semibold mb-3">Riwayat Transaksi</h4>
              {transactions.filter(t => t.customerId === viewingCustomer.id).length === 0 ? <p className="text-sm text-gray-500">Belum ada transaksi</p> :
              <div className="space-y-2">{transactions.filter(t => t.customerId === viewingCustomer.id).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="text-sm font-medium">{t.id}</p><p className="text-xs text-gray-500">{formatDateTime(t.date)}</p></div>
                  <div className="text-right"><p className="text-sm font-medium">{formatCurrency(t.total)}</p>{t.isDebt && <Badge variant="warning">Bon</Badge>}</div>
                </div>
              ))}</div>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!showPayDebt} onClose={() => setShowPayDebt(null)} title="Bayar Hutang" size="sm">
        {showPayDebt && (
          <form className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 text-center"><p className="text-sm text-red-600">Sisa Hutang</p><p className="text-2xl font-bold text-red-700">{formatCurrency(showPayDebt.debt)}</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowPayDebt(null)} type="button">Batal</Button>
              <Button type="button" onClick={() => setShowPayDebt(null)}><DollarSign className="w-4 h-4" />Bayar</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
