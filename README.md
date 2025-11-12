# Donation Receipt System (ระบบออกใบเสร็จการบริจาค)

ระบบจัดการการบริจาคและออกใบเสร็จอัตโนมัติ พร้อมส่งทางอีเมล โดยใช้ Next.js และ Supabase

## ✨ คุณสมบัติหลัก

- 📝 **ฟอร์มบริจาค**: ผู้บริจาคสามารถกรอกข้อมูลและอัพโหลดหลักฐานการบริจาค
- 👨‍💼 **Admin Dashboard**: แดชบอร์ดสำหรับตรวจสอบและอนุมัติการบริจาค
- 📄 **สร้าง PDF อัตโนมัติ**: สร้างใบเสร็จเป็นไฟล์ PDF
- 📧 **ส่งอีเมลอัตโนมัติ**: ส่งใบเสร็จไปยังอีเมลผู้บริจาคโดยอัตโนมัติ
- ⚙️ **ตั้งค่า Email**: Admin สามารถตั้งค่า SMTP สำหรับส่งอีเมล
- 🎨 **UI สวยงาม**: ออกแบบด้วย Tailwind CSS แบบเรียบง่ายและทันสมัย

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **PDF Generation**: pdfmake (รองรับภาษาไทย)
- **Email**: Nodemailer
- **Form Validation**: React Hook Form + Zod
- **Icons**: Lucide React

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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
│   │   │   └── approve/           # Approve donation
│   │   └── settings/
│   │       └── email/             # Email settings
│   ├── admin/                      # Admin Dashboard
│   │   ├── donations/[id]/        # Donation detail page
│   │   └── settings/              # Settings page
│   └── page.tsx                   # Donation form (main page)
├── lib/
│   ├── supabase.ts                # Supabase Client
│   ├── validations.ts             # Form Validations
│   ├── pdf-generator.ts           # PDF Generator (pdfmake)
│   └── email.ts                   # Email Service
├── types/
│   └── database.ts                # TypeScript Types
├── public/
│   └── logo.png                   # Organization logo
└── supabase-setup.sql             # Database Setup
```

## 🔒 ความปลอดภัย

⚠️ สำหรับการใช้งานจริงควรเพิ่ม:
- Authentication System
- Row Level Security
- API Rate Limiting
- Input Validation

## 📝 License

MIT License

---

Made with ❤️ for charity organizations
