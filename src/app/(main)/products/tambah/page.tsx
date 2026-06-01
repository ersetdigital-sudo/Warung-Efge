"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanBarcode, X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mock-data";
import { addProduct, saveProductUnits } from "@/lib/db";

interface UnitLevel { level: number; name: string; conversion: string; stock: string; buyPrice: string; sellPrice: string; }

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");

  // Simple mode (default): 1 satuan
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  // Multi-level mode (optional)
  const [multiLevel, setMultiLevel] = useState(false);
  const [units, setUnits] = useState<UnitLevel[]>([
    { level: 1, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 2, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 3, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
  ]);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanReaderRef = useRef<any>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);

  const stopScanner = () => { try { scanStreamRef.current?.getTracks().forEach(t => { try { t.stop(); } catch {} }); scanStreamRef.current = null; if (scanReaderRef.current) { try { scanReaderRef.current.reset(); } catch {} scanReaderRef.current = null; } } catch {} };
  const openScanner = async () => {
    setScannerError(""); setShowScanner(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.UPC_A]);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 });
      scanReaderRef.current = reader;
      if (!scanVideoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
        scanVideoRef.current.srcObject = stream; scanStreamRef.current = stream;
        await scanVideoRef.current.play();
        reader.decodeFromVideoElement(scanVideoRef.current, (result) => { if (result) { setBarcode(result.getText()); stopScanner(); setShowScanner(false); } });
      } catch { setScannerError("Kamera tidak dapat diakses."); }
    } catch { setScannerError("Kamera tidak dapat diakses."); }
  };
  const closeScanner = () => { stopScanner(); setScannerError(""); setShowScanner(false); };
  useEffect(() => { return () => { stopScanner(); }; }, []);

  const updateUnit = (level: number, field: string, value: string) => { setUnits(prev => prev.map(u => u.level === level ? { ...u, [field]: value } : u)); };

  const getMargin = (buy: string, sell: string) => { const b = Number(buy), s = Number(sell); if (!b || !s) return null; return Math.round((s - b) / s * 100); };

  const handleSubmit = async () => {
    if (!name.trim()) { alert("Nama produk wajib diisi!"); return; }

    if (!multiLevel) {
      // Simple mode: 1 satuan saja
      if (!unit.trim()) { alert("Satuan wajib diisi! (cth: Pcs, Bungkus, Botol)"); return; }
      const product = await addProduct({
        name: name.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
        barcode: barcode.trim() || null,
        category: category || "Lain-lain",
        selling_price: Number(sellPrice) || 0,
        cost_price: Number(buyPrice) || 0,
        stock: Number(stock) || 0,
        unit: unit.trim(),
      });
      if (!product) { alert("Gagal menyimpan produk"); return; }
      // Save single unit level
      await saveProductUnits(product.id, [{ level: 1, name: unit.trim(), conversion: null, stock: Number(stock) || 0, buy_price: Number(buyPrice) || 0, sell_price: Number(sellPrice) || 0 }]);
      router.push("/products");
    } else {
      // Multi-level mode
      const activeUnits = units.filter(u => u.name.trim());
      if (activeUnits.length === 0) { alert("Minimal 1 satuan harus diisi!"); return; }
      const baseUnit = activeUnits[activeUnits.length - 1];
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
      const unitRows = activeUnits.map(u => ({ level: u.level, name: u.name.trim(), conversion: u.conversion ? Number(u.conversion) : null, stock: Number(u.stock) || 0, buy_price: Number(u.buyPrice) || 0, sell_price: Number(u.sellPrice) || 0 }));
      await saveProductUnits(product.id, unitRows);
      router.push("/products");
    }
  };

  const margin = getMargin(buyPrice, sellPrice);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#D9D6C8] px-4 lg:px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/70 hover:text-[#072C2C] cursor-pointer"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Kembali</span></button>
        <h1 className="flex-1 text-center text-base lg:text-lg font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Tambah Produk</h1>
        <div className="w-[80px]" />
      </div>

      <div className="flex-1 px-4 lg:px-8 py-5 lg:py-8 max-w-3xl mx-auto w-full">
        <div className="space-y-5">

          {/* Info Dasar */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#072C2C] uppercase tracking-wider">Informasi Produk</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Nama Produk <span className="text-[#DC2626]">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Indomie Goreng, Aqua 600ml" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan atau ketik" className="flex-1 px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                  <button type="button" onClick={openScanner} className="flex items-center gap-1 px-3 py-2.5 bg-[#FF5F03] text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-[#e55503]"><ScanBarcode className="w-4 h-4" /></button>
                </div>
                {barcode && <p className="text-[10px] text-[#16A34A] mt-1 font-mono">✓ {barcode}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 cursor-pointer">
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">SKU <span className="text-[#9CA3AF]">(opsional)</span></label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Otomatis jika kosong" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
              </div>
            </div>
          </div>

          {/* Harga & Stok - Simple Mode */}
          {!multiLevel && (
            <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#072C2C] uppercase tracking-wider">Harga & Stok</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Satuan <span className="text-[#DC2626]">*</span></label>
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="cth: Pcs, Bungkus, Botol, Kg" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Stok Awal</label>
                  <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Harga Beli</label>
                  <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Harga Jual</label>
                  <input value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-3 py-2.5 border border-[#D9D6C8] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                </div>
              </div>
              {margin !== null && (
                <div className={`text-[11px] font-bold px-3 py-2 rounded-lg ${margin >= 20 ? "bg-[#F0FDF4] text-[#16A34A]" : margin >= 10 ? "bg-[#FFFBEB] text-[#D97706]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                  Margin {margin}% · Untung Rp {(Number(sellPrice) - Number(buyPrice)).toLocaleString("id-ID")} / {unit || "unit"}
                </div>
              )}
            </div>
          )}

          {/* Toggle Multi Level */}
          <div className="bg-white border border-[#D9D6C8] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#072C2C]">Multi Satuan (Opsional)</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">Aktifkan jika produk dijual dalam beberapa satuan (cth: Slop → Bungkus → Batang)</p>
              </div>
              <button onClick={() => setMultiLevel(!multiLevel)} className="cursor-pointer">
                <div className={`w-11 h-6 rounded-full relative transition-colors ${multiLevel ? "bg-[#FF5F03]" : "bg-[#D9D6C8]"}`}>
                  <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${multiLevel ? "left-[22px]" : "left-[3px]"}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Multi Level Units */}
          {multiLevel && (
            <div className="bg-white border border-[#D9D6C8] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#072C2C] uppercase tracking-wider">Tingkatan Satuan</h3>
                <p className="text-[10px] text-[#9CA3AF]">Isi dari terbesar ke terkecil</p>
              </div>
              <div className="space-y-3">
                {units.map((u, idx) => {
                  const m = getMargin(u.buyPrice, u.sellPrice);
                  const labels = ["Satuan Terbesar (cth: Slop, Karton)", "Satuan Tengah (cth: Bungkus, Botol)", "Satuan Terkecil (cth: Batang, Pcs)"];
                  const colors = ["border-l-[#072C2C]", "border-l-[#FF5F03]", "border-l-[#D97706]"];
                  return (
                    <div key={u.level} className={`border border-[#D9D6C8] rounded-lg p-3 border-l-[3px] ${colors[idx]} ${!u.name && idx > 0 ? "opacity-60" : ""}`}>
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Level {u.level} — {labels[idx]}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#9CA3AF] mb-0.5">Nama Satuan</label>
                          <input value={u.name} onChange={(e) => updateUnit(u.level, "name", e.target.value)} placeholder={["Slop", "Bungkus", "Batang"][idx]} className="w-full px-2.5 py-2 border border-[#D9D6C8] rounded text-sm focus:outline-none focus:border-[#FF5F03]" />
                        </div>
                        {u.level < 3 && (
                          <div>
                            <label className="block text-[10px] text-[#9CA3AF] mb-0.5">Isi per 1</label>
                            <input value={u.conversion} onChange={(e) => updateUnit(u.level, "conversion", e.target.value)} placeholder={["10", "12"][idx]} type="number" className="w-full px-2.5 py-2 border border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] text-[#9CA3AF] mb-0.5">Harga Jual</label>
                          <input value={u.sellPrice} onChange={(e) => updateUnit(u.level, "sellPrice", e.target.value)} placeholder="0" type="number" className="w-full px-2.5 py-2 border border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#9CA3AF] mb-0.5">Harga Beli</label>
                          <input value={u.buyPrice} onChange={(e) => updateUnit(u.level, "buyPrice", e.target.value)} placeholder="0" type="number" className="w-full px-2.5 py-2 border border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" />
                        </div>
                      </div>
                      {idx === 2 && (
                        <div className="mt-2">
                          <label className="block text-[10px] text-[#9CA3AF] mb-0.5">Stok Awal ({u.name || "unit terkecil"})</label>
                          <input value={u.stock} onChange={(e) => updateUnit(u.level, "stock", e.target.value)} placeholder="0" type="number" className="w-full sm:w-32 px-2.5 py-2 border border-[#D9D6C8] rounded text-sm font-mono focus:outline-none focus:border-[#FF5F03]" />
                        </div>
                      )}
                      {m !== null && <p className={`text-[10px] font-bold mt-2 ${m >= 20 ? "text-[#16A34A]" : m >= 10 ? "text-[#D97706]" : "text-[#DC2626]"}`}>Margin {m}%</p>}
                    </div>
                  );
                })}
              </div>
              <div className="bg-[#EDEADE] rounded-lg p-3 text-[10px] text-[#4B5563]">
                💡 <strong>Tips:</strong> Kosongkan level yang tidak dipakai. Misal produk cuma punya 2 satuan (Dus → Pcs), isi Level 1 dan Level 3 saja.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <Button variant="secondary" type="button" onClick={() => router.push("/products")}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan Produk</Button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Scan Barcode</p>
              <button onClick={closeScanner} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 relative min-h-[300px]">
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
            <div className="bg-black px-4 py-4 text-center">{scannerError ? <p className="text-[#DC2626] text-sm">{scannerError}</p> : <p className="text-white/70 text-sm">Arahkan kamera ke barcode</p>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
