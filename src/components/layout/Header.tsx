"use client";

import { Menu, Bell, Search, Package, Truck, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

type NotifItem = {
  id: string;
  type: "stock" | "supplier_debt" | "customer_debt";
  title: string;
  subtitle: string;
  amount?: number;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { userName, role } = useAuth();
  const roleLabel = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Kasir";

  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const items: NotifItem[] = [];

    // 1. Stok hampir habis — ambil semua lalu filter di client
    const { data: products } = await supabase
      .from("products")
      .select("id, name, stock, min_stock, unit")
      .order("stock", { ascending: true })
      .limit(50);

    if (products) {
      const lowStock = products
        .filter(p => (p.stock ?? 0) <= (p.min_stock ?? 0))
        .slice(0, 5);
      for (const p of lowStock) {
        items.push({
          id: `stock-${p.id}`,
          type: "stock",
          title: p.name,
          subtitle: `Stok tersisa ${p.stock} ${p.unit ?? ""} — batas min ${p.min_stock}`,
        });
      }
    }

    // 2. Hutang supplier
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id, name, debt")
      .gt("debt", 0)
      .order("debt", { ascending: false })
      .limit(5);

    if (suppliers) {
      for (const s of suppliers) {
        items.push({
          id: `supplier-${s.id}`,
          type: "supplier_debt",
          title: s.name,
          subtitle: "Hutang ke supplier belum lunas",
          amount: s.debt,
        });
      }
    }

    // 3. Hutang pelanggan
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, debt")
      .gt("debt", 0)
      .order("debt", { ascending: false })
      .limit(5);

    if (customers) {
      for (const c of customers) {
        items.push({
          id: `customer-${c.id}`,
          type: "customer_debt",
          title: c.name,
          subtitle: "Piutang pelanggan belum dibayar",
          amount: c.debt,
        });
      }
    }

    setNotifs(items);
    setLoading(false);
  }, []);

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) loadNotifications();
    setOpen(v => !v);
  };

  const iconByType = (type: NotifItem["type"]) => {
    if (type === "stock") return <Package className="w-4 h-4 text-amber-500" />;
    if (type === "supplier_debt") return <Truck className="w-4 h-4 text-red-500" />;
    return <Users className="w-4 h-4 text-blue-500" />;
  };

  const bgByType = (type: NotifItem["type"]) => {
    if (type === "stock") return "bg-amber-50";
    if (type === "supplier_debt") return "bg-red-50";
    return "bg-blue-50";
  };

  const stockCount = notifs.filter(n => n.type === "stock").length;
  const supplierCount = notifs.filter(n => n.type === "supplier_debt").length;
  const customerCount = notifs.filter(n => n.type === "customer_debt").length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <Menu className="w-5 h-5 text-[#072C2C]" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-[#EDEADE] rounded-lg px-4 py-2.5 w-80 border border-[#072C2C]/10">
          <Search className="w-4 h-4 text-[#072C2C]/50" />
          <input
            type="text"
            placeholder="Cari produk, transaksi, pelanggan..."
            className="bg-transparent text-sm text-[#111827] placeholder-[#072C2C]/40 outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className="relative p-2 rounded-lg hover:bg-[#EDEADE] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-[#072C2C]" />
            {notifs.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF5F03] rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-[9px] font-black leading-none px-0.5">
                  {notifs.length > 9 ? "9+" : notifs.length}
                </span>
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#E5E3DC] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EEE8] bg-[#072C2C]">
                <div>
                  <p className="text-sm font-bold text-white">Notifikasi</p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {notifs.length === 0 ? "Semua aman" : `${notifs.length} perlu perhatian`}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Summary chips */}
              {notifs.length > 0 && (
                <div className="flex gap-2 px-4 py-2.5 border-b border-[#F0EEE8] bg-[#FAFAF8]">
                  {stockCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      <Package className="w-3 h-3" />{stockCount} stok tipis
                    </span>
                  )}
                  {supplierCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      <Truck className="w-3 h-3" />{supplierCount} hutang supplier
                    </span>
                  )}
                  {customerCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <Users className="w-3 h-3" />{customerCount} piutang
                    </span>
                  )}
                </div>
              )}

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#F0EEE8]">
                {loading && (
                  <div className="py-10 text-center">
                    <div className="w-6 h-6 border-2 border-[#FF5F03] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#9CA3AF] mt-2">Memuat...</p>
                  </div>
                )}
                {!loading && notifs.length === 0 && (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-sm font-semibold text-[#072C2C]">Semua aman!</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Tidak ada notifikasi saat ini</p>
                  </div>
                )}
                {!loading && notifs.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAF8] transition-colors`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bgByType(n.type)}`}>
                      {iconByType(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#072C2C] truncate">{n.title}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{n.subtitle}</p>
                      {n.amount !== undefined && (
                        <p className={`text-xs font-bold mt-0.5 ${n.type === "supplier_debt" ? "text-red-500" : "text-blue-500"}`}>
                          {formatCurrency(n.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[#F0EEE8] bg-[#FAFAF8]">
                  <button
                    onClick={() => { loadNotifications(); }}
                    className="w-full text-xs font-semibold text-[#072C2C]/50 hover:text-[#FF5F03] transition-colors cursor-pointer py-1"
                  >
                    Refresh notifikasi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-9 h-9 bg-[#072C2C] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{(userName || "?")[0].toUpperCase()}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#072C2C]">{userName || "User"}</p>
            <p className="text-xs text-[#072C2C]/60">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
