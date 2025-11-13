'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Donation } from '@/types/database';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
// Removed client-side pdf-generator; use server-rendered PDF for parity
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // ตรวจสอบ Login ก่อน
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
      return;
    }
    fetchDonation();
  }, [params.id, router]);

  const fetchDonation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setDonation(data);
    } catch (error) {
      console.error('Error fetching donation:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!donation || !confirm('คุณต้องการอนุมัติการบริจาคนี้ใช่หรือไม่?')) return;

    setProcessing(true);
    try {
      console.log('Starting approval for donation:', donation.id);
      
      const response = await fetch('/api/donations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId: donation.id }),
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to approve donation');
      }

      alert('อนุมัติและส่งใบเสร็จสำเร็จ');
      await fetchDonation();
    } catch (error) {
      console.error('Error approving donation:', error);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!donation || !confirm('คุณต้องการปฏิเสธการบริจาคนี้ใช่หรือไม่?')) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', donation.id);

      if (error) throw error;

      alert('ปฏิเสธการบริจาคสำเร็จ');
      router.push('/admin');
    } catch (error) {
      console.error('Error rejecting donation:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!donation) return;
    try {
      // ถ้ามีไฟล์ที่อัปโหลดไว้แล้ว ใช้อันนั้นเลย
      if (donation.pdf_url) {
        const a = document.createElement('a');
        a.href = donation.pdf_url;
        a.download = `receipt-${donation.id.substring(0, 8).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // ไม่งั้น สร้างจากเซิร์ฟเวอร์แล้วดาวน์โหลด
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      const res = await fetch('/api/receipts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation, logoBase64 }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Preview API error: ${res.status} ${text}`);
      }
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${donation.id.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (donation.pdf_url) {
        window.open(donation.pdf_url, '_blank');
      } else {
        alert('เกิดข้อผิดพลาดในการสร้าง/ดาวน์โหลด PDF');
      }
    }
  };

  const handlePreviewReceipt = () => {
    if (donation?.receipt_url) {
      window.open(donation.receipt_url, '_blank');
    }
  };

  const handlePreviewPDF = async () => {
    if (!donation) return;
    
    setProcessing(true);
    try {
      // โหลด logo
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      // ขอพรีวิว PDF จากเซิร์ฟเวอร์ เพื่อให้ตรงกับไฟล์ที่ส่งอีเมล
      const res = await fetch('/api/receipts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation, logoBase64 }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Preview API error: ${res.status} ${text}`);
      }
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!donation || !confirm('คุณต้องการลบข้อมูลการบริจาคนี้ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/donations/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId: donation.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete donation');
      }

      alert('ลบข้อมูลสำเร็จ');
      router.push('/admin');
    } catch (error) {
      console.error('Error deleting donation:', error);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'รอตรวจสอบ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธ',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลการบริจาค</p>
          <Link
            href="/admin"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับไปหน้าหลัก
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">รายละเอียดการบริจาค</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Status and Amount */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">สถานะ</div>
                {getStatusBadge(donation.status)}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-2">จำนวนเงิน</div>
                <div className="text-3xl font-bold text-green-600">
                  {donation.amount.toLocaleString('th-TH')} ฿
                </div>
              </div>
            </div>
          </div>

          {/* Donation Info */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลผู้บริจาค</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">ชื่อ-นามสกุล</div>
                <div className="text-gray-900 font-medium">
                  {donation.title} {donation.first_name} {donation.last_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">วันเกิด</div>
                <div className="text-gray-900">
                  {format(new Date(donation.birth_date), 'dd MMMM yyyy', { locale: th })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">อีเมล</div>
                <div className="text-gray-900">{donation.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">เบอร์โทรศัพท์</div>
                <div className="text-gray-900">{donation.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">วันที่บริจาค</div>
                <div className="text-gray-900">
                  {format(new Date(donation.created_at), 'dd MMMM yyyy เวลา HH:mm น.', { locale: th })}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Image */}
          {donation.receipt_url && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">หลักฐานการบริจาค</h2>
              <div className="relative">
                <img
                  src={donation.receipt_url}
                  alt="Receipt"
                  className="w-full max-w-md mx-auto rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handlePreviewReceipt}
                />
              </div>
              <button
                onClick={handlePreviewReceipt}
                className="mt-4 mx-auto flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                เปิดดูหลักฐานในหน้าใหม่
              </button>
            </div>
          )}

          {/* PDF Download */}
          {donation.status === 'approved' && donation.pdf_url && (
            <div className="p-6 border-b bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-900 text-lg">ใบเสร็จพร้อมแล้ว</div>
                  <div className="text-sm text-green-700 mt-1">
                    ดาวน์โหลดไฟล์ใบเสร็จ PDF
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  ดาวน์โหลด PDF
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {donation.status === 'pending' && (
            <div className="p-6 bg-gray-50 space-y-4">
              {/* Preview PDF */}
              <button
                onClick={handlePreviewPDF}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังสร้างตัวอย่าง PDF...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    ดูตัวอย่าง PDF ก่อนอนุมัติ
                  </>
                )}
              </button>

              {/* Approve/Reject */}
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      อนุมัติและส่งใบเสร็จ
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  ปฏิเสธ
                </button>
              </div>
            </div>
          )}

          {/* Delete Button (for all statuses) */}
          <div className="p-6 border-t">
            <button
              onClick={handleDelete}
              disabled={processing}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              ลบข้อมูลการบริจาค
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">ตัวอย่าง PDF ใบเสร็จ</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (pdfPreviewUrl) {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (pdfPreviewUrl) {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }
                }}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (pdfPreviewUrl) {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }
                  handleApprove();
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5 inline mr-2" />
                ยืนยันและอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
