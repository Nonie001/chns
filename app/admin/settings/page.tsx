'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSettingsFormSchema, type EmailSettingsFormInput } from '@/lib/validations';
import { Save, ArrowLeft, Loader2, CheckCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function EmailSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false); // ล็อคฟอร์มเมื่อมีการตั้งค่าแล้วหรือบันทึกสำเร็จ
  const [uploading, setUploading] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EmailSettingsFormInput>({
    resolver: zodResolver(emailSettingsFormSchema),
  });

  useEffect(() => {
    // ตรวจสอบ Login ก่อน
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/email');
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch settings: ${response.status} ${text}`);
      }
      const result = await response.json();

      if (result.data) {
        // ฟอร์มนี้มีเพียง 3 ช่องเท่านั้น
        reset({
          from_email: result.data.from_email,
          smtp_pass: result.data.smtp_pass,
          from_name: result.data.from_name,
          signer_name: result.data.signer_name || '',
          signer_title: result.data.signer_title || '',
          signature_image_url: result.data.signature_image_url || '',
        });
        setSignaturePreview(result.data.signature_image_url || null);
        // ถ้ามีข้อมูลแล้ว ให้ล็อคไม่ให้แก้ไขทันที ต้องกด "แก้ไขการตั้งค่า" และยืนยันก่อน
        setLocked(true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
  const res = await fetch('/api/settings/signature', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'อัพโหลดไม่สำเร็จ');
      const url = json.url as string;
      setSignaturePreview(url);
  // push to form state
  setValue('signature_image_url', url, { shouldDirty: true, shouldTouch: true });
    } catch (e) {
      alert('อัพโหลดลายเซ็นไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: EmailSettingsFormInput) => {
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Form data:', data);
    
    setSaving(true);
    setSuccess(false);

    try {
      // Auto-fill Gmail SMTP settings
      const emailData = {
        ...data,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: data.from_email, // Use sender email as SMTP user
      };

      console.log('Email data to send:', emailData);

      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to save settings: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Success result:', result);

      if (result.success) {
        console.log('Settings saved successfully!');
        setSuccess(true);
        setLocked(true); // บันทึกสำเร็จแล้วให้ล็อคฟอร์ม
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('API returned success=false:', result);
        throw new Error('Settings save failed');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // โครงกระดูกขณะโหลดข้อมูล (Skeleton)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-80 mt-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border p-6 md:p-8 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded mb-6" />
            <div className="space-y-6">
              <div>
                <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded" />
              </div>
              <div>
                <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded" />
              </div>
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-12 w-full bg-gray-200 rounded" />
              </div>
              <div className="h-12 w-full bg-gray-200 rounded mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">ตั้งค่า Email</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">ตั้งค่า Gmail สำหรับส่งใบเสร็จให้ผู้บริจาคอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-lg border p-4 sm:p-6 md:p-8 relative">
          {/* Saving overlay */}
          {saving && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10" aria-busy="true" aria-live="polite">
              <div className="flex items-center gap-3 text-gray-700">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="font-medium">กำลังบันทึกการตั้งค่า...</span>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">บันทึกการตั้งค่าสำเร็จ</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                ตั้งค่า Gmail สำหรับส่งใบเสร็จ
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('from_email')}
                    disabled={locked || saving}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="your-email@gmail.com"
                  />
                  {errors.from_email && (
                    <p className="mt-1.5 text-xs sm:text-sm text-red-600">{errors.from_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                    Gmail App Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('smtp_pass')}
                    disabled={locked || saving}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="••••••••••••••••"
                  />
                  {errors.smtp_pass && (
                    <p className="mt-1.5 text-xs sm:text-sm text-red-600">{errors.smtp_pass.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                    ชื่อองค์กร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('from_name')}
                    disabled={locked || saving}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="มูลนิธิการกุศล"
                  />
                  {errors.from_name && (
                    <p className="mt-1.5 text-xs sm:text-sm text-red-600">{errors.from_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">ลายเซ็นผู้มีอำนาจลงนาม (สำหรับใบเสร็จ)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">ชื่อผู้ลงนาม</label>
                  <input
                    type="text"
                    {...register('signer_name')}
                    disabled={locked || saving}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">ตำแหน่ง</label>
                  <input
                    type="text"
                    {...register('signer_title')}
                    disabled={locked || saving}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="เช่น ประธานมูลนิธิ"
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">รูปลายเซ็น (อัพโหลดหรือวาง URL)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={locked || uploading || saving}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSignatureUpload(f);
                    }}
                    className="text-sm w-full sm:w-auto"
                  />
                  <input
                    type="url"
                    {...register('signature_image_url')}
                    disabled={locked || saving}
                    className={`flex-1 w-full sm:min-w-[250px] px-3 sm:px-4 py-2.5 sm:py-3 ${locked ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                    placeholder="https://.../signature.png"
                    onBlur={(e) => setSignaturePreview(e.target.value || null)}
                  />
                </div>
                {signaturePreview && (
                  <div className="mt-3">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">ตัวอย่างลายเซ็น:</p>
                    <img src={signaturePreview} alt="signature" className="h-12 sm:h-16 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>วิธีสร้าง Gmail App Password (ละเอียด)</span>
              </h3>
              <div className="text-xs sm:text-sm text-blue-800 space-y-2">
                <p className="mb-2">App Password คือรหัส 16 ตัวอักษรที่ Google อนุญาตให้ใช้กับแอป/ระบบอัตโนมัติ แทนรหัสผ่านปกติ</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    เข้าบัญชี Google ของคุณที่
                    {' '}<a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com</a>
                  </li>
                  <li>
                    ไปที่แท็บ <span className="font-semibold">ความปลอดภัย (Security)</span>
                  </li>
                  <li>
                    เปิดการใช้งาน <span className="font-semibold">ยืนยันตัวตนแบบ 2 ขั้นตอน (2‑Step Verification)</span>
                    {' '}ถ้ายังไม่เปิด ให้ตั้งค่าให้เสร็จก่อน
                    {' '}<a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline">ลิงก์ไปหน้าความปลอดภัย</a>
                  </li>
                  <li>
                    เมื่อเปิด 2‑Step แล้ว ให้เข้าเมนู
                    {' '}<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">App passwords</a>
                  </li>
                  <li>
                    ที่หน้า App passwords เลือก:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><span className="font-semibold">Select app</span> เลือก <span className="font-semibold">Mail</span></li>
                      <li><span className="font-semibold">Select device</span> เลือก <span className="font-semibold">Other (Custom name)</span> แล้วพิมพ์เช่น <span className="italic">Receipt System</span></li>
                    </ul>
                  </li>
                  <li>
                    กด <span className="font-semibold">Generate</span> จะได้รหัส 16 ตัวอักษร (มีช่องว่างแบ่ง 4 ตัวต่อชุด)
                  </li>
                  <li>
                    คัดลอกรหัสนี้ (เฉพาะตัวอักษรและตัวเลข ไม่ต้องเว้นวรรค) มาวางในช่อง
                    {' '}<span className="font-semibold">Gmail App Password</span> ด้านบน แล้วกดบันทึก
                  </li>
                </ol>
                <div className="mt-3 text-blue-900">
                  <p className="font-medium">คำแนะนำ/ปัญหาที่พบบ่อย</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1 text-blue-800">
                    <li>หากไม่พบเมนู App passwords แปลว่าไม่ได้เปิด 2‑Step Verification หรือบัญชีถูกจำกัดโดยผู้ดูแลองค์กร</li>
                    <li>บัญชี Google Workspace บางองค์กรอาจปิด App passwords — ให้ติดต่อผู้ดูแลโดเมน</li>
                    <li>สำหรับ Gmail ปกติ ใช้ <span className="font-semibold">smtp.gmail.com</span> พอร์ต <span className="font-semibold">587</span> (STARTTLS) ซึ่งระบบตั้งค่าให้อัตโนมัติ</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 pt-4">
              {locked ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const ok = confirm('ต้องการแก้ไข/ตั้งค่าใหม่หรือไม่?');
                      if (ok) setLocked(false);
                    }}
                    className="flex-1 bg-gray-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-800 transition-colors"
                  >
                    แก้ไขการตั้งค่า
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">กำลังบันทึก...</span>
                      <span className="sm:hidden">บันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      บันทึกการตั้งค่า
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
