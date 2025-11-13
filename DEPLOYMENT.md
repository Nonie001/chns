# คู่มือการ Deploy บน Vercel

## ✅ สถานะความพร้อม
- ✅ Build สำเร็จ
- ✅ TypeScript ไม่มี Error
- ✅ ทุก Route ทำงานได้
- ✅ Environment Variables ครบถ้วน

## 📋 Environment Variables ที่ต้องตั้งค่าบน Vercel

### 1. Supabase (จำเป็น)
```
NEXT_PUBLIC_SUPABASE_URL=https://jjkbswzvjpktfwvdzawv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Admin Login (จำเป็น - แนะนำเปลี่ยนรหัสผ่าน)
```
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=YourSecurePassword123!
```

### 3. Email Configuration (Optional - สามารถตั้งค่าผ่าน Admin UI ได้)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=มูลนิธิการกุศล
```

## 🚀 ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository
```bash
git add .
git commit -m "Ready for deployment"
git push origin master
```

### 2. Deploy บน Vercel

1. ไปที่ https://vercel.com/new
2. Import GitHub repository ของคุณ
3. **ตั้งค่า Environment Variables** ใน Vercel Dashboard:
   - ไปที่ Settings > Environment Variables
   - เพิ่มตัวแปรทั้งหมดตามด้านบน
   - เลือก Environment: Production, Preview, Development (ทั้งหมด)

4. Deploy!

### 3. หลัง Deploy สำเร็จ

1. **ตั้งค่า Email Settings:**
   - ไปที่ `https://your-domain.vercel.app/login`
   - Login ด้วย admin username/password
   - ไปที่ Settings และตั้งค่า Email

2. **ตั้งค่า Signature (ถ้าต้องการ):**
   - Upload รูปลายเซ็น
   - กรอกชื่อและตำแหน่งผู้ลงนาม

3. **ทดสอบระบบ:**
   - ทดสอบ Login/Logout
   - ทดสอบอนุมัติการบริจาค
   - ตรวจสอบ PDF Preview
   - ทดสอบส่ง Email

## ⚠️ ข้อควรระวัง

### 1. Admin Password
**สำคัญมาก:** เปลี่ยนรหัสผ่าน Admin ให้ปลอดภัยก่อน Deploy Production
```
NEXT_PUBLIC_ADMIN_PASSWORD=ใช้รหัสที่ยาวและซับซ้อน
```

### 2. Gmail App Password
- ถ้าใช้ Gmail ต้องสร้าง **App Password** (ไม่ใช่รหัสผ่านปกติ)
- วิธีสร้าง: Google Account > Security > 2-Step Verification > App passwords

### 3. Supabase Service Role Key
- เก็บรักษาความปลอดภัย (อย่า commit ลง GitHub)
- ใช้สำหรับ upload ไฟล์และเข้าถึง Storage

### 4. Storage Buckets (Supabase)
ตรวจสอบว่ามี Buckets เหล่านี้:
- `donations` - สำหรับเก็บสลิปการโอน
- `assets` - สำหรับเก็บรูปลายเซ็น

## 🔒 Security Best Practices

1. **Admin Credentials:**
   - ใช้รหัสผ่านที่แข็งแรง (ตัวอักษรผสมตัวเลขและสัญลักษณ์)
   - อย่าใช้ admin/admin123 ใน Production

2. **Environment Variables:**
   - ตั้งค่าบน Vercel Dashboard อย่างเดียว
   - อย่า commit `.env.local` ลง Git (มี `.gitignore` อยู่แล้ว)

3. **Database:**
   - ใช้ Row Level Security (RLS) บน Supabase
   - จำกัดสิทธิ์การเข้าถึงตาม role

## 📊 Routes ที่ใช้งาน

### Public Routes
- `/` - หน้าหลัก (ฟอร์มบริจาค)
- `/login` - หน้า Login Admin

### Protected Admin Routes (ต้อง Login)
- `/admin` - รายการการบริจาคทั้งหมด
- `/admin/donations/[id]` - รายละเอียดการบริจาค
- `/admin/settings` - ตั้งค่า Email และ Signature

### API Routes
- `/api/donations/approve` - อนุมัติและส่ง Email
- `/api/donations/delete` - ลบข้อมูล
- `/api/receipts/preview` - สร้าง PDF Preview
- `/api/settings/email` - จัดการ Email Settings
- `/api/settings/signature` - Upload รูปลายเซ็น

## 🐛 Troubleshooting

### Build ล้มเหลว
```bash
# ทดสอบ build ใน local ก่อน
npm run build
```

### PDF ไม่แสดง
- ตรวจสอบว่า Puppeteer ทำงานบน Vercel (ควรใช้ Serverless Function)
- อาจต้องเพิ่ม config สำหรับ Puppeteer บน Vercel

### Email ส่งไม่ได้
- ตรวจสอบ SMTP Settings
- Gmail: ต้องใช้ App Password
- ตรวจสอบ console logs ใน Vercel Dashboard

### Upload รูปไม่ได้
- ตรวจสอบ SUPABASE_SERVICE_ROLE_KEY
- ตรวจสอบว่า Bucket มีสิทธิ์ public access

## 📞 Support
หากมีปัญหา ตรวจสอบ:
1. Vercel Logs: Dashboard > Deployments > [your deployment] > Functions
2. Browser Console: F12 > Console tab
3. Network Tab: ตรวจสอบ API calls ที่ fail
