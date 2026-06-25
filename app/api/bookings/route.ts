import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dummyBookings } from '@/lib/data/dummy';

// Use service role key for server-side operations to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build Supabase query
    let query = supabaseAdmin
      .from('bookings')
      .select('*');

    // Apply filters
    if (userId) {
      query = query.eq('renter_id', userId);
    }

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Sort by date (newest first)
    query = query.order('date', { ascending: false });

    const { data: dbBookings, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      // Fallback to dummy data
      return getFallbackData(searchParams, page, limit);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBookings = (dbBookings || []).slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        page,
        limit,
        total: dbBookings?.length || 0,
        totalPages: Math.ceil((dbBookings?.length || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('Booking insert error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Bookings POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// Fallback to dummy data if Supabase is not available
function getFallbackData(searchParams: URLSearchParams, page: number, limit: number) {
  const userId = searchParams.get('userId');
  const venueId = searchParams.get('venueId');
  const status = searchParams.get('status');

  let filteredBookings = [...dummyBookings];

  // Apply filters
  if (userId) {
    filteredBookings = filteredBookings.filter((b) => b.renterId === userId);
  }

  if (venueId) {
    filteredBookings = filteredBookings.filter((b) => b.venueId === venueId);
  }

  if (status) {
    filteredBookings = filteredBookings.filter((b) => b.status === status);
  }

  // Sort by date (newest first)
  filteredBookings.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: paginatedBookings,
    pagination: {
      page,
      limit,
      total: filteredBookings.length,
      totalPages: Math.ceil(filteredBookings.length / limit),
    },
  });
}
