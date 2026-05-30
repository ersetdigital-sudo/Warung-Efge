"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  Users,
  BarChart3,
  Boxes,
  UserCircle,
  X,
  Store,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pos", icon: ShoppingCart, label: "Kasir (POS)" },
  { href: "/products", icon: Package, label: "Produk" },
  { href: "/stock", icon: Boxes, label: "Stok" },
  { href: "/purchases", icon: ClipboardList, label: "Pembelian" },
  { href: "/suppliers", icon: Truck, label: "Supplier" },
  { href: "/customers", icon: Users, label: "Pelanggan" },
  { href: "/reports", icon: BarChart3, label: "Laporan" },
  { href: "/users", icon: UserCircle, label: "Pengguna" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[#072C2C] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF5F03] rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight font-[Oswald]">WARUNG EFGE</h1>
              <p className="text-[10px] text-white/50 leading-none">POS & Inventory</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#FF5F03] text-white shadow-lg shadow-[#FF5F03]/20"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/50")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
