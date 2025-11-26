-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. ลบ NOT NULL constraint จาก birth_date column (เพราะเราไม่ใช้แล้ว)
ALTER TABLE donations ALTER COLUMN birth_date DROP NOT NULL;

-- 2. เพิ่ม columns ใหม่
ALTER TABLE donations ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS district TEXT; 
ALTER TABLE donations ADD COLUMN IF NOT EXISTS address_detail TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS purpose TEXT;

-- 3. อัปเดตข้อมูลเดิมให้มีค่า default
UPDATE donations SET province = 'ไม่ระบุ' WHERE province IS NULL;
UPDATE donations SET district = 'ไม่ระบุ' WHERE district IS NULL;
UPDATE donations SET address_detail = 'ไม่ระบุ' WHERE address_detail IS NULL;  
UPDATE donations SET purpose = 'เพื่อการบริหาร' WHERE purpose IS NULL;

-- 4. ตรวจสอบโครงสร้าง table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- 4. ตรวจสอบข้อมูลตัวอย่าง
SELECT id, title, first_name, last_name, email, province, district, address_detail, purpose, created_at 
FROM donations 
LIMIT 5;

-- 5. ตรวจสอบ RLS (Row Level Security) policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'donations';

-- 6. หากต้องการปิด RLS ชั่วคราวเพื่อทดสอบ (ระวัง!)
-- ALTER TABLE donations DISABLE ROW LEVEL SECURITY;