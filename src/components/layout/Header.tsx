"use client";

import { Menu, Bell, User, Search } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="hidden md:block lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
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
        <button className="relative p-2 rounded-lg hover:bg-[#EDEADE] transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-[#072C2C]" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF5F03] rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-9 h-9 bg-[#072C2C] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#072C2C]">Pak Efge</p>
            <p className="text-xs text-[#072C2C]/60">Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}
