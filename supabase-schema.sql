-- Warung Efge Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable RLS (Row Level Security) will be configured after tables

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  category TEXT,
  cost_price INTEGER DEFAULT 0,
  selling_price INTEGER DEFAULT 0,
  wholesale_price INTEGER DEFAULT 0,
  retail_price INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  expiry_date DATE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  debt INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  debt INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  amount_paid INTEGER DEFAULT 0,
  change_amount INTEGER DEFAULT 0,
  is_debt BOOLEAN DEFAULT FALSE,
  cashier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  price INTEGER DEFAULT 0,
  subtotal INTEGER DEFAULT 0
);

-- Purchases (from suppliers)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT,
  total_amount INTEGER DEFAULT 0,
  paid_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  price INTEGER DEFAULT 0,
  subtotal INTEGER DEFAULT 0
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'opname'
  quantity INTEGER DEFAULT 0,
  unit TEXT,
  notes TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt Payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  amount INTEGER DEFAULT 0,
  method TEXT DEFAULT 'cash',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'cashier', -- 'owner', 'admin', 'cashier'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow all for now with anon key)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated and anon users (for development)
-- In production, restrict these based on auth
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debt_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);

-- Insert initial seed data
INSERT INTO categories (name, description) VALUES
  ('Beras & Tepung', 'Beras, tepung terigu, tepung beras'),
  ('Minyak & Mentega', 'Minyak goreng, mentega, margarin'),
  ('Gula & Garam', 'Gula pasir, gula merah, garam'),
  ('Minuman', 'Kopi, teh, susu, sirup'),
  ('Mie & Pasta', 'Mie instan, bihun, spaghetti'),
  ('Bumbu & Rempah', 'Kecap, saus, sambal, bumbu masak'),
  ('Sabun & Detergen', 'Sabun mandi, sabun cuci, detergen'),
  ('Snack & Makanan Ringan', 'Keripik, biskuit, wafer'),
  ('Rokok', 'Rokok kretek, filter'),
  ('Lain-lain', 'Produk lainnya');

INSERT INTO products (name, sku, barcode, category, cost_price, selling_price, wholesale_price, retail_price, stock, min_stock, unit) VALUES
  ('Beras Premium 5kg', 'BRS-001', '8991234567001', 'Beras & Tepung', 62000, 68000, 65000, 68000, 45, 10, 'Karung'),
  ('Minyak Goreng Bimoli 2L', 'MYK-001', '8991234567002', 'Minyak & Mentega', 28000, 32000, 30000, 32000, 30, 10, 'Botol'),
  ('Gula Pasir 1kg', 'GLA-001', '8991234567003', 'Gula & Garam', 14000, 16000, 15000, 16000, 8, 15, 'Kg'),
  ('Indomie Goreng', 'MIE-001', '8991234567004', 'Mie & Pasta', 2800, 3500, 3000, 3500, 120, 50, 'Pcs'),
  ('Kopi Kapal Api 165g', 'KPI-001', '8991234567005', 'Minuman', 9500, 12000, 11000, 12000, 25, 10, 'Bungkus'),
  ('Detergen Rinso 800g', 'DTG-001', '8991234567006', 'Sabun & Detergen', 12000, 15000, 14000, 15000, 5, 10, 'Pcs'),
  ('Kecap Manis ABC 600ml', 'KCP-001', '8991234567007', 'Bumbu & Rempah', 15000, 18000, 17000, 18000, 18, 8, 'Botol'),
  ('Susu Indomilk 1L', 'SSU-001', '8991234567008', 'Minuman', 16000, 19000, 18000, 19000, 3, 10, 'Kotak'),
  ('Garam Halus 250g', 'GRM-001', '8991234567009', 'Gula & Garam', 3000, 4500, 4000, 4500, 40, 15, 'Bungkus'),
  ('Sambal ABC 135ml', 'SMB-001', '8991234567010', 'Bumbu & Rempah', 7500, 9500, 9000, 9500, 22, 10, 'Botol');

INSERT INTO customers (name, phone, address, debt) VALUES
  ('Bu Siti', '0812-3456-7890', 'Jl. Melati No.5, RT 03/RW 02', 350000),
  ('Pak Ahmad', '0813-4567-8901', 'Jl. Mawar No.12, RT 05/RW 01', 0),
  ('Bu Rina', '0857-6789-0123', 'Jl. Kenanga No.8, RT 01/RW 03', 175000),
  ('Pak Budi', '0878-9012-3456', 'Jl. Anggrek No.22, RT 02/RW 04', 500000),
  ('Bu Dewi', '0821-0123-4567', 'Jl. Dahlia No.15, RT 04/RW 02', 0);

INSERT INTO suppliers (name, phone, address, email, debt) VALUES
  ('PT Indofood Sukses Makmur', '021-8888001', 'Jl. Jendral Sudirman No.21, Jakarta', 'order@indofood.co.id', 5500000),
  ('CV Sumber Rejeki', '031-5556677', 'Jl. Raya Darmo No.45, Surabaya', 'info@sumberrejeki.com', 0),
  ('UD Maju Jaya', '024-7778899', 'Jl. Pemuda No.12, Semarang', NULL, 2300000),
  ('PT Unilever Indonesia', '021-9998877', 'Jl. BSD Boulevard, Tangerang', 'supply@unilever.co.id', 0),
  ('CV Berkah Sentosa', '022-3334455', 'Jl. Asia Afrika No.88, Bandung', NULL, 1800000);

INSERT INTO users (name, email, role, is_active) VALUES
  ('Pak Efge', 'efge@warung.com', 'owner', true),
  ('Ahmad Fauzi', 'ahmad@warung.com', 'admin', true),
  ('Sari Dewi', 'sari@warung.com', 'cashier', true),
  ('Budi Santoso', 'budi@warung.com', 'cashier', false);
