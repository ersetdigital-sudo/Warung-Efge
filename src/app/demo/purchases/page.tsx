"use client";

import { useState } from "react";
import { Plus, Eye, Trash2, Check, AlertCircle, X, PackagePlus, DollarSign, Search } from "lucide-react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency, formatDate, getPaymentStatusLabel } from "@/lib/utils";

type Purchase = {
  id: string;
  purchase_number: string;
  supplier_id?: string;
  supplier_name: string;
  total_amount: number;
  paid_amount: number;
  status: "paid" | "partial" | "unpaid";
  created_at: string;
  purchase_items: PurchaseItem[];
};

type PurchaseItem = {
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
};

type ItemRow = {
  product_id: string;
  product_name: string;
  quantity: string;
  unit: string;
  price: string;
};

type Toast = { msg: string; type: "success" | "error" };

function generatePONumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `PO-${date}-${rand}`;
}

const EMPTY_ITEM: ItemRow = { product_id: "", product_name: "", quantity: "", unit: "pcs", price: "" };

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "demo-po-1",
    purchase_number: "PO-20240315-1001",
    supplier_id: "demo-s1",
    supplier_name: "PT Indofood Sukses Makmur",
    total_amount: 940000,
    paid_amount: 940000,
    status: "paid",
    created_at: "2024-03-15T08:00:00Z",
    purchase_items: [
      { product_name: "Indomie Goreng", quantity: 5, unit: "Dus", price: 112000, subtotal: 560000 },
      { product_name: "Kopi Kapal Api 165g", quantity: 2, unit: "Dus", price: 190000, subtotal: 380000 },
    ],
  },
  {
    id: "demo-po-2",
    purchase_number: "PO-20240318-1002",
    supplier_id: "demo-s3",
    supplier_name: "UD Maju Jaya",
    total_amount: 1940000,
    paid_amount: 1000000,
    status: "partial",
    created_at: "2024-03-18T08:00:00Z",
    purchase_items: [
      { product_name: "Beras Premium 5kg", quantity: 20, unit: "Karung", price: 62000, subtotal: 1240000 },
      { product_name: "Gula Pasir 1kg", quantity: 50, unit: "Kg", price: 14000, subtotal: 700000 },
    ],
  },
  {
    id: "demo-po-3",
    purchase_number: "PO-20240319-1003",
    supplier_id: "demo-s4",
    supplier_name: "PT Unilever Indonesia",
    total_amount: 432000,
    paid_amount: 432000,
    status: "paid",
    created_at: "2024-03-19T08:00:00Z",
    purchase_items: [
      { product_name: "Detergen Rinso 800g", quantity: 3, unit: "Dus", price: 144000, subtotal: 432000 },
    ],
  },
  {
    id: "demo-po-4",
    purchase_number: "PO-20240320-1004",
    supplier_id: "demo-s5",
    supplier_name: "CV Berkah Sentosa",
    total_amount: 850000,
    paid_amount: 0,
    status: "unpaid",
    created_at: "2024-03-20T08:00:00Z",
    purchase_items: [
      { product_name: "Sabun Lifebuoy 100g", quantity: 100, unit: "Pcs", price: 4000, subtotal: 400000 },
      { product_name: "Teh Sariwangi 25 sachet", quantity: 50, unit: "Kotak", price: 5000, subtotal: 250000 },
      { product_name: "Sambal ABC 135ml", quantity: 20, unit: "Botol", price: 7500, subtotal: 150000 },
    ],
  },
];

export default function DemoPurchasesPage() {
  const { products, suppliers } = useDemo();
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);
  const [toast, setToast] = useState<Toast>({ msg: "", type: "success" });
  const [saving, setSaving] = useState(false);

  // Purchase payment modal
  const [showPayPurchase, setShowPayPurchase] = useState<Purchase | null>(null);
  const [purchasePayAmount, setPurchasePayAmount] = useState("");

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const openAdd = () => {
    setSupplierId("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("cash");
    setItems([{ ...EMPTY_ITEM }]);
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setSupplierId("");
    setPaymentMethod("cash");
    setItems([{ ...EMPTY_ITEM }]);
  };

  const handleProductChange = (idx: number, productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) {
      setItems(prev => prev.map((r, i) => i === idx ? { ...EMPTY_ITEM } : r));
      return;
    }
    setItems(prev => prev.map((r, i) =>
      i === idx ? { ...r, product_id: productId, product_name: product.name, unit: product.unit || "pcs" } : r
    ));
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: string) => {
    setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addItemRow = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);

  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.price) || 0;
    return sum + qty * price;
  }, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { showToast("Pilih supplier terlebih dahulu", "error"); return; }
    const validItems = items.filter(r => r.product_id && Number(r.quantity) > 0 && Number(r.price) > 0);
    if (validItems.length === 0) { showToast("Tambahkan minimal satu item pembelian", "error"); return; }

    setSaving(true);
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    const purchaseNumber = generatePONumber();

    const newPurchase: Purchase = {
      id: `demo-po-${Date.now()}`,
      purchase_number: purchaseNumber,
      supplier_id: supplierId,
      supplier_name: supplier?.name || "",
      total_amount: totalAmount,
      paid_amount: paymentMethod === "cash" ? totalAmount : 0,
      status: paymentMethod === "cash" ? "paid" : "unpaid",
      created_at: new Date().toISOString(),
      purchase_items: validItems.map(r => ({
        product_name: r.product_name,
        quantity: Number(r.quantity),
        unit: r.unit,
        price: Number(r.price),
        subtotal: Number(r.quantity) * Number(r.price),
      })),
    };

    setPurchases(prev => [newPurchase, ...prev]);
    setSaving(false);
    closeAdd();
    showToast(`Pembelian ${purchaseNumber} berhasil dibuat${paymentMethod === "credit" ? " — hutang dicatat" : " — lunas"}`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPurchases(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Pembelian berhasil dihapus");
  };

  const handlePayPurchase = () => {
    if (!showPayPurchase) return;
    const amount = Number(purchasePayAmount);
    const remaining = showPayPurchase.total_amount - showPayPurchase.paid_amount;
    if (!amount || amount <= 0) { showToast("Masukkan jumlah bayar yang valid", "error"); return; }
    if (amount > remaining) { showToast("Jumlah bayar melebihi sisa hutang", "error"); return; }
    const newPaid = showPayPurchase.paid_amount + amount;
    const newStatus: "paid" | "partial" = newPaid >= showPayPurchase.total_amount ? "paid" : "partial";

    setPurchases(prev => prev.map(p =>
      p.id === showPayPurchase.id ? { ...p, paid_amount: newPaid, status: newStatus } : p
    ));

    if (viewingPurchase?.id === showPayPurchase.id) {
      setViewingPurchase(prev => prev ? { ...prev, paid_amount: newPaid, status: newStatus } : prev);
    }
    setShowPayPurchase(null);
    setPurchasePayAmount("");
    showToast(newStatus === "paid" ? "Pembelian lunas!" : "Pembayaran berhasil dicatat");
  };

  const filteredPurchases = purchases.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.purchase_number.toLowerCase().includes(q) || p.supplier_name.toLowerCase().includes(q);
  });

  const totalValue = purchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const unpaidCount = purchases.filter(p => p.status !== "paid").length;

  const statusBadge = (status: string) => {
    if (status === "paid") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Lunas</span>;
    if (status === "partial") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Sebagian</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Belum Bayar</span>;
  };

  const statusStripColor = (status: string) => {
    if (status === "paid") return "bg-[#16A34A]";
    if (status === "partial") return "bg-amber-400";
    return "bg-red-500";
  };

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
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pembelian</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola pembelian barang dari supplier</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5F03] text-white rounded-xl font-bold text-sm hover:bg-[#e05500] cursor-pointer transition-colors">
          <Plus className="w-4 h-4" />Buat Pembelian
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pembelian</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{purchases.length}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#FF5F03]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Nilai</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Belum Lunas</p>
          <p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{unpaidCount}</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#D9D6C8] rounded-lg">
        <div className="p-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Cari nomor PO atau supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E3DC]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">No. PO</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Supplier</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Tanggal</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Total</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEE8]">
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-[#9CA3AF]">Belum ada data pembelian</td>
                    </tr>
                  )}
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFAF8]">
                      <td className="px-3 py-3"><span className="font-mono text-sm font-semibold text-[#072C2C]">{p.purchase_number}</span></td>
                      <td className="px-3 py-3 text-sm text-[#072C2C]">{p.supplier_name}</td>
                      <td className="px-3 py-3"><span className="text-sm text-[#9CA3AF]">{formatDate(p.created_at)}</span></td>
                      <td className="px-3 py-3"><span className="font-semibold text-[#072C2C]">{formatCurrency(p.total_amount)}</span></td>
                      <td className="px-3 py-3">{statusBadge(p.status)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewingPurchase(p)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer" title="Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.status !== "paid" && (
                            <button onClick={() => { setShowPayPurchase(p); setPurchasePayAmount(""); }} className="p-1.5 rounded-md hover:bg-green-50 text-green-600 cursor-pointer" title="Bayar">
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredPurchases.length === 0 && (
              <p className="text-center py-8 text-sm text-[#9CA3AF]">Belum ada data pembelian</p>
            )}
            {filteredPurchases.map((p) => (
              <div key={p.id} className="relative bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
                <div className={`h-1.5 w-full ${statusStripColor(p.status)}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#072C2C]">{p.purchase_number}</p>
                      <p className="text-sm text-[#9CA3AF] mt-0.5">{p.supplier_name}</p>
                    </div>
                    {statusBadge(p.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#9CA3AF]">{formatDate(p.created_at)}</p>
                    <p className="text-sm font-bold text-[#072C2C]">{formatCurrency(p.total_amount)}</p>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0EEE8]">
                    <button
                      onClick={() => setViewingPurchase(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />Detail
                    </button>
                    {p.status !== "paid" && (
                      <button
                        onClick={() => { setShowPayPurchase(p); setPurchasePayAmount(""); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />Bayar
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={closeAdd} />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[94vh]">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#F0EEE8] z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="text-base font-bold text-[#072C2C]">Buat Pembelian Baru</h3>
              <button onClick={closeAdd} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Supplier + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"
                  />
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="text-xs font-semibold text-[#072C2C]/60 mb-2 block">Metode Pembayaran *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "border-[#16A34A] bg-green-50 text-[#16A34A]"
                        : "border-[#E5E3DC] bg-white text-[#9CA3AF] hover:border-[#16A34A]/40"
                    }`}
                  >
                    <span className="text-base">💵</span> Cash / Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      paymentMethod === "credit"
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-[#E5E3DC] bg-white text-[#9CA3AF] hover:border-red-400/40"
                    }`}
                  >
                    <span className="text-base">📋</span> Kredit / Hutang
                  </button>
                </div>
                {paymentMethod === "credit" && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">⚠ Akan dicatat sebagai hutang ke supplier</p>
                )}
                {paymentMethod === "cash" && (
                  <p className="text-xs text-[#16A34A] mt-1.5 font-medium">✓ Lunas, tidak ada hutang</p>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#072C2C]">Item Pembelian</p>
                  <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5F03]/10 text-[#FF5F03] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#FF5F03]/20">
                    <Plus className="w-3.5 h-3.5" />Tambah Item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((row, idx) => (
                    <div key={idx} className="bg-[#FAFAF8] border border-[#E5E3DC] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#9CA3AF]">Item {idx + 1}</p>
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItemRow(idx)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[#9CA3AF] mb-0.5 block">Produk</label>
                        <select
                          value={row.product_id}
                          onChange={e => handleProductChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-[#E5E3DC] rounded-lg text-sm text-[#072C2C] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                        >
                          <option value="">Pilih Produk</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-[#9CA3AF] mb-0.5 block">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={e => updateItem(idx, "quantity", e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 border border-[#E5E3DC] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-[#9CA3AF] mb-0.5 block">Satuan</label>
                          <input
                            type="text"
                            value={row.unit}
                            onChange={e => updateItem(idx, "unit", e.target.value)}
                            className="w-full px-2 py-2 border border-[#E5E3DC] rounded-lg text-sm text-[#072C2C] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-[#9CA3AF] mb-0.5 block">Harga Beli</label>
                          <input
                            type="number"
                            min="0"
                            value={row.price}
                            onChange={e => updateItem(idx, "price", e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 border border-[#E5E3DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                          />
                        </div>
                      </div>
                      {row.product_id && Number(row.quantity) > 0 && Number(row.price) > 0 && (
                        <div className="flex justify-end">
                          <span className="text-xs font-bold text-[#FF5F03]">Subtotal: {formatCurrency(Number(row.quantity) * Number(row.price))}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              {totalAmount > 0 && (
                <div className="bg-[#072C2C] rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/70">Total Pembelian</p>
                  <p className="text-xl font-black text-white">{formatCurrency(totalAmount)}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeAdd} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF5F03] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#e05500] disabled:opacity-50">
                  <PackagePlus className="w-4 h-4" />{saving ? "Menyimpan..." : "Simpan Pembelian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setViewingPurchase(null)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#F0EEE8] z-10">
              <h3 className="text-base font-bold text-[#072C2C]">Detail Pembelian</h3>
              <button onClick={() => setViewingPurchase(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#EDEADE] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-bold text-[#072C2C]">{viewingPurchase.purchase_number}</p>
                  {statusBadge(viewingPurchase.status)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Supplier</p><p className="font-semibold text-[#072C2C]">{viewingPurchase.supplier_name}</p></div>
                  <div><p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Tanggal</p><p className="font-semibold text-[#072C2C]">{formatDate(viewingPurchase.created_at)}</p></div>
                  <div><p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Total</p><p className="font-bold text-[#FF5F03]">{formatCurrency(viewingPurchase.total_amount)}</p></div>
                  <div><p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Dibayar</p><p className="font-semibold text-[#16A34A]">{formatCurrency(viewingPurchase.paid_amount)}</p></div>
                </div>
              </div>
              {viewingPurchase.purchase_items && viewingPurchase.purchase_items.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#072C2C] mb-2 uppercase tracking-wider">Item Pembelian</p>
                  <div className="border border-[#E5E3DC] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#072C2C]">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/80">Produk</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-white/80">Qty</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-white/80">Harga</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-white/80">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EEE8]">
                        {viewingPurchase.purchase_items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAF8]">
                            <td className="px-3 py-2.5 font-medium text-[#072C2C]">{item.product_name}</td>
                            <td className="px-3 py-2.5 text-center text-[#9CA3AF]">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2.5 text-right text-[#9CA3AF]">{formatCurrency(item.price)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-[#072C2C]">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-[#E5E3DC] bg-[#EDEADE]">
                        <tr>
                          <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-bold text-[#072C2C]">Total</td>
                          <td className="px-3 py-2.5 text-right text-sm font-black text-[#FF5F03]">{formatCurrency(viewingPurchase.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
              {viewingPurchase.status !== "paid" && (
                <button
                  onClick={() => { setShowPayPurchase(viewingPurchase); setPurchasePayAmount(""); setViewingPurchase(null); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#15803d]"
                >
                  <DollarSign className="w-4 h-4" />Bayar Hutang Pembelian
                </button>
              )}
              <button onClick={() => setViewingPurchase(null)} className="w-full py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Payment Modal */}
      {showPayPurchase && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setShowPayPurchase(null)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#072C2C]">Bayar Hutang Pembelian</h3>
              <button onClick={() => setShowPayPurchase(null)} className="p-1.5 rounded-xl hover:bg-[#F0EEE8] cursor-pointer">
                <X className="w-4 h-4 text-[#072C2C]/50" />
              </button>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 space-y-1.5">
              <p className="text-xs text-red-400 font-semibold text-center">{showPayPurchase.purchase_number} — {showPayPurchase.supplier_name}</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#072C2C]/60">Total Pembelian</span>
                <span className="font-semibold text-[#072C2C]">{formatCurrency(showPayPurchase.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#072C2C]/60">Sudah Dibayar</span>
                <span className="font-semibold text-[#16A34A]">{formatCurrency(showPayPurchase.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-red-100">
                <span className="font-bold text-[#072C2C]">Sisa Hutang</span>
                <span className="text-2xl font-black text-red-600">{formatCurrency(showPayPurchase.total_amount - showPayPurchase.paid_amount)}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#072C2C]/60 mb-1 block">Jumlah Bayar</label>
              <input
                type="text"
                inputMode="numeric"
                value={purchasePayAmount ? `Rp ${Number(purchasePayAmount).toLocaleString("id-ID")}` : ""}
                onChange={e => setPurchasePayAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp 0"
                className="w-full px-4 py-3 text-xl font-black text-[#072C2C] border border-[#E5E3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 text-right"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPurchasePayAmount(String(showPayPurchase.total_amount - showPayPurchase.paid_amount))}
                  className="py-2 text-xs font-bold bg-green-50 text-green-700 rounded-xl border border-green-200 cursor-pointer"
                >Lunas</button>
                <button
                  type="button"
                  onClick={() => setPurchasePayAmount(String(Math.round((showPayPurchase.total_amount - showPayPurchase.paid_amount) / 2)))}
                  className="py-2 text-xs font-semibold bg-[#F8F7F4] text-[#072C2C]/70 rounded-xl border border-[#E5E3DC] cursor-pointer"
                >Setengah</button>
              </div>
            </div>
            {Number(purchasePayAmount) > 0 && Number(purchasePayAmount) <= (showPayPurchase.total_amount - showPayPurchase.paid_amount) && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-[#072C2C]/60">Pembayaran</span><span className="font-bold text-[#16A34A]">{formatCurrency(Number(purchasePayAmount))}</span></div>
                <div className="flex justify-between"><span className="text-[#072C2C]/60">Sisa hutang</span><span className="font-bold text-[#072C2C]">{formatCurrency(showPayPurchase.total_amount - showPayPurchase.paid_amount - Number(purchasePayAmount))}</span></div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowPayPurchase(null)} className="flex-1 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Batal</button>
              <button onClick={handlePayPurchase} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#15803d]">
                <DollarSign className="w-4 h-4" />Bayar
              </button>
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
              <h3 className="text-base font-bold text-[#072C2C]">Hapus Pembelian?</h3>
              <p className="text-sm text-[#9CA3AF] mt-1">
                <strong className="font-mono text-[#072C2C]">{deleteTarget.purchase_number}</strong> dan semua item-nya akan dihapus permanen.
              </p>
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
