import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        event_name,
        contact_name,
        contact_email,
        contact_phone,
        total_amount,
        payment_status,
        status
      `)
      .eq("id", id)
      .single();
    

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { success: false, error: "Booking is not approved yet" },
        { status: 400 }
      );
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Payment already completed" },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(Number(booking.total_amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: booking.id,
      notes: {
        booking_id: booking.id,
        payment_type: "full_payment",
      },
    });

    await supabaseAdmin
      .from("bookings")
      .update({
        razorpay_order_id: order.id,
        payment_status: "payment_started",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        event_name: booking.event_name,
        contact_name: booking.contact_name,
        contact_email: booking.contact_email,
        contact_phone: booking.contact_phone,
      },
    });
  } catch (error: any) {
    console.error("Create payment order error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}