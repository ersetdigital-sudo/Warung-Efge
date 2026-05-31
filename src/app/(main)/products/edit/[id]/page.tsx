"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Camera, X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mock-data";
import { getProductById, updateProduct } from "@/lib/db";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [barcode, setBarcode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [prices, setPrices] = useState({ costPrice: "", sellingPrice: "", wholesalePrice: "", retailPrice: "" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => {
    getProductById(productId).then((p) => {
      setProduct(p);
      if (p) {
        setBarcode(p.barcode || "");
        setHasExpiry(!!p.expiry_date);
        setExpiryDate(p.expiry_date || "");
        setPrices({
          costPrice: String(p.cost_price || ""),
          sellingPrice: String(p.selling_price || ""),
          wholesalePrice: String(p.wholesale_price || ""),
          retailPrice: String(p.retail_price || ""),
        });
      }
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (readerRef.current) { readerRef.current.reset(); readerRef.current = null; }
  };

  const startCamera = async () => {
    setCameraError(""); setBarcodeDetected(false);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader; setShowCamera(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        try {
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
            if (result) { setBarcode(result.getText()); setBarcodeDetected(true); stopCamera(); setShowCamera(false); setTimeout(() => setBarcodeDetected(false), 3000); }
          });
          streamRef.current = videoRef.current.srcObject as MediaStream;
        } catch { setCameraError("Kamera tidak dapat diakses. Silakan ketik barcode manual."); setShowCamera(false); }
      }, 100);
    } catch { setCameraError("Kamera tidak dapat diakses. Silakan ketik barcode manual."); setShowCamera(false); }
  };

  const handleSubmit = async () => {
    if (!product) return;
    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);

    const updates: Record<string, unknown> = {
      name: formData.get("name") || product.name,
      sku: formData.get("sku") || product.sku,
      barcode: barcode || null,
      category: formData.get("category") || product.category,
      cost_price: Number(prices.costPrice) || product.cost_price,
      selling_price: Number(prices.sellingPrice) || product.selling_price,
      wholesale_price: Number(prices.wholesalePrice) || product.wholesale_price,
      retail_price: Number(prices.retailPrice) || product.retail_price,
      stock: Number(formData.get("stock")) ?? product.stock,
      min_stock: Number(formData.get("minStock")) ?? product.min_stock,
      unit: formData.get("unit") || product.unit,
      expiry_date: hasExpiry && expiryDate ? expiryDate : null,
    };

    const success = await updateProduct(productId, updates);
    if (success) router.push("/products");
    else alert("Gagal menyimpan. Coba lagi.");
  };

  if (loading) return <div className="p-8 text-center text-[#072C2C]/50">Memuat...</div>;
  if (!product) return <div className="p-8 text-center text-[#072C2C]/50">Produk tidak ditemukan</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-[#D9D6C8] px-4 lg:px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/products")} className="flex items-center gap-1.5 text-sm text-[#072C2C]/70 hover:text-[#072C2C] cursor-pointer">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Kembali</span>
        </button>
        <h1 className="flex-1 text-center text-base lg:text-lg font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Edit Produk</h1>
        <div className="w-[80px]" />
      </div>
      <div className="flex-1 px-4 lg:px-8 py-5 lg:py-8 max-w-4xl mx-auto w-full">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div>
            <h3 className="text-sm font-bold text-[#072C2C] mb-3 uppercase tracking-wider">Informasi Produk</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Nama Produk</label><input type="text" name="name" defaultValue={product.name} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Kategori</label><select name="category" defaultValue={product.category} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"><option value="">Pilih Kategori</option>{categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">SKU</label><input type="text" name="sku" defaultValue={product.sku} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="flex-1 px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" />
                  <button type="button" onClick={startCamera} className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[#D9D6C8] rounded-lg hover:bg-[#EDEADE] cursor-pointer"><Camera className="w-5 h-5 text-[#072C2C]/60" /></button>
                </div>
                {barcodeDetected && <p className="text-xs text-[#16A34A] font-medium mt-1 flex items-center gap-1"><Check className="w-3 h-3" />Barcode terdeteksi ✓</p>}
                {cameraError && <p className="text-xs text-[#DC2626] mt-1">{cameraError}</p>}
                {showCamera && (<div className="mt-2 relative rounded-lg overflow-hidden border border-[#D9D6C8] bg-black"><video ref={videoRef} className="w-full h-[200px] object-cover" autoPlay playsInline muted /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[60%] h-[40%] border-2 border-white/60 rounded-lg" /></div><button type="button" onClick={() => { stopCamera(); setShowCamera(false); }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-white" /></button></div>)}
              </div>
            </div>
          </div>
          <div className="border-t border-[#D9D6C8] pt-5">
            <h3 className="text-sm font-bold text-[#072C2C] mb-3 uppercase tracking-wider">Harga</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Modal</label><input type="text" inputMode="numeric" value={prices.costPrice ? `Rp ${Number(prices.costPrice).toLocaleString("id-ID")}` : ""} onChange={(e) => setPrices(p => ({ ...p, costPrice: e.target.value.replace(/\D/g, "") }))} placeholder="Rp 0" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Jual</label><input type="text" inputMode="numeric" value={prices.sellingPrice ? `Rp ${Number(prices.sellingPrice).toLocaleString("id-ID")}` : ""} onChange={(e) => setPrices(p => ({ ...p, sellingPrice: e.target.value.replace(/\D/g, "") }))} placeholder="Rp 0" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Grosir</label><input type="text" inputMode="numeric" value={prices.wholesalePrice ? `Rp ${Number(prices.wholesalePrice).toLocaleString("id-ID")}` : ""} onChange={(e) => setPrices(p => ({ ...p, wholesalePrice: e.target.value.replace(/\D/g, "") }))} placeholder="Rp 0" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Eceran</label><input type="text" inputMode="numeric" value={prices.retailPrice ? `Rp ${Number(prices.retailPrice).toLocaleString("id-ID")}` : ""} onChange={(e) => setPrices(p => ({ ...p, retailPrice: e.target.value.replace(/\D/g, "") }))} placeholder="Rp 0" className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
            </div>
          </div>
          <div className="border-t border-[#D9D6C8] pt-5">
            <h3 className="text-sm font-bold text-[#072C2C] mb-3 uppercase tracking-wider">Stok & Satuan</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Stok</label><input type="number" name="stock" defaultValue={product.stock} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Min Stok</label><input type="number" name="minStock" defaultValue={product.min_stock} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              <div><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Satuan</label><select defaultValue={product.unit} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]"><option value="">Pilih</option><option>Pcs</option><option>Kg</option><option>Liter</option><option>Botol</option><option>Bungkus</option><option>Kotak</option><option>Karung</option><option>Dus</option><option>Pak</option></select></div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" checked={hasExpiry} onChange={(e) => setHasExpiry(e.target.checked)} className="w-4 h-4 rounded accent-[#FF5F03]" /><span className="text-sm font-medium text-[#072C2C]">Produk ini memiliki tanggal expired</span></label>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${hasExpiry ? "max-h-24 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                <div className="max-w-xs"><label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Tanggal Expired</label><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3.5 py-2.5 border border-[#D9D6C8] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" /></div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#D9D6C8] pt-5 flex items-center justify-end gap-3 sticky bottom-0 bg-[#EDEADE] py-4 -mx-4 px-4 lg:static lg:bg-transparent lg:py-0 lg:mx-0 lg:px-0">
            <Button variant="secondary" type="button" onClick={() => router.push("/products")}>Batal</Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
