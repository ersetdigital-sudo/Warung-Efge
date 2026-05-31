"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, DollarSign, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSuppliers } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("transfer");
  const [toast, setToast] = useState("");

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const data = await getSuppliers(); setSuppliers(data); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("suppliers").delete().eq("id", deleteTarget.id);
    await loadData();
    setDeleteTarget(null);
    setToast("Supplier berhasil dihapus");
    setTimeout(() => setToast(""), 2000);
  };

  const handlePayDebt = async () => {
    if (!showPayDebt) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { alert("Masukkan jumlah bayar yang valid"); return; }
    if (amount > showPayDebt.debt) { alert("Jumlah bayar melebihi sisa hutang"); return; }
    const newDebt = showPayDebt.debt - amount;
    await supabase.from("suppliers").update({ debt: newDebt }).eq("id", showPayDebt.id);
    await loadData();
    setShowPayDebt(null);
    setPayAmount("");
    setToast(newDebt === 0 ? "Hutang lunas ✓" : "Pembayaran berhasil ✓");
    setTimeout(() => setToast(""), 2000);
  };

  const columns = [
    { key: "name", label: "Nama Supplier", sortable: true, render: (item: any) => <button onClick={() => setViewingSupplier(item)} className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{item.name}</button> },
    { key: "phone", label: "Telepon", render: (item: any) => <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" />{item.phone}</div> },
    { key: "debt", label: "Hutang", sortable: true, render: (item: any) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${item.debt > 0 ? "text-red-600" : "text-green-600"}`}>{item.debt > 0 ? formatCurrency(item.debt) : "Lunas"}</span>
        {item.debt > 0 && <button onClick={() => { setShowPayDebt(item); setPayAmount(""); }} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium cursor-pointer">Bayar</button>}
      </div>
    )},
    { key: "actions", label: "Aksi", render: (item: any) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setEditingSupplier(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 animate-in slide-in-from-top fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white flex items-center gap-2 ${toast.includes("lunas") || toast.includes("berhasil") ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            <Check className="w-4 h-4" />{toast}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Supplier</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola data supplier</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Tambah Supplier</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Supplier</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{suppliers.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(suppliers.reduce((s, sup) => s + (sup.debt || 0), 0))}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Supplier Lunas</p><p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{suppliers.filter((s) => !s.debt || s.debt === 0).length}</p></div>
      </div>

      <Card><CardContent><DataTable columns={columns} data={suppliers} searchPlaceholder="Cari supplier..." searchKeys={["name", "phone", "address"]} /></CardContent></Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal || !!editingSupplier} onClose={() => { setShowAddModal(false); setEditingSupplier(null); }} title={editingSupplier ? "Edit Supplier" : "Tambah Supplier"} size="lg">
        <form className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input type="text" defaultValue={editingSupplier?.name} placeholder="Nama supplier" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label><input type="text" defaultValue={editingSupplier?.phone} placeholder="021-xxx" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" defaultValue={editingSupplier?.email} placeholder="email@supplier.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea defaultValue={editingSupplier?.address} placeholder="Alamat lengkap" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingSupplier(null); }} type="button">Batal</Button>
            <Button type="button" onClick={() => { setShowAddModal(false); setEditingSupplier(null); }}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!viewingSupplier} onClose={() => setViewingSupplier(null)} title="Detail Supplier" size="lg">
        {viewingSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Telepon</p><p className="text-sm font-medium">{viewingSupplier.phone}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{viewingSupplier.email || "-"}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500">Alamat</p><p className="text-sm font-medium">{viewingSupplier.address}</p></div>
              <div><p className="text-xs text-gray-500">Hutang</p><p className={`text-sm font-bold ${viewingSupplier.debt > 0 ? "text-red-600" : "text-green-600"}`}>{viewingSupplier.debt > 0 ? formatCurrency(viewingSupplier.debt) : "Lunas"}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Debt Modal */}
      <Modal isOpen={!!showPayDebt} onClose={() => setShowPayDebt(null)} title="Bayar Hutang Supplier" size="sm">
        {showPayDebt && (
          <div className="space-y-4">
            <div className="bg-[#FEF2F2] rounded-xl p-4 text-center">
              <p className="text-xs text-[#DC2626]/70 font-medium">Sisa Hutang — {showPayDebt.name}</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-1">{formatCurrency(showPayDebt.debt)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Jumlah Bayar</label>
              <input type="text" inputMode="numeric" value={payAmount ? `Rp ${Number(payAmount).toLocaleString("id-ID")}` : ""} onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ""))} placeholder="Rp 0" className="w-full px-4 py-3 text-lg font-bold text-[#072C2C] border border-[#D9D6C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button type="button" onClick={() => setPayAmount(String(showPayDebt.debt))} className="py-2 text-xs font-bold bg-[#FF5F03]/10 text-[#FF5F03] rounded-lg border border-[#FF5F03]/30 cursor-pointer">Lunas</button>
                <button type="button" onClick={() => setPayAmount(String(Math.round(showPayDebt.debt / 2)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer">Setengah</button>
                <button type="button" onClick={() => setPayAmount(String(Math.min(1000000, showPayDebt.debt)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer">1jt</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Metode</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPayMethod("transfer")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer ${payMethod === "transfer" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>🏦 Transfer</button>
                <button type="button" onClick={() => setPayMethod("cash")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer ${payMethod === "cash" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>💵 Tunai</button>
              </div>
            </div>
            {Number(payAmount) > 0 && Number(payAmount) <= showPayDebt.debt && (
              <div className="bg-[#F0FDF4] rounded-xl p-3 border border-[#16A34A]/10">
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Bayar</span><span className="font-bold text-[#16A34A]">{formatCurrency(Number(payAmount))}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-[#072C2C]/60">Sisa hutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayDebt.debt - Number(payAmount))}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowPayDebt(null)} className="flex-1" type="button">Batal</Button>
              <button onClick={handlePayDebt} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#15803d]">
                <DollarSign className="w-4 h-4" />Bayar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus Supplier?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.name} akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-[#4B5563] text-white font-medium text-sm rounded-xl cursor-pointer">Batal</button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl cursor-pointer">
                <Trash2 className="w-4 h-4" />Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
