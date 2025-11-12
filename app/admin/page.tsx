'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Donation } from '@/types/database';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { downloadPDF } from '@/lib/pdf-generator';
import { 
  Eye, 
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewDonation, setPreviewDonation] = useState<Donation | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
      setFilteredDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Filter และ Search
  useEffect(() => {
    let filtered = donations;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Search by name, email, phone
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.first_name.toLowerCase().includes(search) ||
        d.last_name.toLowerCase().includes(search) ||
        d.email.toLowerCase().includes(search) ||
        d.phone.includes(search)
      );
    }

    setFilteredDonations(filtered);
  }, [searchTerm, statusFilter, donations]);

  const handleDownloadPDF = async (donation: Donation) => {
    try {
      // โหลด logo เป็น base64
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      // สร้างและดาวน์โหลด PDF พร้อม logo
      await downloadPDF(donation, logoBase64);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // ถ้า error ให้เปิด PDF ที่มีอยู่แทน
      if (donation.pdf_url) {
        window.open(donation.pdf_url, '_blank');
      } else {
        alert('เกิดข้อผิดพลาดในการสร้าง PDF');
      }
    }
  };

  const handleDelete = async (donation: Donation) => {
    if (!confirm(`คุณต้องการลบข้อมูลการบริจาคของ ${donation.title}${donation.first_name} ${donation.last_name} ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;

    setDeleting(donation.id);
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
      fetchDonations();
    } catch (error) {
      console.error('Error deleting donation:', error);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handlePreviewPDF = async (donation: Donation) => {
    try {
      setPreviewDonation(donation);
      
      // โหลด logo เป็น base64
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      // Import pdf-generator dynamically
      const { generatePDFBlob } = await import('@/lib/pdf-generator');
      
      // สร้าง PDF blob
      const pdfBlob = await generatePDFBlob(donation, logoBase64);
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('เกิดข้อผิดพลาดในการสร้างพรีวิว PDF');
    }
  };

  const closePreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setShowPreview(false);
    setPdfPreviewUrl(null);
    setPreviewDonation(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 md:h-20"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการการบริจาค</h1>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">รอตรวจสอบ:</span>
                    <span className="font-semibold text-yellow-600">
                      {donations.filter(d => d.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">อนุมัติแล้ว:</span>
                    <span className="font-semibold text-green-600">
                      {donations.filter(d => d.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">ยอดรวม:</span>
                    <span className="font-semibold text-gray-900">
                      {donations
                        .filter(d => d.status === 'approved')
                        .reduce((sum, d) => sum + d.amount, 0)
                        .toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchDonations}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {filteredDonations.length} / {donations.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 pb-8">

        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  ผู้บริจาค
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  ติดต่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'ไม่พบข้อมูลที่ค้นหา'
                      : 'ยังไม่มีข้อมูลการบริจาค'}
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(donation.created_at), 'dd/MM/yyyy', { locale: th })}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(donation.created_at), 'HH:mm', { locale: th })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {donation.title} {donation.first_name} {donation.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{donation.email}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{donation.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {donation.amount.toLocaleString('th-TH')} ฿
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(donation.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/donations/${donation.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {donation.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handlePreviewPDF(donation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="พรีวิว PDF"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(donation)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="ดาวน์โหลดใบเสร็จ"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(donation)}
                          disabled={deleting === donation.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="ลบข้อมูล"
                        >
                          {deleting === donation.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full h-full max-w-6xl max-h-screen p-6">
            <div className="bg-white rounded-lg shadow-xl h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    พรีวิวใบเสร็จรับเงินบริจาค
                  </h2>
                  {previewDonation && (
                    <p className="text-sm text-gray-600 mt-1">
                      {previewDonation.title}{previewDonation.first_name} {previewDonation.last_name} - {previewDonation.amount.toLocaleString('th-TH')} ฿
                    </p>
                  )}
                </div>
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ปิด
                </button>
              </div>
              
              {/* PDF Viewer */}
              <div className="flex-1 p-4 overflow-hidden">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border rounded-lg"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
