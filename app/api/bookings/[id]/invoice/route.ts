import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paymentInvoicePdf } from '@/lib/communication/invoiceTemplates/paymentInvoice';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(
        `id, date, start_time, end_time, event_name, event_type, attendees, status,
         contact_name, contact_email, contact_phone,
         base_price, platform_fee, subtotal, gst_amount, total_amount,
         deposit_amount, balance_amount, razorpay_payment_id,
         venues(name, address_street, address_city, address_state)`
      )
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Invoice is available only for completed bookings' },
        { status: 400 }
      );
    }

    const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues;
    const venueAddress = venue
      ? [venue.address_street, venue.address_city, venue.address_state]
          .filter(Boolean)
          .join(', ')
      : '';

    const pdfBuffer = paymentInvoicePdf({
      bookingId: booking.id,
      venueName: venue?.name,
      venueAddress,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      eventName: booking.event_name,
      eventType: booking.event_type,
      attendees: booking.attendees,
      contactName: booking.contact_name,
      contactEmail: booking.contact_email,
      contactPhone: booking.contact_phone,
      basePrice: booking.base_price,
      platformFee: booking.platform_fee,
      subtotal: booking.subtotal,
      gstAmount: booking.gst_amount,
      totalAmount: booking.total_amount,
      depositAmount: booking.deposit_amount,
      balanceAmount: booking.balance_amount,
      status: booking.status,
      razorpayPaymentId: booking.razorpay_payment_id,
    });

    const fileName = `Invoice-${booking.id.substring(0, 8).toUpperCase()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Invoice download error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
