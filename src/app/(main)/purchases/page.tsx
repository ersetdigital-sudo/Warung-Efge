"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Trash2, Check, AlertCircle, X, PackagePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, getPaymentStatusLabel } from "@/lib/utils";
import { getSuppliers, getProducts, getProductUnits } from "@/lib/db";
import { supabase } from "@/lib/supabase";

type Purchase = {
  id: string;
  purchase_number: string;
  supplier_id?: string;
  supplier_name: string;
  total_amount: number;
  paid_amount: number;
  status: "paid" | "partial" | "unpaid";
  created_at: string;
  purchase_date?: string;
  purchase_items?: PurchaseItem[];
};

type PurchaseItem = {
  id?: string;
  purchase_id?: string;
  product_id: string;
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
  units: { name: string }[];
};

type Toast = { msg: string; type: "success" | "error" };

function generatePONumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `PO-${date}-${rand}`;
}

const EMPTY_ITEM: ItemRow = { product_id: "", product_name: "", quantity: "", unit: "pcs", price: "", units: [] };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);
  const [toast, setToast] = useState<Toast>({ msg: "", type: "success" });
  const [saving, setSaving] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const loadData = useCallback(async () => {
    const [supps, prods] = await Promise.all([getSuppliers(), getProducts()]);
    setSuppliers(supps);
    setProducts(prods);
    const { data } = await supabase
      .from("purchases")
      .select("*, purchase_items(*)")
      .order("created_at", { ascending: false });
    setPurchases((data || []) as Purchase[]);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setSupplierId("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setItems([{ ...EMPTY_ITEM }]);
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setSupplierId("");
    setItems([{ ...EMPTY_ITEM }]);
  };

  // When product is selected in a row, load its units
  const handleProductChange = async (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      setItems(prev => prev.map((r, i) => i === idx ? { ...EMPTY_ITEM } : r));
      return;
    }
    const units = await getProductUnits(productId);
    const defaultUnit = units.length > 0 ? units[0].name : (product.unit || "pcs");
    setItems(prev => prev.map((r, i) =>
      i === idx ? { ...r, product_id: productId, product_name: product.name, unit: defaultUnit, units } : r
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { showToast("Pilih supplier terlebih dahulu", "error"); return; }
    const validItems = items.filter(r => r.product_id && Number(r.quantity) > 0 && Number(r.price) > 0);
    if (validItems.length === 0) { showToast("Tambahkan minimal satu item pembelian", "error"); return; }

    setSaving(true);
    const supplier = suppliers.find(s => s.id === supplierId);
    const purchaseNumber = generatePONumber();

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        purchase_number: purchaseNumber,
        supplier_id: supplierId,
        supplier_name: supplier?.name || "",
        total_amount: totalAmount,
        paid_amount: 0,
        status: "unpaid",
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error("PURCHASE ERROR:", JSON.stringify(purchaseError, null, 2));
      showToast(`Gagal membuat pembelian: ${purchaseError?.message || purchaseError?.code || "unknown error"}`, "error");
      setSaving(false);
      return;
    }

    // Insert purchase items
    const itemRows = validItems.map(r => ({
      purchase_id: purchase.id,
      product_id: r.product_id,
      product_name: r.product_name,
      quantity: Number(r.quantity),
      unit: r.unit,
      price: Number(r.price),
      subtotal: Number(r.quantity) * Number(r.price),
    }));
    await supabase.from("purchase_items").insert(itemRows);

    // Update supplier debt
    if (supplier) {
      await supabase
        .from("suppliers")
        .update({ debt: (supplier.debt || 0) + totalAmount })
        .eq("id", supplierId);
    }

    // Update product stock (add qty to base stock)
    for (const row of validItems) {
      const product = products.find(p => p.id === row.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ stock: (product.stock || 0) + Number(row.quantity) })
          .eq("id", row.product_id);
      }
    }

    await loadData();
    setSaving(false);
    closeAdd();
    showToast(`Pembelian ${purchaseNumber} berhasil dibuat`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("purchase_items").delete().eq("purchase_id", deleteTarget.id);
    const { error } = await supabase.from("purchases").delete().eq("id", deleteTarget.id);
    if (error) { showToast("Gagal menghapus pembelian", "error"); return; }
    await loadData();
    setDeleteTarget(null);
    showToast("Pembelian berhasil dihapus");
  };

  const totalValue = purchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const unpaidCount = purchases.filter(p => p.status !== "paid").length;

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="success">Lunas</Badge>;
    if (status === "partial") return <Badge variant="warning">Sebagian</Badge>;
    return <Badge variant="danger">Belum Bayar</Badge>;
  };

  const statusStripColor = (status: string) => {
    if (status === "paid") return "bg-[#16A34A]";
    if (status === "partial") return "bg-amber-400";
    return "bg-red-500";
  };

  const columns = [
    {
      key: "purchase_number", label: "No. PO",
      render: (item: Purchase) => <span className="font-mono text-sm font-semibold text-[#072C2C]">{item.purchase_number}</span>,
    },
    { key: "supplier_name", label: "Supplier", sortable: true },
    {
      key: "created_at", label: "Tanggal", sortable: true,
      render: (item: Purchase) => <span className="text-sm text-[#9CA3AF]">{formatDate(item.purchase_date || item.created_at)}</span>,
    },
    {
      key: "total_amount", label: "Total", sortable: true,
      render: (item: Purchase) => <span className="font-semibold text-[#072C2C]">{formatCurrency(item.total_amount)}</span>,
    },
    {
      key: "status", label: "Status",
      render: (item: Purchase) => statusBadge(item.status),
    },
    {
      key: "actions", label: "Aksi",
      render: (item: Purchase) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewingPurchase(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer" title="Detail">
            <Eye className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pembelian</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola pembelian barang dari supplier</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" />Buat Pembelian</Button>
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

      {/* Desktop Table + Mobile Cards */}
      <Card>
        <CardContent>
          <div className="hidden md:block">
            <DataTable columns={columns} data={purchases} searchPlaceholder="Cari nomor PO atau supplier..." searchKeys={["purchase_number", "supplier_name"]} />
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {purchases.length === 0 && (
              <p className="text-center py-8 text-sm text-[#9CA3AF]">Belum ada data pembelian</p>
            )}
            {purchases.map((p) => (
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
                    <p className="text-xs text-[#9CA3AF]">{formatDate(p.purchase_date || p.created_at)}</p>
                    <p className="text-sm font-bold text-[#072C2C]">{formatCurrency(p.total_amount)}</p>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0EEE8]">
                    <button
                      onClick={() => setViewingPurchase(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />Detail
                    </button>
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
        </CardContent>
      </Card>

      {/* Create Purchase Modal — bottom sheet on mobile, centered on desktop */}
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
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                          <select
                            value={row.unit}
                            onChange={e => updateItem(idx, "unit", e.target.value)}
                            className="w-full px-2 py-2 border border-[#E5E3DC] rounded-lg text-sm text-[#072C2C] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                          >
                            {row.units.length > 0
                              ? row.units.map(u => <option key={u.name} value={u.name}>{u.name}</option>)
                              : <option value={row.unit || "pcs"}>{row.unit || "pcs"}</option>
                            }
                          </select>
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
                  <div><p className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Tanggal</p><p className="font-semibold text-[#072C2C]">{formatDate(viewingPurchase.purchase_date || viewingPurchase.created_at)}</p></div>
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
              <button onClick={() => setViewingPurchase(null)} className="w-full py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-semibold text-[#072C2C]/60 cursor-pointer hover:bg-[#F8F7F4]">Tutup</button>
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
