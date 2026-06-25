import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to check if 24 hours have passed since confirmation
function isDepositExpired(booking: any): boolean {
  // Only check if status is confirmed, not cancelled/completed, and deposit not paid
  if (booking.status !== 'confirmed' || booking.deposit_paid) {
    return false;
  }
  
  // Use updated_at as the confirmation time (when status was set to confirmed)
  const confirmationTime = new Date(booking.updated_at).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - confirmationTime) > twentyFourHours;
}

// GET - Fetch bookings for venues owned by a specific owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // First get all venue IDs owned directly by this owner.
    const { data: directVenues, error: venuesError } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', ownerId);

    if (venuesError) {
      console.error('Error fetching owner venues:', venuesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch venues' },
        { status: 500 }
      );
    }

    // Try to fetch mapped ownerships, but gracefully skip if table doesn't exist
    let ownerships: Array<{ venue_id: string }> = [];
    const { data: ownershipData, error: ownershipError } = await supabase
      .from('venue_ownerships')
      .select('venue_id')
      .eq('owner_user_id', ownerId)
      .eq('is_active', true);

    if (ownershipError) {
      console.warn('Venue ownership lookup failed, continuing with direct owner venues only:', ownershipError.message);
    } else if (ownershipData) {
      ownerships = ownershipData;
    }

    const directVenueIds = (directVenues || []).map((item) => item.id);
    const mappedVenueIds = (ownerships || []).map((item) => item.venue_id);
    const venueIds = [...new Set([...directVenueIds, ...mappedVenueIds])];

    if (venueIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get bookings for those venues
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, venues(*)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Transform bookings with venue data and expiry check
    const transformedBookings = (bookings || []).map(booking => ({
      ...booking,
      deposit_expired: isDepositExpired(booking),
      venue: booking.venues ? {
        _id: booking.venues.id,
        name: booking.venues.name,
        address: {
          city: booking.venues.address_city,
          state: booking.venues.address_state,
        },
        images: booking.venues.images,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error: any) {
    console.error('Owner bookings API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
