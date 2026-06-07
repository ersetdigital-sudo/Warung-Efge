"use client";

import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { ClipboardCheck, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function DemoStockPage() {
  const { stockMovements, products } = useDemo();

  const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    in: { label: "Masuk", icon: ArrowUpRight, color: "text-[#16A34A]", bg: "bg-green-50" },
    out: { label: "Keluar", icon: ArrowDownRight, color: "text-[#DC2626]", bg: "bg-red-50" },
    adjustment: { label: "Adjustment", icon: RefreshCw, color: "text-[#D97706]", bg: "bg-amber-50" },
    opname: { label: "Opname", icon: ClipboardCheck, color: "text-[#3B82F6]", bg: "bg-blue-50" },
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Stock Opname</h1>
        <p className="text-[10px] text-[#9CA3AF] font-light">{stockMovements.length} pergerakan stok tercatat</p>
      </div>

      <div className="bg-white border border-[#D9D6C8] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EDEADE]">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Produk</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Tipe</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Qty</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">Catatan</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">User</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE8]">
              {stockMovements.map((m) => {
                const cfg = typeConfig[m.type] || typeConfig.adjustment;
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-3 py-2.5 text-[12px] font-medium text-[#111827]">{m.product_name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`font-mono text-[12px] font-bold ${m.type === "in" ? "text-[#16A34A]" : m.type === "out" ? "text-[#DC2626]" : "text-[#D97706]"}`}>
                        {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity} {m.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#9CA3AF] hidden sm:table-cell">{m.notes}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#4B5563] hidden md:table-cell">{m.user_name}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#9CA3AF]">{new Date(m.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
