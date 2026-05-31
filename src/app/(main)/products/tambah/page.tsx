"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanBarcode, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mock-data";
import { addProduct, saveProductUnits } from "@/lib/db";

interface UnitLevel { level: number; active: boolean; name: string; conversion: string; stock: string; buyPrice: string; sellPrice: string; }

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanReaderRef = useRef<any>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const [units, setUnits] = useState<UnitLevel[]>([
    { level: 1, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 2, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 3, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
  ]);

  // Barcode scanner
  const stopScanner = () => {
    try { scanStreamRef.current?.getTracks().forEach(t => { try { t.stop(); } catch {} }); scanStreamRef.current = null; if (scanReaderRef.current) { try { scanReaderRef.current.reset(); } catch {} scanReaderRef.current = null; } } catch {}
  };

  const openScanner = async () => {
    setScannerError(""); setShowScanner(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      scanReaderRef.current = reader;
      setTimeout(async () => {
        if (!scanVideoRef.current) return;
        try {
          await reader.decodeFromVideoDevice(undefined, scanVideoRef.current, (result) => {
            if (result) { const code = result.getText(); setBarcode(code); stopScanner(); setShowScanner(false); }
          });
          if (scanVideoRef.current?.srcObject) scanStreamRef.current = scanVideoRef.current.srcObject as MediaStream;
        } catch { setScannerError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan."); }
      }, 200);
    } catch { setScannerError("Kamera tidak dapat diakses."); }
  };

  const closeScanner = () => { stopScanner(); setScannerError(""); setShowScanner(false); };
  useEffect(() => { return () => { stopScanner(); }; }, []);

  const updateUnit = (level: number, field: string, value: string) => {
    setUnits(prev => prev.map(u => u.level === level ? { ...u, [field]: value } : u));
  };
  const toggleUnit = (level: number) => {
    setUnits(prev => prev.map(u => u.level === level ? { ...u, active: !u.active } : u));
  };

  const getMargin = (buy: string, sell: string) => {
    const b = Number(buy), s = Number(sell);
    if (!b || !s) return null;
    return Math.round((s - b) / s * 100);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { alert("Nama produk wajib diisi!"); return; }
    const activeUnits = units.filter(u => u.active && u.name.trim());
    if (activeUnits.length === 0) { alert("Minimal 1 satuan aktif!"); return; }

    // Save product
    const baseUnit = activeUnits[activeUnits.length - 1]; // smallest unit
    const product = await addProduct({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
      barcode: barcode.trim() || null,
      category: category || "Lain-lain",
      selling_price: Number(baseUnit.sellPrice) || 0,
      cost_price: Number(baseUnit.buyPrice) || 0,
      stock: Number(baseUnit.stock) || 0,
      unit: baseUnit.name,
    });

    if (!product) { alert("Gagal menyimpan produk"); return; }

    // Save unit levels
    const unitRows = activeUnits.map(u => ({
      level: u.level,
      name: u.name.trim(),
      conversion: u.conversion ? Number(u.conversion) : null,
      stock: Number(u.stock) || 0,
      buy_price: Number(u.buyPrice) || 0,
      sell_price: Number(u.sellPrice) || 0,
    }));
    await saveProductUnits(product.id, unitRows);
    router.push("/products");
  };

  // Conversion preview
  const convPreview = () => {
    const active = units.filter(u => u.active && u.name);
    if (active.length < 2) return null;
    const parts: string[] = [];
    for (let i = 0; i < active.length - 1; i++) {
      if (active[i].conversion) parts.push(`1 ${active[i].name} = ${active[i].conversion} ${active[i + 1].name}`);
    }
    // Total conversion
    if (active.length === 3 && active[0].conversion && active[1].conversion) {
      const total = Number(active[0].conversion) * Number(active[1].conversion);
      parts.push(`1 ${active[0].name} = ${total} ${active[2].name}`);
    }
    return parts;
  };

  const levelLabels = ["Level 1 — Satuan Terbesar", "Level 2 — Satuan Tengah", "Level 3 — Satuan Eceran Terkecil"];
  const levelColors = ["bg-[#072C2C]", "bg-[#FF5F03]", "bg-[#D97706]"];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-[#D9D6C8] px-4 lg:px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/70 hover:text-[#072C2C] cursor-pointer"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Kembali</span></button>
        <h1 className="flex-1 text-center text-base lg:text-lg font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Tambah Produk Baru</h1>
        <div className="w-[80px]" />
      </div>

      <div className="flex-1 px-4 lg:px-8 py-5 lg:py-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Info Dasar */}
          <div>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] mb-3 uppercase tracking-wider flex items-center gap-2">Informasi Dasar</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Nama Produk *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Sampoerna Mild" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm focus:outline-none focus:border-[#FF5F03]" /></div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">SKU</label><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" /></div>
              <div>
                <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan atau ketik barcode" className="flex-1 px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" />
                  <button type="button" onClick={openScanner} className="flex items-center gap-1.5 px-3 py-2 bg-[#FF5F03] text-white rounded text-xs font-medium cursor-pointer hover:bg-[#e55503]">
                    <ScanBarcode className="w-4 h-4" />Scan
                  </button>
                </div>
                {barcode && <p className="text-[10px] text-[#16A34A] mt-1 font-mono">✓ {barcode}</p>}
              </div>
              <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm focus:outline-none focus:border-[#FF5F03] cursor-pointer"><option value="">Pilih Kategori</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            </div>
          </div>

          <hr className="border-[#D9D6C8]" />

          {/* Tingkatan Satuan */}
          <div>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] mb-3 uppercase tracking-wider flex items-center gap-2">Tingkatan Satuan (Multi Level)</h3>
            <div className="space-y-3">
              {units.map((u, idx) => {
                const margin = getMargin(u.buyPrice, u.sellPrice);
                const nextUnit = units[idx + 1];
                return (
                  <div key={u.level} className={`bg-[#EDEADE] border border-[#D9D6C8] rounded-md p-3 ${!u.active ? "opacity-40" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${levelColors[idx]}`} />
                        <span className="text-[11px] font-bold text-[#111827]">{levelLabels[idx]}</span>
                      </div>
                      <button onClick={() => toggleUnit(u.level)} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[10px] text-[#9CA3AF]">{u.active ? "Aktif" : "Nonaktif"}</span>
                        <div className={`w-8 h-[18px] rounded-full relative transition-colors ${u.active ? "bg-[#16A34A]" : "bg-[#B8B4A2]"}`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${u.active ? "left-[16px]" : "left-[2px]"}`} />
                        </div>
                      </button>
                    </div>
                    {u.active && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Nama Satuan</label><input value={u.name} onChange={(e) => updateUnit(u.level, "name", e.target.value)} placeholder={["cth: Slop", "cth: Bungkus", "cth: Batang"][idx]} className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm bg-white focus:outline-none focus:border-[#FF5F03]" /></div>
                          {u.level < 3 && <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Isi (ke Level {u.level + 1})</label><input value={u.conversion} onChange={(e) => updateUnit(u.level, "conversion", e.target.value)} placeholder={["10", "12"][idx]} type="number" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono bg-white focus:outline-none focus:border-[#FF5F03]" /></div>}
                          {u.level === 3 && <div className="opacity-40"><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Isi (–)</label><input disabled placeholder="Satuan terkecil" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm bg-[#EDEADE]" /></div>}
                          <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Stok Awal</label><input value={u.stock} onChange={(e) => updateUnit(u.level, "stock", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono bg-white focus:outline-none focus:border-[#FF5F03]" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Harga Beli (HPP)</label><input value={u.buyPrice} onChange={(e) => updateUnit(u.level, "buyPrice", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono bg-white focus:outline-none focus:border-[#FF5F03]" /></div>
                          <div><label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Harga Jual</label><input value={u.sellPrice} onChange={(e) => updateUnit(u.level, "sellPrice", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2 border-[1.5px] border-[#D9D6C8] rounded text-sm font-mono bg-white focus:outline-none focus:border-[#FF5F03]" /></div>
                        </div>
                        {margin !== null && (
                          <div className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded border ${margin >= 20 ? "bg-[#F0FDF4] text-[#16A34A] border-[#bbf7d0]" : margin >= 10 ? "bg-[#FFFBEB] text-[#D97706] border-[#fde68a]" : "bg-[#FEF2F2] text-[#DC2626] border-[#fecaca]"}`}>
                            Margin {margin}% · Untung Rp {(Number(u.sellPrice) - Number(u.buyPrice)).toLocaleString("id-ID")} / {u.name || "unit"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Conversion Preview */}
            {convPreview() && convPreview()!.length > 0 && (
              <div className="mt-3 bg-[#EDEADE] border border-[#D9D6C8] rounded p-3 text-[11px] font-mono flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mr-2">Konversi:</span>
                {convPreview()!.map((c, i) => <span key={i} className="text-[#072C2C]">{i > 0 && <span className="text-[#FF5F03] mx-1">→</span>}{c}</span>)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-[#D9D6C8] pt-5 flex items-center justify-end gap-3 sticky bottom-0 bg-[#EDEADE] py-4 -mx-4 px-4 lg:static lg:bg-transparent lg:py-0 lg:mx-0 lg:px-0">
            <Button variant="secondary" type="button" onClick={() => router.push("/products")}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Scan Barcode Produk</p>
              <button onClick={closeScanner} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 relative min-h-[300px] sm:min-h-[360px]">
              <video ref={scanVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] max-w-[280px] aspect-[3/2] relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-lg" />
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[#FF5F03] opacity-80 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="bg-black px-4 py-4 text-center">
              {scannerError ? <p className="text-[#DC2626] text-sm">{scannerError}</p> : <p className="text-white/70 text-sm">Arahkan kamera ke barcode produk</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
