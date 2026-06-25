import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ADMIN_SESSION_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to check admin auth
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('sd_admin_token');
  return token?.value === ADMIN_SESSION_TOKEN;
}

// PATCH - Update booking payment status and admin fields
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

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle deposit paid status
    if (body.deposit_paid !== undefined) {
      updateData.deposit_paid = body.deposit_paid;
      if (body.deposit_paid) {
        updateData.deposit_paid_at = new Date().toISOString();
        updateData.payment_status = 'deposit_paid';
      } else {
        updateData.deposit_paid_at = null;
        updateData.payment_status = 'pending';
      }
    }

    // Handle balance paid status
    if (body.balance_paid !== undefined) {
      updateData.balance_paid = body.balance_paid;
      if (body.balance_paid) {
        updateData.balance_paid_at = new Date().toISOString();
        updateData.payment_status = 'fully_paid';
        updateData.status = 'completed'; // Mark booking as completed when fully paid
      } else {
        updateData.balance_paid_at = null;
        updateData.status = 'confirmed'; // Revert to confirmed if balance unmarked
        // Keep deposit_paid status if balance is unmarked
        if (body.deposit_paid || body.deposit_paid === undefined) {
          updateData.payment_status = 'deposit_paid';
        }
      }
    }

    // Handle follow-up sent status
    if (body.follow_up_sent !== undefined) {
      updateData.follow_up_sent = body.follow_up_sent;
      if (body.follow_up_sent) {
        updateData.follow_up_sent_at = new Date().toISOString();
      } else {
        updateData.follow_up_sent_at = null;
      }
    }

    // Handle admin notes
    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes;
    }

    // Handle booking status
    if (body.status) {
      updateData.status = body.status;
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Booking updated successfully',
    });
  } catch (error: any) {
    console.error('Admin booking update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get single booking with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`*, venues (*)`)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Get owner and renter info
    const userIds = [booking.venues?.owner_id, booking.renter_id].filter(Boolean);
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .in('id', userIds);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        owner: usersMap.get(booking.venues?.owner_id) || null,
        renter: usersMap.get(booking.renter_id) || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
