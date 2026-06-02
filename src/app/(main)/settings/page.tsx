"use client";

import { useState, useEffect } from "react";
import {
  Store, Save, Phone, MapPin, Tag, FileText,
  CheckCircle, Info, Lock, User, ChevronRight,
  Building2, Receipt
} from "lucide-react";
import { getStoreSettings, updateStoreSetting } from "@/lib/db";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { role, user } = useAuth();
  const isOwner = role === "owner" || role === "admin";
  const [form, setForm] = useState({
    store_name: "",
    store_tagline: "",
    store_address: "",
    store_phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getStoreSettings().then((data) => {
      setForm({
        store_name: data.store_name || "WARUNG EFGE",
        store_tagline: data.store_tagline || "Sembako & Kebutuhan Harian",
        store_address: data.store_address || "",
        store_phone: data.store_phone || "",
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      updateStoreSetting("store_name", form.store_name),
      updateStoreSetting("store_tagline", form.store_tagline),
      updateStoreSetting("store_address", form.store_address),
      updateStoreSetting("store_phone", form.store_phone),
    ]);
    setSaving(false);
    setSaved(true);
    setToast("Pengaturan berhasil disimpan!");
    setTimeout(() => {
      setToast("");
      setSaved(false);
    }, 3000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF5F03] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#072C2C]/50">Memuat pengaturan...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl space-y-6 pb-8">
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

      {/* Role notice for cashier */}
      {!isOwner && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Hanya <strong>Owner / Admin</strong> yang dapat mengubah pengaturan ini.
            Anda dapat melihat informasi toko namun tidak bisa mengedit.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-4">

          {/* Identitas Toko */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden shadow-sm">
            {/* Card Header */}
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
                  disabled={!isOwner}
                  placeholder="WARUNG EFGE"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm font-medium text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] disabled:bg-[#F8F7F4] disabled:text-[#072C2C]/40 transition-all"
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
                  disabled={!isOwner}
                  placeholder="Sembako & Kebutuhan Harian"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] disabled:bg-[#F8F7F4] disabled:text-[#072C2C]/40 transition-all"
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
                  disabled={!isOwner}
                  placeholder="Jl. Contoh No.1, Kota"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] disabled:bg-[#F8F7F4] disabled:text-[#072C2C]/40 transition-all resize-none"
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
                  disabled={!isOwner}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-4 py-2.5 border border-[#E5E3DC] rounded-xl text-sm text-[#072C2C] placeholder:text-[#072C2C]/25 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] disabled:bg-[#F8F7F4] disabled:text-[#072C2C]/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isOwner && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                saved
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#FF5F03] hover:bg-[#e05500] text-white disabled:opacity-60"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Tersimpan!
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Preview + Info */}
        <div className="lg:col-span-2 space-y-4">
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
                  <p className="text-[9px] text-[#666]">
                    {form.store_tagline || "Tagline toko"}
                  </p>
                  {form.store_address && (
                    <p className="text-[9px] text-[#888]">{form.store_address}</p>
                  )}
                  {form.store_phone && (
                    <p className="text-[9px] text-[#888]">{form.store_phone}</p>
                  )}
                </div>
                <div className="border-t border-dashed border-[#CCC] pt-2 pb-1 space-y-1">
                  {[["Produk A", "Rp 5.000"], ["Produk B x2", "Rp 10.000"]].map(([n, p]) => (
                    <div key={n} className="flex justify-between text-[9px] text-[#555]">
                      <span>{n}</span><span>{p}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-[#CCC] pt-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-[#072C2C]">
                    <span>TOTAL</span><span>Rp 15.000</span>
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
              {[
                { label: "Email", value: user?.email || "—" },
                {
                  label: "Role",
                  value:
                    role === "owner"
                      ? "Owner"
                      : role === "admin"
                      ? "Admin"
                      : "Kasir",
                  badge: true,
                },
              ].map(({ label, value, badge }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-[#9CA3AF]">{label}</span>
                  {badge ? (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        role === "owner"
                          ? "bg-[#FF5F03]/10 text-[#FF5F03]"
                          : role === "admin"
                          ? "bg-[#072C2C]/10 text-[#072C2C]"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {value}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[#072C2C] truncate max-w-[140px]">
                      {value}
                    </span>
                  )}
                </div>
              ))}
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
