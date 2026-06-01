"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, Download, Receipt, Banknote, QrCode, CreditCard, Smartphone, X, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTransactions } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { generateReceiptPDF } from "@/lib/generate-receipt-pdf";
import { useAuth } from "@/lib/auth";

export default function TransactionsPage() {
  const { userName, role } = useAuth();
  const isAdmin = role === "owner" || role === "admin";
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const loadTransactions = async () => {
    const all = await getTransactions();
    // Kasir only sees their own transactions
    if (role === "cashier" && userName) {
      setTransactions(all.filter((t: any) => t.cashier === userName));
    } else {
      setTransactions(all);
    }
  };
  useEffect(() => { loadTransactions(); }, [role, userName]);

  const [toast, setToast] = useState("");

  const handleDelete = async (trx: any) => {
    if (!confirm(`Hapus transaksi ${trx.transaction_number}? Data tidak bisa dikembalikan.`)) return;
    await supabase.from("transaction_items").delete().eq("transaction_id", trx.id);
    await supabase.from("transactions").delete().eq("id", trx.id);
    await loadTransactions();
    setSelectedTrx(null);
    setToast(`Transaksi ${trx.transaction_number} berhasil dihapus`);
    setTimeout(() => setToast(""), 3000);
  };

  // KPI
  const totalOmzet = transactions.reduce((s, t) => s + (t.total || 0), 0);
  const totalTrx = transactions.length;
  const avgTrx = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;
  const pmCount: Record<string, number> = {};
  transactions.forEach(t => { pmCount[t.payment_method] = (pmCount[t.payment_method] || 0) + 1; });
  const topPM = Object.entries(pmCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";
  const pmLabel = (m: string) => m === "cash" ? "Tunai" : m === "qris" ? "QRIS" : m === "transfer" ? "Transfer" : m === "edc" ? "EDC" : m;

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = transactions;
    if (search) { const q = search.toLowerCase(); list = list.filter(t => (t.transaction_number || "").toLowerCase().includes(q) || (t.cashier || "").toLowerCase().includes(q)); }
    if (filterMethod) list = list.filter(t => t.payment_method === filterMethod);
    if (sortBy === "oldest") list = [...list].reverse();
    else if (sortBy === "highest") list = [...list].sort((a, b) => b.total - a.total);
    else if (sortBy === "lowest") list = [...list].sort((a, b) => a.total - b.total);
    return list;
  }, [transactions, search, filterMethod, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleCetak = (trx: any) => {
    const items = (trx.transaction_items || []).map((i: any) => ({ name: i.product_name, quantity: i.quantity, unit: i.unit || "pcs", price: i.price, subtotal: i.subtotal }));
    generateReceiptPDF({ storeName: "WARUNG EFGE", cashier: trx.cashier || userName || "Kasir", trxId: trx.transaction_number, date: new Date(trx.created_at).toLocaleString("id-ID"), items, subtotal: trx.subtotal || trx.total, discount: trx.discount || 0, total: trx.total, method: pmLabel(trx.payment_method), paid: trx.amount_paid || trx.total, change: trx.change_amount || 0 }, "open");
  };

  const pmIcon = (m: string) => m === "cash" ? Banknote : m === "qris" ? QrCode : m === "transfer" ? CreditCard : Smartphone;

  return (
    <div className="space-y-4">
      {toast && <div className="fixed z-[9999] top-4 right-4 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#DC2626] animate-in slide-in-from-top">{toast}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Riwayat Transaksi</h1>
          <p className="text-[10px] text-[#9CA3AF]">Semua transaksi penjualan</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#072C2C]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Transaksi</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{totalTrx}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#16A34A]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Total Omzet</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{formatCurrency(totalOmzet)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#FF5F03]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Rata-rata / Trx</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{formatCurrency(avgTrx)}</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-md p-3 border-l-[3px] border-l-[#D97706]"><p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Metode Terpopuler</p><p className="font-[Oswald] text-[22px] font-semibold text-[#072C2C] mt-1">{pmLabel(topPM)}</p></div>
      </div>

      {/* Table */}
      <Card>
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-[#D9D6C8] flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[160px] bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no. transaksi, kasir..." className="bg-transparent outline-none text-xs w-full text-[#111827] placeholder-[#9CA3AF]" />
          </div>
          <select value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }} className="bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5 text-[11px] text-[#4B5563] outline-none cursor-pointer">
            <option value="">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
            <option value="edc">EDC</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#EDEADE] border border-[#D9D6C8] rounded px-2.5 py-1.5 text-[11px] text-[#4B5563] outline-none cursor-pointer">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Nominal Terbesar</option>
            <option value="lowest">Nominal Terkecil</option>
          </select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#D9D6C8]">
                <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">No. Transaksi</th>
                <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Waktu</th>
                <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Kasir</th>
                <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Metode</th>
                <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Items</th>
                <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Total</th>
                <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase hidden sm:table-cell">Bayar</th>
                <th className="text-right px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase hidden sm:table-cell">Kembalian</th>
                <th className="text-left px-3 py-2 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-[#9CA3AF]"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm">Belum ada transaksi</p></td></tr>}
              {paged.map((t) => {
                const Icon = pmIcon(t.payment_method);
                const items = t.transaction_items || [];
                const firstItem = items[0]?.product_name || "–";
                const otherCount = items.length - 1;
                const itemLabel = otherCount > 0 ? `${firstItem} + ${otherCount} Lainnya` : firstItem;
                return (
                  <tr key={t.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                    <td className="px-3 py-2.5"><span className="font-mono font-bold text-[11px] text-[#072C2C]">{t.transaction_number}</span></td>
                    <td className="px-3 py-2.5"><div className="text-[11px]">{t.created_at ? formatDate(t.created_at) : "–"}</div><div className="text-[9px] text-[#9CA3AF]">{t.created_at ? new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</div></td>
                    <td className="px-3 py-2.5 text-[11px]">{t.cashier || "–"}</td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border bg-[#EFF6FF] text-[#1D4ED8] border-[#bfdbfe]"><Icon className="w-3 h-3" />{pmLabel(t.payment_method)}</span></td>
                    <td className="px-3 py-2.5"><div className="text-[11px] text-[#072C2C] font-medium truncate max-w-[140px]">{itemLabel}</div></td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[11px] text-[#072C2C]">{formatCurrency(t.total)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[11px] hidden sm:table-cell">{formatCurrency(t.amount_paid || 0)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[11px] text-[#16A34A] hidden sm:table-cell">{formatCurrency(t.change_amount || 0)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedTrx(t)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#ECFDF5] hover:border-[#bbf7d0] hover:text-[#16A34A] text-[#9CA3AF]"><Eye className="w-3 h-3" /></button>
                        <button onClick={() => handleCetak(t)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#FFF2EB] hover:border-[#fed7aa] hover:text-[#FF5F03] text-[#9CA3AF]"><Download className="w-3 h-3" /></button>
                        {isAdmin && <button onClick={() => handleDelete(t)} className="w-6 h-6 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer hover:bg-[#FEF2F2] hover:border-[#fecaca] hover:text-[#DC2626] text-[#9CA3AF]"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden px-3 py-2 space-y-2">
          {paged.length === 0 && <div className="text-center py-8 text-[#9CA3AF] text-sm">Belum ada transaksi</div>}
          {paged.map((t) => {
            const items = t.transaction_items || [];
            const firstItem = items[0]?.product_name || "–";
            const otherCount = items.length - 1;
            const itemLabel = otherCount > 0 ? `${firstItem} + ${otherCount} Lainnya` : firstItem;
            return (
              <div key={t.id} className="bg-white border border-[#D9D6C8] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#072C2C]">{t.transaction_number}</span>
                  <span className="text-[10px] text-[#9CA3AF]">{t.created_at ? `${formatDate(t.created_at)} ${new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#072C2C] font-medium truncate flex-1">{itemLabel}</p>
                  <p className="font-mono font-bold text-sm text-[#072C2C] ml-2">{formatCurrency(t.total)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{pmLabel(t.payment_method)}</Badge>
                    <span className="text-[10px] text-[#9CA3AF]">{t.cashier}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedTrx(t)} className="w-7 h-7 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer text-[#9CA3AF]"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleCetak(t)} className="w-7 h-7 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer text-[#9CA3AF]"><Download className="w-3.5 h-3.5" /></button>
                    {isAdmin && <button onClick={() => handleDelete(t)} className="w-7 h-7 rounded border border-[#D9D6C8] flex items-center justify-center cursor-pointer text-[#9CA3AF]"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pager */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#D9D6C8] text-[11px] text-[#9CA3AF]">
          <span>{filtered.length > 0 ? `${(page-1)*perPage+1}–${Math.min(page*perPage, filtered.length)} dari ${filtered.length}` : "Belum ada transaksi"}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border border-[#D9D6C8] cursor-pointer hover:bg-[#EDEADE]">‹</button>
            {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 rounded border cursor-pointer ${p === page ? "bg-[#072C2C] text-white border-[#072C2C]" : "border-[#D9D6C8] hover:bg-[#EDEADE]"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border border-[#D9D6C8] cursor-pointer hover:bg-[#EDEADE]">›</button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTrx(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-[#D9D6C8] rounded-t-2xl z-10">
              <h2 className="text-sm font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Detail Transaksi</h2>
              <button onClick={() => setSelectedTrx(null)} className="p-1.5 rounded-lg hover:bg-[#EDEADE] cursor-pointer"><X className="w-5 h-5 text-[#072C2C]/60" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F5F5F0] border border-[#D9D6C8] rounded-lg p-3">
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">Waktu</p>
                  <p className="text-xs font-medium text-[#072C2C] mt-1">{selectedTrx.created_at ? new Date(selectedTrx.created_at).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }) : "–"}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{selectedTrx.created_at ? new Date(selectedTrx.created_at).toLocaleTimeString("id-ID") : ""}</p>
                </div>
                <div className="bg-[#F5F5F0] border border-[#D9D6C8] rounded-lg p-3">
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">Kasir & Metode</p>
                  <p className="text-xs font-medium text-[#072C2C] mt-1">{selectedTrx.cashier || "–"}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{pmLabel(selectedTrx.payment_method)} · {selectedTrx.transaction_number}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[9px] font-bold text-[#9CA3AF] uppercase mb-2">Rincian Item</p>
                <div className="space-y-2">
                  {(selectedTrx.transaction_items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#D9D6C8] last:border-0">
                      <div>
                        <p className="text-xs font-medium text-[#072C2C]">{item.product_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{item.quantity} {item.unit} × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="font-mono font-bold text-xs text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#F5F5F0] border border-[#D9D6C8] rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Subtotal</span><span className="font-mono font-bold">{formatCurrency(selectedTrx.subtotal || selectedTrx.total)}</span></div>
                {selectedTrx.discount > 0 && <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Diskon</span><span className="font-mono font-bold text-[#DC2626]">-{formatCurrency(selectedTrx.discount)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#D9D6C8]"><span className="text-[#072C2C]">TOTAL</span><span className="font-mono text-[#072C2C]">{formatCurrency(selectedTrx.total)}</span></div>
                {selectedTrx.payment_method === "cash" && <>
                  <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Bayar</span><span className="font-mono font-bold">{formatCurrency(selectedTrx.amount_paid || 0)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Kembalian</span><span className="font-mono font-bold text-[#16A34A]">{formatCurrency(selectedTrx.change_amount || 0)}</span></div>
                </>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => handleCetak(selectedTrx)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF5F03] text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-[#e55503]"><Download className="w-3.5 h-3.5" />Cetak Struk</button>
                {isAdmin && <button onClick={() => handleDelete(selectedTrx)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-[#b91c1c]"><Trash2 className="w-3.5 h-3.5" />Hapus</button>}
                <button onClick={() => setSelectedTrx(null)} className="flex-1 py-2.5 border border-[#D9D6C8] text-[#072C2C]/60 font-medium text-xs rounded-lg cursor-pointer hover:bg-[#EDEADE]">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
