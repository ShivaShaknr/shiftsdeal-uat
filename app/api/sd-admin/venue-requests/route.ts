import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ADMIN_SESSION_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('sd_admin_token');
  return token?.value === ADMIN_SESSION_TOKEN;
}

// GET - Fetch all venue requests for admin
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('venue_requests')
      .select('*, users!venue_requests_owner_id_fkey(id, name, email)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedData = (data || []).map(req => ({
      ...req,
      owner: req.users,
      users: undefined,
    }));

    // Get stats
    const { data: allRequests } = await supabaseAdmin
      .from('venue_requests')
      .select('status');

    const stats = {
      total: allRequests?.length || 0,
      pending: allRequests?.filter(r => r.status === 'pending').length || 0,
      approved: allRequests?.filter(r => r.status === 'approved').length || 0,
      rejected: allRequests?.filter(r => r.status === 'rejected').length || 0,
    };

    return NextResponse.json({ success: true, data: transformedData, stats });
  } catch (error: any) {
    console.error('Admin venue requests GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
