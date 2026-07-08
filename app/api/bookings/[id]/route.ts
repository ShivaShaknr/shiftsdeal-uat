import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/communication/sendMail';
import { venueApprovedEmail } from '@/lib/communication/emailTemplates/venueApprovedEmail';
import { venueRejectedEmail } from '@/lib/communication/emailTemplates/venueRejectedEmail';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to extract file path from Supabase Storage URL
function extractFilePath(url: string, bucket: string): string | null {
  if (!url || url === 'pending') return null;
  
  // URL format: http://127.0.0.1:54321/storage/v1/object/public/bucket-name/path/to/file
  const bucketPath = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(bucketPath);
  if (index !== -1) {
    return url.substring(index + bucketPath.length);
  }
  return null;
}

// GET - Fetch a single booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, venues(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, approved_at } = body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // First, get the booking to retrieve KYC file paths
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('kyc_document_url, kyc_face_photo_url')
      .eq('id', id)
      .single();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      approved_at: approved_at ? new Date(Number(approved_at)) : null,
    };

    if (notes) {
      updateData.owner_notes = notes;
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, venues(name)')
      .single();

    if (error) {
      console.error('Booking update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    if (status === 'confirmed' && booking.contact_email) {
      try {
        await sendMail({
          to: booking.contact_email,
          subject: 'Booking Approved - Shifts Deal',
          html: venueApprovedEmail({
            contactName: booking.contact_name,
            eventName: booking.event_name,
            venueName: booking.venues?.name || 'Venue',
          }),
        });
      } catch (emailError) {
        console.error('Booking approval email failed:', emailError);
      }
    }
    if (status === 'cancelled' && booking.contact_email) {
      try {
        await sendMail({
          to: booking.contact_email,
          subject: 'Booking Cancelled - Shifts Deal',
          html: venueRejectedEmail({
            contactName: booking.contact_name,
            eventName: booking.event_name,
            venueName: booking.venues?.name || 'Venue',
          }),
        });
      } catch (emailError) {
        console.error('Booking cancellation email failed:', emailError);
      }
    }

    // Delete KYC files after approve/reject (when status changes from pending)
    if (existingBooking && (status === 'confirmed' || status === 'cancelled')) {
      const filesToDelete: { bucket: string; path: string }[] = [];

      // Extract file paths from URLs
      const docPath = extractFilePath(existingBooking.kyc_document_url, 'kyc-documents');
      const photoPath = extractFilePath(existingBooking.kyc_face_photo_url, 'kyc-photos');

      if (docPath) {
        const { error: docDeleteError } = await supabaseAdmin.storage
          .from('kyc-documents')
          .remove([docPath]);
        if (docDeleteError) {
          console.error('Failed to delete KYC document:', docDeleteError);
        }
      }

      if (photoPath) {
        const { error: photoDeleteError } = await supabaseAdmin.storage
          .from('kyc-photos')
          .remove([photoPath]);
        if (photoDeleteError) {
          console.error('Failed to delete KYC photo:', photoDeleteError);
        }
      }

      // Clear the URLs in the database
      await supabaseAdmin
        .from('bookings')
        .update({
          kyc_document_url: 'deleted',
          kyc_face_photo_url: 'deleted',
        })
        .eq('id', id);

      console.log('KYC files deleted for booking:', id);
    }

    return NextResponse.json({
      success: true,
      data: booking,
      // razorpay_payment_link_id: paymentLink?.id || null,
      // razorpay_payment_link_url: paymentLink?.short_url || null,
      message: `Booking ${status === 'confirmed' ? 'approved' : status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a booking and associated files
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, get the booking to retrieve KYC file paths
    const { data: existingBooking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('kyc_document_url, kyc_face_photo_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Delete KYC files from storage if they exist
    if (existingBooking) {
      const docPath = extractFilePath(existingBooking.kyc_document_url, 'kyc-documents');
      const photoPath = extractFilePath(existingBooking.kyc_face_photo_url, 'kyc-photos');

      if (docPath) {
        const { error: docDeleteError } = await supabaseAdmin.storage
          .from('kyc-documents')
          .remove([docPath]);
        if (docDeleteError) {
          console.error('Failed to delete KYC document:', docDeleteError);
        }
      }

      if (photoPath) {
        const { error: photoDeleteError } = await supabaseAdmin.storage
          .from('kyc-photos')
          .remove([photoPath]);
        if (photoDeleteError) {
          console.error('Failed to delete KYC photo:', photoDeleteError);
        }
      }
    }

    // Delete the booking from database
    const { error: deleteError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Booking delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete booking' },
        { status: 500 }
      );
    }

    console.log('Booking deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
