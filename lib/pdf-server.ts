import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Donation } from '@/types/database';

function createReceiptHTML(donation: Donation, logoBase64?: string): string {
  const fullName = `${donation.title}${donation.first_name} ${donation.last_name}`;
  const receiptNo = donation.id.substring(0, 8).toUpperCase();
  const receiptDate = format(new Date(donation.created_at), 'dd MMMM yyyy', { locale: th });
  const receiptTime = format(new Date(donation.created_at), 'HH:mm น.', { locale: th });
  const birthDate = format(new Date(donation.birth_date), 'dd MMMM yyyy', { locale: th });
  const amountText = donation.amount.toLocaleString('th-TH');
  const generatedDate = format(new Date(), 'dd/MM/yyyy เวลา HH:mm น.', { locale: th });

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบเสร็จรับเงินบริจาค</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Sarabun', Arial, sans-serif; 
          background: white; 
          color: #333;
          line-height: 1.6;
        }
        .container { 
          max-width: 794px; 
          margin: 0 auto; 
          padding: 40px; 
        }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo img { width: 120px; height: auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { 
          font-size: 24px; 
          font-weight: bold; 
          color: #333; 
          margin-bottom: 5px; 
        }
        .header p { 
          font-size: 16px; 
          color: #333; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
          border: 1px solid #333; 
        }
        td { 
          border: 1px solid #333; 
          padding: 8px; 
        }
        .table-header { 
          background: #f8f8f8; 
          font-weight: bold; 
          width: 25%; 
        }
        .section-title { 
          font-size: 18px; 
          margin: 20px 0 10px 0; 
          font-weight: bold; 
          border-bottom: 2px solid #333; 
          padding-bottom: 5px; 
        }
        .amount-table { 
          border: 2px solid #333; 
          margin-bottom: 30px; 
        }
        .amount-header { 
          background: #f0f8ff; 
          font-weight: bold; 
          text-align: center; 
          font-size: 16px; 
          padding: 15px; 
        }
        .amount-value { 
          text-align: center; 
          font-size: 28px; 
          font-weight: bold; 
          color: #16a34a; 
          padding: 20px; 
        }
        .note { 
          text-align: center; 
          color: #666; 
          font-size: 12px; 
          font-style: italic; 
          margin-bottom: 40px; 
        }
        .note p { margin-bottom: 5px; }
        .footer { 
          border-top: 1px solid #ddd; 
          padding-top: 20px; 
          text-align: center; 
        }
        .footer p { 
          margin-bottom: 10px; 
          font-size: 14px; 
        }
        .timestamp { 
          font-size: 11px; 
          color: #787878; 
          margin-top: 15px; 
        }
        @media print {
          .container { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${logoBase64 ? `
        <div class="logo">
          <img src="${logoBase64}" alt="Logo" />
        </div>
        ` : ''}
        
        <div class="header">
          <h1>ใบเสร็จรับเงินบริจาค</h1>
          <p>DONATION RECEIPT</p>
        </div>
        
        <table>
          <tr>
            <td class="table-header">เลขที่ใบเสร็จ</td>
            <td style="width:25%;">${receiptNo}</td>
            <td class="table-header">วันที่ออกเอกสาร</td>
            <td style="width:25%;">${receiptDate}</td>
          </tr>
          <tr>
            <td class="table-header">เวลา</td>
            <td>${receiptTime}</td>
            <td class="table-header">สถานะ</td>
            <td style="color:#16a34a;font-weight:bold;">อนุมัติแล้ว</td>
          </tr>
        </table>
        
        <h2 class="section-title">ข้อมูลผู้บริจาค</h2>
        <table>
          <tr>
            <td class="table-header">ชื่อ-นามสกุล</td>
            <td style="width:75%;">${fullName}</td>
          </tr>
          <tr>
            <td class="table-header">วันเกิด</td>
            <td>${birthDate}</td>
          </tr>
          <tr>
            <td class="table-header">อีเมล</td>
            <td>${donation.email}</td>
          </tr>
          <tr>
            <td class="table-header">เบอร์โทรศัพท์</td>
            <td>${donation.phone}</td>
          </tr>
        </table>
        
        <h2 class="section-title">รายละเอียดการบริจาค</h2>
        <table class="amount-table">
          <tr>
            <td class="amount-header">จำนวนเงินที่บริจาค</td>
          </tr>
          <tr>
            <td class="amount-value">${amountText} บาท</td>
          </tr>
        </table>
        
        <div class="note">
          <p>ใบเสร็จฉบับนี้ออกโดยระบบอัตโนมัติ มีผลใช้งานโดยไม่ต้องลงลายมือชื่อ</p>
          <p>กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐานในการบริจาค</p>
        </div>
        
        <div style="border-top:2px solid #333;padding-top:15px;margin-top:30px;">
          <p style="text-align:center;margin:5px 0;font-size:12px;color:#666;">ใบเสร็จฉบับนี้ออกโดยระบบอัตโนมัติ มีผลใช้งานโดยไม่ต้องลงลายมือชื่อ</p>
          <p style="text-align:center;margin:5px 0;font-size:12px;color:#666;">กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐานในการบริจาค</p>
          <div style="text-align:center;margin-top:20px;">
            <p style="margin:5px 0;font-size:14px;font-weight:bold;">ขอขอบพระคุณที่ท่านให้การสนับสนุนและร่วมบริจาค</p>
            <p style="margin:5px 0;font-size:14px;font-weight:bold;">ขอให้พระคุณอันยิ่งใหญ่จงมีแด่ท่าน</p>
          </div>
          <p style="text-align:right;margin:20px 0 0 0;color:#666;font-size:10px;">เอกสารออกโดยระบบเมื่อ ${generatedDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generateServerPDFBuffer(donation: Donation, logoBase64?: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    const html = createReceiptHTML(donation, logoBase64);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}