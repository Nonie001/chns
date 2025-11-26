'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { Upload, CheckCircle, Loader2, Mail, MapPin, Heart } from 'lucide-react';
import { donationSchema, type DonationInput } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { 
  getAllProvinces, 
  getAmphoesByProvince, 
  getDistrictsByAmphoe,
  parseAddressValue,
  type AddressOption 
} from '@/lib/thai-address';

// Dynamic import to avoid hydration issues
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-11 bg-gray-50 border border-gray-300 rounded-lg animate-pulse"></div>
  ),
});

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Address selection states
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedAmphoe, setSelectedAmphoe] = useState('');
  const [amphoeOptions, setAmphoeOptions] = useState<AddressOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<AddressOption[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<DonationInput>({
    resolver: zodResolver(donationSchema),
  });

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
    // Debug: ตรวจสอบข้อมูลจังหวัด
    const provinces = getAllProvinces();
    console.log('Available provinces:', provinces.length, provinces.slice(0, 5));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle province selection
  const handleProvinceChange = (newValue: unknown) => {
    const option = newValue as { value: string; label: string } | null;
    const provinceName = option?.value || '';
    console.log('Province selected:', provinceName);
    
    setSelectedProvince(provinceName);
    setSelectedAmphoe('');
    setValue('province', provinceName);
    setValue('district', '');
    setValue('address_detail', '');
    
    if (provinceName) {
      // Get amphoes for selected province
      const amphoes = getAmphoesByProvince(provinceName);
      console.log('Amphoes for', provinceName, ':', amphoes.length);
      setAmphoeOptions(amphoes);
      setDistrictOptions([]);
    } else {
      setAmphoeOptions([]);
      setDistrictOptions([]);
    }
  };

  // Handle amphoe selection
  const handleAmphoeChange = (newValue: unknown) => {
    const option = newValue as { value: string; label: string } | null;
    const amphoeName = option?.label || '';
    const amphoeValue = option?.value || '';
    setSelectedAmphoe(amphoeName);
    setValue('district', amphoeName);
    setValue('address_detail', '');
    
    if (amphoeName && selectedProvince) {
      // Get districts for selected amphoe and province
      const districts = getDistrictsByAmphoe(amphoeName, selectedProvince);
      setDistrictOptions(districts);
    } else {
      setDistrictOptions([]);
    }
  };

  // Handle district selection
  const handleDistrictChange = (newValue: unknown) => {
    const option = newValue as { value: string; label: string } | null;
    const districtValue = option?.value || '';
    const addressData = parseAddressValue(districtValue);
    if (addressData) {
      setValue('address_detail', `${addressData.district}, ${addressData.amphoe}, ${addressData.province} ${addressData.zipcode}`);
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
          province: data.province,
          district: data.district,
          address_detail: data.address_detail,
          phone: data.phone,
          amount: data.amount,
          purpose: data.purpose,
          receipt_url: publicUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
      reset();
      setReceiptFile(null);
      setPreviewUrl(null);
      setSelectedProvince('');
      setSelectedAmphoe('');
      setAmphoeOptions([]);
      setDistrictOptions([]);

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting donation:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Detailed error:', error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      } else {
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
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
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 relative">
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
          {/* Overlay while submitting */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3 text-gray-700">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                <span className="font-medium">กำลังอัปโหลดและบันทึกข้อมูล...</span>
              </div>
            </div>
          )}

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

          {/* ที่อยู่ */}
          <div className="space-y-4" suppressHydrationWarning>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* จังหวัด */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                {!isClient ? (
                  <div className="w-full h-11 bg-gray-50 border border-gray-300 rounded-lg animate-pulse"></div>
                ) : (
                  <Select
                    value={selectedProvince ? { value: selectedProvince, label: selectedProvince } : null}
                    onChange={handleProvinceChange}
                    options={getAllProvinces()}
                    placeholder="เลือกจังหวัด"
                    isClearable
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '44px',
                        backgroundColor: '#f9fafb',
                        borderColor: '#d1d5db',
                        fontSize: '16px'
                      })
                    }}
                  />
                )}
                {errors.province && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.province.message}</p>
                )}
              </div>

              {/* อำเภอ/เขต */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  อำเภอ/เขต <span className="text-red-500">*</span>
                </label>
                {!isClient ? (
                  <div className="w-full h-11 bg-gray-50 border border-gray-300 rounded-lg animate-pulse"></div>
                ) : (
                  <Select
                    value={selectedAmphoe ? amphoeOptions.find(o => o.label === selectedAmphoe) : null}
                    onChange={handleAmphoeChange}
                    options={amphoeOptions}
                    placeholder="เลือกอำเภอ/เขต"
                    isClearable
                    isDisabled={!selectedProvince}
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '44px',
                        backgroundColor: '#f9fafb',
                        borderColor: '#d1d5db',
                        fontSize: '16px'
                      })
                    }}
                  />
                )}
                {errors.district && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.district.message}</p>
                )}
              </div>
            </div>

            {/* ตำบล/แขวง */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                ตำบล/แขวง และรหัสไปรษณีย์
              </label>
              {!isClient ? (
                <div className="w-full h-11 bg-gray-50 border border-gray-300 rounded-lg animate-pulse"></div>
              ) : (
                <Select
                  options={districtOptions}
                  onChange={handleDistrictChange}
                  placeholder="เลือกตำบล/แขวง"
                  isClearable
                  isDisabled={districtOptions.length === 0}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '44px',
                      backgroundColor: '#f9fafb',
                      borderColor: '#d1d5db',
                      fontSize: '16px'
                    })
                  }}
                />
              )}
            </div>

            {/* รายละเอียดที่อยู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                รายละเอียดที่อยู่เพิ่มเติม <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('address_detail')}
                rows={3}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500 resize-none ${
                  districtOptions.length === 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                }`}
                placeholder="เลขที่บ้าน ชื่อหมู่บ้าน ซอย ถนน (ข้อมูลตำบลและรหัสไปรษณีย์จะถูกเลือกจากด้านบน)"
                disabled={districtOptions.length === 0}
              />
              {errors.address_detail && (
                <p className="mt-1.5 text-sm text-red-600">{errors.address_detail.message}</p>
              )}
              <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>เลือกจังหวัด → อำเภอ → ตำบล แล้วกรอกรายละเอียดเพิ่มเติม</span>
              </p>
            </div>
          </div>

          {/* เบอร์โทรศัพท์ */}
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

          {/* วัตถุประสงค์การบริจาค */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              วัตถุประสงค์การบริจาค <span className="text-red-500">*</span>
            </label>
            <select
              {...register('purpose')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-gray-900"
            >
              <option value="">เลือกวัตถุประสงค์การบริจาค</option>
              <option value="เพื่อช่วยเหลือปาเลสไตน์">เพื่อช่วยเหลือปาเลสไตน์</option>
              <option value="เพื่อช่วยเหลือภัยพิบัติฉุกเฉินภายในประเทศ">เพื่อช่วยเหลือภัยพิบัติฉุกเฉินภายในประเทศ</option>
              <option value="เพื่อช่วยเหลือผู้ลี้ภัยในประเทศ">เพื่อช่วยเหลือผู้ลี้ภัยในประเทศ</option>
              <option value="เพื่อซากาต">เพื่อซากาต</option>
              <option value="เพื่อการบริหาร">เพื่อการบริหาร</option>
              <option value="เพื่อสนับสนุนภารกิจ">เพื่อสนับสนุนภารกิจ</option>
              <option value="เพื่อช่วยเหลือภัยพิบัติฉุกเฉินต่างประเทศ">เพื่อช่วยเหลือภัยพิบัติฉุกเฉินต่างประเทศ</option>
              <option value="เพื่อช่วยเหลือผู้ลี้ภัยต่างประเทศ">เพื่อช่วยเหลือผู้ลี้ภัยต่างประเทศ</option>
              <option value="เพื่อโครงการที่อยู่อาศัยผู้ยากไร้">เพื่อโครงการที่อยู่อาศัยผู้ยากไร้</option>
              <option value="เพื่อช่วยเหลือพี่น้องซีเรีย">เพื่อช่วยเหลือพี่น้องซีเรีย</option>
            </select>
            {errors.purpose && (
              <p className="mt-1.5 text-sm text-red-600">{errors.purpose.message}</p>
            )}
            <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>เลือกวัตถุประสงค์ที่ท่านต้องการสนับสนุน</span>
            </p>
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