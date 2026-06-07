"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, ScanBarcode, AlertTriangle, RotateCcw, X, Check, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDemo } from "@/lib/demo-context";
import { generateReceiptPDF } from "@/lib/generate-receipt-pdf";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  stockPerUnit: number;
}

// Emoji per kategori
const categoryEmoji: Record<string, string> = {
  "Rokok": "🚬",
  "Beras & Tepung": "🍜",
  "Mie & Pasta": "🍜",
  "Minuman": "🥤",
  "Minyak & Mentega": "🫙",
  "Bumbu & Rempah": "🫙",
  "Gula & Garam": "🧂",
  "Sabun & Detergen": "🧴",
  "Snack & Makanan Ringan": "🍪",
};
const getEmoji = (cat: string) => categoryEmoji[cat] || "📦";

export default function DemoPOSPage() {
  const { products, addTransaction, customers } = useDemo();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"rp" | "persen">("rp");
  const [discountInput, setDiscountInput] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris" | "edc" | "bon">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [bonCustomerId, setBonCustomerId] = useState("");
  const [bonCustomerName, setBonCustomerName] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [trxId, setTrxId] = useState(() => `TRX-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [successToast, setSuccessToast] = useState("");
  const [stockError, setStockError] = useState("");
  const [todayTrxCount, setTodayTrxCount] = useState(0);
  const [todayOmzet, setTodayOmzet] = useState(0);

  // Derive categories from products
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.map(name => ({ id: name, name }));
  }, [products]);

  // Barcode scanner
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
      navigator.mediaDevices.enumerateDevices().then(devices => { if (devices.filter(d => d.kind === "videoinput").length === 0) setHasCamera(false); }).catch(() => setHasCamera(false));
    } else { setHasCamera(false); }
  }, []);

  const stopScanner = () => { try { scanStreamRef.current?.getTracks().forEach(t => { try { t.stop(); } catch {} }); scanStreamRef.current = null; if (scanReaderRef.current) { try { scanReaderRef.current.reset(); } catch {} scanReaderRef.current = null; } } catch {} };

  const openScanner = async () => {
    setScannerError(""); setScannerMsg(""); setShowScanner(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.UPC_A]);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 });
      scanReaderRef.current = reader;
      if (!scanVideoRef.current) return;
      try {
        const constraints = { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        scanVideoRef.current.srcObject = stream;
        scanStreamRef.current = stream;
        await scanVideoRef.current.play();

        reader.decodeFromVideoElement(scanVideoRef.current, (result: any) => {
          if (result) {
            const code = result.getText();
            const product = products.find(p => p.barcode === code);
            if (product) {
              stopScanner(); setShowScanner(false);
              addToCart(product.id, product.unit, product.selling_price, 1);
              setScanNotification("✓ " + product.name);
              setTimeout(() => setScanNotification(""), 2000);
            } else {
              setScannerMsg(`Barcode ${code} tidak ditemukan`);
              setTimeout(() => setScannerMsg(""), 2000);
            }
          }
        });
      } catch { setScannerError("Kamera tidak dapat diakses. Pastikan izin kamera diberikan."); }
    } catch { setScannerError("Kamera tidak dapat diakses."); }
  };
  const closeScanner = () => { stopScanner(); setScannerError(""); setScannerMsg(""); setShowScanner(false); };
  useEffect(() => { return () => { stopScanner(); }; }, []);
  useEffect(() => { if (!showScanner) return; const h = (e: PopStateEvent) => { e.preventDefault(); closeScanner(); window.history.pushState(null, "", window.location.href); }; window.history.pushState(null, "", window.location.href); window.addEventListener("popstate", h); return () => window.removeEventListener("popstate", h); }, [showScanner]);
  useEffect(() => { if (!showReceipt) return; const h = (e: PopStateEvent) => { e.preventDefault(); setShowReceipt(false); window.history.pushState(null, "", window.location.href); }; window.history.pushState(null, "", window.location.href); window.addEventListener("popstate", h); return () => window.removeEventListener("popstate", h); }, [showReceipt]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.stock > 0 && !p.is_archived);
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    if (search) { const s = search.toLowerCase(); filtered = filtered.filter((p) => (p.name || "").toLowerCase().includes(s) || (p.barcode || "").includes(s) || (p.sku || "").toLowerCase().includes(s)); }
    return filtered;
  }, [search, selectedCategory, products]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedDiscount = useMemo(() => { if (discountType === "persen") return Math.round(subtotal * (Number(discountInput) || 0) / 100); return Number(discountInput) || 0; }, [discountType, discountInput, subtotal]);
  const total = Math.max(0, subtotal - calculatedDiscount);
  const change = Number(amountPaid) - total;

  const showStockError = (name: string) => { setStockError(`Stok ${name} tidak cukup!`); setTimeout(() => setStockError(""), 3000); };

  const addToCart = (productId: string, unitName: string, price: number, stockPerUnit: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;
    const effectiveStock = product.stock || 0;
    if (effectiveStock <= 0) { showStockError(product.name); return; }
    const existing = cart.find((item) => item.productId === productId && item.unit === unitName);
    const newQty = existing ? existing.quantity + 1 : 1;
    const otherCartStock = cart.filter(i => i.productId === productId && i.unit !== unitName).reduce((sum, i) => sum + (i.quantity * i.stockPerUnit), 0);
    if ((newQty * stockPerUnit + otherCartStock) > effectiveStock) { showStockError(product.name); return; }
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
        const effectiveStock = product.stock || 0;
        const otherCartStock = cart.filter(i => i.productId === productId && i.unit !== unit).reduce((sum, i) => sum + (i.quantity * i.stockPerUnit), 0);
        if (((item.quantity + 1) * item.stockPerUnit + otherCartStock) > effectiveStock) { showStockError(product.name); return; }
      }
    }
    setCart((prev) => prev.map((item) => { if (item.productId !== productId || item.unit !== unit) return item; const newQty = item.quantity + delta; if (newQty <= 0) return null; return { ...item, quantity: newQty, subtotal: newQty * item.price }; }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string, unit: string) => setCart((prev) => prev.filter((item) => !(item.productId === productId && item.unit === unit)));
  const clearCart = () => { setCart([]); setDiscountInput(""); setAmountPaid(""); };
  const getCartCountForProduct = (productId: string) => cart.filter(i => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);

  const handlePayment = () => {
    const trxData = { subtotal, discount: calculatedDiscount, total, payment_method: paymentMethod, amount_paid: Number(amountPaid) || 0, change_amount: change > 0 ? change : 0, is_debt: paymentMethod === "bon", cashier: "Demo User" };
    const items = cart.map(item => ({ product_id: item.productId, product_name: item.name, quantity: item.quantity, unit: item.unit, price: item.price, subtotal: item.subtotal }));
    addTransaction(trxData, items);

    setTodayTrxCount(prev => prev + 1); setTodayOmzet(prev => prev + total);
    setLastReceiptData({
      items: cart.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, price: item.price, subtotal: item.subtotal })),
      subtotal, discount: calculatedDiscount, total,
      method: paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : paymentMethod === "edc" ? "EDC" : paymentMethod === "bon" ? "Bon/Hutang" : "QRIS",
      paid: Number(amountPaid) || 0,
      change: change > 0 ? change : 0,
      trxId,
    });
    setShowReceipt(true); setShowCart(false);
  };

  const handleNewTransaction = () => { const c = trxId; setCart([]); setDiscountInput(""); setShowDiscount(false); setAmountPaid(""); setBonCustomerId(""); setBonCustomerName(""); setCustomerSearch(""); setShowReceipt(false); setPaymentMethod("cash"); setTrxId(`TRX-${String(Math.floor(Math.random() * 9000) + 1000)}`); setSuccessToast(c); setTimeout(() => setSuccessToast(""), 3000); };

  const [printToast, setPrintToast] = useState<{ msg: string; color: string } | null>(null);
  const [lastReceiptData, setLastReceiptData] = useState<any>(null);

  const handleSavePDF = (action: "download" | "open") => {
    try {
      const dateStr = `${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
      const data = lastReceiptData || {
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, price: item.price, subtotal: item.subtotal })),
        subtotal, discount: calculatedDiscount, total,
        method: paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : paymentMethod === "edc" ? "EDC" : paymentMethod === "bon" ? "Bon/Hutang" : "QRIS",
        paid: Number(amountPaid) || 0, change: change > 0 ? change : 0, trxId,
      };
      generateReceiptPDF({
        storeName: "NEXO POS",
        cashier: "Demo User",
        trxId: data.trxId || trxId,
        date: dateStr,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        discount: data.discount || 0,
        total: data.total || 0,
        method: data.method || "Tunai",
        paid: data.paid || 0,
        change: data.change || 0,
      }, action);
      setShowReceipt(false);
      setLastReceiptData(null);
      handleNewTransaction();
      setPrintToast({ msg: "Struk berhasil disimpan ✓", color: "bg-[#16A34A]" });
      setTimeout(() => setPrintToast(null), 3000);
    } catch (e) {
      console.error("PDF error:", e);
      setPrintToast({ msg: "Gagal membuat struk. Coba lagi.", color: "bg-[#DC2626]" });
      setTimeout(() => setPrintToast(null), 3000);
    }
  };

  const canPay = cart.length > 0 && (paymentMethod === "bon" ? !!bonCustomerId : paymentMethod !== "cash" || Number(amountPaid) >= total);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const formatRupiah = (num: number) => num > 0 ? `Rp ${num.toLocaleString("id-ID")}` : "Rp 0";
  const displayAmountPaid = Number(amountPaid) > 0 ? `Rp ${Number(amountPaid).toLocaleString("id-ID")}` : "";
  const handleAmountInput = (raw: string) => { setAmountPaid(raw.replace(/\D/g, "")); };

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col overflow-hidden h-screen">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 lg:px-5 py-2 bg-white border-b border-[#072C2C]/10">
        <div>
          <h1 className="text-sm lg:text-base font-bold text-[#072C2C]">Demo User</h1>
          <p className="text-[9px] lg:text-[10px] text-[#072C2C]/50">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-[#EDEADE] rounded-md text-[10px]"><span className="text-[#072C2C]/50">Trx: </span><span className="font-bold text-[#072C2C]">{todayTrxCount}</span></div>
          <div className="px-2.5 py-1 bg-[#EDEADE] rounded-md text-[10px]"><span className="text-[#072C2C]/50">Omzet: </span><span className="font-bold text-[#072C2C]">{formatCurrency(todayOmzet)}</span></div>
        </div>
      </div>

      {/* Main content: 2 columns */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: Products */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#F5F5F0]">
          {/* Search + Scan - sticky */}
          <div className="flex-shrink-0 px-3 lg:px-4 pt-3 pb-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#072C2C]/40" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-3 py-2 bg-white border border-[#072C2C]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" autoFocus />
              </div>
              {hasCamera && <button onClick={openScanner} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#FF5F03] text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-[#e55503]"><ScanBarcode className="w-4 h-4" /><span className="hidden sm:inline">Scan</span></button>}
            </div>
          </div>
          {/* Categories - sticky */}
          <div className="flex-shrink-0 px-3 lg:px-4 pb-2">
            <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto lg:max-h-none" style={{ scrollbarWidth: "thin" }}>
              <button onClick={() => setSelectedCategory("")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${!selectedCategory ? "bg-[#072C2C] text-white shadow-sm" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#072C2C]/30"}`}>📋 Semua</button>
              {categories.map((cat) => <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${selectedCategory === cat.name ? "bg-[#072C2C] text-white shadow-sm" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#072C2C]/30"}`}>{getEmoji(cat.name)} {cat.name}</button>)}
            </div>
          </div>

          {/* Product Grid - scrolls independently */}
          <div className="flex-1 overflow-y-auto px-3 lg:px-4 pb-24 lg:pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
              {filteredProducts.map((product) => {
                const cartCount = getCartCountForProduct(product.id);
                const isLowStock = product.stock <= product.min_stock && product.stock > 0;
                return (
                  <div key={product.id} className={`relative bg-white rounded-xl border overflow-hidden ${cartCount > 0 ? "border-[#072C2C]/20 shadow-md" : "border-[#072C2C]/8 shadow-sm"}`}>
                    {/* Stock info badge */}
                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      cartCount > 0 ? "bg-[#FF5F03] text-white" : isLowStock ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#072C2C]/5 text-[#072C2C]/50"
                    }`}>
                      {cartCount > 0 ? `🛒 ${cartCount}` : isLowStock ? `⚠️ ${product.stock}` : product.stock}
                    </div>

                    {/* Emoji + Name + Category + Stock info */}
                    <div className="px-3 pt-3 pb-2">
                      <div className="text-[22px] mb-1.5">{getEmoji(product.category)}</div>
                      <p className="text-[12px] font-bold text-[#072C2C] leading-tight line-clamp-2">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] text-[#072C2C]/40">{product.category}</p>
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${isLowStock ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#ECFDF5] text-[#16A34A]"}`}>
                          {isLowStock ? "Stok menipis" : `Stok ${product.stock} ${product.unit}`}
                        </span>
                      </div>
                    </div>

                    {/* Unit row - single unit from product */}
                    <div className="px-2.5 pb-2.5 space-y-[2px]">
                      {(() => {
                        const u = { name: product.unit, price: product.selling_price, stockPerUnit: 1 };
                        const inCart = cart.find(i => i.productId === product.id && i.unit === u.name);
                        return (
                          <button
                            key={u.name}
                            onClick={() => addToCart(product.id, u.name, u.price, u.stockPerUnit)}
                            className={`w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                              inCart ? "bg-[#072C2C] text-white" : "hover:bg-[#f5f5f2]"
                            }`}
                          >
                            <span className={`text-[11px] ${inCart ? "text-white font-semibold" : "text-[#072C2C]/60 font-medium"}`}>{u.name}</span>
                            <span className={`text-[11px] font-bold tabular-nums ${inCart ? "text-white" : "text-[#072C2C]"}`}>Rp {u.price.toLocaleString("id-ID")}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#072C2C]/30">
                <Search className="w-10 h-10 mb-2" /><p className="text-sm">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Keranjang - fixed height, internal scroll */}
        <div className="hidden lg:flex flex-shrink-0 w-[300px] xl:w-[330px] bg-white border-l border-[#072C2C]/10 flex-col h-full">
          {/* Cart Header */}
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-[#072C2C]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#072C2C]" />
                <h2 className="font-bold text-[#072C2C] text-sm">KERANJANG</h2>
                <span className="text-[10px] text-[#072C2C]/50">({cart.length})</span>
              </div>
              {cart.length > 0 && <button onClick={clearCart} className="text-[9px] text-[#DC2626]/60 hover:text-[#DC2626] cursor-pointer flex items-center gap-0.5"><RotateCcw className="w-2.5 h-2.5" />Hapus</button>}
            </div>
          </div>

          {/* Cart Items - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#072C2C]/20">
                <ShoppingCart className="w-10 h-10 mb-1" />
                <p className="text-[11px] text-[#072C2C]/40">Keranjang kosong</p>
                <p className="text-[9px] text-[#072C2C]/30">Pilih satuan produk di kiri</p>
              </div>
            ) : cart.map((item) => (
              <div key={`${item.productId}-${item.unit}`} className="flex items-center gap-2 p-2.5 bg-[#F9F8F4] rounded-lg border border-[#072C2C]/5">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#072C2C] leading-tight">{item.name}</p>
                  <p className="text-[9px] text-[#072C2C]/50">{item.unit} · {formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, item.unit, -1)} className="w-6 h-6 rounded-md bg-white border border-[#072C2C]/10 flex items-center justify-center cursor-pointer hover:bg-[#DC2626]/5"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.unit, 1)} className="w-6 h-6 rounded-md bg-white border border-[#072C2C]/10 flex items-center justify-center cursor-pointer hover:bg-[#16A34A]/5"><Plus className="w-3 h-3" /></button>
                </div>
                <p className="text-[11px] font-bold text-[#072C2C] min-w-[55px] text-right">{formatCurrency(item.subtotal)}</p>
                <button onClick={() => removeFromCart(item.productId, item.unit)} className="text-[#DC2626]/30 hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>

          {/* Footer: Total + Checkout button */}
          {cart.length > 0 && (
            <div className="flex-shrink-0 border-t border-[#072C2C]/10 px-3 py-3 bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-[#072C2C]">TOTAL</span>
                <span className="text-lg font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
              </div>
              <button onClick={() => setShowCheckout(true)} className="w-full py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#e55503] flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />CHECKOUT
              </button>
            </div>
          )}
        </div>

        {/* Mobile: Cart bottom sheet */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-200">
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#072C2C]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h2 className="font-bold text-white text-base">Keranjang</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">{cart.length}</span>
              </div>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#F5F5F0]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full"><ShoppingCart className="w-14 h-14 mb-2 text-[#072C2C]/15" /><p className="text-sm text-[#072C2C]/40">Keranjang kosong</p></div>
              ) : cart.map((item) => (
                <div key={`${item.productId}-${item.unit}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#072C2C]/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#072C2C]">{item.name}</p>
                    <p className="text-xs text-[#072C2C]/50">{item.unit} · {formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.productId, item.unit, -1)} className="w-8 h-8 rounded-lg bg-[#EDEADE] flex items-center justify-center cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.unit, 1)} className="w-8 h-8 rounded-lg bg-[#EDEADE] flex items-center justify-center cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-bold">{formatCurrency(item.subtotal)}</p>
                    <button onClick={() => removeFromCart(item.productId, item.unit)} className="text-[10px] text-[#DC2626]/60 cursor-pointer">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="flex-shrink-0 border-t border-[#072C2C]/10 px-4 py-3 bg-white space-y-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-[#072C2C]">TOTAL</span>
                  <span className="text-xl font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
                </div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full py-3.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />CHECKOUT
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile floating cart button - above bottom nav */}
        {cart.length > 0 && !showCart && (
          <div className="lg:hidden fixed bottom-[68px] left-0 right-0 z-40 px-3 pb-1">
            <button onClick={() => setShowCart(true)} className="w-full flex items-center justify-between px-4 py-3.5 bg-[#FF5F03] text-white rounded-2xl shadow-xl shadow-[#FF5F03]/30 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /><span className="text-sm font-bold">{cart.length} item</span></div>
              <span className="text-base font-bold">{formatCurrency(total)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal - full screen on mobile, centered card on desktop */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex flex-col sm:items-center sm:justify-center sm:p-4">
          <div className="hidden sm:block fixed inset-0 bg-[#072C2C]/50 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative bg-white w-full h-full sm:h-auto sm:rounded-2xl sm:shadow-2xl sm:w-full sm:max-w-sm sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#072C2C]/10 bg-white">
              <h2 className="text-base font-bold text-[#072C2C]">PROSES PEMBAYARAN</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 rounded-lg hover:bg-[#EDEADE] cursor-pointer"><X className="w-5 h-5 text-[#072C2C]/60" /></button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#072C2C]/60">Total</span>
                <span className="text-2xl font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-xs font-semibold text-[#072C2C]/60 mb-2">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["cash", Banknote, "Tunai"],
                    ["qris", QrCode, "QRIS"],
                    ["transfer", CreditCard, "Transfer"],
                    ["edc", Smartphone, "EDC"],
                    ["bon", null, "Bon/Hutang"],
                  ] as const).map(([method, Icon, label]) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border-2 ${
                        paymentMethod === method
                          ? method === "bon"
                            ? "bg-red-50 border-red-400 text-red-600"
                            : "bg-[#072C2C] border-[#072C2C] text-white"
                          : "bg-[#F5F4F0] border-transparent text-[#072C2C]/60 hover:border-[#072C2C]/20"
                      }`}
                    >
                      {method === "bon" ? "📋" : Icon && <Icon className="w-3.5 h-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "bon" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                      <p className="text-xs text-red-600">Pilih pelanggan yang berhutang. Hutang akan otomatis tercatat di menu Pelanggan.</p>
                    </div>
                    {/* Customer search & select */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setBonCustomerId(""); setBonCustomerName(""); }}
                        placeholder="Cari nama pelanggan..."
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-[#E5E3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                    </div>
                    {/* Dropdown hasil search */}
                    {customerSearch && !bonCustomerId && (
                      <div className="border border-[#E5E3DC] rounded-xl overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                        {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 ? (
                          <p className="text-xs text-[#9CA3AF] p-3 text-center">Pelanggan tidak ditemukan</p>
                        ) : customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setBonCustomerId(c.id); setBonCustomerName(c.name); setCustomerSearch(c.name); }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F8F7F4] border-b border-[#F0EEE8] last:border-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#072C2C]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-black text-[#072C2C]">{c.name.charAt(0)}</span>
                              </div>
                              <span className="text-sm font-medium text-[#072C2C]">{c.name}</span>
                            </div>
                            {c.debt > 0 && (
                              <span className="text-[10px] text-red-500 font-medium">{formatCurrency(c.debt)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Selected customer badge */}
                    {bonCustomerId && (
                      <div className="flex items-center justify-between px-3 py-2.5 bg-[#072C2C] rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-[11px] font-black text-white">{bonCustomerName.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-bold text-white">{bonCustomerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/60">+{formatCurrency(total)}</span>
                          <button type="button" onClick={() => { setBonCustomerId(""); setBonCustomerName(""); setCustomerSearch(""); }} className="text-white/50 hover:text-white cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diskon — collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => { setShowDiscount(v => !v); if (showDiscount) setDiscountInput(""); }}
                  className="flex items-center justify-between w-full group"
                >
                  <span className="text-xs font-semibold text-[#072C2C]/60">Diskon</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${showDiscount ? "bg-[#FF5F03]/10 text-[#FF5F03]" : "bg-[#F0EEE8] text-[#072C2C]/50 group-hover:text-[#072C2C]"}`}>
                    {showDiscount ? (calculatedDiscount > 0 ? `-${formatCurrency(calculatedDiscount)}` : "Tutup") : "+ Tambah Diskon"}
                  </span>
                </button>
                {showDiscount && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric"
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="flex-1 px-3 py-2.5 text-sm border border-[#072C2C]/10 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30"
                    />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value as "rp" | "persen")} className="px-3 py-2.5 text-sm border border-[#072C2C]/10 rounded-xl bg-white cursor-pointer">
                      <option value="rp">Rp</option>
                      <option value="persen">%</option>
                    </select>
                  </div>
                )}
                {!showDiscount && calculatedDiscount > 0 && (
                  <p className="text-xs text-[#DC2626] mt-1">Diskon aktif: -{formatCurrency(calculatedDiscount)}</p>
                )}
              </div>

              {/* Cash input */}
              {paymentMethod === "cash" && (
                <div>
                  <p className="text-xs font-semibold text-[#072C2C]/60 mb-2">Uang Diterima</p>
                  <input type="text" inputMode="numeric" value={displayAmountPaid} onChange={(e) => handleAmountInput(e.target.value)} placeholder="Rp 0" className="w-full px-3 py-3 text-base font-bold border border-[#072C2C]/10 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                  {/* Saran nominal */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => setAmountPaid(String(total))} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${Number(amountPaid) === total ? "bg-[#FF5F03] text-white" : "bg-[#FF5F03]/10 text-[#FF5F03] border border-[#FF5F03]/30"}`}>Uang Pas</button>
                    {(() => {
                      const suggestions: number[] = [];
                      const denoms = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
                      for (const d of denoms) { if (d >= total && suggestions.length < 4) suggestions.push(d); }
                      if (suggestions.length === 0 || suggestions[0] < total) {
                        const rounded = Math.ceil(total / 50000) * 50000;
                        [rounded, rounded + 50000, rounded + 100000].forEach(v => { if (!suggestions.includes(v) && suggestions.length < 4) suggestions.push(v); });
                      }
                      return suggestions.map(amount => (
                        <button key={amount} onClick={() => setAmountPaid(String(amount))} className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer ${Number(amountPaid) === amount ? "bg-[#072C2C] text-white" : "bg-[#F5F4F0] border border-[#072C2C]/10 text-[#072C2C]/70"}`}>
                          {amount >= 1000000 ? `${(amount/1000000)}jt` : `${(amount/1000)}rb`}
                        </button>
                      ));
                    })()}
                  </div>
                  <div className="flex justify-between items-center mt-3 p-3 bg-[#ECFDF5] rounded-lg">
                    <span className="text-sm text-[#072C2C]/60">Kembalian</span>
                    <span className="text-lg font-bold text-[#16A34A]">{formatRupiah(change > 0 ? change : 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed bottom button */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-[#072C2C]/10 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
              {paymentMethod === "bon" && !bonCustomerId && (
                <p className="text-xs text-red-500 text-center mb-2 font-medium">⚠️ Pilih pelanggan dulu untuk lanjut bayar dengan bon</p>
              )}
              <button onClick={() => { handlePayment(); setShowCheckout(false); }} disabled={!canPay} className="w-full py-4 bg-[#FF5F03] text-white font-bold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#e55503] flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                {paymentMethod === "bon" && bonCustomerName ? `BON — ${bonCustomerName}` : "BAYAR SEKARANG"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {scanNotification && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-[#16A34A] text-white rounded-xl shadow-xl text-sm font-medium flex items-center gap-2"><Check className="w-4 h-4" />{scanNotification}</div>}
      {successToast && <div className="fixed z-[9999] top-4 right-4 left-4 sm:left-auto"><div className="bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"><Check className="w-5 h-5" /><div><p className="text-sm font-bold">Transaksi Berhasil!</p><p className="text-xs text-white/80">{successToast}</p></div></div></div>}
      {stockError && <div className="fixed z-[9999] top-4 right-4 left-4 sm:left-auto"><div className="bg-[#DC2626] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"><AlertTriangle className="w-5 h-5" /><div><p className="text-sm font-bold">Stok Tidak Cukup!</p><p className="text-xs text-white/80">{stockError}</p></div></div></div>}
      {printToast && <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 ${printToast.color} text-white rounded-xl shadow-xl text-sm`}>{printToast.msg}</div>}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={closeScanner} />
          <div className="relative bg-black w-full h-full sm:w-[480px] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Scan Barcode</p>
              <button onClick={closeScanner} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 relative min-h-[300px]"><video ref={scanVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[70%] max-w-[280px] aspect-[3/2] relative"><div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-lg" /><div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-lg" /><div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-lg" /><div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-lg" /><div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[#FF5F03] opacity-80 animate-pulse" /></div></div></div>
            <div className="bg-black px-4 py-4 text-center">{scannerError ? <p className="text-[#DC2626] text-sm">{scannerError}</p> : scannerMsg ? <p className="text-[#D97706] text-sm">{scannerMsg}</p> : <p className="text-white/70 text-sm">Arahkan kamera ke barcode</p>}</div>
          </div>
        </div>
      )}

      {/* Success + Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Success header */}
            <div className="bg-[#16A34A] px-5 py-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Pembayaran Berhasil!</h2>
              <p className="text-white/80 text-sm mt-1">{trxId}</p>
            </div>

            {/* Transaction summary */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Total</span><span className="font-bold text-[#072C2C]">{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Metode</span><span className="font-medium text-[#072C2C]">{paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : paymentMethod === "edc" ? "EDC" : paymentMethod === "bon" ? "Bon/Hutang" : "QRIS"}</span></div>
              {paymentMethod === "cash" && Number(amountPaid) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Kembalian</span><span className="font-bold text-[#16A34A]">{formatCurrency(change > 0 ? change : 0)}</span></div>
              )}
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Diskon</span><span className="text-[#DC2626]">-{formatCurrency(calculatedDiscount)}</span></div>
              )}
            </div>

            {/* Action buttons - clear and prominent */}
            <div className="px-5 pb-5 space-y-2">
              <button onClick={() => handleSavePDF("open")} className="w-full flex items-center justify-center gap-2 py-3 bg-[#072C2C] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#0a3d3d] transition-colors">
                🧾 Lihat & Cetak Struk
              </button>
              <button onClick={handleNewTransaction} className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-[#e55503] transition-colors">
                <Plus className="w-4 h-4" />Transaksi Baru
              </button>
            </div>

            {/* Hidden receipt for print */}
            <div ref={receiptRef} className="hidden">
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", textAlign: "center", lineHeight: "1.6" }}>
                <p style={{ fontSize: "14px", fontWeight: "bold" }}>NEXO POS</p>
                <p style={{ fontSize: "10px", color: "#666" }}>Kasir: Demo User</p>
                <p style={{ margin: "8px 0", borderTop: "1px dashed #ccc" }}></p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666" }}><span>{trxId}</span><span>{now.toLocaleDateString("id-ID")} {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                <table style={{ width: "100%", fontSize: "11px", textAlign: "left", borderCollapse: "collapse" }}><tbody>
                  {cart.map((item) => (<tr key={`${item.productId}-${item.unit}`}><td style={{ paddingBottom: "4px" }}><div>{item.name}</div><div style={{ fontSize: "10px", color: "#888" }}>{item.quantity} {item.unit} x {formatCurrency(item.price)}</div></td><td style={{ textAlign: "right", verticalAlign: "top", fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</td></tr>))}
                </tbody></table>
                <p style={{ margin: "6px 0", borderTop: "1px dashed #ccc" }}></p>
                <div style={{ textAlign: "right", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {calculatedDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Diskon</span><span>-{formatCurrency(calculatedDiscount)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
                </div>
                <p style={{ margin: "8px 0", borderTop: "1px dashed #ccc" }}></p>
                <p style={{ fontSize: "10px", color: "#888" }}>Terima kasih!</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
