import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { bucket, fileName, file } = await request.json();

    if (!bucket || !fileName || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = file.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.split(';')[0].split(':')[1],
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
      },
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
