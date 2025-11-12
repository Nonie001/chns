// Database types for Supabase
export interface Donation {
  id: string;
  title: string; // คำนำหน้า
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  phone: string;
  receipt_url: string | null; // URL ของสลิป/หลักฐานการบริจาค
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  pdf_url: string | null; // URL ของใบเสร็จ PDF
  created_at: string;
  updated_at: string;
}

export interface EmailSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  created_at: string;
  updated_at: string;
}

export interface DonationFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phone: string;
  amount: number;
  receiptFile: File;
}
