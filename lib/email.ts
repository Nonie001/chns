import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase';

export async function sendReceiptEmail(
  recipientEmail: string,
  recipientName: string,
  pdfBuffer: Buffer,
  receiptNo: string
): Promise<boolean> {
  try {
    // 1) Try to load email settings from database (configured via Settings page)
    const { data: dbSettings, error: settingsError } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.warn('Failed to load email settings from DB:', settingsError.message);
    }

    const resolved = {
      smtp_host: dbSettings?.smtp_host || process.env.SMTP_HOST,
      smtp_port: dbSettings?.smtp_port || parseInt(process.env.SMTP_PORT || '587'),
      smtp_user: dbSettings?.smtp_user || process.env.SMTP_USER,
      smtp_password: dbSettings?.smtp_password || process.env.SMTP_PASSWORD,
      sender_email: dbSettings?.sender_email || process.env.FROM_EMAIL,
      sender_name: dbSettings?.sender_name || process.env.FROM_NAME,
    };

    if (!resolved.smtp_host || !resolved.smtp_user || !resolved.smtp_password || !resolved.sender_email) {
      console.error('Email settings not configured (DB and ENV both missing)');
      throw new Error('Email settings not configured');
    }

    // Create nodemailer transporter with fallback options
    const transporter = nodemailer.createTransport({
      host: resolved.smtp_host,
      port: resolved.smtp_port || 587,
      secure: (resolved.smtp_port || 587) === 465, // true for 465, false for others
      auth: {
        user: resolved.smtp_user,
        pass: resolved.smtp_password,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
    });

    // Verify transporter with timeout
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Verification timeout')), 30000)
        )
      ]);
    } catch (verifyError) {
      console.warn('Email verification failed, but continuing...', verifyError);
      // Continue anyway - sometimes verify fails but sending works
    }

    // Prepare email content
  const emailSubject = `ใบเสร็จรับเงินบริจาค - เลขที่ ${receiptNo}`;
    const emailBody = `
เรียน คุณ${recipientName}

ขอบคุณสำหรับการบริจาคของท่าน

กรุณาดูใบเสร็จรับเงินที่แนบมาพร้อมนี้
เลขที่ใบเสร็จ: ${receiptNo}

ขอแสดงความนับถือ
${resolved.sender_name}
    `.trim();

    // Send email
    const info = await transporter.sendMail({
      from: `"${resolved.sender_name}" <${resolved.sender_email}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: emailBody,
      attachments: [
        {
          filename: `receipt-${receiptNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

