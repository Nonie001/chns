import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase';

export async function sendReceiptEmail(
  recipientEmail: string,
  recipientName: string,
  pdfBuffer: Buffer,
  receiptNo: string
): Promise<boolean> {
  try {
    console.log('=== SENDING EMAIL ===');
    console.log('Recipient:', recipientEmail);
    console.log('Name:', recipientName);
    console.log('Receipt No:', receiptNo);

    // Get email settings from environment variables
    const emailSettings = {
      smtp_host: process.env.SMTP_HOST,
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_user: process.env.SMTP_USER,
      smtp_password: process.env.SMTP_PASSWORD,
      sender_email: process.env.FROM_EMAIL,
      sender_name: process.env.FROM_NAME,
    };

    if (!emailSettings.smtp_host || !emailSettings.smtp_user || !emailSettings.smtp_password || !emailSettings.sender_email) {
      console.error('Email settings not configured in environment variables');
      throw new Error('Email settings not configured');
    }

    console.log('Email settings loaded:', {
      smtp_host: emailSettings.smtp_host,
      smtp_port: emailSettings.smtp_port,
      sender_email: emailSettings.sender_email,
      sender_name: emailSettings.sender_name
    });

    // Create nodemailer transporter with fallback options
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: 465, // Use port 465 (secure) instead of 587
      secure: true, // true for 465, false for other ports
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
    });

    // Verify transporter with timeout
    console.log('Verifying email transporter...');
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Verification timeout')), 30000)
        )
      ]);
      console.log('Email transporter verified successfully');
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
${emailSettings.sender_name}
    `.trim();

    // Send email
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: `"${emailSettings.sender_name}" <${emailSettings.sender_email}>`,
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

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

