"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, QrCode, Banknote, Percent, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { products, customers } from "@/data/mock-data";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.sku.toLowerCase().includes(s));
  }, [search]);

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

  const handleNewTransaction = () => {
    setCart([]); setDiscount(0); setAmountPaid(""); setSelectedCustomer(""); setIsDebt(false); setShowReceipt(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk, scan barcode, atau ketik SKU..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <button key={product.id} onClick={() => addToCart(product.id)} className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-50 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-gray-300 group-hover:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{product.stock} {product.unit}</p>
                <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(product.sellingPrice)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-[400px] lg:min-h-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Keranjang</h2>
            <Badge variant="info">{cart.length} item</Badge>
          </div>
          <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Pelanggan Umum</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.price)} / {item.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 cursor-pointer"><Minus className="w-3 h-3" /></button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 cursor-pointer"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <input type="number" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="Diskon (Rp)" className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-700">{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Diskon</span><span className="text-red-600">-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2"><span className="text-gray-900">Total</span><span className="text-blue-600">{formatCurrency(total)}</span></div>
          </div>
          <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
            <CreditCard className="w-4 h-4" />Bayar {formatCurrency(total)}
          </Button>
        </div>
      </div>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Pembayaran" size="md">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600">Total Pembayaran</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(total)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {([["cash", Banknote, "Tunai"], ["transfer", CreditCard, "Transfer"], ["qris", QrCode, "QRIS"]] as const).map(([method, Icon, label]) => (
                <button key={method} onClick={() => setPaymentMethod(method)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all cursor-pointer ${paymentMethod === method ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Icon className={`w-5 h-5 ${paymentMethod === method ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-medium ${paymentMethod === method ? "text-blue-700" : "text-gray-600"}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedCustomer && (
            <label className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer">
              <input type="checkbox" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
              <div><p className="text-sm font-medium text-yellow-800">Catat sebagai Bon/Hutang</p></div>
            </label>
          )}
          {!isDebt && paymentMethod === "cash" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dibayar</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" className="w-full px-4 py-3 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-bold" />
              {Number(amountPaid) >= total && <p className="text-right text-sm mt-1 text-green-600 font-medium">Kembalian: {formatCurrency(change)}</p>}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 100000].map((amount) => (
                  <button key={amount} onClick={() => setAmountPaid(String(amount))} className="px-2 py-1.5 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">{formatCurrency(amount)}</button>
                ))}
              </div>
            </div>
          )}
          <Button className="w-full" size="lg" onClick={() => { setShowPayment(false); setShowReceipt(true); }} disabled={!isDebt && paymentMethod === "cash" && Number(amountPaid) < total}>Selesaikan Transaksi</Button>
        </div>
      </Modal>

      <Modal isOpen={showReceipt} onClose={handleNewTransaction} title="Transaksi Berhasil" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Pembayaran Berhasil!</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold">{formatCurrency(total)}</span></div>
            {!isDebt && paymentMethod === "cash" && <>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Dibayar</span><span>{formatCurrency(Number(amountPaid))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Kembalian</span><span className="font-bold text-green-600">{formatCurrency(change > 0 ? change : 0)}</span></div>
            </>}
            <div className="flex justify-between text-sm"><span className="text-gray-500">Metode</span><span className="capitalize">{isDebt ? "Bon/Hutang" : paymentMethod}</span></div>
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
