import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Donation } from '@/types/database';

function createReceiptHTML(donation: Donation, logoBase64?: string): string {
  const fullName = String(donation.title) + donation.first_name + ' ' + donation.last_name;
  const receiptNo = donation.id.substring(0, 8).toUpperCase();
  const receiptDate = format(new Date(donation.created_at), 'dd MMMM yyyy', { locale: th });
  const receiptTime = format(new Date(donation.created_at), 'HH:mm น.', { locale: th });
  const birthDate = format(new Date(donation.birth_date), 'dd MMMM yyyy', { locale: th });
  const amountText = donation.amount.toLocaleString('th-TH');
  const generatedDate = format(new Date(), 'dd/MM/yyyy เวลา HH:mm น.', { locale: th });

  let html = '<div style="width:794px;padding:40px;font-family:\'TH Sarabun New\',Arial,sans-serif;background:white;font-size:14px;">';
  
  if (logoBase64) {
    html += '<div style="text-align:center;margin-bottom:20px;"><img src="' + logoBase64 + '" alt="Logo" style="width:120px;height:auto;"/></div>';
  }
  
  html += '<h1 style="text-align:center;font-size:24px;margin:0 0 5px 0;font-weight:bold;">ใบเสร็จรับเงินบริจาค</h1>';
  html += '<p style="text-align:center;color:#333;font-size:16px;margin:0 0 30px 0;">DONATION RECEIPT</p>';
  
  // Header table
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #333;">';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;width:25%;background:#f8f8f8;font-weight:bold;">เลขที่ใบเสร็จ</td>';
  html += '<td style="border:1px solid #333;padding:8px;width:25%;">' + receiptNo + '</td>';
  html += '<td style="border:1px solid #333;padding:8px;width:25%;background:#f8f8f8;font-weight:bold;">วันที่ออกเอกสาร</td>';
  html += '<td style="border:1px solid #333;padding:8px;width:25%;">' + receiptDate + '</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;background:#f8f8f8;font-weight:bold;">เวลา</td>';
  html += '<td style="border:1px solid #333;padding:8px;">' + receiptTime + '</td>';
  html += '<td style="border:1px solid #333;padding:8px;background:#f8f8f8;font-weight:bold;">สถานะ</td>';
  html += '<td style="border:1px solid #333;padding:8px;color:#16a34a;font-weight:bold;">อนุมัติแล้ว</td>';
  html += '</tr>';
  html += '</table>';
  
  // Donor information table
  html += '<h2 style="font-size:18px;margin:20px 0 10px 0;font-weight:bold;border-bottom:2px solid #333;padding-bottom:5px;">ข้อมูลผู้บริจาค</h2>';
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #333;">';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;width:25%;background:#f8f8f8;font-weight:bold;">ชื่อ-นามสกุล</td>';
  html += '<td style="border:1px solid #333;padding:8px;width:75%;">' + fullName + '</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;background:#f8f8f8;font-weight:bold;">วันเกิด</td>';
  html += '<td style="border:1px solid #333;padding:8px;">' + birthDate + '</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;background:#f8f8f8;font-weight:bold;">อีเมล</td>';
  html += '<td style="border:1px solid #333;padding:8px;">' + donation.email + '</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:8px;background:#f8f8f8;font-weight:bold;">เบอร์โทรศัพท์</td>';
  html += '<td style="border:1px solid #333;padding:8px;">' + donation.phone + '</td>';
  html += '</tr>';
  html += '</table>';
  
  // Amount table
  html += '<h2 style="font-size:18px;margin:20px 0 10px 0;font-weight:bold;border-bottom:2px solid #333;padding-bottom:5px;">รายละเอียดการบริจาค</h2>';
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:30px;border:2px solid #333;">';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:15px;background:#f0f8ff;font-weight:bold;text-align:center;font-size:16px;">จำนวนเงินที่บริจาค</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td style="border:1px solid #333;padding:20px;text-align:center;font-size:28px;font-weight:bold;color:#16a34a;">' + amountText + ' บาท</td>';
  html += '</tr>';
  html += '</table>';
  
  // Footer
  html += '<div style="border-top:2px solid #333;padding-top:15px;margin-top:30px;">';
  html += '<p style="text-align:center;margin:5px 0;font-size:12px;color:#666;">ใบเสร็จฉบับนี้ออกโดยระบบอัตโนมัติ มีผลใช้งานโดยไม่ต้องลงลายมือชื่อ</p>';
  html += '<p style="text-align:center;margin:5px 0;font-size:12px;color:#666;">กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐานในการบริจาค</p>';
  html += '<div style="text-align:center;margin-top:20px;">';
  html += '<p style="margin:5px 0;font-size:14px;font-weight:bold;">ขอขอบพระคุณที่ท่านให้การสนับสนุนและร่วมบริจาค</p>';
  html += '<p style="margin:5px 0;font-size:14px;font-weight:bold;">ขอให้พระคุณอันยิ่งใหญ่จงมีแด่ท่าน</p>';
  html += '</div>';
  html += '<p style="text-align:right;margin:20px 0 0 0;color:#666;font-size:10px;">เอกสารออกโดยระบบเมื่อ ' + generatedDate + '</p>';
  html += '</div></div>';
  
  return html;
}

export async function generateReceiptPDF(donation: Donation, logoBase64?: string): Promise<jsPDF> {
  const htmlContent = createReceiptHTML(donation, logoBase64);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
}

export async function generatePDFBlob(donation: Donation, logoBase64?: string): Promise<Blob> {
  const doc = await generateReceiptPDF(donation, logoBase64);
  return doc.output('blob');
}

export async function downloadPDF(donation: Donation, logoBase64?: string): Promise<void> {
  const doc = await generateReceiptPDF(donation, logoBase64);
  doc.save('receipt-' + donation.id.substring(0, 8) + '.pdf');
}

