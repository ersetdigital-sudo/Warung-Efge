"use client";

import { useState, useMemo } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Search, Filter } from "lucide-react";

export default function DemoTransactionsPage() {
  const { transactions } = useDemo();
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = (t.transaction_number || "").toLowerCase().includes(search.toLowerCase()) || (t.cashier || "").toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === "all" || t.payment_method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [transactions, search, methodFilter]);

  const totalRevenue = filtered.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Transaksi</h1>
          <p className="text-[10px] text-[#9CA3AF] font-light">{filtered.length} transaksi · Total {formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#D9D6C8] rounded-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <input type="text" placeholder="Cari nomor transaksi atau kasir..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder-[#9CA3AF]" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-[#D9D6C8] rounded-lg text-sm cursor-pointer">
          <option value="all">Semua Metode</option>
          <option value="cash">Tunai</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer</option>
          <option value="hutang">Hutang</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9D6C8] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EDEADE]">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">No. Transaksi</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">Waktu</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">Kasir</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Metode</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE8]">
              {filtered.map((t) => {
                const methodLabel = t.payment_method === "cash" ? "Tunai" : t.payment_method === "qris" ? "QRIS" : t.payment_method === "transfer" ? "Transfer" : t.payment_method === "hutang" ? "Hutang" : t.payment_method;
                const methodColor = t.payment_method === "cash" ? "bg-green-50 text-green-700 border-green-200" : t.payment_method === "qris" ? "bg-blue-50 text-blue-700 border-blue-200" : t.payment_method === "transfer" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";
                return (
                  <tr key={t.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-[12px] font-bold text-[#072C2C]">{t.transaction_number}</div>
                      <div className="text-[10px] text-[#9CA3AF] sm:hidden">{new Date(t.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#4B5563] hidden sm:table-cell">
                      {new Date(t.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[#4B5563] hidden md:table-cell">{t.cashier}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${methodColor}`}>{methodLabel}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] font-bold text-[#072C2C]">{formatCurrency(t.total)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-[#9CA3AF] text-sm">Tidak ada transaksi ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
