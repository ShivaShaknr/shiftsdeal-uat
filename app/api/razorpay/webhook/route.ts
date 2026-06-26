import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const razorpaySignature = req.headers.get("x-razorpay-signature");

    if (!razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay signature" },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);

    console.log("Razorpay webhook event:", event.event);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const bookingId = payment.notes?.booking_id;

      if (!bookingId) {
        return NextResponse.json(
          { success: false, error: "Booking ID missing in Razorpay notes" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          payment_status: "fully_paid",
          deposit_paid: true,   
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Webhook DB update failed:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Database update failed",
            details: error.message,
          },
          { status: 500 }
        );
      }

      console.log("Booking payment updated:", bookingId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Webhook failed",
      },
      { status: 500 }
    );
  }
}