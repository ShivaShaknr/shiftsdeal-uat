import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// GET - Fetch venue requests for an owner
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

    const { data, error } = await supabaseAdmin
      .from('venue_requests')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Venue requests GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new venue request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'owner_id', 'name', 'type', 'description', 
      'capacity_min', 'capacity_max',
      'address_street', 'address_city', 'address_state', 'address_pincode',
      'pricing_hourly'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify owner exists and is an owner
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', body.owner_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      // Update user role to owner
      await supabaseAdmin
        .from('users')
        .update({ role: 'owner' })
        .eq('id', body.owner_id);
    }

    const venueRequest = {
      owner_id: body.owner_id,
      name: body.name,
      type: body.type,
      description: body.description,
      capacity_min: parseInt(body.capacity_min),
      capacity_max: parseInt(body.capacity_max),
      address_street: body.address_street,
      address_city: body.address_city,
      address_state: body.address_state,
      address_pincode: body.address_pincode,
      address_country: body.address_country || 'India',
      images: body.images || [],
      pricing_hourly: parseFloat(body.pricing_hourly),
      pricing_half_day: body.pricing_half_day ? parseFloat(body.pricing_half_day) : null,
      pricing_full_day: body.pricing_full_day ? parseFloat(body.pricing_full_day) : null,
      security_deposit: body.security_deposit ? parseFloat(body.security_deposit) : null,
      amenities: body.amenities || [],
      rules: body.rules || [],
      status: 'pending',
    };

    const { data, error } = await supabaseAdmin
      .from('venue_requests')
      .insert([venueRequest])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Venue request submitted successfully! Our team will review it within 24-48 hours.',
    });
  } catch (error: any) {
    console.error('Venue request POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
