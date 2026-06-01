"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Camera, X, Check, ScanBarcode } from "lucide-react";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mock-data";
import { getProductById, updateProduct, getProductUnits, saveProductUnits } from "@/lib/db";

interface UnitLevel { level: number; active: boolean; name: string; conversion: string; stock: string; buyPrice: string; sellPrice: string; }

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [unitValue, setUnitValue] = useState("");

  // Multi-level
  const [multiLevel, setMultiLevel] = useState(false);
  const [units, setUnits] = useState<UnitLevel[]>([
    { level: 1, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 2, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
    { level: 3, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
  ]);

  // Simple mode prices
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanReaderRef = useRef<any>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const load = async () => {
      const p = await getProductById(productId);
      if (!p) { setLoading(false); return; }
      setProduct(p);
      setName(p.name || "");
      setSku(p.sku || "");
      setBarcode(p.barcode || "");
      setCategory(p.category || "");
      setStock(String(p.stock || 0));
      setMinStock(String(p.min_stock || 0));
      setUnitValue(p.unit || "Pcs");
      setBuyPrice(String(p.cost_price || ""));
      setSellPrice(String(p.selling_price || ""));

      // Load product units
      const pu = await getProductUnits(productId);
      if (pu && pu.length > 0) {
        setMultiLevel(true);
        const newUnits: UnitLevel[] = [
          { level: 1, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
          { level: 2, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
          { level: 3, active: false, name: "", conversion: "", stock: "", buyPrice: "", sellPrice: "" },
        ];
        for (const u of pu) {
          const idx = newUnits.findIndex(x => x.level === u.level);
          if (idx >= 0) {
            newUnits[idx] = { level: u.level, active: true, name: u.name || "", conversion: String(u.conversion || ""), stock: String(u.stock || ""), buyPrice: String(u.buy_price || ""), sellPrice: String(u.sell_price || "") };
          }
        }
        setUnits(newUnits);
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  // Scanner
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } } });
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


  const handleSubmit = async () => {
    if (!name.trim()) { alert("Nama produk wajib diisi!"); return; }
    const updates: Record<string, unknown> = { name: name.trim(), sku: sku.trim() || product.sku, barcode: barcode.trim() || null, category: category || product.category, stock: Number(stock) || 0, min_stock: Number(minStock) || 0, unit: unitValue || product.unit, cost_price: Number(buyPrice) || 0, selling_price: Number(sellPrice) || 0 };
    const success = await updateProduct(productId, updates);
    if (!success) { alert("Gagal menyimpan."); return; }
    if (multiLevel) {
      const activeUnits = units.filter(u => u.active && u.name.trim());
      await saveProductUnits(productId, activeUnits.map(u => ({ level: u.level, name: u.name.trim(), conversion: u.conversion ? Number(u.conversion) : null, stock: Number(u.stock) || 0, buy_price: Number(u.buyPrice) || 0, sell_price: Number(u.sellPrice) || 0 })));
    } else {
      // Multi satuan off → hapus semua product_units
      await saveProductUnits(productId, []);
    }
    router.push("/products");
  };

  if (loading) return <div className="p-8 text-center text-[#072C2C]/50">Memuat...</div>;
  if (!product) return <div className="p-8 text-center text-[#072C2C]/50">Produk tidak ditemukan</div>;
  const margin = Number(buyPrice) && Number(sellPrice) ? Math.round((Number(sellPrice) - Number(buyPrice)) / Number(sellPrice) * 100) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="bg-white border-b border-[#072C2C]/5 px-4 lg:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/60 hover:text-[#072C2C] cursor-pointer"><ArrowLeft className="w-4 h-4" />Kembali</button>
          <h1 className="text-sm lg:text-base font-bold text-[#072C2C]">Edit Produk</h1>
          <Button onClick={handleSubmit}>Simpan</Button>
        </div>
      </div>
      <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-5xl mx-auto w-full space-y-6">
        {/* Info */}
        <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#072C2C] mb-4">Informasi Produk</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2"><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Nama Produk</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
            <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Barcode</label><div className="flex gap-2"><input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="flex-1 px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /><button type="button" onClick={openScanner} className="px-4 py-3 bg-[#072C2C] text-white rounded-xl cursor-pointer"><ScanBarcode className="w-4 h-4" /></button></div></div>
            <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm cursor-pointer"><option value="">Pilih</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">SKU</label><input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
          </div>
        </div>
        {/* Harga Simple */}
        {!multiLevel && (
          <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#072C2C] mb-4">Harga & Stok</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Satuan</label><input value={unitValue} onChange={(e) => setUnitValue(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Stok</label><input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Min Stok</label><input value={minStock} onChange={(e) => setMinStock(e.target.value)} type="number" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Harga Beli</label><input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} type="number" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Harga Jual</label><input value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} type="number" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
            </div>
            {margin !== null && <p className={`mt-3 text-sm font-semibold ${margin >= 20 ? "text-[#16A34A]" : margin >= 10 ? "text-[#D97706]" : "text-[#DC2626]"}`}>Margin {margin}%</p>}
          </div>
        )}
        {/* Multi toggle */}
        <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold text-[#072C2C]">Multi Satuan</p><p className="text-xs text-[#072C2C]/50 mt-0.5">Aktifkan jika produk dijual dalam beberapa satuan</p></div>
            <button onClick={() => setMultiLevel(!multiLevel)} className="cursor-pointer"><div className={`w-12 h-7 rounded-full relative transition-colors ${multiLevel ? "bg-[#FF5F03]" : "bg-[#072C2C]/15"}`}><div className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md transition-all ${multiLevel ? "left-[23px]" : "left-[3px]"}`} /></div></button>
          </div>
        </div>
        {/* Multi units */}
        {multiLevel && (
          <div className="bg-white border border-[#072C2C]/8 rounded-2xl p-5 lg:p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#072C2C]">Tingkatan Satuan</h3>
            {units.map((u, idx) => {
              const labels = ["Satuan Besar", "Satuan Sedang", "Satuan Eceran"];
              const colors = ["border-l-[#072C2C]", "border-l-[#FF5F03]", "border-l-[#D97706]"];
              return (
                <div key={u.level} className={`border border-[#072C2C]/8 rounded-xl p-4 border-l-[3px] ${colors[idx]} ${!u.active ? "opacity-40" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#072C2C]">{labels[idx]}</span>
                    <button onClick={() => toggleUnit(u.level)} className="flex items-center gap-2 cursor-pointer"><span className="text-[10px] text-[#072C2C]/40">{u.active ? "Aktif" : "Off"}</span><div className={`w-9 h-5 rounded-full relative ${u.active ? "bg-[#16A34A]" : "bg-[#072C2C]/15"}`}><div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all ${u.active ? "left-[18px]" : "left-[2px]"}`} /></div></button>
                  </div>
                  {u.active && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><label className="block text-[10px] text-[#072C2C]/50 mb-1">Nama</label><input value={u.name} onChange={(e) => updateUnit(u.level, "name", e.target.value)} className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
                      {u.level < 3 ? <div><label className="block text-[10px] text-[#072C2C]/50 mb-1">Isi per 1</label><input value={u.conversion} onChange={(e) => updateUnit(u.level, "conversion", e.target.value)} type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div> : <div><label className="block text-[10px] text-[#072C2C]/50 mb-1">Stok</label><input value={u.stock} onChange={(e) => updateUnit(u.level, "stock", e.target.value)} type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>}
                      <div><label className="block text-[10px] text-[#072C2C]/50 mb-1">Harga Jual</label><input value={u.sellPrice} onChange={(e) => updateUnit(u.level, "sellPrice", e.target.value)} type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
                      <div><label className="block text-[10px] text-[#072C2C]/50 mb-1">Harga Beli</label><input value={u.buyPrice} onChange={(e) => updateUnit(u.level, "buyPrice", e.target.value)} type="number" className="w-full px-3 py-2.5 border border-[#072C2C]/10 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent"><p className="text-white text-sm">Scan Barcode</p><button onClick={closeScanner} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"><X className="w-5 h-5 text-white" /></button></div>
            <div className="flex-1 relative min-h-[300px]"><video ref={scanVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted /></div>
            <div className="bg-black px-4 py-4 text-center">{scannerError ? <p className="text-[#DC2626] text-sm">{scannerError}</p> : <p className="text-white/70 text-sm">Arahkan kamera ke barcode</p>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
