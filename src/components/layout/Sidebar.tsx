"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  Users,
  BarChart3,
  UserCircle,
  X,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Receipt,
  Settings,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pos", icon: ShoppingCart, label: "Kasir (POS)" },
  { href: "/products", icon: Package, label: "Produk & Stok" },
  { href: "/transactions", icon: Receipt, label: "Transaksi" },
  { href: "/purchases", icon: ClipboardList, label: "Pembelian" },
  { href: "/suppliers", icon: Truck, label: "Supplier" },
  { href: "/customers", icon: Users, label: "Pelanggan" },
  { href: "/reports", icon: BarChart3, label: "Laporan" },
  { href: "/users", icon: UserCircle, label: "Pengguna" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

function NavTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 bg-[#072C2C] text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg animate-in fade-in duration-150 pointer-events-none">
      {label}
      <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#072C2C] rotate-45" />
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, role } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  // Filter menu items based on role
  const visibleMenuItems = menuItems.filter(item => {
    if (role === "cashier") {
      return ["/pos", "/products", "/transactions"].includes(item.href);
    }
    return true; // owner & admin see everything
  });

  return (
    <>
      {/* Mobile/tablet overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Mobile bottom nav - 4 menu only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#D9D6C8] flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.06)]" style={{ height: "72px", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingTop: "4px" }}>
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/pos", icon: ShoppingCart, label: "Kasir" },
          { href: "/products", icon: Package, label: "Produk" },
          { href: "/transactions", icon: Receipt, label: "Transaksi" },
        ].filter(item => {
          if (role === "cashier") return ["/pos", "/products", "/transactions"].includes(item.href);
          return true;
        }).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[56px] rounded-lg transition-all active:scale-90 active:opacity-70", isActive ? "text-[#FF5F03]" : "text-[#9CA3AF]")}>
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.7} />
              <span className={cn("text-[11px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop/Tablet sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-[#072C2C] flex-col transition-all duration-[220ms] ease-in-out lg:static lg:z-auto",
          collapsed ? "w-[68px]" : "w-64",
          "hidden md:flex",
          // Mobile slide-in
          isOpen && "!flex !fixed !z-50"
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center h-16 border-b border-white/10 transition-all duration-[220ms]", collapsed ? "justify-center px-2" : "px-4 gap-3")}>
          <Link href="/dashboard" className={cn("flex items-center", collapsed ? "" : "gap-3")}>
            <div className="w-9 h-9 bg-[#FF5F03] rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-base font-bold text-white leading-tight font-[Oswald] whitespace-nowrap">WARUNG EFGE</h1>
                <p className="text-[10px] text-white/50 leading-none whitespace-nowrap">POS & Inventory</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded-md hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className={cn("flex-1 overflow-hidden transition-all duration-[220ms]", collapsed ? "px-2 py-1.5" : "px-2.5 py-1.5")}>
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <div key={item.href} className="relative" onMouseEnter={() => collapsed && setHoveredItem(item.href)} onMouseLeave={() => setHoveredItem(null)}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg font-medium transition-all duration-200 mb-0.5",
                    collapsed ? "justify-center px-2 py-2 text-sm" : "gap-3 px-3 py-2.5 text-sm",
                    isActive
                      ? "bg-[#FF5F03] text-white shadow-lg shadow-[#FF5F03]/20"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className={cn("flex-shrink-0", collapsed ? "w-[18px] h-[18px]" : "w-5 h-5", isActive ? "text-white" : "text-white/50")} />
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                </Link>
                <NavTooltip label={item.label} show={collapsed && hoveredItem === item.href} />
              </div>
            );
          })}
        </nav>

        {/* Logout + Toggle */}
        <div className={cn("border-t border-white/10 transition-all duration-[220ms]", collapsed ? "p-2 space-y-0.5" : "px-2.5 py-2 space-y-0.5")}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center rounded-lg text-white/60 hover:bg-[#DC2626]/20 hover:text-[#fca5a5] transition-all duration-200 cursor-pointer w-full",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"
            )}
          >
            <LogOut className={collapsed ? "w-[18px] h-[18px]" : "w-5 h-5"} />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Keluar</span>}
          </button>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer w-full",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"
            )}
          >
            {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Tutup Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
