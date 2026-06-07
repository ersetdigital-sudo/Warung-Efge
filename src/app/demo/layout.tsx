"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { DemoProvider } from "@/lib/demo-context";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Receipt,
  ClipboardCheck,
  ClipboardList,
  Store,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Info,
} from "lucide-react";

const SIDEBAR_KEY = "warung-efge-demo-sidebar-collapsed";

const menuItems = [
  { href: "/demo/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/demo/pos", icon: ShoppingCart, label: "Kasir (POS)" },
  { href: "/demo/products", icon: Package, label: "Produk & Stok" },
  { href: "/demo/stock", icon: ClipboardCheck, label: "Stock Opname" },
  { href: "/demo/transactions", icon: Receipt, label: "Transaksi" },
  { href: "/demo/purchases", icon: ClipboardList, label: "Pembelian" },
  { href: "/demo/suppliers", icon: Truck, label: "Supplier" },
  { href: "/demo/customers", icon: Users, label: "Pelanggan" },
  { href: "/demo/reports", icon: BarChart3, label: "Laporan" },
];

function NavTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 bg-[#072C2C] text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg pointer-events-none">
      {label}
      <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#072C2C] rotate-45" />
    </div>
  );
}

function DemoSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: { isOpen: boolean; onClose: () => void; collapsed: boolean; onToggleCollapse: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#D9D6C8] flex items-center shadow-[0_-2px_10px_rgba(0,0,0,0.06)]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {[
          { href: "/demo/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/demo/pos", icon: ShoppingCart, label: "Kasir" },
          { href: "/demo/products", icon: Package, label: "Produk" },
          { href: "/demo/transactions", icon: Receipt, label: "Transaksi" },
          { href: "/demo/reports", icon: BarChart3, label: "Laporan" },
        ].map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-all active:scale-90 active:opacity-70 ${isActive ? "text-[#FF5F03]" : "text-[#9CA3AF]"}`}
            >
              <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full bg-[#072C2C] flex flex-col overflow-y-auto transition-all duration-[220ms] ease-in-out lg:static lg:z-auto ${collapsed ? "w-[56px]" : "w-56"} hidden md:flex ${isOpen ? "!flex !fixed !z-50" : ""}`}>
        {/* Brand */}
        <div className={`flex items-center h-14 border-b border-white/10 transition-all duration-[220ms] flex-shrink-0 ${collapsed ? "justify-center px-1.5" : "px-3 gap-2"}`}>
          {!collapsed && (
            <Link href="/demo/dashboard" className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 bg-[#FF5F03] rounded-md flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white leading-tight font-[Oswald] whitespace-nowrap">NEXO POS</h1>
                <p className="text-[9px] text-[#FF5F03]/80 leading-none whitespace-nowrap font-medium">MODE DEMO</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/demo/dashboard">
              <div className="w-7 h-7 bg-[#FF5F03] rounded-md flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden flex-shrink-0 p-1 rounded-md hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className={`overflow-y-auto overflow-x-hidden transition-all duration-[220ms] flex-1 ${collapsed ? "px-1.5 py-1" : "px-2 py-1"}`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <div key={item.href} className="relative" onMouseEnter={() => collapsed && setHoveredItem(item.href)} onMouseLeave={() => setHoveredItem(null)}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center rounded-md font-medium transition-all duration-150 mb-[2px] ${collapsed ? "justify-center px-1.5 py-2" : "gap-2.5 px-2.5 py-2 text-sm"} ${isActive ? "bg-[#FF5F03] text-white shadow-md shadow-[#FF5F03]/20" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon className={`flex-shrink-0 ${collapsed ? "w-[17px] h-[17px]" : "w-[15px] h-[15px]"} ${isActive ? "text-white" : "text-white/50"}`} />
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden text-[13px]">{item.label}</span>}
                </Link>
                <NavTooltip label={item.label} show={collapsed && hoveredItem === item.href} />
              </div>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className={`flex-shrink-0 mt-auto border-t border-white/10 pt-2 transition-all duration-[220ms] ${collapsed ? "p-1.5" : "px-2 py-1.5 space-y-0.5"}`}>
          <button
            onClick={() => router.push("/")}
            className={`flex items-center rounded-md text-white/50 hover:bg-[#DC2626]/20 hover:text-[#fca5a5] transition-all duration-200 cursor-pointer w-full ${collapsed ? "justify-center px-1.5 py-2" : "gap-2.5 px-2.5 py-2"}`}
          >
            <LogOut className={collapsed ? "w-[17px] h-[17px]" : "w-[15px] h-[15px]"} />
            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">Keluar Demo</span>}
          </button>
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer w-full ${collapsed ? "justify-center px-1.5 py-2" : "gap-2.5 px-2.5 py-2"}`}
          >
            {collapsed ? <ChevronRight className="w-[17px] h-[17px]" /> : <ChevronLeft className="w-[15px] h-[15px]" />}
            {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">Tutup Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function DemoHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <Menu className="w-5 h-5 text-[#072C2C]" />
        </button>
        {/* Demo banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF5F03]/10 border border-[#FF5F03]/20 rounded-lg">
          <Info className="w-3.5 h-3.5 text-[#FF5F03]" />
          <span className="text-[11px] sm:text-xs font-medium text-[#FF5F03]">Mode Demo — Data tidak tersimpan ke database</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
        <div className="w-8 h-8 bg-[#072C2C] rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">D</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-[#072C2C]">Demo User</p>
          <p className="text-xs text-[#072C2C]/60">Owner</p>
        </div>
      </div>
    </header>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPOS = pathname === "/demo/pos";

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  return (
    <DemoProvider>
      <div className="flex h-screen bg-[#EDEADE] overflow-hidden">
        <DemoSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={mounted ? collapsed : false}
          onToggleCollapse={handleToggleCollapse}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!isPOS && <DemoHeader onMenuClick={() => setSidebarOpen(true)} />}
          <main className={`flex-1 ${isPOS ? "p-0 overflow-hidden" : "overflow-y-auto p-4 lg:p-6 pb-[80px] md:pb-4 lg:pb-6"}`}>
            {children}
          </main>
        </div>
      </div>
    </DemoProvider>
  );
}
