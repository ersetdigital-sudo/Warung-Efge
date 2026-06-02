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
  BookOpen,
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
  { href: "/tutorial", icon: BookOpen, label: "Tutorial" },
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

  const visibleMenuItems = menuItems.filter(item => {
    if (role === "cashier") {
      return ["/pos", "/products", "/transactions"].includes(item.href);
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Mobile bottom nav — 5 items */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#D9D6C8] flex items-center shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/pos", icon: ShoppingCart, label: "Kasir" },
          { href: "/products", icon: Package, label: "Produk" },
          { href: "/transactions", icon: Receipt, label: "Transaksi" },
          { href: "/reports", icon: BarChart3, label: "Laporan" },
        ].filter(item => {
          if (role === "cashier") return ["/pos", "/products", "/transactions"].includes(item.href);
          return true;
        }).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-all active:scale-90 active:opacity-70",
                isActive ? "text-[#FF5F03]" : "text-[#9CA3AF]"
              )}
            >
              <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop/Tablet sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-[#072C2C] flex flex-col overflow-y-auto transition-all duration-[220ms] ease-in-out lg:static lg:z-auto",
          collapsed ? "w-[56px]" : "w-56",
          "hidden md:flex",
          isOpen && "!flex !fixed !z-50"
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn(
          "flex items-center h-14 border-b border-white/10 transition-all duration-[220ms] flex-shrink-0",
          collapsed ? "justify-center px-1.5" : "px-3 gap-2"
        )}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 bg-[#FF5F03] rounded-md flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white leading-tight font-[Oswald] whitespace-nowrap">WARUNG EFGE</h1>
                <p className="text-[9px] text-white/40 leading-none whitespace-nowrap">POS & Inventory</p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link href="/dashboard">
              <div className="w-7 h-7 bg-[#FF5F03] rounded-md flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}

          {/* Collapse toggle — hanya mobile close */}
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden flex-shrink-0 p-1 rounded-md hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Nav items — rapat ke atas, bisa scroll jika menu banyak */}
        <nav className={cn(
          "overflow-y-auto overflow-x-hidden transition-all duration-[220ms] flex-1",
          collapsed ? "px-1.5 py-1" : "px-2 py-1"
        )}>
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => collapsed && setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-md font-medium transition-all duration-150 mb-[2px]",
                    collapsed
                      ? "justify-center px-1.5 py-2"
                      : "gap-2.5 px-2.5 py-2 text-sm",
                    isActive
                      ? "bg-[#FF5F03] text-white shadow-md shadow-[#FF5F03]/20"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0",
                      collapsed ? "w-[17px] h-[17px]" : "w-[15px] h-[15px]",
                      isActive ? "text-white" : "text-white/50"
                    )}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-[13px]">{item.label}</span>
                  )}
                </Link>
                <NavTooltip label={item.label} show={collapsed && hoveredItem === item.href} />
              </div>
            );
          })}
        </nav>

        {/* Keluar + Tutup Sidebar */}
        <div className={cn(
          "flex-shrink-0 mt-auto border-t border-white/10 pt-2 transition-all duration-[220ms]",
          collapsed ? "p-1.5" : "px-2 py-1.5 space-y-0.5"
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center rounded-md text-white/50 hover:bg-[#DC2626]/20 hover:text-[#fca5a5] transition-all duration-200 cursor-pointer w-full",
              collapsed ? "justify-center px-1.5 py-2" : "gap-2.5 px-2.5 py-2"
            )}
          >
            <LogOut className={collapsed ? "w-[17px] h-[17px]" : "w-[15px] h-[15px]"} />
            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">Keluar</span>}
          </button>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer w-full",
              collapsed ? "justify-center px-1.5 py-2" : "gap-2.5 px-2.5 py-2"
            )}
          >
            {collapsed
              ? <ChevronRight className="w-[17px] h-[17px]" />
              : <ChevronLeft className="w-[15px] h-[15px]" />
            }
            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">Tutup Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
