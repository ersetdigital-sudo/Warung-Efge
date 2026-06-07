"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  Receipt,
  ArrowRight,
  Smartphone,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Kasir (POS)",
    desc: "Proses transaksi cepat dengan barcode scanner, multi-unit, dan berbagai metode pembayaran.",
  },
  {
    icon: Package,
    title: "Manajemen Stok",
    desc: "Pantau stok real-time, alert stok menipis, dan pencatatan stock opname otomatis.",
  },
  {
    icon: BarChart3,
    title: "Dashboard & Laporan",
    desc: "Grafik pendapatan, produk terlaris, metode bayar populer — semua dalam satu tampilan.",
  },
  {
    icon: Users,
    title: "Pelanggan & Hutang",
    desc: "Kelola data pelanggan, sistem bon/hutang, dan pembayaran cicilan dengan mudah.",
  },
  {
    icon: Receipt,
    title: "Cetak Struk PDF",
    desc: "Generate struk penjualan otomatis dalam format PDF, siap print thermal.",
  },
  {
    icon: Shield,
    title: "Multi-User & Role",
    desc: "Sistem login aman dengan role Owner, Admin, dan Kasir — akses sesuai kebutuhan.",
  },
];

const techStack = [
  { name: "Next.js 15", color: "#000" },
  { name: "React 19", color: "#61DAFB" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Tailwind CSS", color: "#06B6D4" },
  { name: "Supabase", color: "#3ECF8E" },
  { name: "Recharts", color: "#FF7300" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#072C2C]">
        <div className="w-8 h-8 border-3 border-[#FF5F03] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#072C2C] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#072C2C]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF5F03] rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-[Oswald] text-white font-bold text-lg tracking-wide">WARUNG EFGE</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/demo/dashboard")}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-sm text-white/70 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Coba Demo
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-[#FF5F03] text-white text-sm font-bold rounded-lg hover:bg-[#e55503] transition-all cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-[#FF5F03]" />
            <span className="text-xs text-white/70 font-medium">Sistem POS Modern untuk Warung & Toko Kelontong</span>
          </div>

          <h1 className="font-[Oswald] text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
            Kelola Warung Jadi{" "}
            <span className="text-[#FF5F03]">Lebih Mudah</span>
            <br className="hidden sm:block" /> & Profesional
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
            Dari kasir, stok barang, sampai laporan keuangan — semua dalam satu aplikasi. 
            Dibangun khusus untuk warung dan toko kelontong Indonesia.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push("/demo/dashboard")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5F03] text-white font-bold rounded-xl hover:bg-[#e55503] hover:scale-[1.02] transition-all shadow-lg shadow-[#FF5F03]/20 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              Coba Demo Langsung
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/15 text-white font-medium rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              Login Admin
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Preview mockup */}
          <div className="mt-12 sm:mt-16 relative">
            <div className="relative mx-auto max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30 bg-[#EDEADE]">
              {/* Fake browser bar */}
              <div className="h-8 bg-[#1a1a1a] flex items-center px-3 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-8">
                  <div className="h-4 bg-white/10 rounded-md max-w-xs mx-auto flex items-center justify-center">
                    <span className="text-[9px] text-white/40 font-mono">warung-efge.vercel.app/dashboard</span>
                  </div>
                </div>
              </div>
              {/* Fake dashboard content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {[
                    { label: "Pendapatan Hari Ini", value: "Rp 1.245.000", color: "#FF5F03" },
                    { label: "Total Transaksi", value: "18", color: "#072C2C" },
                    { label: "Rata-rata", value: "Rp 69.167", color: "#D97706" },
                    { label: "Stok Menipis", value: "3 produk", color: "#DC2626" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg p-2.5 sm:p-3 border border-[#D9D6C8]" style={{ borderLeftColor: stat.color, borderLeftWidth: 3 }}>
                      <div className="text-[8px] sm:text-[9px] text-[#9CA3AF] uppercase font-medium mb-1">{stat.label}</div>
                      <div className="font-[Oswald] text-sm sm:text-base font-semibold text-[#072C2C]">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                  <div className="bg-white rounded-lg p-3 border border-[#D9D6C8] h-24 sm:h-32 flex items-end">
                    {/* Fake chart bars */}
                    <div className="flex items-end gap-1.5 w-full h-full pt-4">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full">
                          <div className="bg-[#FF5F03]/20 rounded-t" style={{ height: `${h}%` }}>
                            <div className="bg-[#FF5F03] rounded-t w-full" style={{ height: "40%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#D9D6C8] hidden sm:flex items-center justify-center">
                    {/* Fake donut */}
                    <div className="w-20 h-20 rounded-full border-[8px] border-[#FF5F03] border-t-[#072C2C] border-r-[#D97706]" />
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-[#FF5F03]/5 rounded-3xl blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#051f1f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-3">Fitur Lengkap, Mudah Dipakai</h2>
            <p className="text-white/40 max-w-lg mx-auto">Semua yang dibutuhkan untuk mengelola warung modern — dalam satu platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="group bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] hover:border-[#FF5F03]/30 transition-all duration-300">
                <div className="w-10 h-10 bg-[#FF5F03]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#FF5F03]/20 transition-colors">
                  <f.icon className="w-5 h-5 text-[#FF5F03]" />
                </div>
                <h3 className="font-[Oswald] text-base font-semibold text-white mb-1.5 tracking-wide">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-5">Dibangun dengan</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {techStack.map((tech) => (
              <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tech.color }} />
                <span className="text-xs text-white/60 font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-4">Lihat Langsung Cara Kerjanya</h2>
          <p className="text-white/40 mb-8">Coba mode demo — tanpa perlu akun, tanpa perlu setup apa-apa. Langsung explore semua fitur.</p>
          <button
            onClick={() => router.push("/demo/dashboard")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF5F03] text-white font-bold text-base rounded-xl hover:bg-[#e55503] hover:scale-[1.02] transition-all shadow-lg shadow-[#FF5F03]/25 cursor-pointer"
          >
            <Smartphone className="w-5 h-5" />
            Masuk Mode Demo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF5F03] rounded-md flex items-center justify-center">
              <Store className="w-3 h-3 text-white" />
            </div>
            <span className="font-[Oswald] text-white/60 font-medium text-sm">WARUNG EFGE</span>
          </div>
          <p className="text-xs text-white/30">&copy; 2024 Warung Efge. Built with Next.js & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
