import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// ให้รันบน Node.js runtime (จำเป็นสำหรับ Buffer/crypto และ SDK ของ Supabase บางส่วน)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const mime = file.type || (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream');
    const key = `signatures/${randomUUID()}.${ext}`;
    const primaryBucket = 'assets';
    const fallbackBucket = 'donations';

    async function tryUpload(bucket: string) {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(key, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });
      return { error };
    }

    // Try primary bucket first
    let { error: uploadError } = await tryUpload(primaryBucket);

    // If bucket missing, attempt to create (requires service role); ignore if already exists
    if (uploadError && /bucket/i.test(uploadError.message) && /not\s*found|doesn't\s*exist/i.test(uploadError.message)) {
      try {
        // createBucket requires service role; this will fail if only anon key is configured
        // @ts-ignore - types depend on supabase-js version, but method exists at runtime
        await supabaseAdmin.storage.createBucket(primaryBucket, { public: true });
        // retry upload
        ({ error: uploadError } = await tryUpload(primaryBucket));
      } catch (e) {
        // ignore; will attempt fallback bucket below
      }
    }

    let usedBucket = primaryBucket;

    // Fallback to donations bucket if still failing (usually because assets bucket doesn't exist and we cannot create it)
    if (uploadError) {
      const res2 = await tryUpload(fallbackBucket);
      if (res2.error) {
        console.error('Signature upload failed (assets and donations):', uploadError.message, res2.error.message);
        return NextResponse.json({ success: false, error: res2.error.message || uploadError.message }, { status: 500 });
      }
      usedBucket = fallbackBucket;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(usedBucket)
      .getPublicUrl(key);

    return NextResponse.json({ success: true, url: publicUrl, bucket: usedBucket });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Signature upload unexpected error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
