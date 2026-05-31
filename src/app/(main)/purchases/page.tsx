"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate, getPaymentStatusLabel } from "@/lib/utils";
import { getSuppliers, getProducts } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function PurchasesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [supps, prods] = await Promise.all([getSuppliers(), getProducts()]);
    setSuppliers(supps);
    setProducts(prods);
    const { data } = await supabase.from("purchases").select("*, purchase_items(*)").order("created_at", { ascending: false });
    setPurchases(data || []);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("purchases").delete().eq("id", deleteTarget.id);
    await loadData();
    setDeleteTarget(null);
    setToast("Pembelian berhasil dihapus");
    setTimeout(() => setToast(""), 2000);
  };

  const totalValue = purchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const unpaidCount = purchases.filter(p => p.status !== "paid").length;

  const columns = [
    { key: "purchase_number", label: "No. PO", render: (item: any) => <span className="font-mono text-sm font-medium">{item.purchase_number}</span> },
    { key: "supplier_name", label: "Supplier", sortable: true },
    { key: "created_at", label: "Tanggal", sortable: true, render: (item: any) => <span className="text-sm text-gray-500">{formatDate(item.created_at)}</span> },
    { key: "total_amount", label: "Total", sortable: true, render: (item: any) => <span className="font-medium">{formatCurrency(item.total_amount)}</span> },
    { key: "paid_amount", label: "Dibayar", render: (item: any) => <span className="text-gray-600">{formatCurrency(item.paid_amount)}</span> },
    { key: "status", label: "Status", render: (item: any) => <Badge variant={item.status === "paid" ? "success" : item.status === "partial" ? "warning" : "danger"}>{getPaymentStatusLabel(item.status)}</Badge> },
    { key: "actions", label: "Aksi", render: (item: any) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewingPurchase(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Eye className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 animate-in slide-in-from-top fade-in duration-200">
          <div className="px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#DC2626]">{toast}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pembelian</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Kelola pembelian barang dari supplier</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Buat Pembelian</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Pembelian</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{purchases.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Nilai</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalValue)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Belum Lunas</p><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{unpaidCount}</p></div>
      </div>

      <Card><CardContent><DataTable columns={columns} data={purchases} searchPlaceholder="Cari nomor PO atau supplier..." searchKeys={["purchase_number", "supplier_name"]} /></CardContent></Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Buat Pembelian Baru" size="xl">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"><option value="">Pilih Supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
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

      {/* Detail Modal */}
      <Modal isOpen={!!viewingPurchase} onClose={() => setViewingPurchase(null)} title="Detail Pembelian" size="lg">
        {viewingPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">No. PO</p><p className="text-sm font-mono font-medium">{viewingPurchase.purchase_number}</p></div>
              <div><p className="text-xs text-gray-500">Tanggal</p><p className="text-sm font-medium">{formatDate(viewingPurchase.created_at)}</p></div>
              <div><p className="text-xs text-gray-500">Supplier</p><p className="text-sm font-medium">{viewingPurchase.supplier_name}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={viewingPurchase.status === "paid" ? "success" : "warning"}>{getPaymentStatusLabel(viewingPurchase.status)}</Badge></div>
            </div>
            {viewingPurchase.purchase_items && viewingPurchase.purchase_items.length > 0 && (
              <div className="border-t pt-4"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Produk</th><th className="px-3 py-2 text-center text-xs">Qty</th><th className="px-3 py-2 text-right text-xs">Harga</th><th className="px-3 py-2 text-right text-xs">Subtotal</th></tr></thead><tbody className="divide-y divide-gray-100">{viewingPurchase.purchase_items.map((item: any, idx: number) => <tr key={idx}><td className="px-3 py-2">{item.product_name}</td><td className="px-3 py-2 text-center">{item.quantity} {item.unit}</td><td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td><td className="px-3 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td></tr>)}</tbody><tfoot className="border-t"><tr><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{formatCurrency(viewingPurchase.total_amount)}</td></tr></tfoot></table></div>
            )}
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
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus Pembelian?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.purchase_number} akan dihapus secara permanen.</p>
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
