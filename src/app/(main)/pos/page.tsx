"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Printer, ScanBarcode, AlertTriangle, RotateCcw, X, Check, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { categories } from "@/data/mock-data";
import { getProducts, getProductsWithUnits, addTransaction, addStockMovement } from "@/lib/db";
import { supabase } from "@/lib/supabase";

interface ProductUnit {
  level: number;
  name: string;
  conversion: number | null;
  stock: number;
  buy_price: number;
  sell_price: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  stockPerUnit: number; // how many base stock units this consumes
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"rp" | "persen">("rp");
  const [discountInput, setDiscountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris" | "edc">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [trxId, setTrxId] = useState(() => `TRX-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [successToast, setSuccessToast] = useState("");
  const [stockError, setStockError] = useState("");
  const [todayTrxCount, setTodayTrxCount] = useState(0);
  const [todayOmzet, setTodayOmzet] = useState(0);

  // Load products with units from Supabase
  useEffect(() => {
    const load = () => { getProductsWithUnits().then(setProducts); };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  // Load today's transaction stats
  useEffect(() => {
    const loadStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("transactions")
        .select("total")
        .gte("created_at", today + "T00:00:00")
        .lte("created_at", today + "T23:59:59");
      if (data) {
        setTodayTrxCount(data.length);
        setTodayOmzet(data.reduce((sum: number, t: any) => sum + (t.total || 0), 0));
      }
    };
    loadStats();
  }, []);

  // Barcode scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerMsg, setScannerMsg] = useState("");
  const [scanNotification, setScanNotification] = useState("");
  const [hasCamera, setHasCamera] = useState(true);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanReaderRef = useRef<any>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        if (devices.filter(d => d.kind === "videoinput").length === 0) setHasCamera(false);
      }).catch(() => setHasCamera(false));
    } else { setHasCamera(false); }
  }, []);

  const stopScanner = () => {
    try {
      if (scanStreamRef.current) { scanStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); scanStreamRef.current = null; }
      if (scanReaderRef.current) { try { scanReaderRef.current.reset(); } catch {} scanReaderRef.current = null; }
    } catch {}
  };

  const openScanner = async () => {
    setScannerError(""); setScannerMsg(""); setShowScanner(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.ITF, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, BarcodeFormat.CODABAR, BarcodeFormat.RSS_14, BarcodeFormat.RSS_EXPANDED]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      scanReaderRef.current = reader;
      setTimeout(async () => {
        if (!scanVideoRef.current) return;
        try {
          await reader.decodeFromVideoDevice(undefined, scanVideoRef.current, (result) => {
            if (result) {
              const code = result.getText();
              const product = products.find(p => p.barcode === code);
              if (product) { stopScanner(); setShowScanner(false); addToCart(product.id, product.unit, product.selling_price, 1); setScanNotification("Produk ditambahkan ✓"); setTimeout(() => setScanNotification(""), 2000); }
              else { setScannerMsg("Produk tidak ditemukan."); setTimeout(() => setScannerMsg(""), 2000); }
            }
          });
          if (scanVideoRef.current?.srcObject) scanStreamRef.current = scanVideoRef.current.srcObject as MediaStream;
        } catch { setScannerError("Kamera tidak dapat diakses."); }
      }, 200);
    } catch { setScannerError("Kamera tidak dapat diakses."); }
  };

  const closeScanner = () => { stopScanner(); setScannerError(""); setScannerMsg(""); setShowScanner(false); };
  useEffect(() => { return () => { stopScanner(); }; }, []);

  useEffect(() => {
    if (!showScanner) return;
    const handleBack = (e: PopStateEvent) => { e.preventDefault(); closeScanner(); window.history.pushState(null, "", window.location.href); };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => { window.removeEventListener("popstate", handleBack); };
  }, [showScanner]);

  useEffect(() => {
    if (!showReceipt) return;
    const handleBack = (e: PopStateEvent) => { e.preventDefault(); setShowReceipt(false); window.history.pushState(null, "", window.location.href); };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => { window.removeEventListener("popstate", handleBack); };
  }, [showReceipt]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => (p.name || "").toLowerCase().includes(s) || (p.barcode || "").includes(s) || (p.sku || "").toLowerCase().includes(s));
    }
    return filtered;
  }, [search, selectedCategory, products]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedDiscount = useMemo(() => {
    if (discountType === "persen") return Math.round(subtotal * (Number(discountInput) || 0) / 100);
    return Number(discountInput) || 0;
  }, [discountType, discountInput, subtotal]);
  const total = Math.max(0, subtotal - calculatedDiscount);
  const change = Number(amountPaid) - total;

  // Get available units for a product (from product_units or fallback to product fields)
  const getProductUnits = (product: any): { name: string; price: number; stockPerUnit: number }[] => {
    const units: { name: string; price: number; stockPerUnit: number }[] = [];
    // If product has product_units from DB
    if (product.product_units && product.product_units.length > 0) {
      const sorted = [...product.product_units].sort((a: any, b: any) => (b.level || 0) - (a.level || 0));
      for (const pu of sorted) {
        units.push({ name: pu.name, price: pu.sell_price, stockPerUnit: pu.conversion || 1 });
      }
    } else {
      // Fallback: use bulk_unit, unit, retail_unit from product fields
      if (product.has_bulk_unit && product.bulk_unit && product.wholesale_price) {
        units.push({ name: product.bulk_unit, price: product.wholesale_price, stockPerUnit: product.bulk_conversion || 1 });
      }
      units.push({ name: product.unit, price: product.selling_price, stockPerUnit: 1 });
      if (product.retail_price && product.retail_price > 0 && product.retail_unit) {
        units.push({ name: product.retail_unit, price: product.retail_price, stockPerUnit: product.retail_conversion ? (1 / product.retail_conversion) : 1 });
      }
    }
    return units.length > 0 ? units : [{ name: product.unit || "Pcs", price: product.selling_price || 0, stockPerUnit: 1 }];
  };

  const showStockError = (productName: string) => {
    setStockError(`Stok ${productName} tidak cukup!`);
    setTimeout(() => setStockError(""), 3000);
  };

  const addToCart = (productId: string, unitName: string, price: number, stockPerUnit: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) { showStockError(product.name); return; }

    // Check stock
    const cartKey = `${productId}-${unitName}`;
    const existing = cart.find((item) => item.productId === productId && item.unit === unitName);
    const newQty = existing ? existing.quantity + 1 : 1;
    const totalStockNeeded = newQty * stockPerUnit;

    // Calculate total stock already in cart for this product (all units)
    const otherCartStock = cart
      .filter(i => i.productId === productId && i.unit !== unitName)
      .reduce((sum, i) => sum + (i.quantity * i.stockPerUnit), 0);

    if ((totalStockNeeded + otherCartStock) > product.stock) { showStockError(product.name); return; }

    setCart((prev) => {
      const ex = prev.find((item) => item.productId === productId && item.unit === unitName);
      if (ex) return prev.map((item) => (item.productId === productId && item.unit === unitName) ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } : item);
      return [...prev, { productId, name: product.name, price, quantity: 1, unit: unitName, subtotal: price, stockPerUnit }];
    });
  };

  const updateQuantity = (productId: string, unit: string, delta: number) => {
    if (delta > 0) {
      const item = cart.find(i => i.productId === productId && i.unit === unit);
      const product = products.find((p: any) => p.id === productId);
      if (item && product) {
        const newQty = item.quantity + 1;
        const otherCartStock = cart.filter(i => i.productId === productId && i.unit !== unit).reduce((sum, i) => sum + (i.quantity * i.stockPerUnit), 0);
        if ((newQty * item.stockPerUnit + otherCartStock) > product.stock) { showStockError(product.name); return; }
      }
    }
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId || item.unit !== unit) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return null;
      return { ...item, quantity: newQty, subtotal: newQty * item.price };
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string, unit: string) => setCart((prev) => prev.filter((item) => !(item.productId === productId && item.unit === unit)));
  const clearCart = () => { setCart([]); setDiscountInput(""); setAmountPaid(""); };

  const handlePayment = async () => {
    const trxData = {
      transaction_number: trxId, subtotal, discount: calculatedDiscount, total,
      payment_method: paymentMethod, amount_paid: Number(amountPaid) || 0,
      change_amount: change > 0 ? change : 0, is_debt: isDebt, cashier: "Pak Efge",
    };
    const items = cart.map(item => ({
      product_id: item.productId, product_name: item.name,
      quantity: item.quantity, unit: item.unit, price: item.price, subtotal: item.subtotal,
    }));
    await addTransaction(trxData, items);

    // Update stock
    const stockUpdates: Record<string, number> = {};
    for (const item of cart) {
      const reduction = item.quantity * item.stockPerUnit;
      stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) + reduction;
    }
    for (const [productId, reduction] of Object.entries(stockUpdates)) {
      const product = products.find((p: any) => p.id === productId);
      if (product && reduction > 0) {
        const newStock = Math.max(0, (product.stock || 0) - Math.floor(reduction));
        await supabase.from("products").update({ stock: newStock }).eq("id", productId);
      }
    }
    // Record stock movements
    for (const item of cart) {
      await addStockMovement({
        product_id: item.productId, product_name: item.name, type: "out",
        quantity: item.quantity, unit: item.unit,
        notes: `Penjualan ${trxId} (${item.quantity} ${item.unit})`, user_name: "Pak Efge",
      });
    }
    setTodayTrxCount(prev => prev + 1);
    setTodayOmzet(prev => prev + total);
    setShowReceipt(true); setShowCart(false);
  };

  const handleNewTransaction = () => {
    const completedTrx = trxId;
    setCart([]); setDiscountInput(""); setAmountPaid(""); setIsDebt(false);
    setShowReceipt(false); setPaymentMethod("cash");
    setTrxId(`TRX-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    setSuccessToast(completedTrx);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const [printToast, setPrintToast] = useState<{ msg: string; color: string } | null>(null);
  const [printData, setPrintData] = useState<CartItem[] | null>(null);
  const [printMeta, setPrintMeta] = useState<any>(null);

  const handlePrintReceipt = () => {
    if (typeof window === "undefined" || !window.print) {
      setPrintToast({ msg: "Cetak tidak didukung.", color: "bg-[#D97706]" });
      setTimeout(() => setPrintToast(null), 3000); return;
    }
    setPrintData([...cart]);
    setPrintMeta({ total, subtotal, discount: calculatedDiscount,
      method: isDebt ? "Bon/Hutang" : paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : paymentMethod === "edc" ? "EDC" : "QRIS",
      paid: Number(amountPaid), change: change > 0 ? change : 0, trxId,
      date: `${now.toLocaleDateString("id-ID")} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
    });
    setShowReceipt(false);
    setTimeout(() => { window.print(); }, 350);
    const afterPrint = () => { setPrintData(null); setPrintMeta(null); handleNewTransaction(); setPrintToast({ msg: "Transaksi selesai ✓", color: "bg-[#16A34A]" }); setTimeout(() => setPrintToast(null), 2000); window.removeEventListener("afterprint", afterPrint); };
    window.addEventListener("afterprint", afterPrint);
  };

  const canPay = cart.length > 0 && (isDebt || paymentMethod !== "cash" || Number(amountPaid) >= total);
  const now = new Date();
  const formatRupiah = (num: number) => num > 0 ? `Rp ${num.toLocaleString("id-ID")}` : "Rp 0";
  const displayAmountPaid = Number(amountPaid) > 0 ? `Rp ${Number(amountPaid).toLocaleString("id-ID")}` : "";
  const handleAmountInput = (raw: string) => { setAmountPaid(raw.replace(/\D/g, "")); };

  // Get cart count for a product (total across all units)
  const getCartCountForProduct = (productId: string) => cart.filter(i => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col h-screen">
      {/* Top Header Bar - minimal, no search/bell/user */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-[#072C2C]/10">
        <div>
          <h1 className="text-base lg:text-lg font-bold text-[#072C2C] tracking-tight">KASIR POS</h1>
          <p className="text-[10px] lg:text-xs text-[#072C2C]/50">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDEADE] rounded-lg">
            <span className="text-[10px] text-[#072C2C]/60">Trx:</span>
            <span className="text-xs font-bold text-[#072C2C]">{todayTrxCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDEADE] rounded-lg">
            <span className="text-[10px] text-[#072C2C]/60">Omzet:</span>
            <span className="text-xs font-bold text-[#072C2C]">{formatCurrency(todayOmzet)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#F5F5F0]">
          {/* Search */}
          <div className="px-3 sm:px-4 lg:px-5 pt-3 pb-2">
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#072C2C]/40" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#072C2C]/10 rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03]" autoFocus />
              </div>
              {hasCamera && (
                <button onClick={openScanner} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-[#FF5F03] text-white rounded-lg font-medium text-xs hover:bg-[#e55503] transition-colors cursor-pointer">
                  <ScanBarcode className="w-4 h-4" /><span className="hidden sm:inline">Scan</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 sm:px-4 lg:px-5 pb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setSelectedCategory("")} className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${!selectedCategory ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>Semua</button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${selectedCategory === cat.name ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>{cat.name}</button>
              ))}
            </div>
          </div>

          {/* Product List - Horizontal cards, scalable for many products */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 pb-32 lg:pb-4">
            <div className="flex flex-col gap-2">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const cartCount = getCartCountForProduct(product.id);
                const units = getProductUnits(product);
                const defaultUnit = product.unit || (units.length > 0 ? units[units.length - 1].name : "Pcs");
                return (
                  <div key={product.id} className={`relative bg-white border rounded-xl p-3 transition-all ${isOutOfStock ? "opacity-50" : ""} ${cartCount > 0 ? "border-[#FF5F03] ring-1 ring-[#FF5F03]/20" : "border-[#072C2C]/8"}`}>
                    {/* Cart count badge */}
                    {cartCount > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF5F03] rounded-full flex items-center justify-center shadow z-10">
                        <span className="text-white text-[9px] font-bold">{cartCount}</span>
                      </div>
                    )}

                    {/* Top row: product info */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 bg-[#EDEADE] rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5 text-[#072C2C]/25" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#072C2C] leading-tight">{product.name}</p>
                        <p className="text-[10px] text-[#072C2C]/40">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-[#072C2C]/40">Stok: {product.stock} {product.unit}</span>
                      </div>
                    </div>

                    {/* Unit buttons row - horizontal wrap */}
                    <div className="flex flex-wrap gap-1.5">
                      {units.map((u) => {
                        const inCart = cart.find(i => i.productId === product.id && i.unit === u.name);
                        const isDefault = u.name === defaultUnit;
                        return (
                          <button
                            key={u.name}
                            onClick={() => !isOutOfStock && addToCart(product.id, u.name, u.price, u.stockPerUnit)}
                            disabled={isOutOfStock}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer active:scale-[0.96] ${
                              inCart
                                ? "bg-[#FF5F03] shadow-sm"
                                : isDefault
                                  ? "bg-[#FF5F03]/10 border border-[#FF5F03]/30"
                                  : "bg-[#F5F4F0] border border-[#072C2C]/8 hover:border-[#FF5F03]/30"
                            } ${isOutOfStock ? "cursor-not-allowed" : ""}`}
                          >
                            <span className={`text-[11px] font-medium ${inCart ? "text-white" : isDefault ? "text-[#FF5F03]" : "text-[#072C2C]/70"}`}>{u.name}</span>
                            <span className={`text-[11px] font-bold tabular-nums ${inCart ? "text-white" : isDefault ? "text-[#FF5F03]" : "text-[#072C2C]"}`}>Rp {u.price.toLocaleString("id-ID")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#072C2C]/30">
                <Search className="w-10 h-10 mb-2" /><p className="text-sm font-medium">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Panel - KERANJANG */}
        <div className="hidden lg:flex flex-shrink-0 w-[320px] xl:w-[350px] bg-white border-l border-[#072C2C]/10 flex-col min-h-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#072C2C]/10">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#072C2C] text-sm">KERANJANG</h2>
              <span className="bg-[#FF5F03] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{cart.length} item</span>
            </div>
          </div>

          {/* Cart Items with details */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#072C2C]/20">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p className="text-xs font-medium text-[#072C2C]/40">Keranjang kosong</p>
                <p className="text-[10px] text-[#072C2C]/30 mt-0.5">Pilih satuan produk di kiri</p>
              </div>
            ) : cart.map((item) => (
              <div key={`${item.productId}-${item.unit}`} className="flex items-center gap-2 p-2.5 bg-[#F9F8F4] rounded-lg border border-[#072C2C]/5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#072C2C] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#072C2C]/50">{item.unit} · {formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, item.unit, -1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#DC2626]/5 cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.unit, 1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#16A34A]/5 cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-xs font-bold text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeFromCart(item.productId, item.unit)} className="text-[#DC2626]/50 hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          <div className="border-t border-[#072C2C]/10 px-4 py-3 space-y-2 bg-white">
            {/* Subtotal */}
            <div className="flex justify-between text-xs">
              <span className="text-[#072C2C]/60">Subtotal</span>
              <span className="text-[#072C2C] font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#072C2C]/60 w-12">Diskon</span>
              <input type="text" inputMode="numeric" value={discountInput} onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, ""))} placeholder="0" className="flex-1 px-2 py-1 text-xs border border-[#072C2C]/15 rounded text-right focus:outline-none focus:ring-1 focus:ring-[#FF5F03]/30" />
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "rp" | "persen")} className="px-2 py-1 text-xs border border-[#072C2C]/15 rounded bg-white cursor-pointer">
                <option value="rp">Rp</option>
                <option value="persen">%</option>
              </select>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#072C2C]/60">Diskon</span>
                <span className="text-[#DC2626] font-medium">- {formatCurrency(calculatedDiscount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-2 border-t border-[#072C2C]/10">
              <span className="text-sm font-bold text-[#072C2C]">TOTAL</span>
              <span className="text-lg font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-[10px] font-semibold text-[#072C2C]/50 mb-1.5 uppercase tracking-wider">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-1.5">
                {([["cash", Banknote, "Tunai"], ["qris", QrCode, "QRIS"], ["transfer", CreditCard, "Transfer"], ["edc", Smartphone, "EDC"]] as const).map(([method, Icon, label]) => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${paymentMethod === method ? "bg-[#072C2C] text-white" : "bg-[#F9F8F4] border border-[#072C2C]/10 text-[#072C2C]/70 hover:border-[#FF5F03]/30"}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash input */}
            {paymentMethod === "cash" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#072C2C]/60">Rp</span>
                  <input type="text" inputMode="numeric" value={displayAmountPaid} onChange={(e) => handleAmountInput(e.target.value)} placeholder="0" className="flex-1 px-2.5 py-1.5 text-xs font-bold text-[#072C2C] border border-[#072C2C]/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5F03]/30 text-right" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#072C2C]/60">Kembalian</span>
                  <span className="font-bold text-[#16A34A]">{formatRupiah(change > 0 ? change : 0)}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-1.5 pt-1">
              <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl hover:bg-[#e55503] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                <Check className="w-4 h-4" />PROSES PEMBAYARAN
              </button>
              <button onClick={clearCart} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[#072C2C]/50 font-medium text-xs hover:text-[#DC2626] cursor-pointer transition-colors">
                <RotateCcw className="w-3 h-3" />Kosongkan
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cart Overlay */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#072C2C]/10 bg-[#072C2C]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h2 className="font-bold text-white text-base">Keranjang</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-md">{cart.length}</span>
              </div>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#F5F5F0]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#072C2C]/20">
                  <ShoppingCart className="w-16 h-16 mb-3" />
                  <p className="text-base font-medium text-[#072C2C]/40">Keranjang kosong</p>
                  <p className="text-sm text-[#072C2C]/30 mt-1">Pilih satuan produk di kiri</p>
                </div>
              ) : cart.map((item) => (
                <div key={`${item.productId}-${item.unit}`} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#072C2C]/5 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#072C2C]">{item.name}</p>
                    <p className="text-xs text-[#072C2C]/50 mt-0.5">{item.unit} · {formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, item.unit, -1)} className="w-9 h-9 rounded-xl bg-[#EDEADE] flex items-center justify-center cursor-pointer"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center text-base font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.unit, 1)} className="w-9 h-9 rounded-xl bg-[#EDEADE] flex items-center justify-center cursor-pointer"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-bold text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                    <button onClick={() => removeFromCart(item.productId, item.unit)} className="mt-1 text-xs text-[#DC2626]/70 cursor-pointer">Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Payment */}
            {cart.length > 0 && (
              <div className="border-t border-[#072C2C]/10 px-4 py-4 space-y-3 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
                <div className="flex justify-between"><span className="text-sm text-[#072C2C]/60">Subtotal</span><span className="text-sm font-medium">{formatCurrency(subtotal)}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#072C2C]/60">Diskon</span>
                  <input type="text" inputMode="numeric" value={discountInput} onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, ""))} placeholder="0" className="flex-1 px-3 py-1.5 text-sm border border-[#072C2C]/15 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-[#FF5F03]/30" />
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "rp" | "persen")} className="px-2.5 py-1.5 text-xs border border-[#072C2C]/15 rounded-lg bg-white cursor-pointer">
                    <option value="rp">Rp</option>
                    <option value="persen">%</option>
                  </select>
                </div>
                {calculatedDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Diskon</span><span className="text-[#DC2626]">- {formatCurrency(calculatedDiscount)}</span></div>}
                <div className="flex justify-between items-center pt-2 border-t border-[#072C2C]/10">
                  <span className="text-base font-bold">TOTAL</span>
                  <span className="text-2xl font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([["cash", Banknote, "Tunai"], ["qris", QrCode, "QRIS"], ["transfer", CreditCard, "Transfer"], ["edc", Smartphone, "EDC"]] as const).map(([method, Icon, label]) => (
                    <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${paymentMethod === method ? "bg-[#072C2C] text-white" : "bg-[#F5F5F0] border border-[#072C2C]/10 text-[#072C2C]/70"}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "cash" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#072C2C]/60">Rp</span>
                      <input type="text" inputMode="numeric" value={displayAmountPaid} onChange={(e) => handleAmountInput(e.target.value)} placeholder="0" className="flex-1 px-3 py-2.5 text-base font-bold border border-[#072C2C]/15 rounded-xl text-right focus:outline-none focus:ring-1 focus:ring-[#FF5F03]/30" />
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Kembalian</span><span className="font-bold text-[#16A34A]">{formatRupiah(change > 0 ? change : 0)}</span></div>
                  </div>
                )}
                <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer">
                  <Check className="w-4 h-4" />PROSES PEMBAYARAN
                </button>
                <button onClick={clearCart} className="w-full text-center text-xs text-[#072C2C]/50 font-medium cursor-pointer hover:text-[#DC2626]">
                  <RotateCcw className="w-3 h-3 inline mr-1" />Kosongkan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile floating cart bar */}
        {cart.length > 0 && !showCart && (
          <div className="lg:hidden fixed bottom-[64px] left-0 right-0 z-40 px-3 pb-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
            <button onClick={() => setShowCart(true)} className="w-full flex items-center justify-between px-4 py-3.5 bg-[#FF5F03] text-white rounded-2xl shadow-xl shadow-[#FF5F03]/30 cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><ShoppingCart className="w-4 h-4" /></div>
                <div className="text-left"><p className="text-xs font-bold">{cart.length} item</p><p className="text-[10px] text-white/70">Tap untuk lihat</p></div>
              </div>
              <p className="text-base font-bold">{formatCurrency(total)}</p>
            </button>
          </div>
        )}
      </div>

      {/* Toasts */}
      {scanNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white rounded-xl shadow-xl text-sm font-medium"><Check className="w-4 h-4" />{scanNotification}</div>
      )}
      {successToast && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 left-4 sm:left-auto">
          <div className="bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Check className="w-4 h-4" /></div>
            <div><p className="text-sm font-bold">Transaksi Berhasil!</p><p className="text-xs text-white/80">{successToast} telah dicatat</p></div>
          </div>
        </div>
      )}
      {stockError && (
        <div className="fixed z-[9999] top-4 right-4 sm:top-6 sm:right-6 left-4 sm:left-auto">
          <div className="bg-[#DC2626] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
            <div><p className="text-sm font-bold">Stok Tidak Cukup!</p><p className="text-xs text-white/80">{stockError}</p></div>
          </div>
        </div>
      )}
      {printToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 ${printToast.color} text-white rounded-xl shadow-xl text-sm font-medium`}>{printToast.msg}</div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Scan Barcode</p>
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
              {scannerError ? <p className="text-[#DC2626] text-sm">{scannerError}</p> : scannerMsg ? <p className="text-[#D97706] text-sm">{scannerMsg}</p> : <p className="text-white/70 text-sm">Arahkan kamera ke barcode produk</p>}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={handleNewTransaction} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-[#072C2C]/10 rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-[#072C2C]">Struk Pembayaran</h2>
              <button onClick={handleNewTransaction} className="p-1.5 rounded-lg hover:bg-[#EDEADE] cursor-pointer"><X className="w-5 h-5 text-[#072C2C]/60" /></button>
            </div>
            <div className="p-5">
              <div ref={receiptRef} style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", textAlign: "center", lineHeight: "1.6" }}>
                <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px" }}>WARUNG EFGE</p>
                <p style={{ fontSize: "10px", color: "#666" }}>Kasir: Pak Efge</p>
                <p style={{ margin: "8px 0", borderTop: "1px dashed #ccc" }}></p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666" }}>
                  <span>{trxId}</span>
                  <span>{now.toLocaleDateString("id-ID")} {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                <table style={{ width: "100%", fontSize: "11px", textAlign: "left", borderCollapse: "collapse" }}>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={`${item.productId}-${item.unit}`}>
                        <td style={{ paddingBottom: "4px" }}>
                          <div>{item.name}</div>
                          <div style={{ fontSize: "10px", color: "#888" }}>{item.quantity} {item.unit} x {formatCurrency(item.price)}</div>
                        </td>
                        <td style={{ textAlign: "right", verticalAlign: "top", fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                <div style={{ textAlign: "right", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {calculatedDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Diskon</span><span>-{formatCurrency(calculatedDiscount)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
                </div>
                <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                <div style={{ textAlign: "right", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Metode</span><span>{paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : paymentMethod === "edc" ? "EDC" : "QRIS"}</span></div>
                  {paymentMethod === "cash" && <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bayar</span><span>{formatCurrency(Number(amountPaid))}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Kembalian</span><span>{formatCurrency(change > 0 ? change : 0)}</span></div>
                  </>}
                </div>
                <p style={{ margin: "8px 0", borderTop: "1px dashed #ccc" }}></p>
                <p style={{ fontSize: "10px", color: "#888" }}>Terima kasih!</p>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" className="flex-1" onClick={handleNewTransaction}>Tutup</Button>
                <button onClick={handlePrintReceipt} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5F03] text-white font-medium text-sm rounded-lg hover:bg-[#e55503] cursor-pointer">
                  <Printer className="w-4 h-4" />Cetak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Area */}
      {printData && printMeta && (
        <div id="print-area" className="hidden print:block">
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#000", background: "#fff", padding: "8px", width: "100%", lineHeight: "1.6" }}>
            <p style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center" }}>WARUNG EFGE</p>
            <p style={{ fontSize: "10px", textAlign: "center", color: "#444" }}>Kasir: Pak Efge</p>
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}><span>{printMeta.trxId}</span><span>{printMeta.date}</span></div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />
            {printData.map((item) => (
              <div key={`${item.productId}-${item.unit}`} style={{ marginBottom: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{item.name}</span><span style={{ fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</span></div>
                <div style={{ fontSize: "10px", color: "#666" }}>{item.quantity} {item.unit} x {formatCurrency(item.price)}</div>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatCurrency(printMeta.subtotal)}</span></div>
            {printMeta.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Diskon</span><span>-{formatCurrency(printMeta.discount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}><span>TOTAL</span><span>{formatCurrency(printMeta.total)}</span></div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Metode</span><span>{printMeta.method}</span></div>
            {printMeta.method === "Tunai" && <>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bayar</span><span>{formatCurrency(printMeta.paid)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Kembalian</span><span>{formatCurrency(printMeta.change)}</span></div>
            </>}
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "8px 0" }} />
            <p style={{ fontSize: "10px", textAlign: "center" }}>Terima kasih!</p>
          </div>
        </div>
      )}
    </div>
  );
}
