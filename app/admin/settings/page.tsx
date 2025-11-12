'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSettingsSchema, type EmailSettingsInput } from '@/lib/validations';
import { Save, ArrowLeft, Loader2, CheckCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailSettingsInput>({
    resolver: zodResolver(emailSettingsSchema),
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/email');
      const result = await response.json();

      if (result.data) {
        reset({
          smtp_host: result.data.smtp_host,
          smtp_port: result.data.smtp_port,
          smtp_user: result.data.smtp_user,
          smtp_pass: result.data.smtp_pass,
          from_email: result.data.from_email,
          from_name: result.data.from_name,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EmailSettingsInput) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ตั้งค่า Email</h1>
              <p className="text-gray-600 mt-1">ตั้งค่า Gmail สำหรับส่งใบเสร็จให้ผู้บริจาคอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border p-6 md:p-8">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">บันทึกการตั้งค่าสำเร็จ</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ตั้งค่า Gmail สำหรับส่งใบเสร็จ
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('from_email')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="your-email@gmail.com"
                  />
                  {errors.from_email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.from_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Gmail App Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('smtp_pass')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="••••••••••••••••"
                  />
                  {errors.smtp_pass && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.smtp_pass.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ชื่อองค์กร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('from_name')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="มูลนิธิการกุศล"
                  />
                  {errors.from_name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.from_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <span>วิธีสร้าง App Password</span>
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                ไปที่ <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com/apppasswords</a>
              </p>
              <p className="text-sm text-blue-700">
                สร้าง App Password แล้วนำมาใส่ในช่องด้านบน (ต้องเปิด 2-Step Verification ก่อน)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-medium text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    บันทึกการตั้งค่า
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
