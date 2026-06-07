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
  Clock,
  AlertTriangle,
  Bell,
  CheckCircle,
  Layers,
  Wifi,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Kasir Digital Instan",
    desc: "Scan barcode, pilih produk, langsung bayar. Support tunai, QRIS, transfer, EDC, dan sistem bon/hutang.",
  },
  {
    icon: Layers,
    title: "Multi-Satuan Otomatis",
    desc: "Jual per Slop, Bungkus, atau Batang — stok & harga terkonversi otomatis antar satuan.",
  },
  {
    icon: Package,
    title: "Stok Real-Time",
    desc: "Pantau stok semua produk. Dapat peringatan otomatis saat barang menipis atau hampir habis.",
  },
  {
    icon: Bell,
    title: "Pengingat Kadaluarsa",
    desc: "Notifikasi WhatsApp otomatis sebelum produk expired. Hindari kerugian dari barang terbuang.",
  },
  {
    icon: Users,
    title: "Hutang & Cicilan",
    desc: "Catat bon pelanggan & hutang supplier. Tracking pembayaran cicilan dengan riwayat lengkap.",
  },
  {
    icon: BarChart3,
    title: "Laporan Otomatis",
    desc: "Dashboard penjualan harian, mingguan, bulanan. Tahu produk terlaris & metode bayar favorit.",
  },
  {
    icon: Receipt,
    title: "Cetak Struk Otomatis",
    desc: "Generate struk PDF siap print. Compatible dengan printer thermal 58mm standar warung.",
  },
  {
    icon: Shield,
    title: "Multi-User & Role",
    desc: "Pisahkan akses Owner, Admin, dan Kasir. Setiap user hanya bisa akses fitur sesuai rolenya.",
  },
  {
    icon: Wifi,
    title: "Akses dari Mana Saja",
    desc: "Berbasis web — buka dari HP, tablet, atau laptop. Tidak perlu install aplikasi apapun.",
  },
];

const problems = [
  { emoji: "📝", text: "Masih catat penjualan di buku tulis?" },
  { emoji: "😰", text: "Stok sering selisih atau tiba-tiba habis?" },
  { emoji: "💸", text: "Produk expired tanpa disadari?" },
  { emoji: "🤷", text: "Bingung untung atau rugi tiap bulan?" },
  { emoji: "📋", text: "Hutang pelanggan sering lupa dicatat?" },
];

const testimonials = [
  { name: "Bu Siti", role: "Pemilik Toko Kelontong", text: "Sekarang ngga perlu pusing itung stok manual. Semua otomatis, tinggal lihat di HP." },
  { name: "Pak Ahmad", role: "Minimarket", text: "Fitur bon pelanggan sangat membantu. Dulu sering lupa siapa yang hutang berapa." },
  { name: "Deni", role: "Toko Sembako", text: "Yang paling berguna itu pengingat expired. Sudah berkali-kali selamat dari rugi." },
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
            <span className="font-[Oswald] text-white font-bold text-lg tracking-wide">NEXO POS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/demo/dashboard")}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-sm text-white/70 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Coba Gratis
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF5F03]/10 border border-[#FF5F03]/20 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-[#FF5F03]" />
            <span className="text-xs text-[#FF5F03] font-bold">Aplikasi Kasir #1 untuk Warung & Toko Kelontong</span>
          </div>

          <h1 className="font-[Oswald] text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
            Warung Naik Kelas,{" "}
            <br className="hidden sm:block" />
            Omzet Naik{" "}
            <span className="text-[#FF5F03]">Berkali Lipat</span>
          </h1>

          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Sistem kasir lengkap yang bikin toko lo lebih rapi, stok terkontrol, dan keuangan jelas. 
            Tinggal pakai — <strong className="text-white/80">tanpa ribet setting</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push("/demo/dashboard")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-[#FF5F03] text-white font-bold text-base rounded-xl hover:bg-[#e55503] hover:scale-[1.02] transition-all shadow-lg shadow-[#FF5F03]/25 cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              Coba Gratis Sekarang
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("fitur");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-white/5 border border-white/15 text-white font-medium rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              Lihat Fitur Lengkap
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-white/40">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#16A34A]" />
              <span>Tanpa install aplikasi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#16A34A]" />
              <span>Langsung pakai dari HP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#16A34A]" />
              <span>Support printer thermal</span>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-12 sm:mt-16 relative">
            <div className="relative mx-auto max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30 bg-[#EDEADE]">
              <div className="h-8 bg-[#1a1a1a] flex items-center px-3 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-8">
                  <div className="h-4 bg-white/10 rounded-md max-w-xs mx-auto flex items-center justify-center">
                    <span className="text-[9px] text-white/40 font-mono">nexopos.app/dashboard</span>
                  </div>
                </div>
              </div>
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
                    <div className="w-20 h-20 rounded-full border-[8px] border-[#FF5F03] border-t-[#072C2C] border-r-[#D97706]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-[#FF5F03]/5 rounded-3xl blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#051f1f]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-3">Masih Ngalamin Ini?</h2>
            <p className="text-white/40">Kalau salah satu aja iya, berarti toko lo butuh upgrade.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {problems.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-sm text-white/70 font-medium">{p.text}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm">Semua masalah di atas <strong className="text-[#FF5F03] font-bold">bisa diselesaikan</strong> dengan satu aplikasi 👇</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-3">Semua yang Toko Lo Butuhkan</h2>
            <p className="text-white/40 max-w-lg mx-auto">Fitur lengkap, tapi tetap gampang dipake. Ngga perlu jago IT.</p>
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

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#051f1f]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-3">Kata Mereka yang Sudah Pakai</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
                <p className="text-sm text-white/60 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#FF5F03]/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-[#FF5F03]">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-[Oswald] text-2xl sm:text-3xl font-bold text-white mb-4">Siap Upgrade Toko Lo?</h2>
          <p className="text-white/50 mb-8">Coba dulu gratis — tanpa kartu kredit, tanpa ribet. Langsung rasain bedanya.</p>
          <button
            onClick={() => router.push("/demo/dashboard")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF5F03] text-white font-bold text-base rounded-xl hover:bg-[#e55503] hover:scale-[1.02] transition-all shadow-lg shadow-[#FF5F03]/25 cursor-pointer"
          >
            <Smartphone className="w-5 h-5" />
            Coba Gratis Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-white/30 mt-4">Langsung bisa dipakai dalam 5 menit. Serius.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF5F03] rounded-md flex items-center justify-center">
              <Store className="w-3 h-3 text-white" />
            </div>
            <span className="font-[Oswald] text-white/60 font-medium text-sm">NEXO POS</span>
          </div>
          <p className="text-xs text-white/30">&copy; 2024 Nexo POS. Aplikasi Kasir untuk UMKM Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
