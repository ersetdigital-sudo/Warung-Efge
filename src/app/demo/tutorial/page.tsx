"use client";

import { useState } from "react";
import {
  BookOpen, ShoppingCart, Package, Users, Truck, ClipboardList,
  BarChart3, Settings, ChevronDown, ChevronRight, CheckCircle2,
  Zap, Store, UserCircle, Play,
} from "lucide-react";

type Section = {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  steps: { title: string; desc: string; tip?: string }[];
};

const sections: Section[] = [
  {
    id: "pos",
    icon: ShoppingCart,
    color: "text-[#FF5F03]",
    bg: "bg-[#FF5F03]",
    title: "Kasir (POS)",
    subtitle: "Cara melakukan transaksi penjualan",
    steps: [
      { title: "Buka halaman Kasir", desc: "Klik menu Kasir (POS) di sidebar atau bottom navigation." },
      { title: "Cari & tambah produk", desc: "Ketik nama produk di kolom pencarian, atau scan barcode. Klik produk untuk menambahkan ke keranjang." },
      { title: "Atur jumlah & satuan", desc: "Di keranjang, klik tombol + / − untuk mengubah jumlah. Pilih satuan jika produk punya multi satuan (misal: Slop, Bungkus, Batang)." },
      { title: "Pilih pelanggan (opsional)", desc: "Klik ikon pelanggan untuk memilih pelanggan yang akan berhutang. Kosongkan jika transaksi tunai tanpa nama.", tip: "Hutang pelanggan otomatis dicatat di menu Pelanggan." },
      { title: "Pilih metode bayar", desc: "Pilih Tunai, Transfer, atau QRIS. Untuk tunai, masukkan jumlah uang yang diterima — kembalian dihitung otomatis." },
      { title: "Selesaikan transaksi", desc: "Klik Bayar. Struk bisa dicetak atau dibagikan. Stok produk otomatis berkurang." },
    ],
  },
  {
    id: "products",
    icon: Package,
    color: "text-[#16A34A]",
    bg: "bg-[#16A34A]",
    title: "Produk & Stok",
    subtitle: "Kelola katalog dan pantau stok barang",
    steps: [
      { title: "Tambah produk baru", desc: "Buka Produk & Stok → klik Tambah Produk. Isi nama, kategori, SKU, harga beli & jual, serta stok awal." },
      { title: "Atur tanggal kadaluarsa", desc: "Di form produk ada field Tanggal Kadaluarsa. Isi jika produk punya masa kadaluarsa — akan otomatis muncul di notifikasi & laporan.", tip: "Notifikasi bell akan berbunyi jika produk mau expired dalam 30 hari." },
      { title: "Multi satuan", desc: "Aktifkan toggle Multi Satuan jika produk dijual dalam beberapa ukuran (misal: Rokok → Slop → Bungkus → Batang). Isi konversi dan harga tiap satuan." },
      { title: "Update stok", desc: "Di tab Stok & Mutasi, klik Stok Masuk untuk menambah stok. Pilih produk, masukkan jumlah dan satuan." },
      { title: "Stock Opname", desc: "Buka menu Stock Opname di sidebar. Input stok aktual per produk — selisih dengan stok sistem dihitung otomatis, lalu simpan untuk update stok.", tip: "Lakukan opname rutin setiap minggu atau bulan." },
    ],
  },
  {
    id: "purchases",
    icon: ClipboardList,
    color: "text-[#D97706]",
    bg: "bg-[#D97706]",
    title: "Pembelian",
    subtitle: "Catat pembelian dari supplier",
    steps: [
      { title: "Buat pembelian baru", desc: "Buka Pembelian → klik Buat Pembelian. Pilih supplier dan tanggal pembelian." },
      { title: "Tambah item pembelian", desc: "Pilih produk, masukkan jumlah, satuan, dan harga beli per unit. Bisa tambah beberapa produk sekaligus." },
      { title: "Pilih metode pembayaran", desc: "Pilih Cash/Tunai jika langsung dibayar — tidak ada hutang. Pilih Kredit/Hutang jika belum dibayar — hutang ke supplier otomatis bertambah.", tip: "Hutang supplier bisa dilihat dan dibayar di menu Supplier." },
      { title: "Bayar hutang pembelian", desc: "Di halaman Pembelian, klik icon $ di baris pembelian yang belum lunas. Masukkan jumlah bayar — status otomatis berubah ke Sebagian atau Lunas." },
    ],
  },
  {
    id: "suppliers",
    icon: Truck,
    color: "text-[#DC2626]",
    bg: "bg-[#DC2626]",
    title: "Supplier",
    subtitle: "Kelola data supplier dan hutang",
    steps: [
      { title: "Tambah supplier", desc: "Buka Supplier → Tambah Supplier. Isi nama, telepon, email, dan alamat." },
      { title: "Pantau hutang", desc: "Kolom Hutang menampilkan total hutang aktif ke tiap supplier. Warna merah = ada hutang, hijau = lunas." },
      { title: "Bayar hutang supplier", desc: "Klik tombol Bayar di baris supplier yang punya hutang. Masukkan jumlah bayar, pilih metode, dan simpan." },
      { title: "Lihat riwayat pembayaran", desc: "Klik icon riwayat (jam) di baris supplier untuk melihat semua histori pembayaran hutang." },
    ],
  },
  {
    id: "customers",
    icon: Users,
    color: "text-[#2563EB]",
    bg: "bg-[#2563EB]",
    title: "Pelanggan & Piutang",
    subtitle: "Kelola pelanggan dan piutang warung",
    steps: [
      { title: "Tambah pelanggan", desc: "Buka Pelanggan → klik Tambah. Isi nama dan nomor telepon pelanggan." },
      { title: "Catat piutang manual", desc: "Klik nama pelanggan → Tambah Piutang. Masukkan nominal dan keterangan (misal: Beli beras 5kg)." },
      { title: "Catat pembayaran", desc: "Klik Catat Pembayaran di detail pelanggan. Pilih metode (tunai/transfer), masukkan jumlah, lalu simpan.", tip: "Gunakan tombol Lunas untuk langsung melunasi semua piutang sekaligus." },
      { title: "Pantau umur piutang", desc: "Badge warna menunjukkan umur piutang: hijau (< 7 hari), kuning (7–30 hari), merah (> 30 hari)." },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    color: "text-[#7C3AED]",
    bg: "bg-[#7C3AED]",
    title: "Laporan",
    subtitle: "Analisis penjualan dan keuangan",
    steps: [
      { title: "Tab Penjualan", desc: "Lihat total pendapatan, jumlah transaksi, rata-rata per transaksi, dan distribusi per jam & metode pembayaran." },
      { title: "Tab Produk", desc: "Lihat performa produk terlaris dan daftar produk yang mendekati kadaluarsa." },
      { title: "Tab Kasir", desc: "Bandingkan kinerja tiap kasir: jumlah transaksi dan total penjualan." },
      { title: "Tab Stok", desc: "Pantau status stok semua produk dan daftar produk yang akan kadaluarsa dalam 60 hari." },
      { title: "Tab Keuangan", desc: "Lihat laporan laba rugi lengkap: pendapatan, HPP, biaya operasional, dan laba bersih. Bisa tambah biaya operasional manual.", tip: "Tambahkan biaya operasional (listrik, sewa, dll) setiap bulan untuk laporan yang akurat." },
    ],
  },
  {
    id: "users",
    icon: UserCircle,
    color: "text-[#0891B2]",
    bg: "bg-[#0891B2]",
    title: "Pengguna",
    subtitle: "Kelola akun & hak akses",
    steps: [
      { title: "3 level akses", desc: "Owner: akses penuh ke semua fitur. Admin: sama dengan owner. Kasir: hanya bisa akses Kasir, Produk, dan Transaksi." },
      { title: "Tambah pengguna", desc: "Buka Pengguna → klik Undang. Masukkan email, nama, dan pilih role. Pengguna akan menerima undangan via email." },
      { title: "Nonaktifkan akun", desc: "Toggle Aktif/Nonaktif di baris pengguna untuk menonaktifkan akses tanpa menghapus data." },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    color: "text-[#059669]",
    bg: "bg-[#059669]",
    title: "Pengaturan",
    subtitle: "Konfigurasi toko dan kategori",
    steps: [
      { title: "Info toko", desc: "Atur nama toko, tagline, alamat, dan nomor telepon. Data ini tampil di struk penjualan." },
      { title: "Kategori produk", desc: "Tambah atau hapus kategori sesuai jenis produk warungmu. Kategori digunakan saat input produk baru." },
      { title: "Preview struk", desc: "Preview struk di sisi kanan berubah real-time saat kamu edit info toko — pastikan tampilannya sesuai sebelum disimpan." },
    ],
  },
];

export default function DemoTutorialPage() {
  const [openSection, setOpenSection] = useState<string | null>("pos");

  const toggle = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#072C2C] flex items-center justify-center shadow-lg flex-shrink-0">
          <BookOpen className="w-6 h-6 text-[#EDEADE]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide leading-tight">
            Tutorial
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Panduan lengkap penggunaan Nexo POS</p>
        </div>
      </div>

      {/* Quick start banner */}
      <div className="bg-[#072C2C] rounded-2xl p-4 sm:p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-[#FF5F03] rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Quick Start</p>
          <p className="text-xs text-white/60 mt-1 leading-relaxed">
            Urutan yang disarankan:{" "}
            <span className="text-white/90 font-medium">Pengaturan</span> →{" "}
            <span className="text-white/90 font-medium">Tambah Produk</span> →{" "}
            <span className="text-white/90 font-medium">Tambah Supplier</span> →{" "}
            <span className="text-white/90 font-medium">Mulai Kasir</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: "Pengaturan", href: "/demo/settings", color: "bg-[#FF5F03]" },
              { label: "Tambah Produk", href: "/demo/products", color: "bg-[#FF5F03]" },
              { label: "Kasir", href: "/demo/pos", color: "bg-[#FF5F03]" },
            ].map((btn) => (
              <a
                key={btn.href}
                href={btn.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${btn.color} text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity`}
              >
                <Play className="w-3 h-3" />
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((sec) => {
          const isOpen = openSection === sec.id;
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${
                isOpen ? "border-[#E5E3DC] shadow-md" : "border-[#E5E3DC]"
              }`}
            >
              {/* Header */}
              <button
                onClick={() => toggle(sec.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 cursor-pointer hover:bg-[#FAFAF8] transition-colors text-left"
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${sec.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#072C2C] leading-tight">{sec.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{sec.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden sm:inline text-[10px] font-semibold text-[#9CA3AF]">
                    {sec.steps.length} langkah
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  )}
                </div>
              </button>

              {/* Steps */}
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-[#F0EEE8]">
                  <div className="mt-4 space-y-3">
                    {sec.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        {/* Step number */}
                        <div
                          className={`w-6 h-6 rounded-full ${sec.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          <span className="text-white text-[10px] font-black">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#072C2C] leading-tight">
                            {step.title}
                          </p>
                          <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">{step.desc}</p>
                          {step.tip && (
                            <div className="flex items-start gap-1.5 mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                              <span className="text-amber-500 text-xs flex-shrink-0 mt-0.5">
                                💡
                              </span>
                              <p className="text-xs text-amber-700 leading-relaxed">{step.tip}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Done button */}
                  <button
                    onClick={() => setOpenSection(null)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#F0EEE8] hover:bg-[#E5E3DC] text-[#072C2C]/60 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tutup
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="bg-[#EDEADE] border border-[#D9D6C8] rounded-2xl p-4 text-center">
        <Store className="w-6 h-6 text-[#072C2C]/30 mx-auto mb-2" />
        <p className="text-xs text-[#9CA3AF]">Nexo POS — POS & Inventory</p>
        <p className="text-[10px] text-[#9CA3AF]/70 mt-0.5">Ada pertanyaan? Hubungi admin warungmu</p>
      </div>
    </div>
  );
}
