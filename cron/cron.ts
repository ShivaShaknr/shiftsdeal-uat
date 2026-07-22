import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

cron.schedule("* * * * *", async () => {
  try {
    const expireVenueApprovalTiming = 30
      // Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_APPROVAL_TIMING) || 1;
    const expireVenuePaymentTiming = 30
      // Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_PAYMENT_TIMING) || 1;
    const expireVenueRequestTiming = 
      // Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_REQUEST_TIMING) ||
      expireVenueApprovalTiming;

    const approvalCutoff = new Date(
      Date.now() - expireVenueApprovalTiming * 60 * 1000
    ).toISOString();
    const paymentCutoff = new Date(
      Date.now() - expireVenuePaymentTiming * 60 * 1000
    ).toISOString();
    const venueRequestCutoff = new Date(
      Date.now() - expireVenueRequestTiming * 60 * 1000
    ).toISOString();

    const { data: expiredBookings, error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "expired",
        payment_status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .lte("created_at", approvalCutoff)
      .select("id, status, payment_status, created_at, updated_at");

      expiredBookings?.forEach((booking) => {
        console.log(
          `Expired booking ${booking.id} | created: ${booking.created_at} | expired: ${booking.updated_at}`
        );
      });
      console.log(`Expired ${expiredBookings?.length ?? 0} bookings`);

    const { data: expiredPayments, error: paymentError } = await supabase
      .from("bookings")
      .update({
        payment_status: "expired",
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "confirmed")
      .eq("payment_status", "pending")
      .lte("approved_at", paymentCutoff)
      .select("id, status, payment_status, created_at, updated_at");

      expiredPayments?.forEach((booking) => {
        console.log(
          `Expired payment booking ${booking.id} | created: ${booking.created_at} | expired: ${booking.updated_at}`
        );
      });
    console.log(`Expired ${expiredPayments?.length ?? 0} payment bookings`);

    const { data: expiredVenueRequests, error: venueRequestError } = await supabase
      .from("venue_requests")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .lte("created_at", venueRequestCutoff)
      .select("id, status, created_at, updated_at");

      expiredVenueRequests?.forEach((request) => {
        console.log(
          `Expired venue request ${request.id} | created: ${request.created_at} | expired: ${request.updated_at}`
        );
      });
      console.log(`Expired ${expiredVenueRequests?.length ?? 0} venue requests`);
  } catch (error) {
    console.error("Cron error:", error);
  }
});

console.log("cron started");