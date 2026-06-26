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