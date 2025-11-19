// Database types for Supabase
export interface Donation {
  id: string;
  title: string; // คำนำหน้า
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  phone: string;
  receipt_url: string | null; // URL ของสลิป/หลักฐานการบริจาค
  amount: number;
  purpose: string; // วัตถุประสงค์การบริจาค
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
  // Optional receipt/signature settings
  signer_name?: string;
  signer_title?: string;
  signature_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DonationFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  amount: number;
  purpose: string;
  receiptFile: File;
}
