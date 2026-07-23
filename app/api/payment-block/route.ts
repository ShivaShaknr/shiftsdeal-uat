import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setOthersPaymentInProgress(
  bookingId: string,
  inProgress: boolean
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("venue_id, date, start_time, end_time, payment_inprogress")
    .eq("id", bookingId)
    .single();

  if (!booking) return null;

  await supabase
    .from("bookings")
    .update({
      payment_inprogress: inProgress,
      updated_at: new Date().toISOString(),
    })
    .eq("venue_id", booking.venue_id)
    .eq("date", booking.date)
    .lt("start_time", booking.end_time)
    .gt("end_time", booking.start_time)
    .neq("id", bookingId)
    .in("status", ["pending", "confirmed"]);
  return booking;
}

// Block other renters when Pay Now is clicked
export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    const booking = await setOthersPaymentInProgress(bookingId, true);

    console.log(booking,'booking**************'); 

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Unblock when payment modal is closed
export async function DELETE(req: Request) {
  try {
    const { bookingId } = await req.json();
    await setOthersPaymentInProgress(bookingId, false);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
