import { z } from 'zod';

export const donationSchema = z.object({
  title: z.string().min(1, 'กรุณาเลือกคำนำหน้า'),
  first_name: z.string().min(1, 'กรุณากรอกชื่อ'),
  last_name: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  phone: z.string().min(10, 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง'),
  birth_date: z.string().min(1, 'กรุณาเลือกวันเกิด'),
  amount: z.number().min(1, 'กรุณากรอกจำนวนเงินที่ต้องการบริจาค')
});

export type DonationInput = z.infer<typeof donationSchema>;

export const emailSettingsSchema = z.object({
  smtp_host: z.string().min(1, 'กรุณากรอก SMTP Host'),
  smtp_port: z.number().min(1, 'กรุณากรอก SMTP Port'),
  smtp_user: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  smtp_pass: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
  from_email: z.string().email('กรุณากรอกอีเมลผู้ส่งที่ถูกต้อง'),
  from_name: z.string().min(1, 'กรุณากรอกชื่อผู้ส่ง'),
  // Optional: signer settings
  signer_name: z.string().optional(),
  signer_title: z.string().optional(),
  signature_image_url: z.string().url('URL ไม่ถูกต้อง').optional(),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

// Schema สำหรับหน้า Settings (ฟอร์มฝั่ง client) ที่กรอกแค่ 3 ช่อง
export const emailSettingsFormSchema = z.object({
  from_email: z.string().email('กรุณากรอกอีเมลผู้ส่งที่ถูกต้อง'),
  smtp_pass: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
  from_name: z.string().min(1, 'กรุณากรอกชื่อผู้ส่ง'),
  // Optional fields in form
  signer_name: z.string().optional(),
  signer_title: z.string().optional(),
  signature_image_url: z.string().url('URL ไม่ถูกต้อง').optional(),
});

export type EmailSettingsFormInput = z.infer<typeof emailSettingsFormSchema>;

