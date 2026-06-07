"use client";

import { useState } from "react";
import {
  Store, Save, Phone, MapPin, Tag, Info,
  Building2, Receipt, Layers, Plus, Trash2,
  CheckCircle, User, ChevronRight,
} from "lucide-react";

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Beras & Tepung" },
  { id: "cat-2", name: "Minyak & Mentega" },
  { id: "cat-3", name: "Gula & Garam" },
  { id: "cat-4", name: "Minuman" },
  { id: "cat-5", name: "Mie & Pasta" },
  { id: "cat-6", name: "Bumbu & Rempah" },
  { id: "cat-7", name: "Sabun & Detergen" },
  { id: "cat-8", name: "Snack & Makanan Ringan" },
  { id: "cat-9", name: "Rokok" },
  { id: "cat-10", name: "Lain-lain" },
];

export default function DemoSettingsPage() {
  const [form, setForm] = useState({
    store_name: "NEXO POS",
    store_tagline: "Sembako & Kebutuhan Harian",
    store_address: "",
    store_phone: "",
  });
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);

  // Category state
  const [categoryList, setCategoryList] = useState(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState("");
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // WhatsApp state
  const [waNumbers, setWaNumbers] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSave = () => {
    setSaved(true);
    showToast("Pengaturan berhasil disimpan!");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setCategoryList((prev) =>
      [...prev, { id: `cat-${Date.now()}`, name }].sort((a, b) => a.name.localeCompare(b.name))
    );
    setNewCatName("");
    showToast("Kategori berhasil ditambahkan!");
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryList((prev) => prev.filter((c) => c.id !== id));
    setCatToDelete(null);
    showToast("Kategori dihapus");
  };

  const handleSaveWa = () => {
    showToast("Nomor WhatsApp berhasil disimpan ✓");
  };

  const handleTestWa = () => {
    if (!waNumbers.trim()) {
      showToast("Isi nomor WhatsApp terlebih dahulu");
      return;
    }
    showToast("✅ Demo: Notifikasi test berhasil dikirim");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8 px-4 md:px-0">
      {/* Toast */}
      {toast && (
        <div className="fixed z-[9999] top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white bg-[#16A34A] animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#072C2C] flex items-center justify-center shadow-lg">
          <Store className="w-6 h-6 text-[#EDEADE]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide leading-tight">
            Pengaturan
          </h1>
          <p className="text-xs text-[#9CA3AF]">Kelola profil toko dan konfigurasi aplikasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Identitas Toko */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-[#072C2C] to-[#0a3d3d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Identitas Toko</h3>
                <p className="text-[10px] text-white/60">Nama dan deskripsi toko</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Nama Toko */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#072C2C]/80">
                  <Store className="w-3.5 h-3.5 text-[#FF5F03]" />
                  Nama Toko
                </label>
                <input
                  value={form.store_name}
                  onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
                  placeholder="NEXO POS"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-medium text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] transition-all"
                />
                <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Muncul di struk dan header aplikasi
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#072C2C]/80">
                  <Tag className="w-3.5 h-3.5 text-[#FF5F03]" />
                  Tagline / Slogan
                </label>
                <input
                  value={form.store_tagline}
                  onChange={(e) => setForm((f) => ({ ...f, store_tagline: e.target.value }))}
                  placeholder="Sembako & Kebutuhan Harian"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Kontak & Lokasi */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-[#FF5F03] to-[#e05500] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kontak & Lokasi</h3>
                <p className="text-[10px] text-white/60">Alamat dan nomor telepon</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Alamat */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#072C2C]/80">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5F03]" />
                  Alamat Toko
                </label>
                <textarea
                  value={form.store_address}
                  onChange={(e) => setForm((f) => ({ ...f, store_address: e.target.value }))}
                  placeholder="Jl. Contoh No.1, Kota"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] transition-all resize-none"
                />
                <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Tampil di bagian bawah struk
                </p>
              </div>

              {/* Telepon */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#072C2C]/80">
                  <Phone className="w-3.5 h-3.5 text-[#FF5F03]" />
                  No. Telepon / WhatsApp
                </label>
                <input
                  value={form.store_phone}
                  onChange={(e) => setForm((f) => ({ ...f, store_phone: e.target.value }))}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
              saved
                ? "bg-[#16A34A] text-white"
                : "bg-[#FF5F03] hover:bg-[#e05500] text-white"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Tersimpan!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Pengaturan
              </>
            )}
          </button>

          {/* Kategori Produk */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-[#072C2C] to-[#0a3d3d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kategori Produk</h3>
                <p className="text-[10px] text-white/60">Kelola kategori untuk pengelompokan produk</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Add category form */}
              <div className="flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                  }}
                  placeholder="Nama kategori baru..."
                  className="flex-1 px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] transition-all"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5F03] hover:bg-[#e05500] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>

              {/* Category list */}
              <div className="divide-y divide-[#F0EEE8] border border-[#E5E3DC] rounded-xl overflow-hidden">
                {categoryList.length === 0 ? (
                  <p className="text-center text-xs text-[#9CA3AF] py-6">Belum ada kategori</p>
                ) : (
                  categoryList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAF8] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FF5F03]" />
                        <span className="text-sm text-[#072C2C]">{cat.name}</span>
                      </div>
                      {catToDelete === cat.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#DC2626]">Hapus?</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-[10px] font-bold text-white bg-[#DC2626] px-2 py-0.5 rounded hover:bg-[#B91C1C] transition-colors"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setCatToDelete(null)}
                            className="text-[10px] font-bold text-[#072C2C]/60 px-2 py-0.5 rounded border border-[#D9D6C8] hover:bg-[#F0EEE8] transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCatToDelete(cat.id)}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notifikasi WhatsApp */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-[#16A34A] to-[#15803d] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Zm0 0a5 5 0 0 0 5 5m0 0h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Notifikasi WhatsApp</h3>
                <p className="text-[10px] text-white/60">Otomatis kirim peringatan H-7 kadaluarsa</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl">
                <Info className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700 leading-relaxed">
                  Sistem akan otomatis mengirim notifikasi WhatsApp <strong>H-7</strong> sebelum
                  produk kadaluarsa. Notif dikirim setiap hari pukul <strong>07.00 WIB</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#072C2C]/80">
                  <Phone className="w-3.5 h-3.5 text-[#16A34A]" />
                  Nomor WhatsApp Penerima
                </label>
                <textarea
                  value={waNumbers}
                  onChange={(e) => setWaNumbers(e.target.value)}
                  placeholder="628123456789, 628987654321"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all resize-none font-mono"
                />
                <p className="text-[10px] text-[#9CA3AF]">
                  Pisahkan dengan koma untuk beberapa nomor. Format: 628xxxxxxxxxx
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSaveWa}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803d] text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Simpan Nomor
                </button>
                <button
                  onClick={handleTestWa}
                  disabled={!waNumbers.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-[#16A34A] text-[#16A34A] text-sm font-bold rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Test Kirim
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — sticky on desktop */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          {/* Struk Preview */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3.5 border-b border-[#E5E3DC] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#072C2C]" />
              <h3 className="text-sm font-bold text-[#072C2C]">Preview Struk</h3>
            </div>
            <div className="p-4">
              <div
                className="bg-[#FAFAF8] border border-dashed border-[#D9D6C8] rounded-xl p-4 mx-auto"
                style={{ fontFamily: "'Courier New', monospace", maxWidth: "240px" }}
              >
                <div className="text-center space-y-0.5 mb-3">
                  <p className="font-black text-[13px] tracking-wide text-[#072C2C]">
                    {form.store_name || "NAMA TOKO"}
                  </p>
                  <p className="text-[9px] text-[#666]">{form.store_tagline || "Tagline toko"}</p>
                  {form.store_address && (
                    <p className="text-[9px] text-[#888]">{form.store_address}</p>
                  )}
                  {form.store_phone && (
                    <p className="text-[9px] text-[#888]">{form.store_phone}</p>
                  )}
                </div>
                <div className="border-t border-dashed border-[#CCC] pt-2 pb-1 space-y-1">
                  {[
                    ["Produk A", "Rp 5.000"],
                    ["Produk B x2", "Rp 10.000"],
                  ].map(([n, p]) => (
                    <div key={n} className="flex justify-between text-[9px] text-[#555]">
                      <span>{n}</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-[#CCC] pt-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-[#072C2C]">
                    <span>TOTAL</span>
                    <span>Rp 15.000</span>
                  </div>
                </div>
                <p className="text-center text-[9px] text-[#AAA] mt-2.5 pt-2 border-t border-dashed border-[#DDD]">
                  Terima kasih sudah belanja!
                </p>
              </div>
              <p className="text-[10px] text-[#9CA3AF] text-center mt-2.5">
                Preview berubah otomatis saat anda mengedit
              </p>
            </div>
          </div>

          {/* Akun Info */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3.5 border-b border-[#E5E3DC] flex items-center gap-2">
              <User className="w-4 h-4 text-[#072C2C]" />
              <h3 className="text-sm font-bold text-[#072C2C]">Informasi Akun</h3>
            </div>
            <div className="divide-y divide-[#F0EEE8]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-[#9CA3AF]">Email</span>
                <span className="text-xs font-medium text-[#072C2C] truncate max-w-[140px]">
                  demo@nexopos.com
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-[#9CA3AF]">Role</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5F03]/10 text-[#FF5F03]">
                  Owner
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#FFF8F5] border border-[#FFD9C5] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-[#FF5F03] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Tips
            </p>
            <ul className="space-y-1.5">
              {[
                "Nama toko akan tampil besar di bagian atas struk",
                "Tagline & alamat membantu pelanggan mengenal toko",
                "Perubahan langsung aktif pada struk berikutnya",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1.5 text-[10px] text-[#CC4400]">
                  <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
