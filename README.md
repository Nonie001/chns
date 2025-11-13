# Donation Receipt System (ระบบออกใบเสร็จการบริจาค)

ระบบจัดการการบริจาคและออกใบเสร็จอัตโนมัติ พร้อมส่งทางอีเมล โดยใช้ Next.js และ Supabase

## ✨ คุณสมบัติหลัก

- 📝 **ฟอร์มบริจาค**: ผู้บริจาคสามารถกรอกข้อมูลและอัพโหลดหลักฐานการบริจาค
- 👨‍💼 **Admin Dashboard**: แดชบอร์ดสำหรับตรวจสอบและอนุมัติการบริจาค (มีระบบ Login)
- 📄 **สร้าง PDF อัตโนมัติ**: สร้างใบเสร็จเป็นไฟล์ PDF แบบทางการ เหมาะสำหรับยื่นภาษี
- 📧 **ส่งอีเมลอัตโนมัติ**: ส่งใบเสร็จไปยังอีเมลผู้บริจาคโดยอัตโนมัติ
- ✍️ **ลายเซ็นดิจิทัล**: อัพโหลดลายเซ็นและตั้งค่าผู้มีอำนาจลงนาม
- ⚙️ **ตั้งค่า Email**: Admin สามารถตั้งค่า SMTP สำหรับส่งอีเมล
- 🔒 **ระบบ Login**: ป้องกันการเข้าถึงหน้า Admin
- 🎨 **UI สวยงาม**: ออกแบบด้วย Tailwind CSS แบบเรียบง่ายและทันสมัย

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **PDF Generation**: Puppeteer (Server-side rendering)
- **Email**: Nodemailer
- **Form Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Authentication**: localStorage-based simple login

## 📋 ข้อกำหนดเบื้องต้น

- Node.js 18+ 
- npm หรือ yarn
- บัญชี Supabase (ฟรี)
- SMTP Email (Gmail, Outlook, หรืออื่นๆ)

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

#### สร้างโปรเจคใน Supabase

1. ไปที่ [supabase.com](https://supabase.com) และสร้างโปรเจคใหม่
2. ไปที่ **SQL Editor** และรันคำสั่ง SQL จากไฟล์ `supabase-setup.sql`

#### สร้าง Storage Bucket

1. ไปที่ **Storage** ใน Supabase Dashboard
2. สร้าง bucket ใหม่ชื่อ `donations`
3. ตั้งค่า bucket เป็น **Public**

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```bash
cp .env.local.example .env.local
```

แก้ไขค่าใน `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Login (เปลี่ยนเป็นรหัสที่ปลอดภัย)
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=YourSecurePassword123

# Email (Optional - สามารถตั้งค่าผ่าน Admin UI ได้)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=มูลนิธิการกุศล
```

### 4. เริ่มต้นใช้งาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 📁 โครงสร้างโปรเจค

```
btc/
├── app/
│   ├── api/                        # API Routes
│   │   ├── donations/
│   │   │   ├── approve/           # Approve & send email
│   │   │   └── delete/            # Delete donation
│   │   ├── receipts/
│   │   │   └── preview/           # Generate PDF preview
│   │   └── settings/
│   │       ├── email/             # Email settings
│   │       └── signature/         # Upload signature
│   ├── admin/                      # Admin Dashboard (Protected)
│   │   ├── donations/[id]/        # Donation detail page
│   │   ├── settings/              # Settings page
│   │   └── page.tsx               # Donations list
│   ├── login/                      # Login page
│   └── page.tsx                   # Donation form (main page)
├── lib/
│   ├── supabase.ts                # Supabase Client
│   ├── validations.ts             # Form Validations
│   ├── pdf-server.ts              # PDF Generator (Puppeteer)
│   └── email.ts                   # Email Service (Nodemailer)
├── types/
│   └── database.ts                # TypeScript Types
├── public/
│   └── logo.png                   # Organization logo
├── supabase-setup.sql             # Database Setup
├── supabase-migration-add-signer.sql  # Add signature fields
└── DEPLOYMENT.md                  # Deployment guide
```

## 🎯 การใช้งาน

### สำหรับผู้บริจาค
1. เข้าที่หน้าหลัก `/`
2. กรอกข้อมูลและอัพโหลดสลิปโอนเงิน
3. รอ Admin อนุมัติ
4. รับใบเสร็จทางอีเมล

### สำหรับ Admin
1. Login ที่ `/login` (default: admin/admin123)
2. ตรวจสอบรายการบริจาคที่ `/admin`
3. อนุมัติและส่งใบเสร็จ
4. ตั้งค่า Email และ Signature ที่ `/admin/settings`

## 🔒 ความปลอดภัย

⚠️ **สำคัญ:**
- เปลี่ยนรหัส Admin ก่อน deploy production
- ใช้ Gmail App Password (ไม่ใช่รหัสผ่านปกติ)
- เก็บ Service Role Key ให้ปลอดภัย
- ตั้งค่า Row Level Security บน Supabase

## 🚀 Deploy to Production

ดูคู่มือการ Deploy ฉบับสมบูรณ์ใน [DEPLOYMENT.md](./DEPLOYMENT.md)

**ขั้นตอนสั้น:**
1. Push โค้ดไป GitHub
2. Deploy บน Vercel
3. ตั้งค่า Environment Variables
4. ตั้งค่า Email Settings ผ่าน Admin UI

## 📝 License

MIT License

---

Made with ❤️ for charity organizations
