import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ADMIN_SESSION_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to check admin auth
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('sd_admin_token');
  return token?.value === ADMIN_SESSION_TOKEN;
}

// GET - Fetch all bookings with owner and renter details
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    // Fetch all bookings with venue info
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        venues (id, name, owner_id, address_city, address_state)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }

    // Get all unique owner and renter IDs
    const ownerIds = [...new Set(bookings?.map(b => b.venues?.owner_id).filter(Boolean))];
    const renterIds = [...new Set(bookings?.map(b => b.renter_id).filter(Boolean))];
    const allUserIds = [...new Set([...ownerIds, ...renterIds])];

    // Fetch user details
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .in('id', allUserIds);

    console.log("fetchBookings users data", users);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Helper to check if deposit is expired (24 hours since confirmation)
    const isDepositExpired = (booking: any) => {
      if (booking.status !== 'confirmed' || booking.deposit_paid) return false;
      const updatedAt = new Date(booking.updated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff >= 24;
    };

    // Enrich bookings with owner, renter info, and expiry status
    const enrichedBookings = bookings?.map(booking => ({
      ...booking,
      owner: usersMap.get(booking.venues?.owner_id) || null,
      renter: usersMap.get(booking.renter_id) || null,
      deposit_expired: isDepositExpired(booking),
    }));
    console.log("fetchBookings enrichedBookings data", bookings);
    let totalRevenue = 0;
    let commisionEarned = 0;
    let totalSettlement = 0;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let successfulPayments = 0;
    let expiredBookings = 0;
    let total_venue_booked = bookings?.length || 0;
    
    for(let i = 0 ; i < bookings?.length; i++) {
      const booking = bookings[i];
      if(booking.payment_status === 'fully_paid') {successfulPayments++;}
      if(booking.status === 'pending') {pending++;}
      if(booking.status === 'confirmed') {confirmed++;}
      if(booking.status === 'completed') {completed++;}
      if(booking.status === 'expired') {expiredBookings++;}
      if(booking.total_amount > 0 && booking.payment_status === 'fully_paid') {totalRevenue += booking.total_amount;}
      if(booking.total_amount > 0 && booking.status === 'completed' && booking.payment_status === 'fully_paid') {commisionEarned += booking.platform_fee;}
      if(booking.total_amount > 0 && booking.status === 'completed' && booking.payment_status === 'fully_paid') {totalSettlement += booking.base_price;}
    }

    const summary = {
      total_venue_booked: total_venue_booked,
      total_revenue: totalRevenue,
      commision_earned: commisionEarned,
      total_settlement: totalSettlement,
      pending_bookings: pending,
      confirmed_bookings: confirmed,
      completed_bookings: completed,
      successful_payments: successfulPayments,
      expired_bookings: expiredBookings,
    }

    return NextResponse.json({
      success: true,
      data: enrichedBookings,
      summary: summary,
    });
  } catch (error: any) {
    console.error('Admin bookings error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
