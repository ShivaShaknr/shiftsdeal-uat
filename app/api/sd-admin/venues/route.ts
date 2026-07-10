import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { sendOwnerVenueAddedEmail } from '@/lib/notifications/email';

const ADMIN_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sd_admin_token')?.value;
  return token === ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const city = searchParams.get('city') || 'all';

    let query = supabaseAdmin
      .from('venues')
      .select(`
        *,
        owner:users!venues_owner_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,address_city.ilike.%${search}%,address_state.ilike.%${search}%`);
    }

    // Apply status filter (using availability column)
    if (status !== 'all') {
      query = query.eq('availability', status);
    }

    // Apply city filter
    if (city !== 'all') {
      query = query.eq('address_city', city);
    }

    const { data: venues, error } = await query;

    if (error) {
      console.error('Error fetching venues:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get unique cities for filter
    const { data: citiesData } = await supabaseAdmin
      .from('venues')
      .select('address_city')
      .order('address_city');
    
    const cities = [...new Set((citiesData || []).map(v => v.address_city))];

    // Calculate stats
    const allVenues = venues || [];
    const stats = {
      total: allVenues.length,
      available: allVenues.filter(v => v.availability === 'available').length,
      hidden: allVenues.filter(v => v.availability === 'hidden').length,
      maintenance: allVenues.filter(v => v.availability === 'maintenance').length,
    };

    return NextResponse.json({
      success: true,
      data: venues || [],
      cities,
      stats,
    });
  } catch (error: any) {
    console.error('Admin venues error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const requiredFields = [
      'venueName',
      'venueType',
      'fullAddress',
      'city',
      'state',
      'pincode',
      'minimumBookingHours',
      'availableTimings',
      'pricingPerHour',
      'venueDescription',
      'ownerFullName',
      'ownerEmail',
      'ownerPhoneNumber',
    ];

    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const parsedCapacityMin = Number(body.capacityMin ?? body.capacity);
    const parsedCapacityMax = Number(body.capacityMax ?? body.capacity);
    if (
      !Number.isFinite(parsedCapacityMin) ||
      !Number.isFinite(parsedCapacityMax) ||
      parsedCapacityMin <= 0 ||
      parsedCapacityMax <= 0 ||
      parsedCapacityMin > parsedCapacityMax
    ) {
      return NextResponse.json({ success: false, error: 'Invalid capacity range.' }, { status: 400 });
    }

    const normalizedOwnerEmail = String(body.ownerEmail).trim().toLowerCase();
    const ownerFullName = String(body.ownerFullName).trim();

    const { data: existingOwner } = await supabaseAdmin
      .from('users')
      .select('id, role, upi_id, bank_account_number, bank_ifsc')
      .eq('email', normalizedOwnerEmail)
      .maybeSingle();

    let ownerId = existingOwner?.id ?? null;
    let generatedPassword: string | null = null;

    if (!ownerId) {
      generatedPassword = ownerFullName.replace(/\s+/g, '') + 'Owner@123';

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedOwnerEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { name: ownerFullName, role: 'owner' },
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { success: false, error: authError?.message || 'Failed to create owner login' },
          { status: 500 }
        );
      }

      const { data: newOwner, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          name: ownerFullName,
          email: normalizedOwnerEmail,
          role: 'owner',
        })
        .select('id')
        .single();

      if (userError || !newOwner) {
        return NextResponse.json(
          { success: false, error: userError?.message || 'Failed to create owner user' },
          { status: 500 }
        );
      }

      ownerId = newOwner.id;
      console.log('Owner login created:', { email: normalizedOwnerEmail, password: generatedPassword });
    } else if (existingOwner?.role !== 'owner') {
      await supabaseAdmin
        .from('users')
        .update({ role: 'owner', name: ownerFullName, updated_at: new Date().toISOString() })
        .eq('id', ownerId);
    }

    const hasPayment = !!(
      existingOwner?.upi_id?.trim() ||
      (existingOwner?.bank_account_number?.trim() && existingOwner?.bank_ifsc?.trim())
    );

    const newVenue = {
      owner_id: ownerId,
      name: String(body.venueName).trim(),
      type: String(body.venueType).trim(),
      description: String(body.venueDescription).trim(),
      images: Array.isArray(body.venueImages) ? body.venueImages : [],
      address_street: String(body.fullAddress).trim(),
      address_city: String(body.city).trim(),
      address_state: String(body.state).trim(),
      address_pincode: String(body.pincode).trim(),
      address_country: 'India',
      capacity_min: parsedCapacityMin,
      capacity_max: parsedCapacityMax,
      pricing_hourly: Number(body.pricingPerHour),
      pricing_half_day: body.pricingPerSlot ? Number(body.pricingPerSlot) : null,
      pricing_full_day: null,
      commission_percentage: body.commissionPercentage
        ? Number(body.commissionPercentage)
        : 0,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      availability: hasPayment ? 'available' : 'hidden',
    };

    const { data: createdVenue, error: venueError } = await supabaseAdmin
      .from('venues')
      .insert([newVenue])
      .select('*')
      .single();

    if (venueError || !createdVenue) {
      return NextResponse.json({ success: false, error: venueError?.message || 'Failed to create venue' }, { status: 500 });
    }

    const ownershipPayload = {
      venue_id: createdVenue.id,
      owner_email: normalizedOwnerEmail,
      owner_user_id: ownerId,
      owner_full_name: ownerFullName,
      owner_phone: String(body.ownerPhoneNumber).trim(),
      alternate_phone: body.alternatePhoneNumber ? String(body.alternatePhoneNumber).trim() : null,
      business_name: body.businessName ? String(body.businessName).trim() : null,
      organization_type: body.organizationType ? String(body.organizationType).trim() : null,
      pan_gst: body.panOrGst ? String(body.panOrGst).trim() : null,
      internal_notes: body.internalNotes ? String(body.internalNotes).trim() : null,
      is_primary: true,
      is_active: true,
    };

    const { error: ownershipError } = await supabaseAdmin
      .from('venue_ownerships')
      .insert([ownershipPayload]);

    let ownershipMapped = true;
    if (ownershipError) {
      ownershipMapped = false;
      console.warn('Venue ownership insert skipped:', ownershipError.message);
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/owner/dashboard`;
    if (ownershipMapped) {
      await sendOwnerVenueAddedEmail({
        ownerEmail: normalizedOwnerEmail,
        ownerPassword: generatedPassword ?? '',
        ownerName: ownershipPayload.owner_full_name,
        venueName: createdVenue.name,
        dashboardUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: ownershipMapped
        ? 'Venue created and owner assigned successfully.'
        : 'Venue created successfully, but owner mapping is pending database migration.',
      data: {
        venue: createdVenue,
        ownerAssignment: ownershipPayload,
        ownershipMapped,
        ...(generatedPassword ? { ownerPassword: generatedPassword } : {}),
      },
    });
  } catch (error: any) {
    console.error('Admin venue create error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
