"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Settings2, ClipboardCheck, History, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatDate, formatNumber, getStockStatus } from "@/lib/utils";
import { getProducts, deleteProduct, getStockMovements, addStockMovement } from "@/lib/db";

type TabType = "overview" | "movements" | "opname";

function ActionDropdown({ product, onDelete }: { product: any; onDelete: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-md hover:bg-[#EDEADE] cursor-pointer"><MoreVertical className="w-4 h-4 text-[#072C2C]/50" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-[#D9D6C8] rounded-lg shadow-xl py-1 w-40">
            <button onClick={() => { setOpen(false); router.push(`/products/edit/${product.id}`); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#072C2C] hover:bg-[#EDEADE] cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              Edit Produk
            </button>
            <button onClick={() => { setOpen(false); onDelete(product); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Hapus Produk
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [toast, setToast] = useState("");
  const [productList, setProductList] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [prods, movs] = await Promise.all([getProducts(), getStockMovements()]);
    setProductList(prods);
    setMovements(movs);
  };

  const lowStock = productList.filter((p) => p.stock <= p.min_stock);

  const tabs = [
    { id: "overview" as TabType, label: "Ringkasan Stok", icon: ClipboardCheck },
    { id: "movements" as TabType, label: "Riwayat Pergerakan", icon: History },
    { id: "opname" as TabType, label: "Stock Opname", icon: Settings2 },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteProduct(deleteTarget.id);
    if (success) { await loadData(); setToast("Produk berhasil dihapus"); setTimeout(() => setToast(""), 2000); }
    setDeleteTarget(null);
  };

  const stockColumns = [
    { key: "name", label: "Produk", sortable: true, render: (item: any) => <div><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">SKU: {item.sku}</p></div> },
    { key: "category", label: "Kategori", sortable: true },
    { key: "stock", label: "Stok", sortable: true, render: (item: any) => { const s = getStockStatus(item.stock, item.min_stock); return <Badge variant={s === "safe" ? "success" : s === "warning" ? "warning" : "danger"}>{formatNumber(item.stock)} {item.unit}</Badge>; } },
    { key: "min_stock", label: "Min. Stok", render: (item: any) => <span className="text-sm text-gray-500">{item.min_stock} {item.unit}</span> },
    { key: "status", label: "Status", render: (item: any) => { const s = getStockStatus(item.stock, item.min_stock); return <Badge variant={s === "safe" ? "success" : s === "warning" ? "warning" : "danger"}>{s === "safe" ? "Aman" : s === "warning" ? "Menipis" : "Habis"}</Badge>; } },
    { key: "actions", label: "", render: (item: any) => <ActionDropdown product={item} onDelete={setDeleteTarget} /> },
  ];

  const movementColumns = [
    { key: "created_at", label: "Tanggal", sortable: true, render: (item: any) => <span className="text-sm text-gray-600">{formatDate(item.created_at)}</span> },
    { key: "product_name", label: "Produk", sortable: true },
    { key: "type", label: "Tipe", render: (item: any) => { const labels: Record<string, string> = { in: "Masuk", out: "Keluar", adjustment: "Penyesuaian", opname: "Opname" }; const variants: Record<string, "success"|"danger"|"warning"|"info"> = { in: "success", out: "danger", adjustment: "warning", opname: "info" }; return <Badge variant={variants[item.type]}>{labels[item.type]}</Badge>; } },
    { key: "quantity", label: "Jumlah", render: (item: any) => <span className={`font-medium ${item.type === "in" ? "text-green-600" : item.type === "out" ? "text-red-600" : "text-gray-700"}`}>{item.type === "in" ? "+" : item.type === "out" ? "-" : ""}{item.quantity} {item.unit}</span> },
    { key: "notes", label: "Catatan", render: (item: any) => <span className="text-sm text-gray-500">{item.notes}</span> },
    { key: "user_name", label: "User" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 animate-in slide-in-from-top fade-in duration-200">
          <div className="px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#DC2626]">
            {toast}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Manajemen Stok</h1><p className="text-[10px] text-[#9CA3AF] font-light mt-0.5">Pantau dan kelola stok barang</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInModal(true)}><ArrowDownToLine className="w-4 h-4" />Masuk</Button>
          <Button variant="outline" onClick={() => setShowOutModal(true)}><ArrowUpFromLine className="w-4 h-4" />Keluar</Button>
          <Button onClick={() => setShowAdjustModal(true)}><Settings2 className="w-4 h-4" />Penyesuaian</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Produk</p><p className="font-[Oswald] text-[24px] font-semibold text-[#072C2C] mt-1">{productList.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Aman</p><p className="font-[Oswald] text-[24px] font-semibold text-[#16A34A] mt-1">{productList.length - lowStock.length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Menipis</p><p className="font-[Oswald] text-[24px] font-semibold text-[#D97706] mt-1">{lowStock.filter(p => p.stock > 0).length}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3.5 border-l-[3px] border-l-[#DC2626]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Stok Habis</p><p className="font-[Oswald] text-[24px] font-semibold text-[#DC2626] mt-1">{lowStock.filter(p => p.stock <= 0).length}</p></div>
      </div>

      <div className="flex gap-1 bg-[#072C2C]/5 rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? "bg-white text-[#072C2C] shadow-sm" : "text-[#072C2C]/50 hover:text-[#072C2C]/80"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <Card><CardContent><DataTable columns={stockColumns} data={productList} searchPlaceholder="Cari produk..." searchKeys={["name", "sku", "category"]} /></CardContent></Card>}
      {activeTab === "movements" && <Card><CardContent><DataTable columns={movementColumns} data={movements} searchPlaceholder="Cari pergerakan stok..." searchKeys={["product_name", "notes", "user_name"]} /></CardContent></Card>}
      {activeTab === "opname" && <Card><CardHeader><div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">Stock Opname</h3><Button size="sm"><ClipboardCheck className="w-4 h-4" />Mulai Opname</Button></div></CardHeader><CardContent><div className="text-center py-12"><ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" /><h3 className="text-lg font-medium text-gray-900">Stock Opname</h3><p className="text-sm text-gray-500 mt-1">Klik Mulai Opname untuk pengecekan stok fisik</p></div></CardContent></Card>}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3 className="text-lg font-bold text-[#072C2C] mb-1">Hapus?</h3>
            <p className="text-sm text-[#072C2C]/60 mb-5">{deleteTarget.name} akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-[#4B5563] text-white font-medium text-sm rounded-xl cursor-pointer hover:bg-[#374151] transition-colors">Batal</button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#b91c1c] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showInModal} onClose={() => setShowInModal(false)} title="Barang Masuk" size="md"><StockForm onClose={() => setShowInModal(false)} /></Modal>
      <Modal isOpen={showOutModal} onClose={() => setShowOutModal(false)} title="Barang Keluar" size="md"><StockForm onClose={() => setShowOutModal(false)} /></Modal>
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Penyesuaian Stok" size="md"><StockForm onClose={() => setShowAdjustModal(false)} /></Modal>
    </div>
  );
}

function StockForm({ onClose }: { onClose: () => void }) {
  const [prods, setProds] = useState<any[]>([]);
  useEffect(() => { getProducts().then(setProds); }, []);
  return (
    <form className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Produk</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Pilih Produk</option>{prods.map((p) => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit})</option>)}</select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><option>Pcs</option><option>Dus</option><option>Pak</option><option>Kg</option><option>Karung</option></select></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label><textarea placeholder="Alasan..." rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
        <Button type="button" onClick={onClose}>Simpan</Button>
      </div>
    </form>
  );
}
