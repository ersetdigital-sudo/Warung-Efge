"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, DollarSign, Check, AlertCircle, X, History, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSuppliers, addSupplierPayment, getSupplierPayments } from "@/lib/db";
import { supabase } from "@/lib/supabase";

type Supplier = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  debt: number;
  created_at?: string;
};

type SupplierPayment = {
  id: string;
  supplier_id: string;
  amount: number;
  method: string;
  note: string;
  created_at: string;
  suppliers?: { name: string };
};

type FormData = { name: string; phone: string; email: string; address: string };
type Toast = { msg: string; type: "success" | "error" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [toast, setToast] = useState<Toast>({ msg: "", type: "success" });
  const [formData, setFormData] = useState<FormData>({ name: "", phone: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);

  // History modal
  const [showHistory, setShowHistory] = useState<Supplier | null>(null);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await getSuppliers();
    setSuppliers(data as Supplier[]);
  };

  const openHistory = async (s: Supplier) => {
    setShowHistory(s);
    setLoadingHistory(true);
    const payments = await getSupplierPayments(s.id);
    setSupplierPayments(payments as SupplierPayment[]);
    setLoadingHistory(false);
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const openAdd = () => {
    setFormData({ name: "", phone: "", email: "", address: "" });
    setShowAddModal(true);
  };

  const openEdit = (s: Supplier) => {
    setFormData({ name: s.name, phone: s.phone, email: s.email || "", address: s.address || "" });
    setEditingSupplier(s);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", email: "", address: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { showToast("Nama dan telepon wajib diisi", "error"); return; }
    setSaving(true);
    if (editingSupplier) {
      const { error } = await supabase
        .from("suppliers")
        .update({ name: formData.name, phone: formData.phone, email: formData.email, address: formData.address })
        .eq("id", editingSupplier.id);
      if (error) { showToast("Gagal memperbarui supplier", "error"); setSaving(false); return; }
      showToast("Supplier berhasil diperbarui");
    } else {
      const { error } = await supabase
        .from("suppliers")
        .insert({ name: formData.name, phone: formData.phone, email: formData.email, address: formData.address, debt: 0 });
      if (error) { showToast("Gagal menambah supplier", "error"); setSaving(false); return; }
      showToast("Supplier berhasil ditambahkan");
    }
    await loadData();
    setSaving(false);
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", deleteTarget.id);
    if (error) { showToast("Gagal menghapus supplier", "error"); return; }
    await loadData();
    setDeleteTarget(null);
    showToast("Supplier berhasil dihapus");
  };

  const handlePayDebt = async () => {
    if (!showPayDebt) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { showToast("Masukkan jumlah bayar yang valid", "error"); return; }
    if (amount > showPayDebt.debt) { showToast("Jumlah bayar melebihi sisa hutang", "error"); return; }
    const newDebt = showPayDebt.debt - amount;
    const { error } = await supabase.from("suppliers").update({ debt: newDebt }).eq("id", showPayDebt.id);
    if (error) { showToast("Gagal mencatat pembayaran", "error"); return; }
    // Record payment history
    await addSupplierPayment({
      supplier_id: showPayDebt.id,
      amount,
      method: "cash",
      note: "Pembayaran hutang supplier",
    });
    await loadData();
    setShowPayDebt(null);
    setPayAmount("");
    showToast(newDebt === 0 ? "Hutang lunas! ✓" : "Pembayaran berhasil dicatat");
  };

  const totalDebt = suppliers.reduce((s, sup) => s + (sup.debt || 0), 0);
  const lunasCount = suppliers.filter(s => !s.debt || s.debt === 0).length;

  const columns = [
    {
      key: "name", label: "Nama Supplier", sortable: true,
      render: (item: Supplier) => (
        <div>
          <p className="font-semibold text-[#072C2C]">{item.name}</p>
          {item.email && <p className="text-xs text-[#9CA3AF]">{item.email}</p>}
        </div>
      ),
    },
    {
      key: "phone", label: "Telepon",
      render: (item: Supplier) => (
        <div className="flex items-center gap-1.5 text-sm text-[#072C2C]/70">
          <Phone className="w-3.5 h-3.5" />{item.phone}
        </div>
      ),
    },
    {
      key: "debt", label: "Hutang", sortable: true,
      render: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${item.debt > 0 ? "text-red-600" : "text-[#16A34A]"}`}>
            {item.debt > 0 ? formatCurrency(item.debt) : "Lunas"}
          </span>
          {item.debt > 0 && (
            <button
              onClick={() => { setShowPayDebt(item); setPayAmount(""); }}
              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium cursor-pointer"
            >Bayar</button>
          )}
        </div>
      ),
    },
    {
      key: "actions", label: "Aksi",
      render: (item: Supplier) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openHistory(item)} className="p-1.5 rounded-md hover:bg-purple-50 text-purple-600 cursor-pointer" title="Riwayat Pembayaran">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer" title="Hapus">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Toast */}
      {toast.msg && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 animate-in slide-in-from-top fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-bold text-white flex items-center gap-2 ${toast.type === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Supplier</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola data supplier dan hutang pembelian</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" />Tambah Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Supplier</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Supplier Lunas</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{lunasCount}</p>
        </div>
      </div>

      {/* Desktop Table */}
      <Card>
        <CardContent>
          <div className="hidden md:block">
            <DataTable columns={columns} data={suppliers} searchPlaceholder="Cari supplier..." searchKeys={["name", "phone", "address", "email"]} />
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {suppliers.length === 0 && (
              <p className="text-center py-8 text-sm text-[#9CA3AF]">Belum ada supplier</p>
            )}
            {suppliers.map((s) => (
              <div key={s.id} className="relative bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
                {/* Color strip top */}
                <div className={`h-1.5 w-full ${s.debt > 0 ? "bg-red-500" : "bg-[#16A34A]"}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${s.debt > 0 ? "bg-red-500" : "bg-[#16A34A]"}`}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#072C2C] text-sm leading-tight">{s.name}</p>
                      <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mt-0.5">
                        <Phone className="w-3 h-3" />{s.phone}
                      </div>
                      {s.address && (
                        <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mt-0.5">
                          <MapPin className="w-3 h-3" /><span className="truncate">{s.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.debt > 0 ? (
                        <span className="text-sm font-black text-red-600">{formatCurrency(s.debt)}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#16A34A]/10 text-[#16A34A]">Lunas</span>
                      )}
                    </div>
                  </div>
                  {/* Action bar */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0EEE8]">
                    <button
                      onClick={() => { if (s.debt > 0) { setShowPayDebt(s); setPayAmount(""); } }}
                      disabled={s.debt === 0}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${s.debt > 0 ? "bg-[#16A34A] text-white hover:bg-[#15803d] cursor-pointer" : "bg-[#F0EEE8] text-[#9CA3AF] cursor-not-allowed"}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />Bayar
                    </button>
                    <button
                      onClick={() => openHistory(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />Riwayat
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Modal — bottom sheet on mobile, centered on desktop */}
      {(showAddModal || !!editingSupplier) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EEE8]">
              <h3 className="text-base font-bold text-[#072C2C]">{editingSupplier ? "Edit Supplier" : "Tambah Supplier"}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Nama Supplier *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama supplier"
                  required
                  className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Telepon *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="08xx-xxxx-xxxx"
                    required
                    className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@supplier.com"
                    className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  placeholder="Alamat lengkap supplier"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FF5F03] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#e05500] disabled:opacity-50">
                  {saving ? "Menyimpan..." : (editingSupplier ? "Simpan Perubahan" : "Tambah Supplier")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {showPayDebt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setShowPayDebt(null)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#072C2C]">Bayar Hutang Supplier</h3>
              <button onClick={() => setShowPayDebt(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
              <p className="text-xs text-red-400 font-semibold">{showPayDebt.name} — Sisa Hutang</p>
              <p className="text-3xl font-black text-red-600 mt-1">{formatCurrency(showPayDebt.debt)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Jumlah Bayar</label>
              <input
                type="text"
                inputMode="numeric"
                value={payAmount ? `Rp ${Number(payAmount).toLocaleString("id-ID")}` : ""}
                onChange={e => setPayAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp 0"
                className="w-full px-4 py-3 text-xl font-black text-[#072C2C] border border-[#E5E3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 text-right"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button type="button" onClick={() => setPayAmount(String(showPayDebt.debt))} className="py-2 text-xs font-bold bg-green-50 text-green-700 rounded-xl border border-green-200 cursor-pointer">Lunas</button>
                <button type="button" onClick={() => setPayAmount(String(Math.round(showPayDebt.debt / 2)))} className="py-2 text-xs font-semibold bg-[#F8F7F4] text-[#072C2C]/70 rounded-xl border border-[#E5E3DC] cursor-pointer">Setengah</button>
                <button type="button" onClick={() => setPayAmount(String(Math.min(1000000, showPayDebt.debt)))} className="py-2 text-xs font-semibold bg-[#F8F7F4] text-[#072C2C]/70 rounded-xl border border-[#E5E3DC] cursor-pointer">1 Juta</button>
              </div>
            </div>
            {Number(payAmount) > 0 && Number(payAmount) <= showPayDebt.debt && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-[#072C2C]/60">Pembayaran</span><span className="font-bold text-[#16A34A]">{formatCurrency(Number(payAmount))}</span></div>
                <div className="flex justify-between"><span className="text-[#072C2C]/60">Sisa hutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayDebt.debt - Number(payAmount))}</span></div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowPayDebt(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
              <button onClick={handlePayDebt} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#15803d]">
                <DollarSign className="w-4 h-4" />Bayar Hutang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setShowHistory(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EEE8]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-[#072C2C]">Riwayat Pembayaran</h3>
              </div>
              <button onClick={() => setShowHistory(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
              <p className="text-sm font-bold text-[#072C2C]">{showHistory.name}</p>
              <p className="text-xs text-[#9CA3AF]">
                Sisa hutang: <span className={`font-bold ${showHistory.debt > 0 ? "text-red-600" : "text-[#16A34A]"}`}>{showHistory.debt > 0 ? formatCurrency(showHistory.debt) : "Lunas"}</span>
              </p>
            </div>
            <div className="p-5">
              {loadingHistory ? (
                <p className="text-center py-8 text-sm text-[#9CA3AF]">Memuat riwayat...</p>
              ) : supplierPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-[#9CA3AF]">Belum ada riwayat pembayaran</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {supplierPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-[#FAFAF8] border border-[#E5E3DC] rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-[#16A34A]">+{formatCurrency(p.amount)}</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{p.note} · {p.method === "cash" ? "Tunai" : p.method}</p>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF]">{formatDate(p.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowHistory(null)} className="w-full py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#072C2C]">Hapus Supplier?</h3>
              <p className="text-sm text-[#9CA3AF] mt-1"><strong className="text-[#072C2C]">{deleteTarget.name}</strong> akan dihapus secara permanen.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-[#DC2626] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#b91c1c]">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
