'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, CheckCircle, Loader2, Mail } from 'lucide-react';
import { donationSchema, type DonationInput } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DonationInput>({
    resolver: zodResolver(donationSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data: DonationInput) => {
    if (!receiptFile) {
      alert('กรุณาแนบหลักฐานการบริจาค');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt file to Supabase Storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('donations')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('donations')
        .getPublicUrl(filePath);

      // Insert donation record
      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          title: data.title,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          birth_date: data.birth_date,
          phone: data.phone,
          amount: data.amount,
          receipt_url: publicUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
      reset();
      setReceiptFile(null);
      setPreviewUrl(null);

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting donation:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ส่งข้อมูลสำเร็จ!
          </h2>
          <p className="text-gray-600 mb-6">
            ขอบคุณสำหรับการบริจาค<br />
            เจ้าหน้าที่จะตรวจสอบและส่งใบเสร็จไปยังอีเมลของคุณ
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            บริจาคอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-24 md:h-32 mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            แบบฟอร์มบริจาค
          </h1>
          <p className="text-gray-600">
            กรุณากรอกข้อมูลและแนบหลักฐานการบริจาค
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* คำนำหน้า */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              คำนำหน้า <span className="text-red-500">*</span>
            </label>
            <select
              {...register('title')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900"
            >
              <option value="">เลือกคำนำหน้า</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* ชื่อ - นามสกุล */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('first_name')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                placeholder="ชื่อ"
              />
              {errors.first_name && (
                <p className="mt-1.5 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('last_name')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                placeholder="นามสกุล"
              />
              {errors.last_name && (
                <p className="mt-1.5 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>ใบเสร็จรับเงินจะถูกส่งไปที่อีเมลของคุณ</span>
            </p>
          </div>

          {/* วันเกิด - เบอร์โทร */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                วันเกิด <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('birth_date')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900"
              />
              {errors.birth_date && (
                <p className="mt-1.5 text-sm text-red-600">{errors.birth_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                placeholder="0812345678"
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* จำนวนเงิน */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              จำนวนเงินที่บริจาค (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
              placeholder="1000"
              min="1"
            />
            {errors.amount && (
              <p className="mt-1.5 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* แนบหลักฐาน */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              แนบหลักฐานการบริจาค / สลิปโอนเงิน <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex justify-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors bg-white">
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <label className="cursor-pointer">
                  <span className="text-green-600 font-medium hover:text-green-700">อัพโหลดไฟล์</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">หรือลากไฟล์มาวาง</p>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, PDF (สูงสุด 10MB)</p>
              </div>
            </div>
            {previewUrl && receiptFile && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">✓ {receiptFile.name}</p>
                {receiptFile.type.startsWith('image/') && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                กำลังส่งข้อมูล...
              </>
            ) : (
              'ส่งข้อมูลการบริจาค'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
