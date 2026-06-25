import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { dummyVenues } from '@/lib/data/dummy';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Venues API called - querying Supabase...');
    const { searchParams } = new URL(request.url);
    
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minCapacity = searchParams.get('minCapacity');
    const maxPrice = searchParams.get('maxPrice');
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : null;

    // Build Supabase query
    let query = supabase
      .from('venues')
      .select('*')
      .eq('availability', 'available'); // Only show available venues (not hidden/maintenance)

    // Apply filters
    if (city && city !== 'all') {
      query = query.eq('address_city', city);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (minCapacity) {
      query = query.gte('capacity_max', parseInt(minCapacity));
    }

    if (maxPrice) {
      query = query.lte('pricing_full_day', parseInt(maxPrice));
    }

    if (amenities && amenities.length > 0) {
      query = query.contains('amenities', amenities);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        query = query.order('pricing_full_day', { ascending: true });
        break;
      case 'price-high':
        query = query.order('pricing_full_day', { ascending: false });
        break;
      case 'capacity':
        query = query.order('capacity_max', { ascending: false });
        break;
      case 'rating':
      default:
        query = query.order('rating', { ascending: false });
    }

    const { data: dbVenues, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      console.log('⚠️ Falling back to dummy data');
      // Fallback to dummy data if database fails
      return getFallbackData(searchParams, page, limit);
    }

    console.log(`✅ Loaded ${dbVenues?.length || 0} venues from Supabase`);

    // Transform database format to app format
    const transformedVenues = (dbVenues || []).map(venue => ({
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
      reviewsCount: venue.reviews_count,
      ownerId: venue.owner_id,
      rules: ['No smoking', 'ID verification required', 'Professional events only'],
      isVerified: true,
      isActive: true,
    }));

    // Pagination is optional. If no `limit` query is provided, return all venues.
    const paginatedVenues = limit
      ? transformedVenues.slice((page - 1) * limit, (page - 1) * limit + limit)
      : transformedVenues;

    return NextResponse.json({
      success: true,
      data: paginatedVenues,
      pagination: {
        page,
        limit: limit ?? transformedVenues.length,
        total: transformedVenues.length,
        totalPages: limit ? Math.ceil(transformedVenues.length / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error('Venues API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

// Fallback to dummy data if Supabase is not available
function getFallbackData(searchParams: URLSearchParams, page: number, limit: number | null) {
  const city = searchParams.get('city');
  const type = searchParams.get('type');
  const minCapacity = searchParams.get('minCapacity');
  const maxPrice = searchParams.get('maxPrice');
  const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
  const sortBy = searchParams.get('sortBy') || 'rating';

  let filteredVenues = [...dummyVenues];

  // Apply filters
  if (city && city !== 'all') {
    filteredVenues = filteredVenues.filter(
      (v) => v.address.city.toLowerCase() === city.toLowerCase()
    );
  }

  if (type && type !== 'all') {
    filteredVenues = filteredVenues.filter((v) => v.type === type);
  }

  if (minCapacity) {
    const capacity = parseInt(minCapacity);
    filteredVenues = filteredVenues.filter((v) => v.capacity.max >= capacity);
  }

  if (maxPrice) {
    const price = parseInt(maxPrice);
    filteredVenues = filteredVenues.filter((v) => v.pricing.fullDay <= price);
  }

  if (amenities && amenities.length > 0) {
    filteredVenues = filteredVenues.filter((v) =>
      amenities.every((a) => v.amenities.includes(a))
    );
  }

  // Apply sorting
  switch (sortBy) {
    case 'price-low':
      filteredVenues.sort((a, b) => a.pricing.fullDay - b.pricing.fullDay);
      break;
    case 'price-high':
      filteredVenues.sort((a, b) => b.pricing.fullDay - a.pricing.fullDay);
      break;
    case 'rating':
      filteredVenues.sort((a, b) => b.rating - a.rating);
      break;
    case 'capacity':
      filteredVenues.sort((a, b) => b.capacity.max - a.capacity.max);
      break;
    default:
      break;
  }

  // Pagination is optional. If no `limit` query is provided, return all venues.
  const paginatedVenues = limit
    ? filteredVenues.slice((page - 1) * limit, (page - 1) * limit + limit)
    : filteredVenues;

  return NextResponse.json({
    success: true,
    data: paginatedVenues,
    pagination: {
      page,
      limit: limit ?? filteredVenues.length,
      total: filteredVenues.length,
      totalPages: limit ? Math.ceil(filteredVenues.length / limit) : 1,
    },
  });
}
