"use client";

import { useState, useMemo } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Minus, ShoppingCart, Trash2, CreditCard, Check, X } from "lucide-react";

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export default function DemoPOSPage() {
  const { products, addTransaction } = useDemo();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products.filter((p) => p.stock > 0);
    return products.filter((p) =>
      p.stock > 0 && (p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  const cartTotal = cart.reduce((s, item) => s + item.subtotal, 0);
  const cartCount = cart.reduce((s, item) => s + item.quantity, 0);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i);
      }
      return [...prev, { product_id: product.id, product_name: product.name, quantity: 1, unit: product.unit, price: product.selling_price, subtotal: product.selling_price }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      return { ...i, quantity: newQty, subtotal: newQty * i.price };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleCheckout = () => {
    addTransaction(
      { subtotal: cartTotal, discount: 0, total: cartTotal, payment_method: paymentMethod, amount_paid: cartTotal, change_amount: 0, is_debt: paymentMethod === "hutang", cashier: "Demo User" },
      cart
    );
    setCart([]);
    setShowCheckout(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="flex h-full gap-0 bg-[#EDEADE]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 lg:p-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#D9D6C8] rounded-lg px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <input type="text" placeholder="Scan barcode atau cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder-[#9CA3AF]" autoFocus />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white border border-[#D9D6C8] rounded-lg p-3 text-left hover:border-[#FF5F03] hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-medium text-[#111827] truncate group-hover:text-[#FF5F03] transition-colors">{p.name}</div>
              <div className="text-[9px] text-[#9CA3AF] mt-0.5">{p.category}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-[12px] font-bold text-[#072C2C]">{formatCurrency(p.selling_price)}</span>
                <span className="text-[9px] text-[#9CA3AF]">{p.stock} {p.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 lg:w-96 bg-white border-l border-[#D9D6C8] flex flex-col hidden md:flex">
        <div className="px-4 py-3 border-b border-[#D9D6C8]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#FF5F03]" />
            <span className="font-[Oswald] text-sm font-semibold text-[#072C2C] uppercase tracking-wide">Keranjang</span>
            {cartCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-[#FF5F03] text-white px-1.5 py-0.5 rounded-full">{cartCount}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-[#9CA3AF]">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Keranjang kosong</p>
              <p className="text-[10px] mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-2 p-2 bg-[#FAFAF8] rounded-lg border border-[#F0EEE8]">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[#111827] truncate">{item.product_name}</div>
                <div className="text-[10px] text-[#9CA3AF]">{formatCurrency(item.price)} / {item.unit}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded bg-[#EDEADE] flex items-center justify-center cursor-pointer hover:bg-[#D9D6C8]">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-[12px] font-bold font-mono">{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded bg-[#EDEADE] flex items-center justify-center cursor-pointer hover:bg-[#D9D6C8]">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right ml-1">
                <div className="text-[11px] font-bold font-mono text-[#072C2C]">{formatCurrency(item.subtotal)}</div>
                <button onClick={() => removeFromCart(item.product_id)} className="text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Pay */}
        {cart.length > 0 && (
          <div className="border-t border-[#D9D6C8] px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#4B5563]">Total</span>
              <span className="font-[Oswald] text-xl font-bold text-[#072C2C]">{formatCurrency(cartTotal)}</span>
            </div>
            {!showCheckout ? (
              <button onClick={() => setShowCheckout(true)} className="w-full py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl hover:bg-[#e55503] transition-all cursor-pointer flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> Bayar
              </button>
            ) : (
              <div className="space-y-2">
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-[#D9D6C8] rounded-lg text-sm">
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer</option>
                  <option value="hutang">Hutang</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowCheckout(false)} className="flex-1 py-2.5 bg-[#EDEADE] text-[#4B5563] font-medium text-sm rounded-lg cursor-pointer hover:bg-[#D9D6C8]">Batal</button>
                  <button onClick={handleCheckout} className="flex-1 py-2.5 bg-[#16A34A] text-white font-bold text-sm rounded-lg cursor-pointer hover:bg-[#15803d] flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-200">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Transaksi berhasil! (Demo)</span>
        </div>
      )}
    </div>
  );
}
