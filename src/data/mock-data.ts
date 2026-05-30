import { Product, Category, Supplier, Customer, Transaction, Purchase, StockMovement, User, DashboardStats } from "@/types";

export const categories: Category[] = [
  { id: "1", name: "Beras & Tepung", description: "Beras, tepung terigu, tepung beras" },
  { id: "2", name: "Minyak & Mentega", description: "Minyak goreng, mentega, margarin" },
  { id: "3", name: "Gula & Garam", description: "Gula pasir, gula merah, garam" },
  { id: "4", name: "Minuman", description: "Kopi, teh, susu, sirup" },
  { id: "5", name: "Mie & Pasta", description: "Mie instan, bihun, spaghetti" },
  { id: "6", name: "Bumbu & Rempah", description: "Kecap, saus, sambal, bumbu masak" },
  { id: "7", name: "Sabun & Detergen", description: "Sabun mandi, sabun cuci, detergen" },
  { id: "8", name: "Snack & Makanan Ringan", description: "Keripik, biskuit, wafer" },
  { id: "9", name: "Rokok", description: "Rokok kretek, filter" },
  { id: "10", name: "Lain-lain", description: "Produk lainnya" },
];

export const products: Product[] = [
  { id: "1", name: "Beras Premium 5kg", sku: "BRS-001", barcode: "8991234567001", category: "Beras & Tepung", costPrice: 62000, sellingPrice: 68000, wholesalePrice: 65000, retailPrice: 68000, stock: 45, minStock: 10, unit: "Karung", unitConversions: [{ fromUnit: "Karung", toUnit: "Kg", conversionRate: 5 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "2", name: "Minyak Goreng Bimoli 2L", sku: "MYK-001", barcode: "8991234567002", category: "Minyak & Mentega", costPrice: 28000, sellingPrice: 32000, wholesalePrice: 30000, retailPrice: 32000, stock: 30, minStock: 10, unit: "Botol", unitConversions: [{ fromUnit: "Dus", toUnit: "Botol", conversionRate: 6 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "3", name: "Gula Pasir 1kg", sku: "GLA-001", barcode: "8991234567003", category: "Gula & Garam", costPrice: 14000, sellingPrice: 16000, wholesalePrice: 15000, retailPrice: 16000, stock: 8, minStock: 15, unit: "Kg", unitConversions: [{ fromUnit: "Karung", toUnit: "Kg", conversionRate: 50 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "4", name: "Indomie Goreng", sku: "MIE-001", barcode: "8991234567004", category: "Mie & Pasta", costPrice: 2800, sellingPrice: 3500, wholesalePrice: 3000, retailPrice: 3500, stock: 120, minStock: 50, unit: "Pcs", unitConversions: [{ fromUnit: "Dus", toUnit: "Pcs", conversionRate: 40 }, { fromUnit: "Pak", toUnit: "Pcs", conversionRate: 5 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "5", name: "Kopi Kapal Api 165g", sku: "KPI-001", barcode: "8991234567005", category: "Minuman", costPrice: 9500, sellingPrice: 12000, wholesalePrice: 11000, retailPrice: 12000, stock: 25, minStock: 10, unit: "Bungkus", unitConversions: [{ fromUnit: "Dus", toUnit: "Bungkus", conversionRate: 20 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "6", name: "Detergen Rinso 800g", sku: "DTG-001", barcode: "8991234567006", category: "Sabun & Detergen", costPrice: 12000, sellingPrice: 15000, wholesalePrice: 14000, retailPrice: 15000, stock: 5, minStock: 10, unit: "Pcs", unitConversions: [{ fromUnit: "Dus", toUnit: "Pcs", conversionRate: 12 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "7", name: "Kecap Manis ABC 600ml", sku: "KCP-001", barcode: "8991234567007", category: "Bumbu & Rempah", costPrice: 15000, sellingPrice: 18000, wholesalePrice: 17000, retailPrice: 18000, stock: 18, minStock: 8, unit: "Botol", unitConversions: [{ fromUnit: "Dus", toUnit: "Botol", conversionRate: 12 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "8", name: "Susu Indomilk 1L", sku: "SSU-001", barcode: "8991234567008", category: "Minuman", costPrice: 16000, sellingPrice: 19000, wholesalePrice: 18000, retailPrice: 19000, stock: 3, minStock: 10, unit: "Kotak", unitConversions: [{ fromUnit: "Dus", toUnit: "Kotak", conversionRate: 12 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "9", name: "Garam Halus 250g", sku: "GRM-001", barcode: "8991234567009", category: "Gula & Garam", costPrice: 3000, sellingPrice: 4500, wholesalePrice: 4000, retailPrice: 4500, stock: 40, minStock: 15, unit: "Bungkus", unitConversions: [{ fromUnit: "Dus", toUnit: "Bungkus", conversionRate: 24 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
  { id: "10", name: "Sambal ABC 135ml", sku: "SMB-001", barcode: "8991234567010", category: "Bumbu & Rempah", costPrice: 7500, sellingPrice: 9500, wholesalePrice: 9000, retailPrice: 9500, stock: 22, minStock: 10, unit: "Botol", unitConversions: [{ fromUnit: "Dus", toUnit: "Botol", conversionRate: 24 }], createdAt: "2024-01-15", updatedAt: "2024-03-20" },
];

export const suppliers: Supplier[] = [
  { id: "1", name: "PT Indofood Sukses Makmur", phone: "021-8888001", address: "Jl. Jendral Sudirman No.21, Jakarta", email: "order@indofood.co.id", debt: 5500000, createdAt: "2024-01-10" },
  { id: "2", name: "CV Sumber Rejeki", phone: "031-5556677", address: "Jl. Raya Darmo No.45, Surabaya", email: "info@sumberrejeki.com", debt: 0, createdAt: "2024-01-12" },
  { id: "3", name: "UD Maju Jaya", phone: "024-7778899", address: "Jl. Pemuda No.12, Semarang", debt: 2300000, createdAt: "2024-02-01" },
  { id: "4", name: "PT Unilever Indonesia", phone: "021-9998877", address: "Jl. BSD Boulevard, Tangerang", email: "supply@unilever.co.id", debt: 0, createdAt: "2024-01-15" },
  { id: "5", name: "CV Berkah Sentosa", phone: "022-3334455", address: "Jl. Asia Afrika No.88, Bandung", debt: 1800000, createdAt: "2024-02-20" },
];

export const customers: Customer[] = [
  { id: "1", name: "Bu Siti", phone: "0812-3456-7890", address: "Jl. Melati No.5, RT 03/RW 02", debt: 350000, createdAt: "2024-01-20" },
  { id: "2", name: "Pak Ahmad", phone: "0813-4567-8901", address: "Jl. Mawar No.12, RT 05/RW 01", debt: 0, createdAt: "2024-01-25" },
  { id: "3", name: "Bu Rina", phone: "0857-6789-0123", address: "Jl. Kenanga No.8, RT 01/RW 03", debt: 175000, createdAt: "2024-02-05" },
  { id: "4", name: "Pak Budi", phone: "0878-9012-3456", address: "Jl. Anggrek No.22, RT 02/RW 04", debt: 500000, createdAt: "2024-02-10" },
  { id: "5", name: "Bu Dewi", phone: "0821-0123-4567", address: "Jl. Dahlia No.15, RT 04/RW 02", debt: 0, createdAt: "2024-02-15" },
];

export const transactions: Transaction[] = [
  { id: "TRX-001", items: [{ productId: "4", productName: "Indomie Goreng", quantity: 5, unit: "Pcs", price: 3500, subtotal: 17500 }, { productId: "3", productName: "Gula Pasir 1kg", quantity: 2, unit: "Kg", price: 16000, subtotal: 32000 }], subtotal: 49500, discount: 0, total: 49500, paymentMethod: "cash", amountPaid: 50000, change: 500, cashier: "Kasir 1", isDebt: false, date: "2024-03-20T08:30:00" },
  { id: "TRX-002", items: [{ productId: "1", productName: "Beras Premium 5kg", quantity: 1, unit: "Karung", price: 68000, subtotal: 68000 }, { productId: "2", productName: "Minyak Goreng Bimoli 2L", quantity: 2, unit: "Botol", price: 32000, subtotal: 64000 }], subtotal: 132000, discount: 2000, total: 130000, paymentMethod: "transfer", amountPaid: 130000, change: 0, customerId: "1", customerName: "Bu Siti", cashier: "Kasir 1", isDebt: false, date: "2024-03-20T09:15:00" },
  { id: "TRX-003", items: [{ productId: "5", productName: "Kopi Kapal Api 165g", quantity: 3, unit: "Bungkus", price: 12000, subtotal: 36000 }, { productId: "6", productName: "Detergen Rinso 800g", quantity: 1, unit: "Pcs", price: 15000, subtotal: 15000 }, { productId: "9", productName: "Garam Halus 250g", quantity: 4, unit: "Bungkus", price: 4500, subtotal: 18000 }], subtotal: 69000, discount: 0, total: 69000, paymentMethod: "cash", amountPaid: 70000, change: 1000, cashier: "Admin", isDebt: false, date: "2024-03-20T10:00:00" },
  { id: "TRX-004", items: [{ productId: "7", productName: "Kecap Manis ABC 600ml", quantity: 2, unit: "Botol", price: 18000, subtotal: 36000 }, { productId: "10", productName: "Sambal ABC 135ml", quantity: 1, unit: "Botol", price: 9500, subtotal: 9500 }], subtotal: 45500, discount: 0, total: 45500, paymentMethod: "qris", amountPaid: 45500, change: 0, customerId: "3", customerName: "Bu Rina", cashier: "Kasir 1", isDebt: false, date: "2024-03-20T11:30:00" },
  { id: "TRX-005", items: [{ productId: "4", productName: "Indomie Goreng", quantity: 10, unit: "Pcs", price: 3500, subtotal: 35000 }, { productId: "8", productName: "Susu Indomilk 1L", quantity: 2, unit: "Kotak", price: 19000, subtotal: 38000 }], subtotal: 73000, discount: 3000, total: 70000, paymentMethod: "cash", amountPaid: 0, change: 0, customerId: "4", customerName: "Pak Budi", cashier: "Admin", isDebt: true, date: "2024-03-20T14:00:00" },
];

export const purchases: Purchase[] = [
  { id: "PO-001", supplierId: "1", supplierName: "PT Indofood Sukses Makmur", items: [{ productId: "4", productName: "Indomie Goreng", quantity: 5, unit: "Dus", price: 112000, subtotal: 560000 }, { productId: "5", productName: "Kopi Kapal Api 165g", quantity: 2, unit: "Dus", price: 190000, subtotal: 380000 }], totalAmount: 940000, paidAmount: 940000, status: "paid", date: "2024-03-15", notes: "Pesanan rutin mingguan" },
  { id: "PO-002", supplierId: "3", supplierName: "UD Maju Jaya", items: [{ productId: "1", productName: "Beras Premium 5kg", quantity: 20, unit: "Karung", price: 62000, subtotal: 1240000 }, { productId: "3", productName: "Gula Pasir 1kg", quantity: 1, unit: "Karung", price: 700000, subtotal: 700000 }], totalAmount: 1940000, paidAmount: 1000000, status: "partial", date: "2024-03-18" },
  { id: "PO-003", supplierId: "4", supplierName: "PT Unilever Indonesia", items: [{ productId: "6", productName: "Detergen Rinso 800g", quantity: 3, unit: "Dus", price: 144000, subtotal: 432000 }], totalAmount: 432000, paidAmount: 432000, status: "paid", date: "2024-03-19" },
];

export const stockMovements: StockMovement[] = [
  { id: "1", productId: "4", productName: "Indomie Goreng", type: "in", quantity: 200, unit: "Pcs", notes: "Pembelian dari Indofood", date: "2024-03-15", user: "Admin" },
  { id: "2", productId: "1", productName: "Beras Premium 5kg", type: "in", quantity: 20, unit: "Karung", notes: "Pembelian dari UD Maju Jaya", date: "2024-03-18", user: "Admin" },
  { id: "3", productId: "6", productName: "Detergen Rinso 800g", type: "in", quantity: 36, unit: "Pcs", notes: "Pembelian dari Unilever", date: "2024-03-19", user: "Admin" },
  { id: "4", productId: "4", productName: "Indomie Goreng", type: "out", quantity: 15, unit: "Pcs", notes: "Penjualan harian", date: "2024-03-20", user: "Kasir 1" },
  { id: "5", productId: "8", productName: "Susu Indomilk 1L", type: "adjustment", quantity: -2, unit: "Kotak", notes: "Produk kadaluarsa", date: "2024-03-20", user: "Admin" },
];

export const users: User[] = [
  { id: "1", name: "Pak Efge", email: "efge@warung.com", role: "owner", isActive: true, createdAt: "2024-01-01" },
  { id: "2", name: "Ahmad Fauzi", email: "ahmad@warung.com", role: "admin", isActive: true, createdAt: "2024-01-05" },
  { id: "3", name: "Sari Dewi", email: "sari@warung.com", role: "cashier", isActive: true, createdAt: "2024-01-10" },
  { id: "4", name: "Budi Santoso", email: "budi@warung.com", role: "cashier", isActive: false, createdAt: "2024-02-01" },
];

export const dashboardStats: DashboardStats = {
  todaySales: 364000,
  monthlyRevenue: 12850000,
  totalTransactions: 5,
  lowStockProducts: 3,
  customerDebt: 1025000,
  supplierDebt: 9600000,
};

export const salesChartData = [
  { name: "Sen", sales: 2400000 },
  { name: "Sel", sales: 1800000 },
  { name: "Rab", sales: 3200000 },
  { name: "Kam", sales: 2800000 },
  { name: "Jum", sales: 3500000 },
  { name: "Sab", sales: 4200000 },
  { name: "Min", sales: 1500000 },
];

export const monthlySalesData = [
  { name: "Jan", sales: 45000000 },
  { name: "Feb", sales: 52000000 },
  { name: "Mar", sales: 48000000 },
  { name: "Apr", sales: 61000000 },
  { name: "Mei", sales: 55000000 },
  { name: "Jun", sales: 67000000 },
];

export const topProducts = [
  { name: "Indomie Goreng", sold: 450, revenue: 1575000 },
  { name: "Beras Premium 5kg", sold: 120, revenue: 8160000 },
  { name: "Minyak Goreng 2L", sold: 95, revenue: 3040000 },
  { name: "Gula Pasir 1kg", sold: 88, revenue: 1408000 },
  { name: "Kopi Kapal Api", sold: 75, revenue: 900000 },
];
