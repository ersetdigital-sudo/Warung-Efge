-- ============================================
-- DEMO PRODUCTS SEED DATA
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Buat tabel product_units jika belum ada
CREATE TABLE IF NOT EXISTS product_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  conversion INTEGER DEFAULT 1,
  stock INTEGER DEFAULT 0,
  buy_price INTEGER DEFAULT 0,
  sell_price INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_units' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON product_units FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Hapus produk demo lama
DELETE FROM product_units WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'DEMO-%');
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'DEMO-%');
DELETE FROM transaction_items WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'DEMO-%');
DELETE FROM products WHERE sku LIKE 'DEMO-%';

-- ============================================
-- INSERT PRODUK DEMO (15 produk)
-- ============================================

INSERT INTO products (name, sku, barcode, category, cost_price, selling_price, wholesale_price, retail_price, stock, min_stock, unit, has_bulk_unit, bulk_unit, bulk_conversion, retail_unit)
VALUES
('Sampoerna Mild 16', 'DEMO-001', '8999909090001', 'Rokok', 24000, 27000, 270000, 2000, 96, 20, 'Bungkus', true, 'Slop', 10, 'Batang'),
('Gudang Garam Merah', 'DEMO-002', '8999909090002', 'Rokok', 20000, 22500, 225000, 2000, 120, 20, 'Bungkus', true, 'Slop', 10, 'Batang'),
('Indomie Goreng', 'DEMO-003', '8999909090003', 'Mie & Pasta', 2800, 3500, 105000, 3500, 200, 50, 'Pcs', true, 'Karton', 30, NULL),
('Aqua 600ml', 'DEMO-004', '8999909090004', 'Minuman', 2500, 3200, 72000, 3200, 180, 30, 'Botol', true, 'Dus', 24, NULL),
('Beras Premium 5kg', 'DEMO-005', '8999909090005', 'Beras & Tepung', 62000, 68000, 650000, 68000, 42, 10, 'Karung', true, 'Sak', 10, NULL),
('Minyak Goreng Bimoli 2L', 'DEMO-006', '8999909090006', 'Minyak & Mentega', 28000, 32000, 360000, 32000, 36, 10, 'Botol', true, 'Karton', 12, NULL),
('Gula Pasir 1kg', 'DEMO-007', '8999909090007', 'Gula & Garam', 14000, 16000, 390000, 16000, 50, 15, 'Kg', true, 'Karung 25kg', 25, NULL),
('Sunlight 400ml', 'DEMO-008', '8999909090008', 'Sabun & Detergen', 7500, 9500, 192000, 9500, 48, 12, 'Botol', true, 'Dus', 24, NULL),
('Teh Pucuk Harum 350ml', 'DEMO-009', '8999909090009', 'Minuman', 2800, 3500, 72000, 3500, 120, 24, 'Botol', true, 'Karton', 24, NULL),
('Kopi Kapal Api Sachet', 'DEMO-010', '8999909090010', 'Minuman', 1000, 1500, 30000, 1500, 200, 50, 'Sachet', true, 'Renceng', 10, NULL),
('Rinso Anti Noda 800g', 'DEMO-011', '8999909090011', 'Sabun & Detergen', 12000, 15000, 144000, 15000, 24, 8, 'Pcs', true, 'Dus', 12, NULL),
('Chitato Sapi Panggang 68g', 'DEMO-012', '8999909090012', 'Snack & Makanan Ringan', 7000, 9000, 90000, 9000, 60, 12, 'Pcs', true, 'Karton', 12, NULL),
('ABC Kecap Manis 600ml', 'DEMO-013', '8999909090013', 'Bumbu & Rempah', 15000, 18000, 200000, 18000, 18, 6, 'Botol', true, 'Dus', 12, NULL),
('Garam Halus Cap Kapal 250g', 'DEMO-014', '8999909090014', 'Gula & Garam', 3000, 4500, 4000, 4500, 40, 15, 'Bungkus', false, NULL, NULL, NULL),
('Susu Ultra Milk 1L', 'DEMO-015', '8999909090015', 'Minuman', 14000, 17000, 192000, 17000, 24, 6, 'Kotak', true, 'Dus', 12, NULL);

-- ============================================
-- INSERT PRODUCT UNITS (multi-satuan)
-- ============================================

-- Sampoerna Mild 16: Slop > Bungkus > Batang
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 3, 'Slop', 10, 0, 240000, 270000 FROM products WHERE sku = 'DEMO-001';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Bungkus', 1, 0, 24000, 27000 FROM products WHERE sku = 'DEMO-001';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Batang', 0, 0, 1500, 2000 FROM products WHERE sku = 'DEMO-001';

-- Gudang Garam Merah: Slop > Bungkus > Batang
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 3, 'Slop', 10, 0, 200000, 225000 FROM products WHERE sku = 'DEMO-002';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Bungkus', 1, 0, 20000, 22500 FROM products WHERE sku = 'DEMO-002';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Batang', 0, 0, 1500, 2000 FROM products WHERE sku = 'DEMO-002';

-- Indomie Goreng: Karton > Pcs
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Karton', 30, 0, 84000, 105000 FROM products WHERE sku = 'DEMO-003';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Pcs', 1, 0, 2800, 3500 FROM products WHERE sku = 'DEMO-003';

-- Aqua 600ml: Dus > Botol
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Dus', 24, 0, 60000, 72000 FROM products WHERE sku = 'DEMO-004';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Botol', 1, 0, 2500, 3200 FROM products WHERE sku = 'DEMO-004';

-- Beras Premium: Sak > Karung
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Sak', 10, 0, 620000, 650000 FROM products WHERE sku = 'DEMO-005';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Karung', 1, 0, 62000, 68000 FROM products WHERE sku = 'DEMO-005';

-- Minyak Goreng: Karton > Botol
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Karton', 12, 0, 336000, 360000 FROM products WHERE sku = 'DEMO-006';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Botol', 1, 0, 28000, 32000 FROM products WHERE sku = 'DEMO-006';

-- Gula Pasir: Karung 25kg > Kg
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Karung 25kg', 25, 0, 350000, 390000 FROM products WHERE sku = 'DEMO-007';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Kg', 1, 0, 14000, 16000 FROM products WHERE sku = 'DEMO-007';

-- Sunlight: Dus > Botol
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Dus', 24, 0, 180000, 192000 FROM products WHERE sku = 'DEMO-008';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Botol', 1, 0, 7500, 9500 FROM products WHERE sku = 'DEMO-008';

-- Teh Pucuk: Karton > Botol
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Karton', 24, 0, 67200, 72000 FROM products WHERE sku = 'DEMO-009';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Botol', 1, 0, 2800, 3500 FROM products WHERE sku = 'DEMO-009';

-- Kopi Kapal Api: Renceng > Sachet
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Renceng', 10, 0, 10000, 15000 FROM products WHERE sku = 'DEMO-010';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Sachet', 1, 0, 1000, 1500 FROM products WHERE sku = 'DEMO-010';

-- Rinso: Dus > Pcs
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Dus', 12, 0, 144000, 168000 FROM products WHERE sku = 'DEMO-011';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Pcs', 1, 0, 12000, 15000 FROM products WHERE sku = 'DEMO-011';

-- Chitato: Karton > Pcs
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Karton', 12, 0, 84000, 90000 FROM products WHERE sku = 'DEMO-012';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Pcs', 1, 0, 7000, 9000 FROM products WHERE sku = 'DEMO-012';

-- ABC Kecap: Dus > Botol
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Dus', 12, 0, 180000, 200000 FROM products WHERE sku = 'DEMO-013';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Botol', 1, 0, 15000, 18000 FROM products WHERE sku = 'DEMO-013';

-- Susu Ultra: Dus > Kotak
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 2, 'Dus', 12, 0, 168000, 192000 FROM products WHERE sku = 'DEMO-015';
INSERT INTO product_units (product_id, level, name, conversion, stock, buy_price, sell_price)
SELECT id, 1, 'Kotak', 1, 0, 14000, 17000 FROM products WHERE sku = 'DEMO-015';

-- ============================================
-- DONE! Refresh halaman Kasir untuk melihat produk demo
-- ============================================
