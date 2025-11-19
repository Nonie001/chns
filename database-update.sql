-- Update database schema for donations table
-- Add new fields: address and purpose
-- Remove birth_date field

-- Add address column
ALTER TABLE donations 
ADD COLUMN address TEXT;

-- Add purpose column  
ALTER TABLE donations 
ADD COLUMN purpose TEXT;

-- For existing data, set default values
UPDATE donations 
SET address = 'ไม่ระบุ' 
WHERE address IS NULL;

UPDATE donations 
SET purpose = 'เพื่อการบริหาร' 
WHERE purpose IS NULL;

-- Make the new columns required for future inserts
-- (This is handled by the validation schema on the frontend)

-- Optional: If you want to remove birth_date column completely
-- ALTER TABLE donations DROP COLUMN birth_date;

-- View current table structure
-- \d donations;