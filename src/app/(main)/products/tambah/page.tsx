"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanBarcode, X, Plus } from "lucide-react";
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

  // Simple mode (default): 1 satuan
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  // Multi-level mode (optional)
  const [multiLevel, setMultiLevel] = useState(false);
  const [units, setUnits] = useState<UnitLevel[]>([
    { level: 1, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 2, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 3, active: true, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
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
  const toggleUnit = (level: number) => { setUnits(prev => prev.map(u => u.level === level ? { ...u, active: !u.active } : u)); };

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
      const activeUnits = units.filter(u => u.active && u.name.trim());
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
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-[#072C2C]/5 px-4 lg:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/60 hover:text-[#072C2C] cursor-pointer transition-colors"><ArrowLeft className="w-4 h-4" />Kembali</button>
          <h1 className="text-sm lg:text-base font-bold text-[#072C2C]">Tambah Produk</h1>
          <Button onClick={handleSubmit}>Simpan</Button>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-5xl mx-auto">
        <div className="space-y-6">

          {/* Info Produk */}
          <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#072C2C] mb-4">Informasi Produk</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Nama Produk <span className="text-[#DC2626]">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Indomie Goreng, Aqua 600ml" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Barcode</label>
                <div className="flex gap-2">
                  <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan atau ketik" className="flex-1 px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                  <button type="button" onClick={openScanner} className="flex items-center gap-1.5 px-4 py-3 bg-[#072C2C] text-white rounded-xl text-xs font-medium cursor-pointer hover:bg-[#0a3d3d] transition-colors"><ScanBarcode className="w-4 h-4" /></button>
                </div>
                {barcode && <p className="text-[10px] text-[#16A34A] mt-1.5 font-mono font-medium">✓ {barcode}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 cursor-pointer">
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">SKU <span className="text-[#072C2C]/30">(opsional)</span></label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Otomatis jika kosong" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
              </div>
            </div>
          </div>

          {/* Harga & Stok - Simple Mode */}
          {!multiLevel && (
            <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#072C2C] mb-4">Harga & Stok</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Satuan <span className="text-[#DC2626]">*</span></label>
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="cth: Pcs, Bungkus" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Stok Awal</label>
                  <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Harga Beli</label>
                  <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Harga Jual</label>
                  <input value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0" type="number" inputMode="numeric" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                </div>
              </div>
              {margin !== null && (
                <div className={`mt-4 text-sm font-semibold px-4 py-3 rounded-xl ${margin >= 20 ? "bg-[#F0FDF4] text-[#16A34A]" : margin >= 10 ? "bg-[#FFFBEB] text-[#D97706]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                  Margin {margin}% · Untung Rp {(Number(sellPrice) - Number(buyPrice)).toLocaleString("id-ID")} / {unit || "unit"}
                </div>
              )}
            </div>
          )}

          {/* Toggle Multi Level */}
          <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#072C2C]">Multi Satuan</p>
                <p className="text-xs text-[#072C2C]/50 mt-0.5">Aktifkan jika produk dijual dalam beberapa satuan (cth: Slop → Bungkus → Batang)</p>
              </div>
              <button onClick={() => setMultiLevel(!multiLevel)} className="cursor-pointer">
                <div className={`w-12 h-7 rounded-full relative transition-colors ${multiLevel ? "bg-[#FF5F03]" : "bg-[#072C2C]/15"}`}>
                  <div className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md transition-all ${multiLevel ? "left-[23px]" : "left-[3px]"}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Multi Level Units */}
          {multiLevel && (
            <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#072C2C]">Tingkatan Satuan</h3>
                <p className="text-[10px] text-[#072C2C]/40">Isi dari terbesar ke terkecil</p>
              </div>
              <div className="space-y-3">
                {units.map((u, idx) => {
                  const m = getMargin(u.buyPrice, u.sellPrice);
                  const labels = ["Satuan Besar (cth: Slop, Karton, Dus)", "Satuan Sedang (cth: Bungkus, Botol)", "Satuan Eceran (cth: Batang, Pcs, Gram)"];
                  const placeholders = [["Slop", "Karton", "Dus"], ["Bungkus", "Botol", "Pcs"], ["Batang", "Pcs", "Gram"]];
                  const colors = ["border-l-[#072C2C]", "border-l-[#FF5F03]", "border-l-[#D97706]"];
                  const dotColors = ["bg-[#072C2C]", "bg-[#FF5F03]", "bg-[#D97706]"];
                  return (
                    <div key={u.level} className={`border border-[#072C2C]/8 rounded-xl p-4 border-l-[3px] ${colors[idx]} ${!u.active ? "opacity-40" : ""}`}>
                      {/* Level header with toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[idx]}`} />
                          <span className="text-xs font-bold text-[#072C2C]">{labels[idx]}</span>
                        </div>
                        <button onClick={() => toggleUnit(u.level)} className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[10px] text-[#072C2C]/40">{u.active ? "Aktif" : "Nonaktif"}</span>
                          <div className={`w-9 h-5 rounded-full relative transition-colors ${u.active ? "bg-[#16A34A]" : "bg-[#072C2C]/15"}`}>
                            <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow transition-all ${u.active ? "left-[18px]" : "left-[2px]"}`} />
                          </div>
                        </button>
                      </div>
                      {/* Fields - only show when active */}
                      {u.active && (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] text-[#072C2C]/50 mb-1">Nama Satuan</label>
                              <input value={u.name} onChange={(e) => updateUnit(u.level, "name", e.target.value)} placeholder={placeholders[idx][0]} className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                            </div>
                            {u.level < 3 ? (
                              <div>
                                <label className="block text-[10px] text-[#072C2C]/50 mb-1">Isi per 1 (ke satuan di bawah)</label>
                                <input value={u.conversion} onChange={(e) => updateUnit(u.level, "conversion", e.target.value)} placeholder={["10", "12"][idx]} type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-[10px] text-[#072C2C]/50 mb-1">Stok Awal</label>
                                <input value={u.stock} onChange={(e) => updateUnit(u.level, "stock", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                              </div>
                            )}
                            <div>
                              <label className="block text-[10px] text-[#072C2C]/50 mb-1">Harga Jual</label>
                              <input value={u.sellPrice} onChange={(e) => updateUnit(u.level, "sellPrice", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#072C2C]/50 mb-1">Harga Beli</label>
                              <input value={u.buyPrice} onChange={(e) => updateUnit(u.level, "buyPrice", e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
                            </div>
                          </div>
                          {m !== null && <p className={`text-xs font-bold mt-3 ${m >= 20 ? "text-[#16A34A]" : m >= 10 ? "text-[#D97706]" : "text-[#DC2626]"}`}>Margin {m}%</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-[#072C2C]/5 rounded-xl p-4 text-xs text-[#072C2C]/60">
                💡 <strong>Tips:</strong> Kosongkan level yang tidak dipakai. Misal produk cuma punya 2 satuan (Dus → Pcs), isi Level 1 dan Level 3 saja.
              </div>
            </div>
          )}

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
