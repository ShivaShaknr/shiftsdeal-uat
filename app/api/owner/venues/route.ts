import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch venues owned by a specific owner
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

    const { data: directVenues, error: directVenuesError } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (directVenuesError) {
      console.error('Error fetching direct owner venues:', directVenuesError);
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

    let venues = directVenues || [];
    if (venueIds.length > 0) {
      const { data: allVenues, error: allVenuesError } = await supabase
        .from('venues')
        .select('*')
        .in('id', venueIds)
        .order('created_at', { ascending: false });

      if (allVenuesError) {
        console.error('Error fetching owner venues:', allVenuesError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch venues' },
          { status: 500 }
        );
      }

      venues = allVenues || [];
    }

    // Transform to app format
    const transformedVenues = (venues || []).map(venue => ({
      _id: venue.id,
      id: venue.id,
      name: venue.name,
      title: venue.name,
      description: venue.description,
      type: venue.type,
      images: venue.images,
      address: {
        street: venue.address_street,
        city: venue.address_city,
        state: venue.address_state,
        pincode: venue.address_pincode,
        country: venue.address_country,
      },
      capacity: {
        min: venue.capacity_min,
        max: venue.capacity_max,
      },
      pricing: {
        hourly: venue.pricing_hourly,
        halfDay: venue.pricing_half_day,
        fullDay: venue.pricing_full_day,
      },
      availability: venue.availability,
      inventory_visibility: venue.inventory_visibility,
      minBookingHours: venue.min_booking_hours,
      availableTimings: venue.available_timings,
      pricingPerSlot: venue.pricing_per_slot,
      booking_slots: venue.booking_slots,
      blocked_dates: venue.blocked_dates,
      amenities: venue.amenities,
      rating: venue.rating,
      reviewsCount: venue.reviews_count,
      ownerId: venue.owner_id,
    }));

    return NextResponse.json({
      success: true,
      data: transformedVenues,
    });
  } catch (error: any) {
    console.error('Owner venues API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
