import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ownerId = String(body.ownerId || '').trim();

    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Owner ID is required' }, { status: 400 });
    }

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, owner_id')
      .eq('id', id)
      .maybeSingle();

    if (venueError || !venue) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 });
    }

    const isDirectOwner = venue.owner_id === ownerId;

    let isMappedOwner = false;
    const { data: ownershipRow, error: ownershipError } = await supabase
      .from('venue_ownerships')
      .select('id')
      .eq('venue_id', id)
      .eq('owner_user_id', ownerId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!ownershipError && ownershipRow) {
      isMappedOwner = true;
    }

    if (!isDirectOwner && !isMappedOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden: You can only edit your own venue inventory.' }, { status: 403 });
    }

    const allowedFields = [
      'availability',
      'inventory_visibility',
      'pricing_hourly',
      'pricing_half_day',
      'pricing_full_day',
      'pricing_per_slot',
      'min_booking_hours',
      'available_timings',
      'capacity_min',
      'capacity_max',
      'amenities',
      'rules_restrictions',
      'cancellation_policy',
      'description',
      'google_maps_link',
      'images',
      'videos',
      'booking_slots',
      'blocked_dates',
    ] as const;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (field in body) {
        updatePayload[field] = body[field];
      }
    }

    if (Array.isArray(body.images) || typeof body.images === 'string') {
      updatePayload.images = Array.isArray(body.images)
        ? body.images
        : String(body.images).split(',').map((value: string) => value.trim()).filter(Boolean);
    }

    if (Array.isArray(body.videos) || typeof body.videos === 'string') {
      updatePayload.videos = Array.isArray(body.videos)
        ? body.videos
        : String(body.videos).split(',').map((value: string) => value.trim()).filter(Boolean);
    }

    const minCap = Number(updatePayload.capacity_min);
    const maxCap = Number(updatePayload.capacity_max);
    if (
      Number.isFinite(minCap) &&
      Number.isFinite(maxCap) &&
      minCap > 0 &&
      maxCap > 0 &&
      minCap > maxCap
    ) {
      return NextResponse.json({ success: false, error: 'Capacity min cannot be greater than capacity max.' }, { status: 400 });
    }

    const { data: updatedVenue, error: updateError } = await supabase
      .from('venues')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedVenue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
