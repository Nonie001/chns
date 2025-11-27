import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateServerPDFBuffer } from '@/lib/pdf-server';
import { sendReceiptEmail } from '@/lib/email';
import type { Donation } from '@/types/database';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('=== APPROVE API STARTED ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { donationId } = body;

    if (!donationId) {
      console.error('No donation ID provided');
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching donation:', donationId);
    
    // Get donation data
    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (donationError) {
      console.error('Donation fetch error:', donationError);
      return NextResponse.json(
        { error: 'Donation not found', details: donationError.message },
        { status: 404 }
      );
    }
    
    if (!donation) {
      console.error('Donation not found in database');
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    console.log('Donation found:', donation.id, 'Status:', donation.status);

    // Check if already approved
    if (donation.status === 'approved') {
      console.warn('Donation already approved');
      return NextResponse.json(
        { error: 'Donation already approved' },
        { status: 400 }
      );
    }

  // Email settings will be read from DB (fallback to env inside sendReceiptEmail)
  console.log('Email settings will be loaded from DB within sendReceiptEmail');

    // Load logo as base64
    console.log('Loading logo...');
    let logoBase64: string | undefined;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      console.log('Logo loaded successfully');
    } catch {
      console.warn('Logo file not found, generating PDF without logo');
    }

    // Generate PDF
    console.log('Generating PDF...');
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateServerPDFBuffer(donation as Donation);
      console.log('PDF buffer created, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`);
    }

    // Upload PDF to Supabase Storage
    console.log('Uploading PDF to Supabase...');
    const pdfFileName = `receipt-${donationId}.pdf`;
    const pdfPath = `receipts/${pdfFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('donations')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('PDF uploaded successfully');

    // Get PDF public URL
    const { data: { publicUrl: pdfUrl } } = supabaseAdmin.storage
      .from('donations')
      .getPublicUrl(pdfPath);
    
    console.log('PDF URL:', pdfUrl);

    // Update donation status
    console.log('Updating donation status...');
    const { error: updateError } = await supabaseAdmin
      .from('donations')
      .update({
        status: 'approved',
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', donationId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }
    
    console.log('Donation status updated to approved');

    // Send email with PDF
    let emailSent = false;
    console.log('Attempting to send email...');
    try {
      const receiptId = donationId.substring(0, 8).toUpperCase();
      const recipientName = `${donation.title} ${donation.first_name} ${donation.last_name}`;

      const emailResult = await sendReceiptEmail(
        donation.email,
        recipientName,
        pdfBuffer,
        receiptId
      );
      
      emailSent = emailResult;
      console.log('Email sent result:', emailResult);
      if (emailResult) {
        console.log('Email sent successfully to:', donation.email);
      } else {
        console.warn('Email not sent (likely missing settings).');
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't throw - continue with approval even if email fails
    }

    console.log('=== APPROVAL COMPLETED SUCCESSFULLY ===');
    
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Donation approved and receipt sent successfully'
        : 'Donation approved successfully (email not sent - configure email in Settings)',
      emailSent,
      pdfUrl
    });
  } catch (error) {
    console.error('=== ERROR IN APPROVAL PROCESS ===');
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        step: 'approval_process'
      },
      { status: 500 }
    );
  }
}
