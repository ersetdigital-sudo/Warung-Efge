"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ============ DEMO DATA ============

const DEMO_PRODUCTS = [
  { id: "demo-1", name: "Beras Premium 5kg", sku: "BRS-001", barcode: "8991234567001", category: "Beras & Tepung", cost_price: 62000, selling_price: 68000, wholesale_price: 65000, retail_price: 68000, stock: 45, min_stock: 10, unit: "Karung", expiry_date: null, is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-2", name: "Minyak Goreng Bimoli 2L", sku: "MYK-001", barcode: "8991234567002", category: "Minyak & Mentega", cost_price: 28000, selling_price: 32000, wholesale_price: 30000, retail_price: 32000, stock: 30, min_stock: 10, unit: "Botol", expiry_date: null, is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-3", name: "Gula Pasir 1kg", sku: "GLA-001", barcode: "8991234567003", category: "Gula & Garam", cost_price: 14000, selling_price: 16000, wholesale_price: 15000, retail_price: 16000, stock: 8, min_stock: 15, unit: "Kg", expiry_date: null, is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-4", name: "Indomie Goreng", sku: "MIE-001", barcode: "8991234567004", category: "Mie & Pasta", cost_price: 2800, selling_price: 3500, wholesale_price: 3000, retail_price: 3500, stock: 120, min_stock: 50, unit: "Pcs", expiry_date: "2025-08-15", is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-5", name: "Kopi Kapal Api 165g", sku: "KPI-001", barcode: "8991234567005", category: "Minuman", cost_price: 9500, selling_price: 12000, wholesale_price: 11000, retail_price: 12000, stock: 25, min_stock: 10, unit: "Bungkus", expiry_date: "2025-06-30", is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-6", name: "Detergen Rinso 800g", sku: "DTG-001", barcode: "8991234567006", category: "Sabun & Detergen", cost_price: 12000, selling_price: 15000, wholesale_price: 14000, retail_price: 15000, stock: 5, min_stock: 10, unit: "Pcs", expiry_date: null, is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-7", name: "Kecap Manis ABC 600ml", sku: "KCP-001", barcode: "8991234567007", category: "Bumbu & Rempah", cost_price: 15000, selling_price: 18000, wholesale_price: 17000, retail_price: 18000, stock: 18, min_stock: 8, unit: "Botol", expiry_date: "2025-12-01", is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-8", name: "Susu Indomilk 1L", sku: "SSU-001", barcode: "8991234567008", category: "Minuman", cost_price: 16000, selling_price: 19000, wholesale_price: 18000, retail_price: 19000, stock: 3, min_stock: 10, unit: "Kotak", expiry_date: "2025-04-20", is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-9", name: "Garam Halus 250g", sku: "GRM-001", barcode: "8991234567009", category: "Gula & Garam", cost_price: 3000, selling_price: 4500, wholesale_price: 4000, retail_price: 4500, stock: 40, min_stock: 15, unit: "Bungkus", expiry_date: null, is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-10", name: "Sambal ABC 135ml", sku: "SMB-001", barcode: "8991234567010", category: "Bumbu & Rempah", cost_price: 7500, selling_price: 9500, wholesale_price: 9000, retail_price: 9500, stock: 22, min_stock: 10, unit: "Botol", expiry_date: "2025-09-10", is_archived: false, created_at: "2024-01-15T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-11", name: "Teh Sariwangi 25 sachet", sku: "TEH-001", barcode: "8991234567011", category: "Minuman", cost_price: 5000, selling_price: 7000, wholesale_price: 6500, retail_price: 7000, stock: 35, min_stock: 10, unit: "Kotak", expiry_date: null, is_archived: false, created_at: "2024-02-01T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
  { id: "demo-12", name: "Sabun Lifebuoy 100g", sku: "SBN-001", barcode: "8991234567012", category: "Sabun & Detergen", cost_price: 4000, selling_price: 5500, wholesale_price: 5000, retail_price: 5500, stock: 50, min_stock: 15, unit: "Pcs", expiry_date: null, is_archived: false, created_at: "2024-02-01T08:00:00Z", updated_at: "2024-03-20T08:00:00Z" },
];

const DEMO_CUSTOMERS = [
  { id: "demo-c1", name: "Bu Siti", phone: "0812-3456-7890", address: "Jl. Melati No.5, RT 03/RW 02", debt: 350000, created_at: "2024-01-20T08:00:00Z" },
  { id: "demo-c2", name: "Pak Ahmad", phone: "0813-4567-8901", address: "Jl. Mawar No.12, RT 05/RW 01", debt: 0, created_at: "2024-01-25T08:00:00Z" },
  { id: "demo-c3", name: "Bu Rina", phone: "0857-6789-0123", address: "Jl. Kenanga No.8, RT 01/RW 03", debt: 175000, created_at: "2024-02-05T08:00:00Z" },
  { id: "demo-c4", name: "Pak Budi", phone: "0878-9012-3456", address: "Jl. Anggrek No.22, RT 02/RW 04", debt: 500000, created_at: "2024-02-10T08:00:00Z" },
  { id: "demo-c5", name: "Bu Dewi", phone: "0821-0123-4567", address: "Jl. Dahlia No.15, RT 04/RW 02", debt: 0, created_at: "2024-02-15T08:00:00Z" },
];

const DEMO_SUPPLIERS = [
  { id: "demo-s1", name: "PT Indofood Sukses Makmur", phone: "021-8888001", address: "Jl. Jendral Sudirman No.21, Jakarta", email: "order@indofood.co.id", debt: 5500000, created_at: "2024-01-10T08:00:00Z" },
  { id: "demo-s2", name: "CV Sumber Rejeki", phone: "031-5556677", address: "Jl. Raya Darmo No.45, Surabaya", email: "info@sumberrejeki.com", debt: 0, created_at: "2024-01-12T08:00:00Z" },
  { id: "demo-s3", name: "UD Maju Jaya", phone: "024-7778899", address: "Jl. Pemuda No.12, Semarang", email: null, debt: 2300000, created_at: "2024-02-01T08:00:00Z" },
  { id: "demo-s4", name: "PT Unilever Indonesia", phone: "021-9998877", address: "Jl. BSD Boulevard, Tangerang", email: "supply@unilever.co.id", debt: 0, created_at: "2024-01-15T08:00:00Z" },
  { id: "demo-s5", name: "CV Berkah Sentosa", phone: "022-3334455", address: "Jl. Asia Afrika No.88, Bandung", email: null, debt: 1800000, created_at: "2024-02-20T08:00:00Z" },
];

// Generate recent demo transactions (dates relative to today)
function generateDemoTransactions() {
  const now = new Date();
  const transactions = [];
  const methods = ["cash", "cash", "cash", "qris", "transfer", "hutang"];
  const cashiers = ["Pak Efge", "Sari Dewi", "Ahmad Fauzi"];

  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hour = 7 + Math.floor(Math.random() * 12);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

    const numItems = 1 + Math.floor(Math.random() * 3);
    const items = [];
    const usedProductIds = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let product;
      do {
        product = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
      } while (usedProductIds.has(product.id));
      usedProductIds.add(product.id);

      const qty = 1 + Math.floor(Math.random() * 5);
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit: product.unit,
        price: product.selling_price,
        subtotal: qty * product.selling_price,
      });
    }

    const subtotal = items.reduce((s, item) => s + item.subtotal, 0);
    const discount = Math.random() > 0.8 ? Math.round(subtotal * 0.05 / 1000) * 1000 : 0;
    const total = subtotal - discount;
    const method = methods[Math.floor(Math.random() * methods.length)];
    const isDebt = method === "hutang";

    transactions.push({
      id: `demo-trx-${String(i + 1).padStart(3, "0")}`,
      transaction_number: `TRX-${String(i + 1).padStart(4, "0")}`,
      customer_id: isDebt ? DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)].id : null,
      subtotal,
      discount,
      total,
      payment_method: method,
      amount_paid: isDebt ? 0 : total,
      change_amount: method === "cash" ? (Math.ceil(total / 5000) * 5000 - total) : 0,
      is_debt: isDebt,
      cashier: cashiers[Math.floor(Math.random() * cashiers.length)],
      created_at: date.toISOString(),
      transaction_items: items,
    });
  }

  return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const DEMO_TRANSACTIONS = generateDemoTransactions();

const DEMO_STOCK_MOVEMENTS = [
  { id: "demo-sm1", product_id: "demo-4", product_name: "Indomie Goreng", type: "in", quantity: 200, unit: "Pcs", notes: "Pembelian dari Indofood", user_name: "Ahmad Fauzi", created_at: "2024-03-15T08:00:00Z" },
  { id: "demo-sm2", product_id: "demo-1", product_name: "Beras Premium 5kg", type: "in", quantity: 20, unit: "Karung", notes: "Pembelian dari UD Maju Jaya", user_name: "Ahmad Fauzi", created_at: "2024-03-18T08:00:00Z" },
  { id: "demo-sm3", product_id: "demo-6", product_name: "Detergen Rinso 800g", type: "in", quantity: 36, unit: "Pcs", notes: "Pembelian dari Unilever", user_name: "Ahmad Fauzi", created_at: "2024-03-19T08:00:00Z" },
  { id: "demo-sm4", product_id: "demo-4", product_name: "Indomie Goreng", type: "out", quantity: 15, unit: "Pcs", notes: "Penjualan harian", user_name: "Sari Dewi", created_at: "2024-03-20T08:00:00Z" },
  { id: "demo-sm5", product_id: "demo-8", product_name: "Susu Indomilk 1L", type: "adjustment", quantity: -2, unit: "Kotak", notes: "Produk kadaluarsa", user_name: "Ahmad Fauzi", created_at: "2024-03-20T10:00:00Z" },
];

const DEMO_USERS = [
  { id: "demo-u1", name: "Pak Efge", email: "efge@warung.com", role: "owner", is_active: true, created_at: "2024-01-01T08:00:00Z" },
  { id: "demo-u2", name: "Ahmad Fauzi", email: "ahmad@warung.com", role: "admin", is_active: true, created_at: "2024-01-05T08:00:00Z" },
  { id: "demo-u3", name: "Sari Dewi", email: "sari@warung.com", role: "cashier", is_active: true, created_at: "2024-01-10T08:00:00Z" },
  { id: "demo-u4", name: "Budi Santoso", email: "budi@warung.com", role: "cashier", is_active: false, created_at: "2024-02-01T08:00:00Z" },
];

// ============ CONTEXT ============

interface DemoContextType {
  isDemo: boolean;
  // Data getters
  products: any[];
  customers: any[];
  suppliers: any[];
  transactions: any[];
  stockMovements: any[];
  users: any[];
  // Actions (all no-op to real DB, mutate local state only)
  addProduct: (product: any) => any;
  updateProduct: (id: string, updates: any) => boolean;
  deleteProduct: (id: string) => boolean;
  addTransaction: (trx: any, items: any[]) => any;
  addStockMovement: (movement: any) => boolean;
  updateCustomerDebt: (id: string, newDebt: number) => boolean;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  products: [],
  customers: [],
  suppliers: [],
  transactions: [],
  stockMovements: [],
  users: [],
  addProduct: () => null,
  updateProduct: () => false,
  deleteProduct: () => false,
  addTransaction: () => null,
  addStockMovement: () => false,
  updateCustomerDebt: () => false,
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [customers, setCustomers] = useState(DEMO_CUSTOMERS);
  const [suppliers] = useState(DEMO_SUPPLIERS);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [stockMovements, setStockMovements] = useState(DEMO_STOCK_MOVEMENTS);
  const [users] = useState(DEMO_USERS);

  const addProduct = useCallback((product: any) => {
    const newProduct = { ...product, id: `demo-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: any) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)));
    return true;
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  const addTransaction = useCallback((trx: any, items: any[]) => {
    const newTrx = {
      ...trx,
      id: `demo-trx-${Date.now()}`,
      transaction_number: `TRX-${String(transactions.length + 1).padStart(4, "0")}`,
      created_at: new Date().toISOString(),
      transaction_items: items,
    };
    setTransactions((prev) => [newTrx, ...prev]);
    // Update stock
    for (const item of items) {
      setProducts((prev) =>
        prev.map((p) => (p.id === item.product_id ? { ...p, stock: Math.max(0, p.stock - (item.quantity || 0)) } : p))
      );
    }
    return newTrx;
  }, [transactions.length]);

  const addStockMovement = useCallback((movement: any) => {
    const newMovement = { ...movement, id: `demo-sm-${Date.now()}`, created_at: new Date().toISOString() };
    setStockMovements((prev) => [newMovement, ...prev]);
    return true;
  }, []);

  const updateCustomerDebt = useCallback((id: string, newDebt: number) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, debt: newDebt } : c)));
    return true;
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        products,
        customers,
        suppliers,
        transactions,
        stockMovements,
        users,
        addProduct,
        updateProduct,
        deleteProduct,
        addTransaction,
        addStockMovement,
        updateCustomerDebt,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
export { DemoContext };
