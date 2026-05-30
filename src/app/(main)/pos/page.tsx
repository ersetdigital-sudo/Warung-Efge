"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Printer, ScanBarcode, AlertTriangle, Store, User, Clock, RotateCcw } from "lucide-react";
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

  const handlePayment = () => {
    setShowReceipt(true);
  };

  const handleNewTransaction = () => {
    setCart([]); setDiscount(0); setAmountPaid(""); setSelectedCustomer(""); setIsDebt(false); setShowReceipt(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " - " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const canPay = cart.length > 0 && (isDebt || paymentMethod !== "cash" || Number(amountPaid) >= total);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">Warung Efge</h1>
            <p className="text-emerald-200 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(currentTime)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Pak Efge</p>
              <p className="text-emerald-200 text-[10px]">Owner</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
          {/* Search Bar */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk atau nama barang..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  autoFocus
                />
              </div>
              <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
                <ScanBarcode className="w-5 h-5" />
                Scan Barcode
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-5 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${!selectedCategory ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"}`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat.name ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                const inCart = cart.find((item) => item.productId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id)}
                    className={`relative bg-white border rounded-2xl p-4 text-left transition-all group cursor-pointer ${inCart ? "border-emerald-400 ring-2 ring-emerald-100 shadow-md" : "border-gray-200 hover:border-emerald-300 hover:shadow-md"}`}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                    <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-50 transition-colors">
                      <ShoppingCart className="w-8 h-8 text-gray-200 group-hover:text-emerald-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(product.sellingPrice)}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      <p className={`text-xs ${isLowStock ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                        Stok: {product.stock} {product.unit}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart & Payment */}
        <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col min-h-0">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-base">Keranjang</h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{cart.length} item</span>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" />Kosongkan
                </button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <ShoppingCart className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium text-gray-400">Keranjang kosong</p>
                <p className="text-xs text-gray-400 mt-1">Pilih produk untuk memulai</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/50">
            {/* Subtotal & Discount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Diskon</span>
                <span className="text-red-500 font-medium">- {formatCurrency(discount)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-emerald-700">{formatCurrency(total)}</span>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Metode bayar</p>
              <div className="grid grid-cols-3 gap-2">
                {([["cash", Banknote, "Tunai"], ["transfer", CreditCard, "Transfer"], ["qris", QrCode, "QRIS"]] as const).map(([method, Icon, label]) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${paymentMethod === method ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              {selectedCustomer && (
                <label className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer">
                  <input type="checkbox" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                  <span className="text-xs font-medium text-amber-800">Bon / Hutang</span>
                </label>
              )}
            </div>

            {/* Cash Input */}
            {!isDebt && paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bayar (Rp)</p>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kembalian</p>
                  <div className="w-full px-3 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
                    {formatCurrency(change > 0 ? change : 0)}
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!canPay}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={handleNewTransaction} title="Transaksi Berhasil" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Pembayaran Berhasil!</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{formatCurrency(total)}</span></div>
            {!isDebt && paymentMethod === "cash" && <>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Dibayar</span><span className="text-gray-700">{formatCurrency(Number(amountPaid))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Kembalian</span><span className="font-bold text-emerald-600">{formatCurrency(change > 0 ? change : 0)}</span></div>
            </>}
            <div className="flex justify-between text-sm"><span className="text-gray-500">Metode</span><span className="capitalize font-medium">{isDebt ? "Bon/Hutang" : paymentMethod === "cash" ? "Tunai" : paymentMethod === "transfer" ? "Transfer" : "QRIS"}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleNewTransaction}>Transaksi Baru</Button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer">
              <Printer className="w-4 h-4" />Cetak Struk
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
