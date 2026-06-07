"use client";

import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { Users } from "lucide-react";

export default function DemoCustomersPage() {
  const { customers } = useDemo();
  const totalDebt = customers.reduce((s, c) => s + (c.debt || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Pelanggan</h1>
        <p className="text-[10px] text-[#9CA3AF] font-light">{customers.length} pelanggan · Total piutang {formatCurrency(totalDebt)}</p>
      </div>

      <div className="bg-white border border-[#D9D6C8] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EDEADE]">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nama</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">Telepon</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">Alamat</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Hutang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE8]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#072C2C] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">{c.name[0]}</span>
                      </div>
                      <span className="text-[12px] font-medium text-[#111827]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#4B5563] hidden sm:table-cell">{c.phone}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[#9CA3AF] hidden md:table-cell">{c.address}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono text-[12px] font-bold ${c.debt > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                      {c.debt > 0 ? formatCurrency(c.debt) : "Lunas"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
