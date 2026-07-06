import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sd_admin_token')?.value;
  return token === ADMIN_TOKEN;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: venue, error } = await supabase
      .from('venues')
      .select(`
        *,
        owner:users!venues_owner_id_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: ownerships } = await supabase
      .from('venue_ownerships')
      .select('*')
      .eq('venue_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ success: true, data: venue, ownerships: ownerships || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, admin_notes, ...updateData } = body;

    const finalUpdateData: any = { updated_at: new Date().toISOString() };

    // Handle simple availability actions (existing functionality)
    if (action) {
      switch (action) {
        case 'hide':
          finalUpdateData.availability = 'hidden';
          break;
        case 'show':
          finalUpdateData.availability = 'available';
          break;
        case 'maintenance':
          finalUpdateData.availability = 'maintenance';
          break;
        case 'disable':
          finalUpdateData.is_disabled = true;
          break;
        case 'enable':
          finalUpdateData.is_disabled = false;
          break;
        case 'archive':
          finalUpdateData.is_archived = true;
          break;
        case 'unarchive':
          finalUpdateData.is_archived = false;
          break;
        case 'reassignOwner': {
          const ownerEmail = String(updateData.owner_email || '').trim().toLowerCase();
          const ownerFullName = String(updateData.owner_full_name || '').trim();
          const ownerPhone = String(updateData.owner_phone || '').trim();

          if (!ownerEmail || !ownerFullName || !ownerPhone) {
            return NextResponse.json({ success: false, error: 'owner_email, owner_full_name, and owner_phone are required' }, { status: 400 });
          }

          const { data: ownerUser } = await supabase
            .from('users')
            .select('id, role, upi_id, bank_account_number, bank_ifsc')
            .eq('email', ownerEmail)
            .maybeSingle();

          const hasPayment = !!(
            ownerUser?.upi_id?.trim() ||
            (ownerUser?.bank_account_number?.trim() && ownerUser?.bank_ifsc?.trim())
          );

          if (ownerUser?.id && ownerUser.role !== 'owner') {
            await supabase
              .from('users')
              .update({ role: 'owner', updated_at: new Date().toISOString() })
              .eq('id', ownerUser.id);
          }

          await supabase
            .from('venue_ownerships')
            .update({ is_primary: false, updated_at: new Date().toISOString() })
            .eq('venue_id', id)
            .eq('is_primary', true);

          const { error: upsertOwnershipError } = await supabase
            .from('venue_ownerships')
            .upsert({
              venue_id: id,
              owner_email: ownerEmail,
              owner_user_id: ownerUser?.id ?? null,
              owner_full_name: ownerFullName,
              owner_phone: ownerPhone,
              alternate_phone: updateData.alternate_phone ? String(updateData.alternate_phone).trim() : null,
              business_name: updateData.business_name ? String(updateData.business_name).trim() : null,
              organization_type: updateData.organization_type ? String(updateData.organization_type).trim() : null,
              pan_gst: updateData.pan_gst ? String(updateData.pan_gst).trim() : null,
              internal_notes: updateData.internal_notes ? String(updateData.internal_notes).trim() : null,
              is_primary: true,
              is_active: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'venue_id,owner_email', ignoreDuplicates: false });

          if (upsertOwnershipError) {
            return NextResponse.json({ success: false, error: upsertOwnershipError.message }, { status: 500 });
          }

          finalUpdateData.owner_id = ownerUser?.id ?? null;
          finalUpdateData.availability = hasPayment ? 'available' : 'hidden';
          break;
        }
        case 'edit':
          // Handle full venue editing
          const allowedFields = [
            'name', 'type', 'description', 'capacity_min', 'capacity_max',
            'address_street', 'address_city', 'address_state', 'address_pincode',
            'images', 'pricing_hourly', 'pricing_half_day', 'pricing_full_day',
            'amenities', 'availability', 'videos',
            'google_maps_link', 'min_booking_hours', 'available_timings',
            'pricing_per_slot', 'rules_restrictions', 'cancellation_policy',
            'gst_number', 'is_archived', 'is_disabled', 'commission_percentage'
          ];

          // Filter allowed fields from updateData
          allowedFields.forEach(field => {
            if (field in updateData) {
              finalUpdateData[field] = updateData[field];
            }
          });
          break;
        default:
          return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }
    } else {
      // Handle direct field updates (for backward compatibility)
      const allowedFields = [
        'name', 'type', 'description', 'capacity_min', 'capacity_max',
        'address_street', 'address_city', 'address_state', 'address_pincode',
        'images', 'pricing_hourly', 'pricing_half_day', 'pricing_full_day',
        'amenities', 'availability', 'videos',
        'google_maps_link', 'min_booking_hours', 'available_timings',
        'pricing_per_slot', 'rules_restrictions', 'cancellation_policy',
        'gst_number', 'is_archived', 'is_disabled', 'commission_percentage', 'owner_id'
      ];

      allowedFields.forEach(field => {
        if (field in updateData) {
          finalUpdateData[field] = updateData[field];
        }
      });
    }

    if (admin_notes) {
      // Note: admin_notes column may not exist, so we'll skip it if not needed
      // finalUpdateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('venues')
      .update(finalUpdateData)
      .eq('id', id)
      .select(`
        *,
        owner:users!venues_owner_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating venue:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Admin venue update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // First check if there are any bookings for this venue
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('venue_id', id)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete venue with existing bookings. Hide it instead.',
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting venue:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Venue deleted successfully' });
  } catch (error: any) {
    console.error('Admin venue delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
