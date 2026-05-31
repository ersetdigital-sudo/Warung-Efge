"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Printer, ScanBarcode, AlertTriangle, RotateCcw, X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { categories } from "@/data/mock-data";
import { getProducts, addTransaction } from "@/lib/db";
import { supabase } from "@/lib/supabase";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  hasBulkUnit?: boolean;
  bulkUnit?: string;
  bulkConversion?: number;
  selectedUnit?: string; // current selected unit
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [trxId] = useState(() => `TRX-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Load products from Supabase - reload on every focus/navigation
  useEffect(() => {
    const load = () => { getProducts().then(setProducts); };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
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

  // Check camera availability
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        if (videoDevices.length === 0) setHasCamera(false);
      }).catch(() => setHasCamera(false));
    } else {
      setHasCamera(false);
    }
  }, []);

  const stopScanner = () => {
    try {
      if (scanStreamRef.current) {
        scanStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} });
        scanStreamRef.current = null;
      }
      if (scanReaderRef.current) {
        try { scanReaderRef.current.reset(); } catch {}
        scanReaderRef.current = null;
      }
    } catch {}
  };

  const openScanner = async () => {
    setScannerError(""); setScannerMsg(""); setShowScanner(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.CODABAR, BarcodeFormat.RSS_14, BarcodeFormat.RSS_EXPANDED,
      ]);
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
              if (product) {
                stopScanner(); setShowScanner(false);
                addToCart(product.id);
                setScanNotification("Produk ditambahkan ✓");
                setTimeout(() => setScanNotification(""), 2000);
              } else {
                setScannerMsg("Produk tidak ditemukan. Coba scan ulang atau cari manual.");
                setTimeout(() => setScannerMsg(""), 2000);
              }
            }
          });
          if (scanVideoRef.current?.srcObject) {
            scanStreamRef.current = scanVideoRef.current.srcObject as MediaStream;
          }
        } catch { setScannerError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser."); }
      }, 200);
    } catch { setScannerError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser."); }
  };

  const closeScanner = () => {
    stopScanner();
    setScannerError("");
    setScannerMsg("");
    setShowScanner(false);
  };

  // Cleanup on unmount
  useEffect(() => { return () => { stopScanner(); }; }, []);

  // Android back button: use beforeunload-style approach without pushState
  useEffect(() => {
    if (!showScanner) return;
    const handleBack = (e: PopStateEvent) => {
      e.preventDefault();
      closeScanner();
      // Re-push current state to prevent actual navigation
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => { window.removeEventListener("popstate", handleBack); };
  }, [showScanner]);

  // Android back button handling for receipt modal
  useEffect(() => {
    if (!showReceipt) return;
    const handleBack = (e: PopStateEvent) => {
      e.preventDefault();
      setShowReceipt(false);
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => { window.removeEventListener("popstate", handleBack); };
  }, [showReceipt]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.sku.toLowerCase().includes(s));
    }
    return filtered;
  }, [search, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discount;
  const change = Number(amountPaid) - total;

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) return prev.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } : item);
      return [...prev, { productId: product.id, name: product.name, price: product.selling_price, quantity: 1, unit: product.unit, subtotal: product.selling_price, hasBulkUnit: product.has_bulk_unit, bulkUnit: product.bulk_unit, bulkConversion: product.bulk_conversion, selectedUnit: product.unit }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return null;
      return { ...item, quantity: newQty, subtotal: newQty * item.price };
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item.productId !== productId));

  const changeCartUnit = (productId: string, newUnit: string) => {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) return item;
      const product = products.find((p: any) => p.id === productId);
      if (!product) return item;
      const isBulk = newUnit === item.bulkUnit;
      const price = isBulk ? product.selling_price * (item.bulkConversion || 1) : product.selling_price;
      return { ...item, selectedUnit: newUnit, price, subtotal: item.quantity * price };
    }));
  };

  const clearCart = () => { setCart([]); setDiscount(0); setAmountPaid(""); };
  const handlePayment = () => { setShowReceipt(true); setShowCart(false); };
  const handleNewTransaction = () => { setCart([]); setDiscount(0); setAmountPaid(""); setIsDebt(false); setShowReceipt(false); };

  // Print state
  const [printToast, setPrintToast] = useState<{ msg: string; color: string } | null>(null);
  const [printData, setPrintData] = useState<CartItem[] | null>(null);
  const [printMeta, setPrintMeta] = useState<{ total: number; subtotal: number; discount: number; method: string; paid: number; change: number; trxId: string; date: string } | null>(null);

  const handlePrintReceipt = () => {
    if (typeof window === "undefined" || !window.print) {
      setPrintToast({ msg: "Cetak tidak didukung di perangkat ini. Silakan screenshot struk.", color: "bg-[#D97706]" });
      setTimeout(() => setPrintToast(null), 3000);
      return;
    }

    // Save print data before closing modal
    setPrintData([...cart]);
    setPrintMeta({
      total, subtotal, discount,
      method: isDebt ? "Bon/Hutang" : paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : "QRIS",
      paid: Number(amountPaid),
      change: change > 0 ? change : 0,
      trxId,
      date: `${now.toLocaleDateString("id-ID")} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
    });

    // Close modal first
    setShowReceipt(false);

    // Wait for modal to close, then print
    setTimeout(() => {
      window.print();
    }, 350);

    // After print
    const afterPrint = () => {
      setPrintData(null);
      setPrintMeta(null);
      handleNewTransaction();
      setPrintToast({ msg: "Transaksi selesai ✓", color: "bg-[#16A34A]" });
      setTimeout(() => setPrintToast(null), 2000);
      window.removeEventListener("afterprint", afterPrint);
    };
    window.addEventListener("afterprint", afterPrint);
  };

  const canPay = cart.length > 0 && (isDebt || paymentMethod !== "cash" || Number(amountPaid) >= total);
  const now = new Date();

  // Format number to Rupiah display
  const formatRupiah = (num: number) => num > 0 ? `Rp ${num.toLocaleString("id-ID")}` : "Rp 0";
  const displayAmountPaid = Number(amountPaid) > 0 ? `Rp ${Number(amountPaid).toLocaleString("id-ID")}` : "";

  // Handle rupiah input - only allow digits
  const handleAmountInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmountPaid(digits);
  };

  // Generate dynamic denomination buttons based on total
  const getDenominations = useMemo(() => {
    if (total <= 0) return [];
    const denoms: number[] = [];
    const commonDenoms = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];

    // Find denominations above total
    for (const d of commonDenoms) {
      if (d > total && denoms.length < 5) denoms.push(d);
    }

    // If total > 200k, add multiples
    if (total > 200000) {
      const base50 = Math.ceil(total / 50000) * 50000;
      const base100 = Math.ceil(total / 100000) * 100000;
      const candidates = [base50, base50 + 50000, base100, base100 + 100000, base100 + 200000];
      for (const c of candidates) {
        if (c > total && !denoms.includes(c) && denoms.length < 5) denoms.push(c);
      }
    }

    // Fill remaining with nearest round numbers above total
    if (denoms.length < 5) {
      const nearest10k = Math.ceil(total / 10000) * 10000;
      const candidates = [nearest10k, nearest10k + 5000, nearest10k + 10000, nearest10k + 20000, nearest10k + 50000];
      for (const c of candidates) {
        if (c > total && !denoms.includes(c) && denoms.length < 5) denoms.push(c);
      }
    }

    return denoms.sort((a, b) => a - b).slice(0, 5);
  }, [total]);

  // Format short label for buttons
  const shortLabel = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}rb`;
    return String(n);
  };

  return (
    <div className="flex flex-col -m-4 lg:-m-6" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="flex flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#EDEADE]">
          {/* Search Bar */}
          <div className="px-3 sm:px-4 lg:px-5 pt-3 pb-2">
            <div className="flex gap-2 lg:gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-[#072C2C]/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk, scan barcode..."
                  className="w-full pl-9 lg:pl-12 pr-3 py-2.5 lg:py-3 bg-white border border-[#072C2C]/10 rounded-lg lg:rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] shadow-sm"
                  autoFocus
                />
              </div>
              <button onClick={openScanner} className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-5 py-2.5 bg-[#FF5F03] text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm hover:bg-[#e55503] transition-colors shadow-sm cursor-pointer ${!hasCamera ? "hidden" : ""}`}>
                <ScanBarcode className="w-4 lg:w-5 h-4 lg:h-5" />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 sm:px-4 lg:px-5 pb-2">
            <div className="flex gap-1.5 lg:gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setSelectedCategory("")} className={`flex-shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 rounded-md lg:rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${!selectedCategory ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>
                Semua
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex-shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 rounded-md lg:rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat.name ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 pb-32 lg:pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-3">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.min_stock;
                const inCart = cart.find((item) => item.productId === product.id);
                return (
                  <button key={product.id} onClick={() => addToCart(product.id)} className={`relative bg-white border rounded-xl lg:rounded-2xl p-2.5 lg:p-4 text-left transition-all group cursor-pointer ${inCart ? "border-[#FF5F03] ring-2 ring-[#FF5F03]/20 shadow-md" : "border-[#072C2C]/10 hover:border-[#FF5F03]/40 hover:shadow-md"}`}>
                    {inCart && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 lg:w-6 lg:h-6 bg-[#FF5F03] rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-[10px] lg:text-xs font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                    <div className="w-full aspect-square sm:aspect-[4/3] bg-[#EDEADE] rounded-lg lg:rounded-xl flex items-center justify-center mb-2 lg:mb-3 group-hover:bg-[#FF5F03]/5 transition-colors">
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#072C2C]/15 group-hover:text-[#FF5F03]/40" />
                    </div>
                    <p className="text-[11px] sm:text-xs lg:text-sm font-semibold text-[#072C2C] truncate">{product.name}</p>
                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-[#FF5F03] mt-0.5 lg:mt-1">{formatCurrency(product.selling_price)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {isLowStock && <AlertTriangle className="w-3 h-3 text-[#D97706]" />}
                      <p className={`text-[9px] sm:text-[10px] lg:text-xs ${isLowStock ? "text-[#D97706] font-medium" : "text-[#072C2C]/50"}`}>Stok: {product.stock} {product.unit}</p>
                    </div>
                  </button>
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

        {/* Mobile Cart Overlay - Full screen for easy input */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#072C2C]/10 bg-[#072C2C]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h2 className="font-bold text-white text-base">Keranjang</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-md">{cart.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-white/70 font-medium flex items-center gap-1 cursor-pointer active:opacity-70">
                    <RotateCcw className="w-3.5 h-3.5" />Hapus
                  </button>
                )}
                <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer active:scale-90">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#EDEADE]/30">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#072C2C]/20">
                  <ShoppingCart className="w-16 h-16 mb-3" />
                  <p className="text-base font-medium text-[#072C2C]/40">Keranjang kosong</p>
                  <p className="text-sm text-[#072C2C]/30 mt-1">Pilih produk untuk memulai</p>
                  <button onClick={() => setShowCart(false)} className="mt-4 px-5 py-2.5 bg-[#FF5F03] text-white rounded-xl font-medium text-sm cursor-pointer">
                    Pilih Produk
                  </button>
                </div>
              ) : cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#072C2C]/5 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#072C2C]">{item.name}</p>
                    <p className="text-xs text-[#072C2C]/50 mt-0.5">{formatCurrency(item.price)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-9 h-9 rounded-xl bg-[#EDEADE] flex items-center justify-center cursor-pointer active:scale-90 active:bg-[#DC2626]/10">
                      <Minus className="w-4 h-4 text-[#072C2C]" />
                    </button>
                    <span className="w-8 text-center text-base font-bold text-[#072C2C]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-9 h-9 rounded-xl bg-[#EDEADE] flex items-center justify-center cursor-pointer active:scale-90 active:bg-[#16A34A]/10">
                      <Plus className="w-4 h-4 text-[#072C2C]" />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-bold text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                    <button onClick={() => removeFromCart(item.productId)} className="mt-1 text-xs text-[#DC2626]/70 font-medium cursor-pointer active:text-[#DC2626]">Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Payment Panel */}
            {cart.length > 0 && (
              <div className="border-t border-[#072C2C]/10 px-4 py-4 space-y-3 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#072C2C]">Total</span>
                  <span className="text-2xl font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-3 gap-2">
                  {([["cash", Banknote, "Tunai"], ["transfer", CreditCard, "Transfer"], ["qris", QrCode, "QRIS"]] as const).map(([method, Icon, label]) => (
                    <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer active:scale-95 transition-transform ${paymentMethod === method ? "bg-[#072C2C] text-white" : "bg-[#EDEADE] border border-[#D9D6C8] text-[#072C2C]/70"}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>

                {/* Cash Input */}
                {!isDebt && paymentMethod === "cash" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#072C2C]/60 mb-1 font-medium">Bayar</p>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={displayAmountPaid}
                          onChange={(e) => handleAmountInput(e.target.value)}
                          placeholder="Rp 0"
                          className="w-full px-4 py-3 text-lg font-bold text-[#072C2C] border border-[#072C2C]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-[#072C2C]/60 mb-1 font-medium">Kembalian</p>
                        <div className="w-full px-4 py-3 text-lg font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-xl text-right">
                          {formatRupiah(change > 0 ? change : 0)}
                        </div>
                      </div>
                    </div>
                    {/* Dynamic denomination buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setAmountPaid(String(total))} className={`min-h-[48px] px-2 py-2.5 text-sm font-bold rounded-xl cursor-pointer active:scale-95 transition-transform ${Number(amountPaid) === total ? "bg-[#FF5F03] text-white" : "bg-[#FF5F03]/10 text-[#FF5F03] border border-[#FF5F03]/30"}`}>
                        PAS
                      </button>
                      {getDenominations.map((amount) => (
                        <button key={amount} onClick={() => setAmountPaid(String(amount))} className={`min-h-[48px] px-2 py-2.5 text-sm font-medium rounded-xl cursor-pointer active:scale-95 transition-transform ${Number(amountPaid) === amount ? "bg-[#FF5F03]/10 text-[#FF5F03] border-2 border-[#FF5F03]" : "bg-[#EDEADE] text-[#072C2C] border border-[#D9D6C8]"}`}>
                          {shortLabel(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF5F03] text-white font-bold text-base rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-[#FF5F03]/20">
                  <CreditCard className="w-5 h-5" />Bayar {formatCurrency(total)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Desktop Right Panel */}
        <div className="hidden lg:flex flex-shrink-0 w-[340px] xl:w-[380px] bg-white border-l border-[#072C2C]/10 flex-col min-h-0">
          <div className="px-4 py-3 border-b border-[#072C2C]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[#072C2C] text-sm">Keranjang</h2>
                <span className="bg-[#FF5F03]/10 text-[#FF5F03] text-xs font-bold px-2 py-0.5 rounded-md">{cart.length} item</span>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[10px] text-[#DC2626] hover:text-[#DC2626]/80 font-medium flex items-center gap-1 cursor-pointer">
                  <RotateCcw className="w-3 h-3" />Kosongkan
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#072C2C]/20">
                <ShoppingCart className="w-14 h-14 mb-2" />
                <p className="text-xs font-medium text-[#072C2C]/40">Keranjang kosong</p>
                <p className="text-[10px] text-[#072C2C]/30 mt-0.5">Pilih produk untuk memulai</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2.5 bg-[#EDEADE]/50 rounded-lg border border-[#072C2C]/5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#072C2C] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#072C2C]/50">{formatCurrency(item.price)} / {item.selectedUnit || item.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#DC2626]/5 cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#16A34A]/5 cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                </div>
                {item.hasBulkUnit && item.bulkUnit && (
                  <select value={item.selectedUnit || item.unit} onChange={(e) => changeCartUnit(item.productId, e.target.value)} className="text-[10px] px-1.5 py-1 border border-[#D9D6C8] rounded text-[#072C2C] bg-white cursor-pointer">
                    <option value={item.unit}>{item.unit}</option>
                    <option value={item.bulkUnit}>{item.bulkUnit}</option>
                  </select>
                )}
                <div className="text-right min-w-[70px]">
                  <p className="text-xs font-bold text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-[#DC2626]/50 hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Payment */}
          <div className="border-t border-[#072C2C]/10 px-4 py-3 space-y-2.5 bg-[#EDEADE]/30">
            <div className="space-y-1">
              <div className="flex justify-between text-xs"><span className="text-[#072C2C]/60">Subtotal</span><span className="text-[#072C2C] font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#072C2C]/60">Diskon</span><span className="text-[#DC2626] font-medium">- {formatCurrency(discount)}</span></div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-[#072C2C]/10">
              <span className="text-sm font-bold text-[#072C2C]">Total</span>
              <span className="text-lg font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#072C2C]/60 mb-1.5 uppercase tracking-wider">Metode bayar</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([["cash", Banknote, "Tunai"], ["transfer", CreditCard, "Transfer"], ["qris", QrCode, "QRIS"]] as const).map(([method, Icon, label]) => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${paymentMethod === method ? "bg-[#072C2C] text-white" : "bg-white border border-[#072C2C]/10 text-[#072C2C]/70 hover:border-[#FF5F03]/30"}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
            {!isDebt && paymentMethod === "cash" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Bayar</p><input type="text" inputMode="numeric" value={displayAmountPaid} onChange={(e) => handleAmountInput(e.target.value)} placeholder="Rp 0" className="w-full px-2.5 py-2 text-xs font-bold text-[#072C2C] border border-[#072C2C]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" /></div>
                  <div><p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Kembalian</p><div className="w-full px-2.5 py-2 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg text-right">{formatRupiah(change > 0 ? change : 0)}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => setAmountPaid(String(total))} className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${Number(amountPaid) === total ? "bg-[#FF5F03] text-white" : "bg-[#FF5F03]/10 text-[#FF5F03] border border-[#FF5F03]/30 hover:bg-[#FF5F03]/20"}`}>PAS</button>
                  {getDenominations.slice(0, 5).map((amount) => (
                    <button key={amount} onClick={() => setAmountPaid(String(amount))} className={`py-1.5 text-[10px] font-medium rounded-lg cursor-pointer transition-all ${Number(amountPaid) === amount ? "bg-[#FF5F03]/10 text-[#FF5F03] border-2 border-[#FF5F03]" : "bg-[#EDEADE] text-[#072C2C] border border-[#D9D6C8] hover:border-[#FF5F03]/30"}`}>
                      {shortLabel(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl hover:bg-[#e55503] transition-all shadow-lg shadow-[#FF5F03]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
              <CreditCard className="w-4 h-4" />Proses Pembayaran
            </button>
          </div>
        </div>

        {/* Mobile floating cart bar - always visible when items in cart */}
        {cart.length > 0 && !showCart && (
          <div className="lg:hidden fixed bottom-[64px] left-0 right-0 z-40 px-3 pb-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
            <button onClick={() => setShowCart(true)} className="w-full flex items-center justify-between px-4 py-3.5 bg-[#FF5F03] text-white rounded-2xl shadow-xl shadow-[#FF5F03]/30 cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">{cart.length} item</p>
                  <p className="text-[10px] text-white/70">Tap untuk lihat keranjang</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold">{formatCurrency(total)}</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Scan Notification */}
      {scanNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white rounded-xl shadow-xl text-sm font-medium animate-in fade-in">
          <Check className="w-4 h-4" />{scanNotification}
        </div>
      )}

      {/* Print Toast */}
      {printToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 ${printToast.color} text-white rounded-xl shadow-xl text-sm font-medium`}>
          {printToast.msg}
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Scan Barcode</p>
              <button onClick={closeScanner} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer active:scale-90">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Camera Preview */}
            <div className="flex-1 relative min-h-[300px] sm:min-h-[360px]">
              <video ref={scanVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] max-w-[280px] aspect-[3/2] relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[#FF5F03] opacity-80 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="bg-black px-4 py-4 text-center space-y-2">
              {scannerError ? (
                <p className="text-[#DC2626] text-sm">{scannerError}</p>
              ) : scannerMsg ? (
                <p className="text-[#D97706] text-sm">{scannerMsg}</p>
              ) : (
                <p className="text-white/70 text-sm">Arahkan kamera ke barcode produk</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto border border-[#072C2C]/10">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-[#072C2C]/10 rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-[#072C2C]">Struk Pembayaran</h2>
              <button onClick={() => setShowReceipt(false)} className="p-1.5 rounded-lg hover:bg-[#EDEADE] cursor-pointer"><X className="w-5 h-5 text-[#072C2C]/60" /></button>
            </div>

            {/* Receipt Content */}
            <div className="p-5">
              <div ref={receiptRef}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", textAlign: "center", lineHeight: "1.6" }}>
                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px" }}>WARUNG EFGE</p>
                  <p style={{ fontSize: "10px", color: "#666" }}>Sistem POS & Inventory</p>
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
                        <tr key={item.productId}>
                          <td style={{ paddingBottom: "4px" }}>
                            <div>{item.name}</div>
                            <div style={{ fontSize: "10px", color: "#888" }}>{item.quantity} x {formatCurrency(item.price)}</div>
                          </td>
                          <td style={{ textAlign: "right", verticalAlign: "top", fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                  <div style={{ textAlign: "right", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Diskon</span><span>-{formatCurrency(discount)}</span></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
                  </div>
                  <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                  <div style={{ textAlign: "right", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Metode</span><span>{isDebt ? "Bon/Hutang" : paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : "QRIS"}</span></div>
                    {!isDebt && paymentMethod === "cash" && <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bayar</span><span>{formatCurrency(Number(amountPaid))}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Kembalian</span><span>{formatCurrency(change > 0 ? change : 0)}</span></div>
                    </>}
                  </div>
                  <p style={{ margin: "8px 0", borderTop: "1px dashed #ccc" }}></p>
                  <p style={{ fontSize: "10px", color: "#888", textAlign: "center" }}>Terima kasih atas kunjungan Anda!</p>
                  <p style={{ fontSize: "9px", color: "#aaa", textAlign: "center" }}>Barang yang sudah dibeli tidak dapat dikembalikan</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setShowReceipt(false)}>Tutup</Button>
                <button onClick={handlePrintReceipt} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5F03] text-white font-medium text-sm rounded-lg hover:bg-[#e55503] transition-colors cursor-pointer">
                  <Printer className="w-4 h-4" />Cetak Struk
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
            <p style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "2px" }}>WARUNG EFGE</p>
            <p style={{ fontSize: "10px", textAlign: "center", color: "#444" }}>Sistem POS & Inventory</p>
            <p style={{ fontSize: "10px", textAlign: "center", color: "#444" }}>Kasir: Pak Efge</p>
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <span>{printMeta.trxId}</span><span>{printMeta.date}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", margin: "6px 0" }} />
            {printData.map((item) => (
              <div key={item.productId} style={{ marginBottom: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.name}</span><span style={{ fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>{item.quantity} x {formatCurrency(item.price)}</div>
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
            <p style={{ fontSize: "10px", textAlign: "center" }}>Terima kasih atas kunjungan Anda!</p>
            <p style={{ fontSize: "9px", textAlign: "center", color: "#888" }}>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
        </div>
      )}
    </div>
  );
}
