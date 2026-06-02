"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Phone, MapPin, DollarSign, Check,
  AlertCircle, Users, Clock, TrendingDown, ChevronRight,
  X, Search, ArrowLeft, FileText, CreditCard
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getCustomers, updateCustomerDebt, addDebtPayment, getDebtPayments } from "@/lib/db";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────
type Tab = "pelanggan" | "piutang" | "riwayat";
type Customer = { id: string; name: string; phone: string; address?: string; debt: number; created_at?: string };
type Payment = { id: string; customer_id: string; amount: number; method: string; note: string; created_at: string; customers?: { name: string } };

// ─── Helpers ─────────────────────────────────────────────────────
function debtAgeDays(payments: Payment[], customerId: string): number {
  const debts = payments.filter(p => p.customer_id === customerId && p.amount < 0);
  if (!debts.length) return 0;
  const oldest = debts[debts.length - 1];
  return Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / 86400000);
}

function AgeBadge({ days }: { days: number }) {
  if (days === 0) return <span className="text-[10px] text-[#9CA3AF]">—</span>;
  if (days <= 7) return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">{days}h</span>;
  if (days <= 30) return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{days}h</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{days}h ⚠️</span>;
}

// ─── Main Component ───────────────────────────────────────────────
export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pelanggan");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddDebt, setShowAddDebt] = useState<Customer | null>(null);
  const [showPayDebt, setShowPayDebt] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [addDebtAmount, setAddDebtAmount] = useState("");
  const [addDebtNote, setAddDebtNote] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");

  // Toast
  const [toast, setToast] = useState({ msg: "", type: "success" as "success" | "error" });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [custs, pays] = await Promise.all([getCustomers(), getDebtPayments()]);
    setCustomerList(custs as Customer[]);
    setPayments(pays as Payment[]);
  };

  // ─── Computed ────────────────────────────────────────────────────
  const activeDebtors = useMemo(() => customerList.filter(c => c.debt > 0), [customerList]);
  const totalDebt = useMemo(() => customerList.reduce((s, c) => s + (c.debt || 0), 0), [customerList]);
  const overdueCount = useMemo(() => activeDebtors.filter(c => debtAgeDays(payments, c.id) > 30).length, [activeDebtors, payments]);
  const paymentHistory = useMemo(() => payments.filter(p => p.amount > 0), [payments]);

  const filteredCustomers = useMemo(() => {
    if (!search) return customerList;
    return customerList.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );
  }, [customerList, search]);

  const filteredDebtors = useMemo(() => {
    if (!search) return activeDebtors;
    return activeDebtors.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );
  }, [activeDebtors, search]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { showToast("Nama dan telepon wajib diisi", "error"); return; }
    if (editingCustomer) {
      const { error } = await supabase.from("customers").update({ name: formData.name, phone: formData.phone, address: formData.address }).eq("id", editingCustomer.id);
      if (error) { showToast("Gagal update", "error"); return; }
      showToast("Pelanggan diperbarui");
    } else {
      const { error } = await supabase.from("customers").insert({ name: formData.name, phone: formData.phone, address: formData.address, debt: 0 });
      if (error) { showToast("Gagal tambah pelanggan", "error"); return; }
      showToast("Pelanggan ditambahkan");
    }
    await loadData();
    setShowAddModal(false); setEditingCustomer(null); setFormData({ name: "", phone: "", address: "" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("debt_payments").delete().eq("customer_id", deleteTarget.id);
    await supabase.from("customers").delete().eq("id", deleteTarget.id);
    await loadData();
    setDeleteTarget(null);
    if (selectedCustomer?.id === deleteTarget.id) setSelectedCustomer(null);
    showToast("Pelanggan dihapus");
  };

  const handleAddDebt = async () => {
    if (!showAddDebt) return;
    const amount = Number(addDebtAmount);
    if (!amount || amount <= 0) { showToast("Masukkan jumlah yang valid", "error"); return; }
    await supabase.from("customers").update({ debt: (showAddDebt.debt || 0) + amount }).eq("id", showAddDebt.id);
    await supabase.from("debt_payments").insert({ customer_id: showAddDebt.id, amount: -amount, method: "hutang", note: addDebtNote || "Piutang baru" });
    await loadData();
    setShowAddDebt(null); setAddDebtAmount(""); setAddDebtNote("");
    showToast(`Piutang ${formatCurrency(amount)} dicatat`);
  };

  const handlePayDebt = async () => {
    if (!showPayDebt) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { showToast("Masukkan jumlah yang valid", "error"); return; }
    if (amount > showPayDebt.debt) { showToast("Melebihi sisa piutang", "error"); return; }
    await updateCustomerDebt(showPayDebt.id, showPayDebt.debt - amount);
    await addDebtPayment({ customer_id: showPayDebt.id, amount, method: payMethod, note: payNote || (amount >= showPayDebt.debt ? "Pelunasan" : "Cicilan") });
    await loadData();
    setShowPayDebt(null); setPayAmount(""); setPayMethod("cash"); setPayNote("");
    showToast(amount >= showPayDebt.debt ? "Piutang lunas! ✓" : "Pembayaran berhasil");
  };

  // ─── Detail View ───────────────────────────────────────────────
  if (selectedCustomer) {
    const cust = customerList.find(c => c.id === selectedCustomer.id) || selectedCustomer;
    const custHistory = payments.filter(p => p.customer_id === cust.id);
    const custPayments = custHistory.filter(p => p.amount > 0);
    const custDebts = custHistory.filter(p => p.amount < 0);
    const totalPaid = custPayments.reduce((s, p) => s + p.amount, 0);
    const ageDays = debtAgeDays(payments, cust.id);

    return (
      <div className="max-w-2xl space-y-4 pb-20 md:pb-0">
        {/* Back */}
        <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 text-sm font-semibold text-[#072C2C]/60 hover:text-[#072C2C] cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />Kembali ke Pelanggan & Piutang
        </button>

        {/* Header card */}
        <div className="bg-[#072C2C] rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black">{cust.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{cust.name}</p>
                <p className="text-white/60 text-sm">📞 {cust.phone}</p>
                {cust.address && <p className="text-white/50 text-xs mt-0.5">📍 {cust.address}</p>}
              </div>
            </div>
            <button onClick={() => { setEditingCustomer(cust); setFormData({ name: cust.name, phone: cust.phone, address: cust.address || "" }); }} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer">
              <Edit className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* Debt summary */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Piutang Aktif</p>
              <p className={`text-lg font-black mt-0.5 ${cust.debt > 0 ? "text-red-300" : "text-green-400"}`}>{cust.debt > 0 ? formatCurrency(cust.debt) : "Lunas"}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Sudah Bayar</p>
              <p className="text-lg font-black text-green-400 mt-0.5">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Umur Piutang</p>
              <p className={`text-lg font-black mt-0.5 ${ageDays > 30 ? "text-red-300" : ageDays > 7 ? "text-amber-300" : "text-white"}`}>{ageDays > 0 ? `${ageDays} hari` : "—"}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setShowAddDebt(cust); setAddDebtAmount(""); setAddDebtNote(""); }} className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#FF5F03] text-[#FF5F03] font-bold text-sm rounded-2xl cursor-pointer hover:bg-[#FFF8F5] transition-colors">
            <Plus className="w-4 h-4" />Tambah Piutang
          </button>
          {cust.debt > 0 ? (
            <button onClick={() => { setShowPayDebt(cust); setPayAmount(""); setPayNote(""); }} className="flex items-center justify-center gap-2 py-3 bg-[#16A34A] text-white font-bold text-sm rounded-2xl cursor-pointer hover:bg-[#15803d] transition-colors">
              <DollarSign className="w-4 h-4" />Catat Pembayaran
            </button>
          ) : (
            <button onClick={() => setDeleteTarget(cust)} className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-red-200 text-red-500 font-bold text-sm rounded-2xl cursor-pointer hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />Hapus Pelanggan
            </button>
          )}
        </div>

        {/* Riwayat piutang */}
        {custDebts.length > 0 && (
          <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              <p className="text-sm font-bold text-[#072C2C]">Riwayat Piutang</p>
              <span className="ml-auto text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{custDebts.length} transaksi</span>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {custDebts.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(Math.abs(p.amount))}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{p.note}</p>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">{formatDate(p.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat pembayaran */}
        {custPayments.length > 0 && (
          <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F5F5F5] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-500" />
              <p className="text-sm font-bold text-[#072C2C]">Riwayat Pembayaran</p>
              <span className="ml-auto text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{custPayments.length} kali bayar</span>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {custPayments.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-600">+{formatCurrency(p.amount)}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{p.note} · {p.method === "cash" ? "Tunai" : "Transfer"}</p>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF]">{formatDate(p.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {custHistory.length === 0 && (
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#9CA3AF]">Belum ada riwayat transaksi</p>
          </div>
        )}

        {/* Modals (edit, add debt, pay debt, delete) */}
        {renderModals()}
      </div>
    );
  }

  // ─── Modals (shared) ─────────────────────────────────────────
  function renderModals() {
    return (
      <>
        {/* Add / Edit Customer */}
        {(showAddModal || !!editingCustomer) && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} />
            <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#072C2C]">{editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"}</h3>
                <button onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer"><X className="w-4 h-4 text-[#072C2C]/50" /></button>
              </div>
              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Nama Lengkap *</label>
                  <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Nama pelanggan" required className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">No. Telepon *</label>
                  <input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx" required className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Alamat</label>
                  <input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="Alamat (opsional)" className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#FF5F03] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#e05500]">{editingCustomer ? "Simpan" : "Tambah"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Debt */}
        {showAddDebt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddDebt(null)} />
            <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#072C2C]">Tambah Piutang</h3>
                <button onClick={() => setShowAddDebt(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer"><X className="w-4 h-4 text-[#072C2C]/50" /></button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#FFF8F5] border border-orange-100 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600">{showAddDebt.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-bold text-[#072C2C]">{showAddDebt.name}</p>
                  <p className="text-xs text-[#9CA3AF]">Piutang saat ini: <span className="font-bold text-red-500">{formatCurrency(showAddDebt.debt)}</span></p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Jumlah Piutang</label>
                <input type="text" inputMode="numeric" value={addDebtAmount ? `Rp ${Number(addDebtAmount).toLocaleString("id-ID")}` : ""} onChange={e => setAddDebtAmount(e.target.value.replace(/\D/g, ""))} placeholder="Rp 0" className="w-full px-4 py-3 text-xl font-black text-[#072C2C] border border-[#E5E3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Keterangan</label>
                <input value={addDebtNote} onChange={e => setAddDebtNote(e.target.value)} placeholder="Contoh: Beli beras 5kg" className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
              </div>
              {Number(addDebtAmount) > 0 && (
                <div className="bg-red-50 rounded-xl p-3 border border-red-100 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-[#072C2C]/60">Piutang saat ini</span><span className="font-semibold text-red-500">{formatCurrency(showAddDebt.debt)}</span></div>
                  <div className="flex justify-between"><span className="text-[#072C2C]/60">Tambah</span><span className="font-semibold text-red-500">+{formatCurrency(Number(addDebtAmount))}</span></div>
                  <div className="flex justify-between pt-1 border-t border-red-100"><span className="font-bold text-[#072C2C]">Total piutang</span><span className="font-black text-red-600">{formatCurrency(showAddDebt.debt + Number(addDebtAmount))}</span></div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowAddDebt(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                <button onClick={handleAddDebt} className="flex-1 py-2.5 bg-[#FF5F03] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#e05500] flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />Tambah Piutang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pay Debt */}
        {showPayDebt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowPayDebt(null)} />
            <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#072C2C]">Catat Pembayaran</h3>
                <button onClick={() => setShowPayDebt(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer"><X className="w-4 h-4 text-[#072C2C]/50" /></button>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                <p className="text-xs text-red-400 font-semibold">{showPayDebt.name} — Sisa Piutang</p>
                <p className="text-3xl font-black text-red-600 mt-1">{formatCurrency(showPayDebt.debt)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Jumlah Bayar</label>
                <input type="text" inputMode="numeric" value={payAmount ? `Rp ${Number(payAmount).toLocaleString("id-ID")}` : ""} onChange={e => setPayAmount(e.target.value.replace(/\D/g, ""))} placeholder="Rp 0" className="w-full px-4 py-3 text-xl font-black text-[#072C2C] border border-[#E5E3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 text-right" />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button type="button" onClick={() => setPayAmount(String(showPayDebt.debt))} className="py-2 text-xs font-bold bg-green-50 text-green-700 rounded-xl border border-green-200 cursor-pointer">Lunas</button>
                  <button type="button" onClick={() => setPayAmount(String(Math.round(showPayDebt.debt / 2)))} className="py-2 text-xs font-semibold bg-[#F8F7F4] text-[#072C2C]/70 rounded-xl border border-[#E5E3DC] cursor-pointer">Setengah</button>
                  <button type="button" onClick={() => setPayAmount(String(Math.min(50000, showPayDebt.debt)))} className="py-2 text-xs font-semibold bg-[#F8F7F4] text-[#072C2C]/70 rounded-xl border border-[#E5E3DC] cursor-pointer">50rb</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Metode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["cash", "💵 Tunai"], ["transfer", "🏦 Transfer"]].map(([m, label]) => (
                    <button key={m} type="button" onClick={() => setPayMethod(m)} className={`py-2.5 text-sm font-bold rounded-xl cursor-pointer transition-all ${payMethod === m ? "bg-[#072C2C] text-white" : "bg-[#F8F7F4] text-[#072C2C]/60 border border-[#E5E3DC]"}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Catatan</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Opsional" className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30" />
              </div>
              {Number(payAmount) > 0 && Number(payAmount) <= showPayDebt.debt && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-100 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-[#072C2C]/60">Pembayaran</span><span className="font-bold text-green-600">{formatCurrency(Number(payAmount))}</span></div>
                  <div className="flex justify-between"><span className="text-[#072C2C]/60">Sisa piutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayDebt.debt - Number(payAmount))}</span></div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowPayDebt(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                <button onClick={handlePayDebt} className="flex-1 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#15803d] flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />Bayar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto"><Trash2 className="w-7 h-7 text-red-500" /></div>
              <div>
                <h3 className="text-base font-bold text-[#072C2C]">Hapus Pelanggan?</h3>
                <p className="text-sm text-[#9CA3AF] mt-1"><strong className="text-[#072C2C]">{deleteTarget.name}</strong> dan seluruh riwayat piutangnya akan dihapus permanen.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-[#DC2626] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#b91c1c]">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── Main List View ───────────────────────────────────────────
  return (
    <div className="space-y-5 pb-20 md:pb-0">
      {/* Toast */}
      {toast.msg && (
        <div className="fixed z-[9999] top-4 right-4 animate-in slide-in-from-top fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-bold text-white flex items-center gap-2 ${toast.type === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pelanggan & Piutang</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Kelola pelanggan dan pantau piutang warung</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setFormData({ name: "", phone: "", address: "" }); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5F03] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-[#e05500] transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" />Tambah
        </button>
      </div>

      {/* Dashboard KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pelanggan</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{customerList.length}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#FF5F03]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Piutang Aktif</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#FF5F03] mt-1">{activeDebtors.length}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Piutang</p>
          <p className="font-[Oswald] text-[20px] font-semibold text-[#DC2626] mt-1 leading-tight">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Menunggak &gt;30 Hari</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor telepon..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#072C2C]/10 focus:border-[#072C2C]/30"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 bg-[#F0EEE8] p-1 rounded-2xl">
        {([
          ["pelanggan", Users, "Semua Pelanggan", customerList.length],
          ["piutang", AlertCircle, "Piutang Aktif", activeDebtors.length],
          ["riwayat", CreditCard, "Riwayat Bayar", paymentHistory.length],
        ] as const).map(([tab, Icon, label, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? "bg-[#FF5F03] text-white shadow-sm" : "text-[#072C2C]/40 hover:text-[#072C2C]/70"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{tab === "pelanggan" ? "Semua" : tab === "piutang" ? "Piutang" : "Riwayat"}</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/30 text-white" : "bg-[#072C2C]/10 text-[#072C2C]/40"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Semua Pelanggan ─────────────────────────────── */}
      {activeTab === "pelanggan" && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-[#9CA3AF] text-sm">Tidak ada pelanggan ditemukan</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F8F7F4] border-b border-[#EBEBEB]">
                  <tr>{["Pelanggan", "Telepon", "Alamat", "Piutang", "Status", "Aksi"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {filteredCustomers.map(item => (
                    <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedCustomer(item)} className="flex items-center gap-2.5 group cursor-pointer">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${item.debt > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>{item.name.charAt(0)}</div>
                          <span className="font-semibold text-[#072C2C] group-hover:text-[#FF5F03] transition-colors">{item.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF]">{item.phone}</td>
                      <td className="px-4 py-3 text-[#9CA3AF] max-w-[150px] truncate">{item.address || "—"}</td>
                      <td className="px-4 py-3 font-bold">{item.debt > 0 ? <span className="text-red-600">{formatCurrency(item.debt)}</span> : <span className="text-green-600">Lunas</span>}</td>
                      <td className="px-4 py-3">
                        {item.debt > 0
                          ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Ada Piutang</span>
                          : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">✓ Lunas</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setShowAddDebt(item); setAddDebtAmount(""); setAddDebtNote(""); }} className="text-[11px] px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-bold cursor-pointer">+ Piutang</button>
                          {item.debt > 0 && <button onClick={() => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); }} className="text-[11px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold cursor-pointer">Bayar</button>}
                          <button onClick={() => { setEditingCustomer(item); setFormData({ name: item.name, phone: item.phone, address: item.address || "" }); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-[#9CA3AF] text-sm">Tidak ada pelanggan</div>
            ) : filteredCustomers.map(item => (
              <div key={item.id} className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                <div className={`h-1 ${item.debt > 0 ? "bg-gradient-to-r from-red-400 to-orange-400" : "bg-gradient-to-r from-green-400 to-emerald-400"}`} />
                <button onClick={() => setSelectedCustomer(item)} className="w-full p-4 flex items-center gap-3 text-left cursor-pointer hover:bg-[#FAFAF8] transition-colors">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${item.debt > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>{item.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#072C2C] text-sm">{item.name}</p>
                    <p className="text-xs text-[#9CA3AF]">📞 {item.phone}</p>
                    {item.address && <p className="text-[11px] text-[#BBBBBB] truncate">📍 {item.address}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.debt > 0 ? (
                      <><p className="text-sm font-black text-red-600">{formatCurrency(item.debt)}</p><p className="text-[10px] text-red-400">piutang aktif</p></>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 px-2 py-1 rounded-xl text-[11px] font-bold text-green-600"><Check className="w-3 h-3" />Lunas</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#BBBBBB] ml-auto mt-1" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB: Piutang Aktif ───────────────────────────────── */}
      {activeTab === "piutang" && (
        <>
          {filteredDebtors.length === 0 ? (
            <div className="bg-white border border-[#EBEBEB] rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-500" /></div>
              <p className="text-sm font-bold text-[#072C2C]">{search ? "Tidak ditemukan" : "Semua Piutang Lunas! 🎉"}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{search ? "Coba kata kunci lain" : "Tidak ada piutang aktif saat ini"}</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F7F4] border-b border-[#EBEBEB]">
                    <tr>{["Pelanggan", "Jumlah Piutang", "Umur Piutang", "Status", "Aksi"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    {filteredDebtors.sort((a, b) => b.debt - a.debt).map(item => {
                      const age = debtAgeDays(payments, item.id);
                      return (
                        <tr key={item.id} className="hover:bg-[#FAFAF8]">
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedCustomer(item)} className="flex items-center gap-2 group cursor-pointer">
                              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center font-black text-sm text-red-500 flex-shrink-0">{item.name.charAt(0)}</div>
                              <div>
                                <p className="font-semibold text-[#072C2C] group-hover:text-[#FF5F03]">{item.name}</p>
                                <p className="text-[11px] text-[#9CA3AF]">{item.phone}</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 font-black text-red-600 text-base">{formatCurrency(item.debt)}</td>
                          <td className="px-4 py-3"><AgeBadge days={age} /></td>
                          <td className="px-4 py-3">
                            {age > 30 ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">⚠️ Menunggak</span>
                              : age > 7 ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Perlu Ditagih</span>
                              : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Baru</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setShowAddDebt(item); setAddDebtAmount(""); setAddDebtNote(""); }} className="text-[11px] px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 font-bold cursor-pointer whitespace-nowrap">+ Piutang</button>
                              <button onClick={() => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); }} className="text-[11px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold cursor-pointer whitespace-nowrap">Bayar</button>
                              <button onClick={() => setSelectedCustomer(item)} className="text-[11px] px-2.5 py-1 bg-[#F0EEE8] text-[#072C2C]/60 rounded-lg hover:bg-[#E8E5DC] font-bold cursor-pointer">Riwayat</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile piutang cards */}
              <div className="md:hidden space-y-2.5">
                {filteredDebtors.sort((a, b) => b.debt - a.debt).map(item => {
                  const age = debtAgeDays(payments, item.id);
                  return (
                    <div key={item.id} className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                      <div className={`h-1 ${age > 30 ? "bg-red-500" : age > 7 ? "bg-amber-400" : "bg-blue-400"}`} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button onClick={() => setSelectedCustomer(item)} className="flex items-center gap-3 flex-1 text-left cursor-pointer">
                            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center font-black text-lg text-red-500 flex-shrink-0">{item.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-[#072C2C] text-sm">{item.name}</p>
                              <p className="text-xs text-[#9CA3AF]">📞 {item.phone}</p>
                            </div>
                          </button>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-black text-red-600">{formatCurrency(item.debt)}</p>
                            <AgeBadge days={age} />
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#F5F5F5] grid grid-cols-3">
                        {[
                          { label: "+ Piutang", color: "text-orange-600 hover:bg-orange-50", action: () => { setShowAddDebt(item); setAddDebtAmount(""); setAddDebtNote(""); } },
                          { label: "Bayar", color: "text-green-600 hover:bg-green-50", action: () => { setShowPayDebt(item); setPayAmount(""); setPayNote(""); } },
                          { label: "Riwayat", color: "text-[#072C2C]/50 hover:bg-[#F8F7F4]", action: () => setSelectedCustomer(item) },
                        ].map(({ label, color, action }) => (
                          <button key={label} onClick={action} className={`py-3 text-[11px] font-bold ${color} transition-colors cursor-pointer`}>{label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── TAB: Riwayat Pembayaran ──────────────────────────── */}
      {activeTab === "riwayat" && (
        <>
          {paymentHistory.length === 0 ? (
            <div className="bg-white border border-[#EBEBEB] rounded-2xl p-12 text-center">
              <p className="text-sm text-[#9CA3AF]">Belum ada riwayat pembayaran piutang</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F7F4] border-b border-[#EBEBEB]">
                    <tr>{["Tanggal", "Pelanggan", "Nominal", "Metode", "Catatan"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    {paymentHistory.map(p => {
                      const custName = p.customers?.name || customerList.find(c => c.id === p.customer_id)?.name || "—";
                      return (
                        <tr key={p.id} className="hover:bg-[#FAFAF8]">
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                          <td className="px-4 py-3 font-semibold text-[#072C2C]">{custName}</td>
                          <td className="px-4 py-3 font-black text-green-600">+{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${p.method === "cash" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{p.method === "cash" ? "💵 Tunai" : "🏦 Transfer"}</span></td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs">{p.note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile */}
              <div className="md:hidden space-y-2.5">
                {paymentHistory.map(p => {
                  const custName = p.customers?.name || customerList.find(c => c.id === p.customer_id)?.name || "—";
                  return (
                    <div key={p.id} className="bg-white border border-[#EBEBEB] rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0"><Check className="w-5 h-5 text-green-500" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-[#072C2C] text-sm truncate">{custName}</p>
                          <p className="font-black text-green-600 text-sm flex-shrink-0">+{formatCurrency(p.amount)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.method === "cash" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{p.method === "cash" ? "Tunai" : "Transfer"}</span>
                          {p.note && <span className="text-[10px] text-[#9CA3AF] truncate">· {p.note}</span>}
                        </div>
                        <p className="text-[10px] text-[#BBBBBB] mt-0.5">{formatDateTime(p.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {renderModals()}
    </div>
  );
}
