import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Donation } from '@/types/database';
import { supabaseAdmin } from '@/lib/supabase';

// แปลงจำนวนเงินเป็นข้อความภาษาไทย สำหรับระบุในใบเสร็จ (เหมาะกับเอกสารทางการ/ยื่นภาษี)
function thaiBahtText(amount: number): string {
  const numberText = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const unitText = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];

  const toThai = (n: number): string => {
    if (n === 0) return '';
    let text = '';
    const millions = Math.floor(n / 1_000_000);
    const rest = n % 1_000_000;
    if (millions > 0) {
      text += toThai(millions) + 'ล้าน';
    }
    let k = rest;
    let i = 0;
    while (k > 0) {
      const d = k % 10;
      if (d !== 0) {
        if (i === 0) {
          // หน่วย
          if (d === 1 && (rest > 10)) text = 'เอ็ด' + text;
          else text = numberText[d] + text;
        } else if (i === 1) {
          // หลักสิบ
          if (d === 1) text = 'สิบ' + text;
          else if (d === 2) text = 'ยี่สิบ' + text;
          else text = numberText[d] + 'สิบ' + text;
        } else {
          text = numberText[d] + unitText[i] + text;
        }
      }
      k = Math.floor(k / 10);
      i++;
    }
    return text;
  };

  const integer = Math.floor(Math.abs(amount));
  const satang = Math.round((Math.abs(amount) - integer) * 100);
  let result = integer === 0 ? 'ศูนย์บาท' : toThai(integer) + 'บาท';
  if (satang === 0) result += 'ถ้วน';
  else result += toThai(satang) + 'สตางค์';
  return result;
}

type SignatureInfo = { name?: string; title?: string; imageBase64?: string };

function createReceiptHTML(donation: Donation, logoBase64?: string, signature?: SignatureInfo): string {
  const fullName = `${donation.title}${donation.first_name} ${donation.last_name}`;
  const receiptNo = donation.id.substring(0, 8).toUpperCase();
  const receiptDate = format(new Date(donation.created_at), 'dd MMMM yyyy', { locale: th });
  const receiptTime = format(new Date(donation.created_at), 'HH:mm น.', { locale: th });
  const birthDate = format(new Date(donation.birth_date), 'dd MMMM yyyy', { locale: th });
  const amountText = donation.amount.toLocaleString('th-TH');
  const amountWords = thaiBahtText(donation.amount);
  const generatedDate = format(new Date(), 'dd/MM/yyyy เวลา HH:mm น.', { locale: th });

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบเสร็จรับเงินบริจาค</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans Thai', Tahoma, sans-serif;
          background: #fff;
          color: #222;
          line-height: 1.5;
          font-size: 13.5px;
        }
        .container {
          max-width: 794px; /* A4 width at 96dpi */
          margin: 0 auto;
          padding: 28px;
        }
        .header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { width: 80px; height: auto; }
        .title {
          text-align: right;
        }
        .title h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
        .title p { font-size: 12px; color: #555; }
  .main-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
  .main-table th, .main-table td { padding: 8px 10px; border: 1px solid #ddd; vertical-align: top; }
  .main-table th { background: #f6f6f6; text-align: left; width: 28%; font-weight: 600; }
  .section-title { background: #efefef; text-align: left; font-size: 14.5px; font-weight: 700; padding: 8px 10px; }
  .amount-box { display: flex; justify-content: flex-end; margin-top: 6px; }
  .amount-table { width: 360px; border-collapse: collapse; }
  .amount-table th, .amount-table td { padding: 8px 10px; border: 1px solid #ddd; }
  .amount-table th { background: #f6f6f6; text-align: left; width: 60%; font-weight: 600; }
  .amount-value { text-align: right; font-weight: 700; color: #111; }
  .note { margin-top: 10px; color: #555; font-size: 12px; }
  .amount-words { margin-top: 6px; font-size: 12px; color: #333; }
  .signature { margin-top: 24px; display: flex; justify-content: flex-end; }
  .sign-block { width: 300px; text-align: center; }
  .sign-line { margin-top: 36px; border-top: 1px solid #888; padding-top: 6px; }
  .timestamp { margin-top: 10px; font-size: 11px; color: #777; text-align: right; }
        .sign-image { max-height: 64px; object-fit: contain; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ''}
            <div>
              <div style="font-size:14px;font-weight:700;color:#111;">ใบเสร็จรับเงินบริจาค</div>
              <div style="font-size:11px;color:#666;">Donation Receipt</div>
            </div>
          </div>
          <div class="title">
            <h1>เลขที่: ${receiptNo}</h1>
            <p>ออกเอกสาร: ${receiptDate} เวลา ${receiptTime}</p>
          </div>
        </div>
        <table class="main-table">
          <tr>
            <th colspan="2" class="section-title">ข้อมูลเอกสาร</th>
          </tr>
          <tr>
            <th>สถานะ</th>
            <td>อนุมัติแล้ว</td>
          </tr>

          <tr>
            <th colspan="2" class="section-title">ข้อมูลผู้บริจาค</th>
          </tr>
          <tr>
            <th>ชื่อ-นามสกุล</th>
            <td>${fullName}</td>
          </tr>
          <tr>
            <th>วันเกิด</th>
            <td>${birthDate}</td>
          </tr>
          <tr>
            <th>อีเมล</th>
            <td>${donation.email}</td>
          </tr>
          <tr>
            <th>เบอร์โทรศัพท์</th>
            <td>${donation.phone}</td>
          </tr>

          <tr>
            <th colspan="2" class="section-title">รายละเอียดการบริจาค</th>
          </tr>
          <tr>
            <th>วันที่บริจาค</th>
            <td>${receiptDate} เวลา ${receiptTime}</td>
          </tr>
        </table>
        <div class="amount-box">
          <table class="amount-table">
            <tr>
              <th>ยอดบริจาค (บาท)</th>
              <td class="amount-value">${amountText}</td>
            </tr>
            <tr>
              <th>รวมทั้งสิ้น (บาท)</th>
              <td class="amount-value">${amountText}</td>
            </tr>
          </table>
        </div>

        <div class="amount-words">จำนวนเงิน (ตัวอักษร): ${amountWords}</div>

        <div class="note">
          ใบเสร็จฉบับนี้ออกโดยระบบอัตโนมัติ เพื่อใช้เป็นหลักฐานการบริจาค และสามารถใช้ประกอบการยื่นภาษีได้ตามระเบียบที่เกี่ยวข้อง
        </div>

        <div class="signature">
          <div class="sign-block">
            ${signature?.imageBase64 ? `<img class="sign-image" src="${signature.imageBase64}" alt="signature" />` : ''}
            <div class="sign-line"></div>
            <div style="margin-top:6px; font-weight:600;">${signature?.name || 'ผู้มีอำนาจลงนาม'}</div>
            ${signature?.title ? `<div style="font-size:12px; color:#666;">${signature.title}</div>` : '<div style="font-size:11px;color:#666;">(ระบบออกเอกสารอัตโนมัติ)</div>'}
          </div>
        </div>

        <div class="timestamp">พิมพ์เมื่อ: ${generatedDate}</div>
      </div>
    </body>
    </html>
  `;
}

export async function generateServerPDFBuffer(donation: Donation, logoBase64?: string): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    // Load signer settings
    let signature: SignatureInfo | undefined;
    try {
      const { data } = await supabaseAdmin
        .from('email_settings')
        .select('signer_name, signer_title, signature_image_url')
        .limit(1)
        .maybeSingle();
      if (data) {
        let imageBase64: string | undefined;
        if (data.signature_image_url) {
          try {
            const res = await fetch(data.signature_image_url);
            const arr = await res.arrayBuffer();
            const b64 = Buffer.from(arr).toString('base64');
            const mime = res.headers.get('content-type') || 'image/png';
            imageBase64 = `data:${mime};base64,${b64}`;
          } catch {}
        }
        signature = { name: data.signer_name || undefined, title: data.signer_title || undefined, imageBase64 };
      }
    } catch {}

    const page = await browser.newPage();
    // ลดเวลารอ network ให้เร็วขึ้น เนื่องจากเราไม่มี resource ภายนอกแล้ว
    page.setDefaultNavigationTimeout(15000);
    const html = createReceiptHTML(donation, logoBase64, signature);
    // setContent เร็วกว่า goto data URL ในหลายกรณี และเราไม่ต้องรอ network idle
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      }
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  } finally {
    // เก็บ browser ไว้ reuse รอบถัดไปเพื่อลดเวลา
  }
}

// ---------- Browser singleton (reuse instance เพื่อให้เร็วขึ้น) ----------
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    // ตรวจสอบว่าอยู่บน Vercel หรือไม่
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (isVercel) {
      // สำหรับ Vercel/Lambda - ใช้ Chromium
      browserPromise = puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true
      });
    } else {
      // สำหรับ Local - ใช้ Chrome ปกติ
      browserPromise = puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: puppeteer.executablePath(),
        headless: true
      });
    }

    // ป้องกัน zombie process ถ้าเกิด error
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}