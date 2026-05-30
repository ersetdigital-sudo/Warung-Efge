"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Printer, ScanBarcode, AlertTriangle, Store, User, Clock, RotateCcw, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { products, customers, categories } from "@/data/mock-data";

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
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
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
  const handleNewTransaction = () => {
    setCart([]); setDiscount(0); setAmountPaid(""); setSelectedCustomer(""); setIsDebt(false); setShowReceipt(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + " · " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const canPay = cart.length > 0 && (isDebt || paymentMethod !== "cash" || Number(amountPaid) >= total);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 lg:-m-6">
      {/* Top Header Bar */}
      <div className="bg-[#072C2C] px-4 lg:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#FF5F03] rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm lg:text-base font-[Oswald] tracking-wide">WARUNG EFGE</h1>
            <p className="text-white/50 text-[10px] lg:text-xs flex items-center gap-1 hidden sm:flex"><Clock className="w-3 h-3" />{formatTime(currentTime)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile cart toggle */}
          <button onClick={() => setShowCart(true)} className="lg:hidden relative flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5F03] text-white rounded-lg text-xs font-medium cursor-pointer">
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-[#FF5F03] rounded-full text-[10px] font-bold flex items-center justify-center">{cart.length}</span>}
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 lg:w-7 lg:h-7 bg-[#FF5F03] rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-white text-xs font-medium">Pak Efge</p>
              <p className="text-white/50 text-[9px]">Owner</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#EDEADE]">
          {/* Search Bar */}
          <div className="px-3 lg:px-5 pt-3 pb-2">
            <div className="flex gap-2 lg:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-[#072C2C]/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 lg:pl-12 pr-3 py-2.5 lg:py-3 bg-white border border-[#072C2C]/10 rounded-lg lg:rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 focus:border-[#FF5F03] shadow-sm"
                  autoFocus
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 lg:px-5 py-2.5 bg-[#FF5F03] text-white rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm hover:bg-[#e55503] transition-colors shadow-sm cursor-pointer">
                <ScanBarcode className="w-4 lg:w-5 h-4 lg:h-5" />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 lg:px-5 pb-2">
            <div className="flex gap-1.5 lg:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-md lg:rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${!selectedCategory ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-md lg:rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat.name ? "bg-[#072C2C] text-white" : "bg-white text-[#072C2C]/70 border border-[#072C2C]/10 hover:border-[#FF5F03]/30"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-3 lg:px-5 pb-20 lg:pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                const inCart = cart.find((item) => item.productId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id)}
                    className={`relative bg-white border rounded-xl lg:rounded-2xl p-2.5 lg:p-4 text-left transition-all group cursor-pointer ${inCart ? "border-[#FF5F03] ring-2 ring-[#FF5F03]/20 shadow-md" : "border-[#072C2C]/10 hover:border-[#FF5F03]/40 hover:shadow-md"}`}
                  >
                    {inCart && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 lg:w-6 lg:h-6 bg-[#FF5F03] rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-[10px] lg:text-xs font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                    <div className="w-full aspect-square lg:aspect-[4/3] bg-[#EDEADE] rounded-lg lg:rounded-xl flex items-center justify-center mb-2 lg:mb-3 group-hover:bg-[#FF5F03]/5 transition-colors">
                      <ShoppingCart className="w-6 h-6 lg:w-8 lg:h-8 text-[#072C2C]/15 group-hover:text-[#FF5F03]/40" />
                    </div>
                    <p className="text-xs lg:text-sm font-semibold text-[#072C2C] truncate">{product.name}</p>
                    <p className="text-sm lg:text-lg font-bold text-[#FF5F03] mt-0.5 lg:mt-1">{formatCurrency(product.sellingPrice)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {isLowStock && <AlertTriangle className="w-3 h-3 text-[#D97706]" />}
                      <p className={`text-[10px] lg:text-xs ${isLowStock ? "text-[#D97706] font-medium" : "text-[#072C2C]/50"}`}>
                        Stok: {product.stock} {product.unit}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#072C2C]/30">
                <Search className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cart Overlay */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
            <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
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
                    <ShoppingCart className="w-12 h-12 mb-2" />
                    <p className="text-sm text-[#072C2C]/40">Keranjang kosong</p>
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
              {/* Mobile Payment */}
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

        {/* Desktop Right Panel - Cart & Payment */}
        <div className="hidden lg:flex w-[340px] xl:w-[380px] bg-white border-l border-[#072C2C]/10 flex-col min-h-0">
          {/* Cart Header */}
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

          {/* Cart Items */}
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

          {/* Payment Section */}
          <div className="border-t border-[#072C2C]/10 px-4 py-3 space-y-2.5 bg-[#EDEADE]/30">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#072C2C]/60">Subtotal</span>
                <span className="text-[#072C2C] font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#072C2C]/60">Diskon</span>
                <span className="text-[#DC2626] font-medium">- {formatCurrency(discount)}</span>
              </div>
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
              {selectedCustomer && (
                <label className="flex items-center gap-2 mt-1.5 p-2 bg-[#D97706]/10 rounded-lg border border-[#D97706]/20 cursor-pointer">
                  <input type="checkbox" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="w-3 h-3 rounded accent-[#FF5F03]" />
                  <span className="text-[10px] font-medium text-[#D97706]">Bon / Hutang</span>
                </label>
              )}
            </div>
            {!isDebt && paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Bayar (Rp)</p>
                  <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" className="w-full px-2.5 py-2 text-xs font-bold text-[#072C2C] border border-[#072C2C]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 text-right" />
                </div>
                <div>
                  <p className="text-[10px] text-[#072C2C]/60 mb-0.5 font-medium">Kembalian</p>
                  <div className="w-full px-2.5 py-2 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg text-right">{formatCurrency(change > 0 ? change : 0)}</div>
                </div>
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
            <ShoppingCart className="w-4 h-4" />
            {cart.length} item · {formatCurrency(total)}
          </button>
        )}
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={handleNewTransaction} title="Transaksi Berhasil" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-[#072C2C]">Pembayaran Berhasil!</h3>
          </div>
          <div className="bg-[#EDEADE] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Total</span><span className="font-bold text-[#072C2C]">{formatCurrency(total)}</span></div>
            {!isDebt && paymentMethod === "cash" && <>
              <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Dibayar</span><span className="text-[#072C2C]">{formatCurrency(Number(amountPaid))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Kembalian</span><span className="font-bold text-[#16A34A]">{formatCurrency(change > 0 ? change : 0)}</span></div>
            </>}
            <div className="flex justify-between text-sm"><span className="text-[#072C2C]/60">Metode</span><span className="capitalize font-medium text-[#072C2C]">{isDebt ? "Bon/Hutang" : paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : "QRIS"}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleNewTransaction}>Transaksi Baru</Button>
            <Button className="flex-1"><Printer className="w-4 h-4" />Cetak Struk</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
