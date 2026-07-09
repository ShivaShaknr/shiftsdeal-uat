import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("venue_id, date, start_time, end_time")
      .eq("id", id)
      .single();

    if (!bookingData) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    await supabase
      .from("bookings")
      .update({
        payment_inprogress: false,
        updated_at: new Date().toISOString(),
      })
      .eq("venue_id", bookingData.venue_id)
      .eq("date", bookingData.date)
      .lt("start_time", bookingData.end_time)
      .gt("end_time", bookingData.start_time)
      .neq("id", id)
      .in("status", ["pending", "confirmed"]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bookingId = id;
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    console.log(bookingData,'bookingData');
    // TODO: later get actual amount from database using bookingId
    const amount = bookingData?.total_amount; // ₹500 test amount

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay needs paise
      currency: "INR",
      receipt: bookingId.replace(/-/g, "").slice(0, 40),
      notes: {
        booking_id: bookingId,
      },
    });
    await supabase
      .from("bookings")
      .update({
        payment_inprogress: true,
        updated_at: new Date().toISOString(),
      })
      .eq("venue_id", bookingData?.venue_id)
      .eq("date", bookingData?.date)
      .lt("start_time", bookingData?.end_time)
      .gt("end_time", bookingData?.start_time)
      .neq("id", bookingId)
      .in("status", ["pending", "confirmed"])
      .select("id, event_name, date, venue_id, start_time, end_time, status, payment_status, payment_inprogress");

    return NextResponse.json({
      success: true,
      data: {
        booking_id: bookingId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error: any) {
    console.error("Razorpay order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}