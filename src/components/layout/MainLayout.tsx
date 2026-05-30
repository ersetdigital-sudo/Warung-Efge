"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const SIDEBAR_KEY = "warung-efge-sidebar-collapsed";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) {
      setCollapsed(stored === "true");
    } else {
      // Default: collapsed on tablet, expanded on desktop
      const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
      setCollapsed(isTablet);
    }
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  return (
    <div className="flex h-screen bg-[#EDEADE] overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={mounted ? collapsed : false}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[80px] md:pb-4 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
