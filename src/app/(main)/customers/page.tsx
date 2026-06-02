"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, DollarSign, Check, User, Receipt, History, Users, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getCustomers, updateCustomerDebt, addDebtPayment, getDebtPayments } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"pelanggan" | "riwayat">("pelanggan");
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<any | null>(null);
  const [showAddDebt, setShowAddDebt] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [addDebtAmount, setAddDebtAmount] = useState("");
  const [addDebtNote, setAddDebtNote] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [payments, setPayments] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const loadData = async () => {
    const [custs, pays] = await Promise.all([getCustomers(), getDebtPayments()]);
    setCustomerList(custs);
    setPayments(pays);
  };

  const totalDebt = customerList.reduce((s, c) => s + (c.debt || 0), 0);

  // ===== CRUD PELANGGAN =====
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { showToast("Nama dan telepon wajib diisi", "error"); return; }
    if (editingCustomer) {
      const { error } = await supabase.from("customers").update({ name: formData.name, phone: formData.phone, address: formData.address }).eq("id", editingCustomer.id);
      if (error) { showToast("Gagal mengupdate pelanggan", "error"); return; }
      showToast("Pelanggan berhasil diperbarui");
    } else {
      const { error } = await supabase.from("customers").insert({ name: formData.name, phone: formData.phone, address: formData.address, debt: 0 });
      if (error) { showToast("Gagal menambah pelanggan", "error"); return; }
      showToast("Pelanggan berhasil ditambahkan");
    }
    await loadData();
    setShowAddModal(false); setEditingCustomer(null); setFormData({ name: "", phone: "", address: "" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("debt_payments").delete().eq("customer_id", deleteTarget.id);
    const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
    if (error) { showToast("Gagal menghapus pelanggan", "error"); return; }
    await loadData();
    setDeleteTarget(null);
    showToast("Pelanggan berhasil dihapus");
  };

  // ===== CATAT HUTANG BARU =====
  const handleAddDebt = async () => {
    if (!showAddDebt) return;
    const amount = Number(addDebtAmount);
    if (!amount || amount <= 0) { showToast("Masukkan jumlah hutang yang valid", "error"); return; }
    const newDebt = (showAddDebt.debt || 0) + amount;
    const { error } = await supabase.from("customers").update({ debt: newDebt }).eq("id", showAddDebt.id);
    if (error) { showToast("Gagal mencatat hutang", "error"); return; }
    // Catat ke debt_payments sebagai hutang baru (amount negatif = hutang, positif = bayar)
    await supabase.from("debt_payments").insert({
      customer_id: showAddDebt.id,
      amount: -amount,
      method: "hutang",
      note: addDebtNote || "Hutang baru",
    });
    await loadData();
    setShowAddDebt(null); setAddDebtAmount(""); setAddDebtNote("");
    showToast(`Hutang Rp ${amount.toLocaleString("id-ID")} berhasil dicatat`);
  };

  // ===== BAYAR HUTANG =====
  const handlePayDebt = async () => {
    if (!showPayDebt) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { showToast("Masukkan jumlah bayar yang valid", "error"); return; }
    if (amount > showPayDebt.debt) { showToast("Jumlah bayar melebihi sisa hutang", "error"); return; }
    const newDebt = showPayDebt.debt - amount;
    const success = await updateCustomerDebt(showPayDebt.id, newDebt);
    if (!success) { showToast("Gagal menyimpan pembayaran", "error"); return; }
    await addDebtPayment({ customer_id: showPayDebt.id, amount, method: payMethod, note: payNote || (amount >= showPayDebt.debt ? "Pelunasan" : "Cicilan") });
    await loadData();
    setShowPayDebt(null); setPayAmount(""); setPayMethod("cash"); setPayNote("");
    showToast(amount >= showPayDebt.debt ? "Hutang lunas ✓" : "Pembayaran berhasil ✓");
  };

  // ===== COLUMNS DESKTOP =====
  const columns = [
    { key: "name", label: "Nama", sortable: true, render: (item: any) => <button onClick={() => setViewingCustomer(item)} className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{item.name}</button> },
    { key: "phone", label: "Telepon", render: (item: any) => <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" />{item.phone}</div> },
    { key: "address", label: "Alamat", render: (item: any) => <span className="text-sm text-gray-600 truncate max-w-[160px] block">{item.address || "-"}</span> },
    { key: "debt", label: "Hutang", sortable: true, render: (item: any) => (
      <span className={`font-bold ${item.debt > 0 ? "text-red-600" : "text-green-600"}`}>
        {item.debt > 0 ? formatCurrency(item.debt) : "Lunas"}
      </span>
    )},
    { key: "actions", label: "Aksi", render: (item: any) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setShowAddDebt(item); setAddDebtAmount(""); setAddDebtNote(""); }} className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 font-medium cursor-pointer whitespace-nowrap">+ Hutang</button>
        {item.debt > 0 && <button onClick={() => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); }} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium cursor-pointer">Bayar</button>}
        <button onClick={() => { setEditingCustomer(item); setFormData({ name: item.name, phone: item.phone, address: item.address || "" }); }} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  // ===== RIWAYAT: pisahkan hutang baru vs bayar =====
  const allHistory = payments; // includes both debt records (amount < 0) and payments (amount > 0)

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Toast */}
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 animate-in slide-in-from-top fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white flex items-center gap-2 ${toastType === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            {toastType === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pelanggan</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola data pelanggan dan hutang</p>
        </div>
        <Button onClick={() => { setShowAddModal(true); setFormData({ name: "", phone: "", address: "" }); }}>
          <Plus className="w-4 h-4" />Tambah Pelanggan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pelanggan</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{customerList.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Punya Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{customerList.filter(c => c.debt > 0).length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{formatCurrency(totalDebt)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Lunas</p><p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{customerList.filter(c => c.debt === 0).length}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EEE8] p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("pelanggan")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pelanggan" ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/50 hover:text-[#072C2C]/80"}`}>
          <Users className="w-4 h-4" />Daftar Pelanggan
        </button>
        <button onClick={() => setActiveTab("riwayat")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "riwayat" ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/50 hover:text-[#072C2C]/80"}`}>
          <History className="w-4 h-4" />Riwayat Hutang
          {allHistory.length > 0 && <span className="bg-[#FF5F03] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{allHistory.length}</span>}
        </button>
      </div>

      {/* TAB: Daftar Pelanggan */}
      {activeTab === "pelanggan" && (
        <>
          <div className="hidden md:block">
            <Card><CardContent>
              <DataTable columns={columns} data={customerList} searchPlaceholder="Cari pelanggan..." searchKeys={["name", "phone", "address"]} />
            </CardContent></Card>
          </div>
          <div className="md:hidden space-y-3">
            {customerList.length === 0 ? (
              <div className="text-center py-12 text-[#072C2C]/40 text-sm">Belum ada pelanggan</div>
            ) : customerList.map((item) => {
              const custPayments = payments.filter(p => p.customer_id === item.id && p.amount > 0);
              return (
                <div key={item.id} className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#072C2C]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#072C2C]/50" />
                        </div>
                        <div>
                          <p className="font-bold text-[#072C2C] text-sm">{item.name}</p>
                          <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{item.phone}</p>
                          {item.address && <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{item.address}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.debt > 0 ? (
                          <span className="inline-block px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{formatCurrency(item.debt)}</span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg border border-green-100">Lunas</span>
                        )}
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">hutang</p>
                      </div>
                    </div>
                  </div>
                  {/* Riwayat bayar ringkas */}
                  {custPayments.length > 0 && (
                    <div className="mx-4 mb-3 bg-[#F8F7F4] rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[#072C2C]/50 uppercase tracking-wider mb-2">Terakhir Bayar</p>
                      {custPayments.slice(0, 2).map((p) => (
                        <div key={p.id} className="flex items-center justify-between mb-1.5 last:mb-0">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                            <div>
                              <p className="text-xs font-medium text-[#16A34A]">+{formatCurrency(p.amount)}</p>
                              <p className="text-[10px] text-[#9CA3AF]">{p.note}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF]">{formatDate(p.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 4 tombol aksi */}
                  <div className="border-t border-[#F0EEE8] grid grid-cols-4 divide-x divide-[#F0EEE8]">
                    <button onClick={() => { setShowAddDebt(item); setAddDebtAmount(""); setAddDebtNote(""); }} className="py-2.5 text-[11px] font-bold text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-1 cursor-pointer">
                      <Plus className="w-3 h-3" />Hutang
                    </button>
                    {item.debt > 0 ? (
                      <button onClick={() => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); }} className="py-2.5 text-[11px] font-bold text-[#16A34A] hover:bg-green-50 flex items-center justify-center gap-1 cursor-pointer">
                        <DollarSign className="w-3 h-3" />Bayar
                      </button>
                    ) : (
                      <button onClick={() => setViewingCustomer(item)} className="py-2.5 text-[11px] font-medium text-[#072C2C]/50 hover:bg-[#F8F7F4] flex items-center justify-center gap-1 cursor-pointer">
                        <Receipt className="w-3 h-3" />Detail
                      </button>
                    )}
                    <button onClick={() => { setEditingCustomer(item); setFormData({ name: item.name, phone: item.phone, address: item.address || "" }); }} className="py-2.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 cursor-pointer">
                      <Edit className="w-3 h-3" />Edit
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="py-2.5 text-[11px] font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1 cursor-pointer">
                      <Trash2 className="w-3 h-3" />Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB: Riwayat Hutang */}
      {activeTab === "riwayat" && (
        <div className="space-y-3">
          {allHistory.length === 0 ? (
            <div className="bg-white border border-[#E5E3DC] rounded-2xl p-10 text-center">
              <div className="w-14 h-14 bg-[#F0EEE8] rounded-full flex items-center justify-center mx-auto mb-3">
                <History className="w-7 h-7 text-[#072C2C]/30" />
              </div>
              <p className="text-sm font-medium text-[#072C2C]/50">Belum ada riwayat hutang</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Catat hutang atau pembayaran di tab Daftar Pelanggan</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F7F4] border-b border-[#E5E3DC]">
                    <tr>
                      {["Pelanggan", "Jenis", "Jumlah", "Metode", "Catatan", "Tanggal"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#072C2C]/60 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE8]">
                    {allHistory.map(p => {
                      const custName = p.customers?.name || customerList.find(c => c.id === p.customer_id)?.name || "—";
                      const isDebt = p.amount < 0;
                      return (
                        <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#072C2C]">{custName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isDebt ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                              {isDebt ? "📋 Hutang" : "✅ Bayar"}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-bold ${isDebt ? "text-red-600" : "text-[#16A34A]"}`}>
                            {isDebt ? `-${formatCurrency(Math.abs(p.amount))}` : `+${formatCurrency(p.amount)}`}
                          </td>
                          <td className="px-4 py-3">
                            {isDebt ? <span className="text-[11px] text-[#9CA3AF]">—</span> :
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${p.method === "cash" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                                {p.method === "cash" ? "💵 Tunai" : "🏦 Transfer"}
                              </span>
                            }
                          </td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs">{p.note || "—"}</td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs">{formatDateTime(p.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile */}
              <div className="md:hidden space-y-2.5">
                {allHistory.map(p => {
                  const custName = p.customers?.name || customerList.find(c => c.id === p.customer_id)?.name || "—";
                  const isDebt = p.amount < 0;
                  return (
                    <div key={p.id} className="bg-white border border-[#E5E3DC] rounded-2xl p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDebt ? "bg-red-50" : "bg-green-50"}`}>
                        {isDebt ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-[#16A34A]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[#072C2C] text-sm truncate">{custName}</p>
                          <p className={`font-bold text-sm ml-2 ${isDebt ? "text-red-600" : "text-[#16A34A]"}`}>
                            {isDebt ? `-${formatCurrency(Math.abs(p.amount))}` : `+${formatCurrency(p.amount)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${isDebt ? "text-red-500" : "text-green-600"}`}>{isDebt ? "Hutang baru" : "Pembayaran"}</span>
                          {!isDebt && <span className="text-[10px] text-[#9CA3AF]">· {p.method === "cash" ? "Tunai" : "Transfer"}</span>}
                          {p.note && <span className="text-[10px] text-[#9CA3AF]">· {p.note}</span>}
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{formatDateTime(p.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal: Tambah / Edit Pelanggan */}
      <Modal isOpen={showAddModal || !!editingCustomer} onClose={() => { setShowAddModal(false); setEditingCustomer(null); setFormData({ name: "", phone: "", address: "" }); }} title={editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"} size="md">
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#072C2C]/70 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Nama pelanggan" required className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#072C2C]/70 mb-1.5">No. Telepon <span className="text-red-500">*</span></label>
            <input type="text" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx" required className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#072C2C]/70 mb-1.5">Alamat</label>
            <textarea value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="Alamat (opsional)" rows={2} className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[#F0EEE8]">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} type="button">Batal</Button>
            <Button type="submit">{editingCustomer ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Catat Hutang Baru */}
      <Modal isOpen={!!showAddDebt} onClose={() => setShowAddDebt(null)} title="Catat Hutang Baru" size="sm">
        {showAddDebt && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#FFF8F5] border border-orange-100 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#072C2C]">{showAddDebt.name}</p>
                <p className="text-xs text-[#9CA3AF]">Hutang saat ini: <span className="font-semibold text-red-600">{formatCurrency(showAddDebt.debt || 0)}</span></p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Jumlah Hutang Baru</label>
              <input
                type="text" inputMode="numeric"
                value={addDebtAmount ? `Rp ${Number(addDebtAmount).toLocaleString("id-ID")}` : ""}
                onChange={e => setAddDebtAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp 0"
                className="w-full px-4 py-3 text-lg font-bold text-[#072C2C] border border-[#D9D6C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Keterangan</label>
              <input type="text" value={addDebtNote} onChange={e => setAddDebtNote(e.target.value)} placeholder="Contoh: Beli beras 5kg" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
            </div>
            {Number(addDebtAmount) > 0 && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Hutang sekarang</span><span className="font-semibold text-red-600">{formatCurrency(showAddDebt.debt || 0)}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-[#072C2C]/60">Tambah hutang</span><span className="font-semibold text-red-600">+{formatCurrency(Number(addDebtAmount))}</span></div>
                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-red-100"><span className="font-bold text-[#072C2C]">Total hutang</span><span className="font-bold text-red-600">{formatCurrency((showAddDebt.debt || 0) + Number(addDebtAmount))}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setShowAddDebt(null)} className="flex-1" type="button">Batal</Button>
              <button onClick={handleAddDebt} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#e05500]">
                <Plus className="w-4 h-4" />Catat Hutang
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Bayar Hutang */}
      <Modal isOpen={!!showPayDebt} onClose={() => setShowPayDebt(null)} title="Bayar Hutang" size="sm">
        {showPayDebt && (
          <div className="space-y-4">
            <div className="bg-[#FEF2F2] rounded-xl p-4 text-center">
              <p className="text-xs text-[#DC2626]/70 font-medium">Sisa Hutang — {showPayDebt.name}</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-1">{formatCurrency(showPayDebt.debt)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Jumlah Bayar</label>
              <input type="text" inputMode="numeric" value={payAmount ? `Rp ${Number(payAmount).toLocaleString("id-ID")}` : ""} onChange={e => setPayAmount(e.target.value.replace(/\D/g, ""))} placeholder="Rp 0" className="w-full px-4 py-3 text-lg font-bold text-[#072C2C] border border-[#D9D6C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button type="button" onClick={() => setPayAmount(String(showPayDebt.debt))} className="py-2 text-xs font-bold bg-[#FF5F03]/10 text-[#FF5F03] rounded-lg border border-[#FF5F03]/30 cursor-pointer">Lunas</button>
                <button type="button" onClick={() => setPayAmount(String(Math.round(showPayDebt.debt / 2)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer">½</button>
                <button type="button" onClick={() => setPayAmount(String(Math.min(50000, showPayDebt.debt)))} className="py-2 text-xs font-medium bg-[#EDEADE] text-[#072C2C] rounded-lg border border-[#D9D6C8] cursor-pointer">50rb</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Metode</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPayMethod("cash")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all ${payMethod === "cash" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>💵 Tunai</button>
                <button type="button" onClick={() => setPayMethod("transfer")} className={`py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all ${payMethod === "transfer" ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] text-[#072C2C]/70 border border-[#D9D6C8]"}`}>🏦 Transfer</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Catatan</label>
              <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Opsional" className="w-full px-3 py-2 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
            </div>
            {Number(payAmount) > 0 && Number(payAmount) <= showPayDebt.debt && (
              <div className="bg-[#F0FDF4] rounded-xl p-3 border border-[#16A34A]/10">
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Bayar</span><span className="font-bold text-[#16A34A]">{formatCurrency(Number(payAmount))}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="text-[#072C2C]/60">Sisa hutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayDebt.debt - Number(payAmount))}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setShowPayDebt(null)} className="flex-1" type="button">Batal</Button>
              <button onClick={handlePayDebt} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#16A34A] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#15803d]">
                <DollarSign className="w-4 h-4" />Bayar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Detail Pelanggan */}
      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="Detail Pelanggan" size="lg">
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8F7F4] rounded-xl p-3"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Telepon</p><p className="text-sm font-semibold text-[#072C2C] mt-0.5">{viewingCustomer.phone}</p></div>
              <div className="bg-[#F8F7F4] rounded-xl p-3"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Total Hutang</p><p className={`text-sm font-bold mt-0.5 ${viewingCustomer.debt > 0 ? "text-red-600" : "text-green-600"}`}>{viewingCustomer.debt > 0 ? formatCurrency(viewingCustomer.debt) : "Lunas"}</p></div>
              {viewingCustomer.address && <div className="col-span-2 bg-[#F8F7F4] rounded-xl p-3"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Alamat</p><p className="text-sm font-medium text-[#072C2C] mt-0.5">{viewingCustomer.address}</p></div>}
            </div>
            {(() => {
              const custHistory = payments.filter(p => p.customer_id === viewingCustomer.id);
              if (!custHistory.length) return <p className="text-sm text-[#9CA3AF] text-center py-4">Belum ada riwayat</p>;
              return (
                <div>
                  <p className="text-xs font-bold text-[#072C2C]/70 mb-2 uppercase tracking-wider">Riwayat Hutang & Pembayaran</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {custHistory.map(p => {
                      const isDebt = p.amount < 0;
                      return (
                        <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDebt ? "bg-red-50 border-red-100" : "bg-[#F0FDF4] border-[#16A34A]/10"}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDebt ? "bg-red-100" : "bg-green-100"}`}>
                              {isDebt ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <Check className="w-3.5 h-3.5 text-green-600" />}
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isDebt ? "text-red-600" : "text-[#16A34A]"}`}>{isDebt ? `-${formatCurrency(Math.abs(p.amount))}` : `+${formatCurrency(p.amount)}`}</p>
                              <p className="text-[10px] text-[#9CA3AF]">{p.note}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF]">{formatDateTime(p.created_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-3 pt-2 border-t border-[#F0EEE8]">
              <button onClick={() => { setViewingCustomer(null); setShowAddDebt(viewingCustomer); setAddDebtAmount(""); setAddDebtNote(""); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-50 text-orange-600 font-bold text-sm rounded-xl cursor-pointer hover:bg-orange-100">
                <Plus className="w-4 h-4" />Catat Hutang
              </button>
              {viewingCustomer.debt > 0 && (
                <button onClick={() => { setViewingCustomer(null); setShowPayDebt(viewingCustomer); setPayAmount(""); setPayNote(""); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#16A34A] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#15803d]">
                  <DollarSign className="w-4 h-4" />Bayar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-[#DC2626]" /></div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus Pelanggan?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5"><strong>{deleteTarget.name}</strong> dan seluruh riwayat hutangnya akan dihapus permanen.</p>
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
