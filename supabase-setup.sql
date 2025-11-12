-- ===================================
-- Donation Receipt System Database Setup
-- ===================================

-- 1. สร้างตาราง donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  receipt_url TEXT,
  pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. สร้างตาราง email_settings
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL,
  email_subject TEXT,
  email_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. สร้าง index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);

-- 4. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- 5. สร้าง Policy สำหรับ donations
-- หมายเหตุ: Policy เหล่านี้อนุญาตให้ทุกคนเข้าถึงได้ 
-- ในการใช้งานจริงควรเพิ่มการ authentication และจำกัดสิทธิ์

-- Policy สำหรับอ่านข้อมูล
DROP POLICY IF EXISTS "Enable read access for all users" ON donations;
CREATE POLICY "Enable read access for all users" 
ON donations FOR SELECT 
USING (true);

-- Policy สำหรับเพิ่มข้อมูล
DROP POLICY IF EXISTS "Enable insert access for all users" ON donations;
CREATE POLICY "Enable insert access for all users" 
ON donations FOR INSERT 
WITH CHECK (true);

-- Policy สำหรับอัพเดทข้อมูล
DROP POLICY IF EXISTS "Enable update access for all users" ON donations;
CREATE POLICY "Enable update access for all users" 
ON donations FOR UPDATE 
USING (true);

-- 6. สร้าง Policy สำหรับ email_settings
DROP POLICY IF EXISTS "Enable all access for email_settings" ON email_settings;
CREATE POLICY "Enable all access for email_settings" 
ON email_settings FOR ALL 
USING (true);

-- 7. สร้าง function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. สร้าง trigger สำหรับ donations
DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
CREATE TRIGGER update_donations_updated_at 
BEFORE UPDATE ON donations 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 9. สร้าง trigger สำหรับ email_settings
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at 
BEFORE UPDATE ON email_settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- Storage Bucket Policies
-- ===================================
-- หมายเหตุ: ต้องสร้าง bucket ชื่อ 'donations' ใน Supabase Storage ก่อน
-- จากนั้นรัน SQL ด้านล่างนี้

-- Policy สำหรับอัพโหลดไฟล์
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;
CREATE POLICY "Enable insert for all users" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'donations');

-- Policy สำหรับอ่านไฟล์
DROP POLICY IF EXISTS "Enable read for all users" ON storage.objects;
CREATE POLICY "Enable read for all users" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'donations');

-- Policy สำหรับอัพเดทไฟล์
DROP POLICY IF EXISTS "Enable update for all users" ON storage.objects;
CREATE POLICY "Enable update for all users" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'donations');

-- ===================================
-- ข้อมูลทดสอบ (Optional)
-- ===================================
-- ลบคอมเมนต์ด้านล่างเพื่อเพิ่มข้อมูลทดสอบ

/*
INSERT INTO donations (title, first_name, last_name, email, birth_date, phone, amount, status, receipt_url)
VALUES 
  ('นาย', 'สมชาย', 'ใจดี', 'somchai@example.com', '1990-01-15', '0812345678', 1000.00, 'pending', 'https://example.com/receipt1.jpg'),
  ('นาง', 'สมหญิง', 'ใจดี', 'somying@example.com', '1992-05-20', '0823456789', 2000.00, 'approved', 'https://example.com/receipt2.jpg'),
  ('นางสาว', 'สมใจ', 'มีสุข', 'somjai@example.com', '1995-08-10', '0834567890', 1500.00, 'pending', 'https://example.com/receipt3.jpg');
*/

-- ===================================
-- คำสั่งตรวจสอบข้อมูล
-- ===================================

-- ดูข้อมูลการบริจาคทั้งหมด
-- SELECT * FROM donations ORDER BY created_at DESC;

-- นับจำนวนการบริจาคแต่ละสถานะ
-- SELECT status, COUNT(*) as count, SUM(amount) as total_amount 
-- FROM donations 
-- GROUP BY status;

-- ดูการตั้งค่า email
-- SELECT * FROM email_settings;
