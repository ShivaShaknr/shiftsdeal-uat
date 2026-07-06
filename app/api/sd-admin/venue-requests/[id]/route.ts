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

// PATCH - Approve, reject, or edit venue request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, admin_notes, rejection_reason, ...updateData } = body;

    // Handle edit action for updating venue request details
    if (action === 'edit') {
      const allowedFields = [
        'name', 'type', 'description', 'capacity_min', 'capacity_max',
        'address_street', 'address_city', 'address_state', 'address_pincode',
        'images', 'pricing_hourly', 'pricing_half_day', 'pricing_full_day',
        'security_deposit', 'amenities', 'rules', 'commission_percentage'
      ];

      // Filter allowed fields from updateData
      const filteredData: any = {};
      allowedFields.forEach(field => {
        if (field in updateData) {
          filteredData[field] = updateData[field];
        }
      });

      if (admin_notes !== undefined) {
        filteredData.admin_notes = admin_notes;
      }

      filteredData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('venue_requests')
        .update(filteredData)
        .eq('id', id)
        .select('*, users!venue_requests_owner_id_fkey(id, name, email)')
        .single();

      if (error) {
        console.error('Error updating venue request:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Venue request updated successfully',
        data: { ...data, owner: data.users, users: undefined },
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve", "reject", or "edit"' },
        { status: 400 }
      );
    }

    // Get the venue request
    const { data: venueRequest, error: fetchError } = await supabaseAdmin
      .from('venue_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !venueRequest) {
      return NextResponse.json(
        { success: false, error: 'Venue request not found' },
        { status: 404 }
      );
    }

    if (venueRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      let availability: 'available' | 'hidden' = 'hidden';
      if (venueRequest.owner_id) {
        const { data: owner } = await supabaseAdmin
          .from('users')
          .select('upi_id, bank_account_number, bank_ifsc')
          .eq('id', venueRequest.owner_id)
          .single();
        const hasPayment = !!(
          owner?.upi_id?.trim() ||
          (owner?.bank_account_number?.trim() && owner?.bank_ifsc?.trim())
        );
        if (hasPayment) availability = 'available';
      }

      // Create the venue in the venues table
      const newVenue = {
        owner_id: venueRequest.owner_id,
        name: venueRequest.name,
        type: venueRequest.type,
        description: venueRequest.description,
        images: venueRequest.images,
        address_street: venueRequest.address_street,
        address_city: venueRequest.address_city,
        address_state: venueRequest.address_state,
        address_pincode: venueRequest.address_pincode,
        address_country: venueRequest.address_country,
        capacity_min: venueRequest.capacity_min,
        capacity_max: venueRequest.capacity_max,
        pricing_hourly: venueRequest.pricing_hourly,
        pricing_half_day: venueRequest.pricing_half_day,
        pricing_full_day: venueRequest.pricing_full_day,
        amenities: venueRequest.amenities,
        commission_percentage: venueRequest.commission_percentage ?? 0,
        availability,
        rating: 4.8 + Math.random() * 0.2, // Random rating between 4.8 and 5.0 for new venues
        reviews_count: 0,
      };

      const { data: venue, error: venueError } = await supabaseAdmin
        .from('venues')
        .insert([newVenue])
        .select()
        .single();

      if (venueError) {
        console.error('Error creating venue:', venueError);
        return NextResponse.json(
          { success: false, error: 'Failed to create venue: ' + venueError.message },
          { status: 500 }
        );
      }

      // Update venue request status
      const { error: updateError } = await supabaseAdmin
        .from('venue_requests')
        .update({
          status: 'approved',
          admin_notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Venue approved and published successfully!',
        data: { venueRequest: { ...venueRequest, status: 'approved' }, venue },
      });
    } else {
      // Reject the request
      if (!rejection_reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('venue_requests')
        .update({
          status: 'rejected',
          admin_notes,
          rejection_reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Venue request rejected',
        data: { ...venueRequest, status: 'rejected', rejection_reason },
      });
    }
  } catch (error: any) {
    console.error('Admin venue request PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
