import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to create user in auth + public.users
async function createOrGetUser(email: string, password: string, name: string, role: 'owner' | 'renter') {
  // Check if auth user exists
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
  let authUser = authList?.users?.find(u => u.email === email);

  if (!authUser) {
    // Create new auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) throw new Error(`Auth create failed for ${email}: ${error.message}`);
    authUser = data.user;
  }

  // Upsert to public.users table
  const { error: upsertError } = await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    email,
    name,
    role,
  });
  if (upsertError) throw new Error(`User upsert failed for ${email}: ${upsertError.message}`);

  return authUser;
}

// POST - Create test users and link venues
export async function POST() {
  try {
    // 1. Create/get owner user
    const ownerUser = await createOrGetUser('owner@shiftsdeal.com', 'owner123', 'Venue Owner', 'owner');

    // 2. Create/get renter user
    const renterUser = await createOrGetUser('renter@shiftsdeal.com', 'renter123', 'Test Renter', 'renter');

    // 3. Link ALL venues to the owner
    const { data: updatedVenues, error: updateError } = await supabaseAdmin
      .from('venues')
      .update({ owner_id: ownerUser.id })
      .is('owner_id', null)  // Only update venues with NULL owner_id
      .select('id, name');

    if (updateError) {
      throw new Error(`Venue update failed: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Test users setup complete',
      owner: { id: ownerUser.id, email: ownerUser.email },
      renter: { id: renterUser.id, email: renterUser.email },
      venuesLinked: updatedVenues?.length || 0,
      credentials: {
        owner: { email: 'owner@shiftsdeal.com', password: 'owner123' },
        renter: { email: 'renter@shiftsdeal.com', password: 'renter123' },
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check test users status
export async function GET() {
  try {
    const { data: users } = await supabaseAdmin.from('users').select('id, email, name, role');
    const { data: venues } = await supabaseAdmin.from('venues').select('id, name, owner_id');
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    return NextResponse.json({
      success: true,
      publicUsers: users,
      authUsers: authUsers?.users?.map(u => ({ id: u.id, email: u.email })),
      venueCount: venues?.length,
      venuesWithOwner: venues?.filter(v => v.owner_id).length,
      venuesWithoutOwner: venues?.filter(v => !v.owner_id).length,
      testCredentials: {
        owner: { email: 'owner@shiftsdeal.com', password: 'owner123' },
        renter: { email: 'renter@shiftsdeal.com', password: 'renter123' },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
