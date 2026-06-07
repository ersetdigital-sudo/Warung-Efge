"use client";

import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { Truck } from "lucide-react";

export default function DemoSuppliersPage() {
  const { suppliers } = useDemo();
  const totalDebt = suppliers.reduce((s, c) => s + (c.debt || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[15px] lg:text-[17px] font-semibold text-[#072C2C] font-[Oswald] tracking-wide uppercase">Supplier</h1>
        <p className="text-[10px] text-[#9CA3AF] font-light">{suppliers.length} supplier · Total hutang {formatCurrency(totalDebt)}</p>
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
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#FF5F03] rounded-full flex items-center justify-center flex-shrink-0">
                        <Truck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12px] font-medium text-[#111827] block truncate">{s.name}</span>
                        {s.email && <span className="text-[10px] text-[#9CA3AF]">{s.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#4B5563] hidden sm:table-cell">{s.phone}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[#9CA3AF] hidden md:table-cell">{s.address}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono text-[12px] font-bold ${s.debt > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                      {s.debt > 0 ? formatCurrency(s.debt) : "Lunas"}
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
