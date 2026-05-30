"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Printer, ScanBarcode, AlertTriangle, RotateCcw, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { products, categories } from "@/data/mock-data";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
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
      return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, quantity: 1, unit: product.unit, subtotal: product.sellingPrice }];
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
  const clearCart = () => { setCart([]); setDiscount(0); setAmountPaid(""); };
  const handlePayment = () => { setShowReceipt(true); setShowCart(false); };
  const handleNewTransaction = () => { setCart([]); setDiscount(0); setAmountPaid(""); setIsDebt(false); setShowReceipt(false); };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Struk</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11px;padding:12px;width:280px;color:#111}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    handleNewTransaction();
  };

  const canPay = cart.length > 0 && (isDebt || paymentMethod !== "cash" || Number(amountPaid) >= total);
  const now = new Date();

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
              <button className="flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-5 py-2.5 bg-[#FF5F03] text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm hover:bg-[#e55503] transition-colors shadow-sm cursor-pointer">
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
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 pb-20 lg:pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-3">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
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
                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-[#FF5F03] mt-0.5 lg:mt-1">{formatCurrency(product.sellingPrice)}</p>
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

        {/* Mobile Cart Overlay */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
            <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#072C2C]/10">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[#072C2C] text-base">Keranjang</h2>
                  <span className="bg-[#FF5F03]/10 text-[#FF5F03] text-xs font-bold px-2 py-0.5 rounded-md">{cart.length} item</span>
                </div>
                <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-[#EDEADE] cursor-pointer"><X className="w-5 h-5 text-[#072C2C]/60" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#072C2C]/20">
                    <ShoppingCart className="w-12 h-12 mb-2" /><p className="text-sm text-[#072C2C]/40">Keranjang kosong</p>
                  </div>
                ) : cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 bg-[#EDEADE]/50 rounded-xl border border-[#072C2C]/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#072C2C] truncate">{item.name}</p>
                      <p className="text-xs text-[#072C2C]/50">{formatCurrency(item.price)} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white border border-[#072C2C]/10 flex items-center justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white border border-[#072C2C]/10 flex items-center justify-center cursor-pointer"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#072C2C]">{formatCurrency(item.subtotal)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-[#DC2626]/60 hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#072C2C]/10 px-5 py-4 space-y-3 bg-[#EDEADE]/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#072C2C]">Total</span>
                  <span className="text-xl font-bold text-[#FF5F03]">{formatCurrency(total)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([["cash", Banknote, "Tunai"], ["transfer", CreditCard, "Transfer"], ["qris", QrCode, "QRIS"]] as const).map(([method, Icon, label]) => (
                    <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium cursor-pointer ${paymentMethod === method ? "bg-[#072C2C] text-white" : "bg-white border border-[#072C2C]/10 text-[#072C2C]/70"}`}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>
                {!isDebt && paymentMethod === "cash" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Bayar (Rp)" className="px-3 py-2.5 text-sm font-bold border border-[#072C2C]/15 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30" />
                    <div className="px-3 py-2.5 text-sm font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg text-right">{formatCurrency(change > 0 ? change : 0)}</div>
                  </div>
                )}
                <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  <CreditCard className="w-5 h-5" />Proses Pembayaran
                </button>
              </div>
            </div>
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
                  <p className="text-[10px] text-[#072C2C]/50">{formatCurrency(item.price)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#DC2626]/5 cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-white border border-[#072C2C]/10 flex items-center justify-center hover:bg-[#16A34A]/5 cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                </div>
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
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Bayar (Rp)</p><input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" className="w-full px-2.5 py-2 text-xs font-bold text-[#072C2C] border border-[#072C2C]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" /></div>
                <div><p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Kembalian</p><div className="w-full px-2.5 py-2 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg text-right">{formatCurrency(change > 0 ? change : 0)}</div></div>
              </div>
            )}
            <button onClick={handlePayment} disabled={!canPay} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl hover:bg-[#e55503] transition-all shadow-lg shadow-[#FF5F03]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
              <CreditCard className="w-4 h-4" />Proses Pembayaran
            </button>
          </div>
        </div>

        {/* Mobile floating cart button */}
        {cart.length > 0 && !showCart && (
          <button onClick={() => setShowCart(true)} className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 bg-[#FF5F03] text-white rounded-full shadow-xl shadow-[#FF5F03]/30 font-medium text-sm cursor-pointer z-40">
            <ShoppingCart className="w-4 h-4" />{cart.length} item · {formatCurrency(total)}
          </button>
        )}
      </div>

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
    </div>
  );
}
