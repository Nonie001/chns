'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Donation } from '@/types/database';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
// Removed client-side pdf-generator; we now use server-rendered PDFs for parity
import { 
  Eye, 
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewDonation, setPreviewDonation] = useState<Donation | null>(null);

  useEffect(() => {
    // ตรวจสอบ Login ก่อน
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
      return;
    }
    fetchDonations();
  }, [router]);

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

  const handleLogout = () => {
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminLoginTime');
      router.push('/login');
    }
  };

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
      // ถ้ามีไฟล์ที่อัปโหลดไว้แล้ว ใช้อันนั้นเลยเพื่อความเร็ว
      if (donation.pdf_url) {
        const a = document.createElement('a');
        a.href = donation.pdf_url;
        a.download = `receipt-${donation.id.substring(0, 8).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // ไม่งั้นให้สร้างจากเซิร์ฟเวอร์ (หน้าตาเหมือนส่งอีเมล 100%) แล้วดาวน์โหลด
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
      setPreviewingId(donation.id);
      setPreviewDonation(donation);
      // โหลด logo เป็น base64
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      // ขอพรีวิว PDF จากเซิร์ฟเวอร์ เพื่อให้หน้าตาเหมือนอีเมล 100%
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
      console.error('Error generating preview:', error);
      alert('เกิดข้อผิดพลาดในการสร้างพรีวิว PDF');
    } finally {
      setPreviewingId(null);
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
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      rejected: 'bg-rose-100 text-rose-800 border border-rose-200',
    };

    const labels = {
      pending: 'รอตรวจสอบ',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธ',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-6 space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-12 sm:h-14 flex-shrink-0"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  ระบบจัดการบริจาค
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-700">
                  <span>รอตรวจสอบ: <strong className="text-amber-700">{donations.filter(d => d.status === 'pending').length}</strong></span>
                  <span>อนุมัติแล้ว: <strong className="text-emerald-700">{donations.filter(d => d.status === 'approved').length}</strong></span>
                  <span className="hidden sm:inline">ยอดรวม: <strong className="text-slate-900">{donations.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0).toLocaleString('th-TH')} ฿</strong></span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-sm border border-slate-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">ตั้งค่า</span>
              </Link>
              <button
                onClick={fetchDonations}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-500"
            />
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
            <span className="text-sm text-slate-700 whitespace-nowrap font-medium">
              {filteredDonations.length} / {donations.length}
            </span>
          </div>
        </div>
      </div>

      {/* Table/Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        {/* Desktop Table */}
        <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">วันที่</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ผู้บริจาค</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ติดต่อ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">จำนวน</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">สถานะ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-600 text-sm font-medium">
                    {searchTerm || statusFilter !== 'all' ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลการบริจาค'}
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {format(new Date(donation.created_at), 'dd/MM/yy', { locale: th })}
                      <div className="text-xs text-slate-500">{format(new Date(donation.created_at), 'HH:mm', { locale: th })}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {donation.title} {donation.first_name} {donation.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="truncate max-w-32">{donation.email}</div>
                      <div className="text-xs text-slate-600">{donation.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {donation.amount.toLocaleString('th-TH')} ฿
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(donation.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/donations/${donation.id}`} className="p-1.5 text-slate-700 hover:bg-slate-100 rounded transition-colors border border-slate-200" title="ดูรายละเอียด">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {donation.status === 'approved' && (
                          <>
                            <button onClick={() => handlePreviewPDF(donation)} disabled={previewingId === donation.id} className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 border border-blue-200" title="พรีวิว PDF">
                              {previewingId === donation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDownloadPDF(donation)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors border border-emerald-200" title="ดาวน์โหลด">
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(donation)} disabled={deleting === donation.id} className="p-1.5 text-rose-700 hover:bg-rose-50 rounded transition-colors disabled:opacity-50 border border-rose-200" title="ลบ">
                          {deleting === donation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredDonations.length === 0 ? (
            <div className="bg-white border rounded-lg p-6 text-center text-slate-600 text-sm font-medium">
              {searchTerm || statusFilter !== 'all' ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลการบริจาค'}
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div key={donation.id} className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {donation.title} {donation.first_name} {donation.last_name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {format(new Date(donation.created_at), 'dd/MM/yy HH:mm', { locale: th })}
                    </p>
                  </div>
                  {getStatusBadge(donation.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-600 font-medium">อีเมล:</span>
                    <p className="truncate text-slate-800">{donation.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 font-medium">เบอร์:</span>
                    <p className="text-slate-800">{donation.phone}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div className="text-sm font-bold text-slate-900">
                    {donation.amount.toLocaleString('th-TH')} ฿
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/donations/${donation.id}`} className="p-1.5 text-slate-700 hover:bg-slate-100 rounded transition-colors border border-slate-200">
                      <Eye className="w-4 h-4" />
                    </Link>
                    {donation.status === 'approved' && (
                      <>
                        <button onClick={() => handlePreviewPDF(donation)} disabled={previewingId === donation.id} className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 border border-blue-200">
                          {previewingId === donation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDownloadPDF(donation)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors border border-emerald-200">
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(donation)} disabled={deleting === donation.id} className="p-1.5 text-rose-700 hover:bg-rose-50 rounded transition-colors disabled:opacity-50 border border-rose-200">
                      {deleting === donation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-6">
          <div className="relative w-full h-full max-w-6xl max-h-screen">
            <div className="bg-white rounded-lg shadow-xl h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                    พรีวิวใบเสร็จรับเงินบริจาค
                  </h2>
                  {previewDonation && (
                    <p className="text-xs sm:text-sm text-slate-700 mt-1 truncate">
                      {previewDonation.title}{previewDonation.first_name} {previewDonation.last_name} - {previewDonation.amount.toLocaleString('th-TH')} ฿
                    </p>
                  )}
                </div>
                <button
                  onClick={closePreview}
                  className="ml-3 px-3 sm:px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm flex-shrink-0 border border-slate-200"
                >
                  ปิด
                </button>
              </div>
              
              {/* PDF Viewer */}
              <div className="flex-1 p-2 sm:p-4 overflow-hidden">
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
