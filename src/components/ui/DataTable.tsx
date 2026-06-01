"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (item: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
}

export default function DataTable({ columns, data, searchPlaceholder = "Cari...", searchKeys = [], pageSize = 10 }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredData = data.filter((item) => {
    if (!search) return true;
    return searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(search.toLowerCase()));
  });

  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      })
    : filteredData;

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#072C2C]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#072C2C]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] bg-white text-[#111827]"
          />
        </div>
        <span className="text-sm text-[#072C2C]/60 font-medium">{filteredData.length} data</span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[#072C2C]/10">
        <table className="w-full text-sm">
          <thead className="bg-[#072C2C] border-b border-[#072C2C]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3.5 text-left font-semibold text-white/90 text-xs uppercase tracking-wider ${col.sortable ? "cursor-pointer hover:text-white select-none" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && <span className="text-[#FF5F03]">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#072C2C]/5 bg-white">
            {paginatedData.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[#072C2C]/50">Tidak ada data ditemukan</td></tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#EDEADE]/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-[#111827]">
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-[#072C2C]/50 text-sm">Tidak ada data ditemukan</div>
        ) : (
          paginatedData.map((item, idx) => (
            <div key={idx} className="bg-white border border-[#072C2C]/10 rounded-xl p-4 space-y-2.5">
              {columns.map((col, ci) => {
                const val = col.render ? col.render(item) : String(item[col.key] ?? "");
                // Skip "Aksi" label, show it at bottom
                if (col.label === "Aksi" || col.key === "actions") return null;
                return (
                  <div key={col.key} className={`flex items-start justify-between gap-2 ${ci === 0 ? "" : "border-t border-[#072C2C]/5 pt-2"}`}>
                    <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider flex-shrink-0 w-24">{col.label}</span>
                    <div className="text-sm text-[#111827] text-right flex-1">{val}</div>
                  </div>
                );
              })}
              {/* Actions row */}
              {columns.find(c => c.label === "Aksi" || c.key === "actions") && (
                <div className="pt-2 border-t border-[#072C2C]/5 flex justify-end">
                  {columns.find(c => c.label === "Aksi" || c.key === "actions")!.render?.(item)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#072C2C]/60">Halaman {currentPage} dari {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-[#EDEADE] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#072C2C]" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer transition-colors ${currentPage === page ? "bg-[#FF5F03] text-white" : "hover:bg-[#EDEADE] text-[#072C2C]"}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-[#EDEADE] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors">
              <ChevronRight className="w-4 h-4 text-[#072C2C]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
