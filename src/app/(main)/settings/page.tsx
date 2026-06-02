"use client";

import { useState, useEffect } from "react";
import { Store, Save, Phone, MapPin, Tag, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getStoreSettings, updateStoreSetting } from "@/lib/db";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { role } = useAuth();
  const isOwner = role === "owner" || role === "admin";
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ store_name: "", store_tagline: "", store_address: "", store_phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getStoreSettings().then(data => {
      setSettings(data);
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
    setToast("Pengaturan berhasil disimpan!");
    setTimeout(() => setToast(""), 3000);
  };

  if (loading) return <div className="p-8 text-center text-[#072C2C]/50">Memuat pengaturan...</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      {toast && <div className="fixed z-[9999] top-4 right-4 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white bg-[#16A34A]">{toast}</div>}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Pengaturan</h1>
        <p className="text-[10px] text-[#9CA3AF]">Konfigurasi profil toko dan preferensi aplikasi</p>
      </div>

      {/* Profil Toko */}
      <Card>
        <div className="px-5 py-3.5 border-b border-[#D9D6C8] flex items-center gap-2">
          <Store className="w-4 h-4 text-[#FF5F03]" />
          <h3 className="text-sm font-bold text-[#072C2C]">Profil Toko</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Nama Toko</label>
            <input
              value={form.store_name}
              onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
              disabled={!isOwner}
              placeholder="WARUNG EFGE"
              className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 disabled:bg-[#F5F5F0] disabled:text-[#072C2C]/50"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1">Tampil di struk pembayaran dan header aplikasi</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" />Tagline</label>
            <input
              value={form.store_tagline}
              onChange={e => setForm(f => ({ ...f, store_tagline: e.target.value }))}
              disabled={!isOwner}
              placeholder="Sembako & Kebutuhan Harian"
              className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 disabled:bg-[#F5F5F0] disabled:text-[#072C2C]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />Alamat</label>
            <input
              value={form.store_address}
              onChange={e => setForm(f => ({ ...f, store_address: e.target.value }))}
              disabled={!isOwner}
              placeholder="Jl. Contoh No.1, Kota"
              className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 disabled:bg-[#F5F5F0] disabled:text-[#072C2C]/50"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1">Tampil di struk pembayaran</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" />No. Telepon</label>
            <input
              value={form.store_phone}
              onChange={e => setForm(f => ({ ...f, store_phone: e.target.value }))}
              disabled={!isOwner}
              placeholder="0812-xxxx-xxxx"
              className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 disabled:bg-[#F5F5F0] disabled:text-[#072C2C]/50"
            />
          </div>
        </div>
      </Card>

      {/* Preview Struk */}
      <Card>
        <div className="px-5 py-3.5 border-b border-[#D9D6C8] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#072C2C]" />
          <h3 className="text-sm font-bold text-[#072C2C]">Preview Struk</h3>
        </div>
        <div className="p-5">
          <div className="bg-[#F5F5F5] rounded-xl p-4 max-w-[280px] mx-auto" style={{ fontFamily: "'Courier New', monospace", fontSize: "12px" }}>
            <p className="text-center font-bold text-[14px]">{form.store_name || "NAMA TOKO"}</p>
            <p className="text-center text-[10px] text-[#666]">{form.store_tagline || "Tagline toko"}</p>
            {form.store_address && <p className="text-center text-[10px] text-[#666]">{form.store_address}</p>}
            {form.store_phone && <p className="text-center text-[10px] text-[#666]">{form.store_phone}</p>}
            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "8px 0" }} />
            <p className="text-[10px] text-[#999] text-center">... isi struk ...</p>
            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "8px 0" }} />
            <p className="text-center text-[10px] text-[#888]">Terima kasih!</p>
          </div>
        </div>
      </Card>

      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      )}
    </div>
  );
}
