"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, DollarSign, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { transactions } from "@/data/mock-data";
import { getCustomers, updateCustomerDebt, addDebtPayment, getDebtPayments } from "@/lib/db";

export default function CustomersPage() {
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [toast, setToast] = useState("");
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [custs, pays] = await Promise.all([getCustomers(), getDebtPayments()]);
    setCustomerList(custs);
    setPayments(pays);
  };

  const totalDebt = customerList.reduce((s, c) => s + (c.debt || 0), 0);

  const handlePayDebt = async () => {
    if (!showPayDebt) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { alert("Masukkan jumlah bayar yang valid"); return; }
    if (amount > showPayDebt.debt) { alert("Jumlah bayar melebihi sisa hutang"); return; }

    // Update customer debt in Supabase
    const newDebt = showPayDebt.debt - amount;
    const success = await updateCustomerDebt(showPayDebt.id, newDebt);
    if (!success) { alert("Gagal menyimpan pembayaran"); return; }

    // Save payment record
    await addDebtPayment({
      customer_id: showPayDebt.id,
      amount,
      method: payMethod,
      note: payNote || (amount >= showPayDebt.debt ? "Pelunasan" : "Cicilan"),
    });

    // Reload data
    await loadData();

    // Reset & close
    setShowPayDebt(null);
    setPayAmount("");
    setPayMethod("cash");
    setPayNote("");
    setToast(amount >= showPayDebt.debt ? "Hutang lunas ✓" : "Pembayaran berhasil ✓");
    setTimeout(() => setToast(""), 2000);
  };

  const columns = [
    { key: "name", label: "Nama", sortable: true, render: (item: any) => <button onClick={() => setViewingCustomer(item)} className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{item.name}</button> },
    { key: "phone", label: "Telepon", render: (item: any) => <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" />{item.phone}</div> },
    { key: "address", label: "Alamat", render: (item: any) => <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="truncate">{item.address || "-"}</span></div> },
    { key: "debt", label: "Hutang", sortable: true, render: (item: any) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${item.debt > 0 ? "text-red-600" : "text-green-600"}`}>{item.debt > 0 ? formatCurrency(item.debt) : "Lunas"}</span>
        {item.debt > 0 && <button onClick={() => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); }} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium cursor-pointer">Bayar</button>}
      </div>
    )},
    { key: "actions", label: "Aksi", render: (item: any) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setEditingCustomer(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        <button className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 animate-in slide-in-from-top fade-in duration-200">
          <div className="px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#16A34A] flex items-center gap-2">
            <Check className="w-4 h-4" />{toast}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pelanggan</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola data pelanggan dan hutang</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Tambah Pelanggan</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pelanggan</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{customerList.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Punya Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{customerList.filter(c => c.debt > 0).length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(totalDebt)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Lunas</p><p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{customerList.filter(c => c.debt === 0).length}</p></div>
      </div>

      <Card><CardContent><DataTable columns={columns} data={customerList} searchPlaceholder="Cari pelanggan..." searchKeys={["name", "phone", "address"]} /></CardContent></Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal || !!editingCustomer} onClose={() => { setShowAddModal(false); setEditingCustomer(null); }} title={editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"} size="md">
        <form className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input type="text" defaultValue={editingCustomer?.name} placeholder="Nama lengkap" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label><input type="text" defaultValue={editingCustomer?.phone} placeholder="08xx-xxxx-xxxx" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea defaultValue={editingCustomer?.address} placeholder="Alamat" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} type="button">Batal</Button>
            <Button type="button" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="Detail Pelanggan" size="lg">
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Telepon</p><p className="text-sm font-medium">{viewingCustomer.phone}</p></div>
              <div><p className="text-xs text-gray-500">Alamat</p><p className="text-sm font-medium">{viewingCustomer.address || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Hutang</p><p className={`text-sm font-bold ${viewingCustomer.debt > 0 ? "text-red-600" : "text-green-600"}`}>{viewingCustomer.debt > 0 ? formatCurrency(viewingCustomer.debt) : "Lunas"}</p></div>
              <div><p className="text-xs text-gray-500">Terdaftar</p><p className="text-sm font-medium">{formatDate(viewingCustomer.createdAt)}</p></div>
            </div>
            {/* Payment History */}
            {payments.filter(p => p.customer_id === viewingCustomer.id).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Riwayat Pembayaran Hutang</h4>
                <div className="space-y-2">
                  {payments.filter(p => p.customer_id === viewingCustomer.id).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-[#F0FDF4] rounded-lg border border-[#16A34A]/10">
                      <div><p className="text-sm font-medium text-[#16A34A]">+{formatCurrency(p.amount)}</p><p className="text-xs text-gray-500">{formatDateTime(p.created_at)} · {p.method === "cash" ? "Tunai" : "Transfer"}</p></div>
                      <span className="text-xs text-gray-500">{p.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Transaction History */}
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

      {/* Pay Debt Modal */}
      <Modal isOpen={!!showPayDebt} onClose={() => setShowPayDebt(null)} title="Bayar Hutang" size="sm">
        {showPayDebt && (
          <div className="space-y-4">
            {/* Customer info */}
            <div className="bg-[#FEF2F2] rounded-xl p-4 text-center">
              <p className="text-xs text-[#DC2626]/70 font-medium">Sisa Hutang — {showPayDebt.name}</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-1">{formatCurrency(showPayDebt.debt)}</p>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Jumlah Bayar</label>
              <input
                type="text"
                inputMode="numeric"
                value={payAmount ? `Rp ${Number(payAmount).toLocaleString("id-ID")}` : ""}
                onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp 0"
                className="w-full px-4 py-3 text-lg font-bold text-[#072C2C] border border-[#D9D6C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] text-right"
              />
              {/* Quick buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button type="button" onClick={() => setPayAmount(String(showPayDebt.debt))} className="py-2 text-xs font-bold bg-[#FF5F03]/10 text-[#FF5F03] rounded-lg border border-[#FF5F03]/30 cursor-pointer active:scale-95">Lunas</button>
                <button type="button" onClick={() => setPayAmount(String(Math.round(showPayDebt.debt / 2)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer active:scale-95">Setengah</button>
                <button type="button" onClick={() => setPayAmount(String(Math.min(50000, showPayDebt.debt)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer active:scale-95">50rb</button>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPayMethod("cash")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all ${payMethod === "cash" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>💵 Tunai</button>
                <button type="button" onClick={() => setPayMethod("transfer")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all ${payMethod === "transfer" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>🏦 Transfer</button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Catatan (opsional)</label>
              <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Contoh: Cicilan minggu ke-2" className="w-full px-3 py-2 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
            </div>

            {/* Summary */}
            {Number(payAmount) > 0 && Number(payAmount) <= showPayDebt.debt && (
              <div className="bg-[#F0FDF4] rounded-xl p-3 border border-[#16A34A]/10">
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Bayar</span><span className="font-bold text-[#16A34A]">{formatCurrency(Number(payAmount))}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-[#072C2C]/60">Sisa hutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayDebt.debt - Number(payAmount))}</span></div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowPayDebt(null)} className="flex-1" type="button">Batal</Button>
              <button onClick={handlePayDebt} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#15803d] transition-colors">
                <DollarSign className="w-4 h-4" />Bayar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
