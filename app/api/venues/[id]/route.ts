import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { dummyVenues } from '@/lib/data/dummy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 [API] Fetching venue with ID: ${id} from Supabase...`);

    // Query Supabase for the venue
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API] Supabase error fetching venue:', error);
      
      // Fallback to dummy data
      console.log('⚠️ [API] Falling back to dummy data for venue');
      const dummyVenue = dummyVenues.find(v => v._id === id);
      
      if (dummyVenue) {
        return NextResponse.json({
          success: true,
          data: dummyVenue,
          source: 'dummy'
        });
      }
      
      return NextResponse.json(
        { success: false, error: 'Venue not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [API] Loaded venue from database: ${venue.title}`);

    // Transform the database format to match the app format
    const transformedVenue = {
      _id: venue.id,
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
      amenities: venue.amenities,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '08:00',
        endTime: '22:00',
      },
      rating: venue.rating,
      reviewCount: venue.reviews_count,
      reviews: venue.reviews_count,
      ownerId: venue.owner_id,
      commission_percentage: venue.commission_percentage,
      rules: ['No smoking', 'ID verification required', 'Professional events only'],
      isVerified: true,
      isActive: true,
    };

    return NextResponse.json({
      success: true,
      data: transformedVenue,
      source: 'supabase'
    });
  } catch (error: any) {
    console.error('❌ [API] Error in venue detail route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}
