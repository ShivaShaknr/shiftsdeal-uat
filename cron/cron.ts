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
      const expireVenuePaymentTiming = Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_PAYMENT_TIMING || 1440);
      const currentTimeMinusOneMinute = new Date(Date.now() - expireVenuePaymentTiming * 60 * 1000).toISOString();
  
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("status", "pending")
        .lte("created_at", currentTimeMinusOneMinute)
        .select("id, status, payment_status, created_at, updated_at");
      if (error) {
        console.error("Cron update error:", error);
        return;
      }
      data?.forEach((booking) => {
        console.log(
          `Cancelled booking ${booking.id} | created: ${booking.created_at} | cancelled: ${booking.updated_at}`
        );
      });
    } catch (error) {
      console.error("Cron error:", error);
    }
  });

console.log("cron started");