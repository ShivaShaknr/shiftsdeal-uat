import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .select('payment_method, upi_id, bank_account_name, bank_account_number, bank_ifsc, payment_contact_email')
    .eq('id', userId)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      payment_method,
      upi_id,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      payment_contact_email,
    } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const contactEmail = payment_contact_email?.trim() || null;

    if (payment_method === 'upi') {
      const { data, error } = await supabase
        .from('users')
        .update({
          payment_method: 'upi',
          upi_id: upi_id?.trim() || null,
          bank_account_name: null,
          bank_account_number: null,
          bank_ifsc: null,
          payment_contact_email: contactEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('payment_method, upi_id, bank_account_name, bank_account_number, bank_ifsc, payment_contact_email')
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (upi_id?.trim()) {
        await supabase
          .from('venues')
          .update({ availability: 'available', updated_at: new Date().toISOString() })
          .eq('owner_id', userId);
      }

      return NextResponse.json({ success: true, data });
    }

    if (payment_method === 'bank') {
      const { data, error } = await supabase
        .from('users')
        .update({
          payment_method: 'bank',
          upi_id: null,
          bank_account_name: bank_account_name?.trim() || null,
          bank_account_number: bank_account_number?.trim() || null,
          bank_ifsc: bank_ifsc?.trim().toUpperCase() || null,
          payment_contact_email: contactEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('payment_method, upi_id, bank_account_name, bank_account_number, bank_ifsc, payment_contact_email')
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (bank_account_number?.trim() && bank_ifsc?.trim()) {
        await supabase
          .from('venues')
          .update({ availability: 'available', updated_at: new Date().toISOString() })
          .eq('owner_id', userId);
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
