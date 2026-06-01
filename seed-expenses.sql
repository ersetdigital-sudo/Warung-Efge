-- ============================================
-- TABEL BIAYA OPERASIONAL (EXPENSES)
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  category TEXT DEFAULT 'operasional',
  month TEXT, -- format: '2026-06'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Allow all') THEN
    CREATE POLICY "Allow all" ON expenses FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed data contoh (Juni 2026)
INSERT INTO expenses (name, amount, category, month) VALUES
('Gaji Karyawan', 1600000, 'operasional', '2026-06'),
('Listrik & Air', 780000, 'operasional', '2026-06'),
('Sewa Tempat', 333000, 'operasional', '2026-06'),
('Kantong & Packing', 125000, 'operasional', '2026-06'),
('Biaya Lain-lain', 74800, 'operasional', '2026-06');
