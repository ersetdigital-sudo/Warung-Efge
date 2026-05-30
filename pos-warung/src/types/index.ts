export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  image?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  unitConversions: UnitConversion[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  conversionRate: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  debt: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  date: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  debt: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  amountPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  isDebt: boolean;
  cashier: string;
  date: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'opname';
  quantity: number;
  unit: string;
  notes: string;
  date: string;
  user: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlyRevenue: number;
  totalTransactions: number;
  lowStockProducts: number;
  customerDebt: number;
  supplierDebt: number;
}
