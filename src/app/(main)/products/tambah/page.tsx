"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, X, Check, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";

interface UnitLevel {
  level: number;
  name: string;
  conversion: string;
  stock: string;
  buyPrice: string;
  sellPrice: string;
  active: boolean;
}

export default function AddProductPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);

  // Unit levels
  const [units, setUnits] = useState<UnitLevel[]>([
    { level: 1, name: "", conversion: "", stock: "0", buyPrice: "", sellPrice: "", active: true },
    { level: 2, name: "", conversion: "", stock: "0", buyPrice: "", sellPrice: "", active: false },
    { level: 3, name: "", conversion: "", stock: "0", buyPrice: "", sellPrice: "", active: false },
  ]);

  const updateUnit = (level: number, field: keyof UnitLevel, value: string | boolean) => {
    setUnits(prev => prev.map(u => u.level === level ? { ...u, [field]: value } : u));
  };

  const getMargin = (buy: string, sell: string) => {
    const b = Number(buy), s = Number(sell);
    if (!b || !s) return null;
    return Math.round((s - b) / s * 100);
  };

  const formatRp = (val: string) => val ? `Rp ${Number(val).toLocaleString("id-ID")}` : "";

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); streamRef.current = null; }
    if (readerRef.current) { try { readerRef.current.reset(); } catch {} readerRef.current = null; }
  };

  const startCamera = async () => {
    setCameraError(""); setBarcodeDetected(false); setShowCamera(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      setTimeout(async () => {
        if (!videoRef.current) return;
        try {
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
            if (result) { setBarcode(result.getText()); setBarcodeDetected(true); stopCamera(); setShowCamera(false); setTimeout(() => setBarcodeDetected(false), 3000); }
          });
          if (videoRef.current?.srcObject) streamRef.current = videoRef.current.srcObject as MediaStream;
        } catch { setCameraError("Kamera tidak dapat diakses."); setShowCamera(false); }
      }, 200);
    } catch { setCameraError("Kamera tidak dapat diakses."); setShowCamera(false); }
  };

  const handleSubmit = async () => {
    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;
    const fd = new FormData(form);
    const name = fd.get("name") as string;
    if (!name) { alert("Nama produk wajib diisi"); return; }

    const activeUnits = units.filter(u => u.active && u.name);
    if (activeUnits.length === 0) { alert("Minimal 1 satuan aktif dengan nama"); return; }

    setSaving(true);

    // Insert product
    const { data: product, error } = await supabase.from("products").insert({
      name,
      sku: (fd.get("sku") as string) || `SKU-${Date.now().toString(36).toUpperCase()}`,
      barcode: barcode || null,
      category: (fd.get("category") as string) || "Lain-lain",
      // Use level 1 prices as main product prices for backward compat
      cost_price: Number(activeUnits[0].buyPrice) || 0,
      selling_price: Number(activeUnits[0].sellPrice) || 0,
      wholesale_price: activeUnits.length > 1 ? Number(activeUnits[0].sellPrice) || 0 : 0,
      retail_price: activeUnits.length > 2 ? Number(activeUnits[2].sellPrice) || 0 : 0,
      stock: Number(activeUnits[0].stock) || 0,
      min_stock: Number(fd.get("minStock")) || 0,
      unit: activeUnits[0].name,
      has_bulk_unit: activeUnits.length > 1,
      bulk_unit: activeUnits.length > 1 ? activeUnits[0].name : null,
      bulk_conversion: activeUnits.length > 1 ? Number(activeUnits[0].conversion) || null : null,
    }).select().single();

    if (error || !product) { alert("Gagal menyimpan produk. Cek console."); console.error(error); setSaving(false); return; }

    // Insert unit levels
    const unitRows = activeUnits.map(u => ({
      product_id: product.id,
      level: u.level,
      name: u.name,
      conversion: u.conversion ? Number(u.conversion) : null,
      stock: Number(u.stock) || 0,
      buy_price: Number(u.buyPrice) || 0,
      sell_price: Number(u.sellPrice) || 0,
    }));
    await supabase.from("product_units").insert(unitRows);

    setSaving(false);
    router.push("/products");
  };

  // Conversion preview
  const convPreview = () => {
    const u1 = units[0], u2 = units[1], u3 = units[2];
    const parts: string[] = [];
    if (u1.active && u2.active && u1.name && u2.name && u1.conversion) {
      parts.push(`1 ${u1.name} = ${u1.conversion} ${u2.name}`);
    }
    if (u2.active && u3.active && u2.name && u3.name && u2.conversion) {
      parts.push(`1 ${u2.name} = ${u2.conversion} ${u3.name}`);
    }
    if (u1.active && u2.active && u3.active && u1.conversion && u2.conversion && u1.name && u3.name) {
      parts.push(`1 ${u1.name} = ${Number(u1.conversion) * Number(u2.conversion)} ${u3.name}`);
    }
    return parts;
  };

  const levelColors = ["border-l-[#072C2C]", "border-l-[#FF5F03]", "border-l-[#D97706]"];
  const levelLabels = ["Satuan Terbesar", "Satuan Tengah", "Satuan Eceran Terkecil"];
  const levelDots = ["bg-[#072C2C]", "bg-[#FF5F03]", "bg-[#D97706]"];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-[#D9D6C8] px-4 lg:px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/70 hover:text-[#072C2C] cursor-pointer">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Kembali</span>
        </button>
        <h1 className="flex-1 text-center text-base lg:text-lg font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Tambah Produk Baru</h1>
        <div className="w-[80px]" />
      </div>

      <div className="flex-1 px-4 lg:px-8 py-5 lg:py-8 max-w-4xl mx-auto w-full">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Info Dasar */}
          <div>
            <div className="flex items-center gap-2 mb-3"><div className="w-5 h-5 rounded-full bg-[#FF5F03]/10 flex items-center justify-center"><span className="text-[10px] text-[#FF5F03] font-bold">1</span></div><h3 className="text-sm font-bold text-[#072C2C] uppercase tracking-wider">Informasi Dasar</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Nama Produk *</label><input type="text" name="name" placeholder="cth: Sampoerna Mild 16" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-md text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Kategori</label><select name="category" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-md text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"><option value="">Pilih</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">SKU</label><input type="text" name="sku" placeholder="SKU-001 (auto)" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-md text-sm font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan atau ketik" className="flex-1 px-3.5 py-2.5 border border-[#D9D6C8] rounded-md text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                  <button type="button" onClick={startCamera} className="w-10 h-10 flex items-center justify-center border border-[#D9D6C8] rounded-md hover:bg-[#EDEADE] cursor-pointer"><Camera className="w-5 h-5 text-[#072C2C]/60" /></button>
                </div>
                {barcodeDetected && <p className="text-xs text-[#16A34A] font-medium mt-1"><Check className="w-3 h-3 inline" /> Terdeteksi ✓</p>}
                {cameraError && <p className="text-xs text-[#DC2626] mt-1">{cameraError}</p>}
                {showCamera && (<div className="mt-2 relative rounded-md overflow-hidden border border-[#D9D6C8] bg-black"><video ref={videoRef} className="w-full h-[180px] object-cover" autoPlay playsInline muted /><button type="button" onClick={() => { stopCamera(); setShowCamera(false); }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-white" /></button></div>)}
              </div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Min Stok Alert</label><input type="number" name="minStock" placeholder="0" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-md text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" /></div>
            </div>
          </div>
