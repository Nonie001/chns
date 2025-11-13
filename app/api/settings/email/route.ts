import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { emailSettingsSchema } from '@/lib/validations';

// Utility to map DB row to API shape expected by the client form
type EmailSettingsRow = {
  id?: string;
  sender_email?: string;
  sender_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  // For backward compatibility with earlier property names if any existed
  from_email?: string;
  from_name?: string;
  smtp_pass?: string;
  // New optional signer fields
  signer_name?: string;
  signer_title?: string;
  signature_image_url?: string;
} | null;

function mapDbToApi(row: EmailSettingsRow) {
  if (!row) return null;
  return {
    smtp_host: row.smtp_host ?? '',
    smtp_port: row.smtp_port ?? 587,
    smtp_user: row.smtp_user ?? row.sender_email ?? '',
    smtp_pass: row.smtp_password ?? row.smtp_pass ?? '',
    from_email: row.sender_email ?? row.from_email ?? '',
    from_name: row.sender_name ?? row.from_name ?? '',
    signer_name: row.signer_name ?? '',
    signer_title: row.signer_title ?? '',
    signature_image_url: row.signature_image_url ?? '',
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('GET /api/settings/email error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapDbToApi(data) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/settings/email unexpected error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = emailSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check existing row
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('email_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('POST /api/settings/email read error:', fetchErr);
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    const payload = {
      sender_email: parsed.data.from_email,
      sender_name: parsed.data.from_name,
      smtp_host: parsed.data.smtp_host,
      smtp_port: parsed.data.smtp_port,
      smtp_user: parsed.data.smtp_user,
      smtp_password: parsed.data.smtp_pass,
      signer_name: parsed.data.signer_name ?? null,
      signer_title: parsed.data.signer_title ?? null,
      signature_image_url: parsed.data.signature_image_url ?? null,
    };

    if (existing?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('email_settings')
        .update(payload)
        .eq('id', existing.id);
      if (updateError) {
        console.error('POST /api/settings/email write error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('email_settings')
        .insert(payload);
      if (insertError) {
        console.error('POST /api/settings/email write error:', insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // If body was HTML or otherwise invalid, ensure we return JSON
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/settings/email unexpected error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
