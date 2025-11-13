-- Migration: Add signer fields to email_settings table
-- วันที่: 2025-11-13
-- คำอธิบาย: เพิ่มคอลัมน์สำหรับข้อมูลลายเซ็นในใบเสร็จ

-- เพิ่ม 3 คอลัมน์ใหม่ในตาราง email_settings
ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS signer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS signer_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS signature_image_url TEXT;

-- ตรวจสอบว่าเพิ่มสำเร็จ (optional - สำหรับ debug)
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'email_settings' 
-- AND column_name IN ('signer_name', 'signer_title', 'signature_image_url');
