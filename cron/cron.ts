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
      const expireVeneueApprovalTiming = Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_APPROVAL_TIMING);
      const expireVeneuePaymentTiming = Number(process.env.NEXT_PUBLIC_EXPIRE_VENUE_PAYMENT_TIMING);
      const currentTimeMinusOneMinuteApproval = new Date(Date.now() - expireVeneueApprovalTiming * 60 * 1000).toISOString();
      const currentTimeMinusOneMinutePayment = new Date(Date.now() - expireVeneuePaymentTiming * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "expired", payment_status: "expired" })
        .eq("status", "pending")
        .lte("created_at", currentTimeMinusOneMinuteApproval)
        .select("id, status, payment_status, created_at, updated_at");
        data?.forEach((booking) => {
          console.log(
            `Expired booking ${booking.id} | created: ${booking.created_at} | expired: ${booking.updated_at}`
          );
        });
        const { data: paymentData} = await supabase
          .from("bookings")
          .update({ payment_status: "expired" , status: "expired" })
          .eq("status", "confirmed")
          .lte("approved_at", currentTimeMinusOneMinutePayment)
          .select("id, status, payment_status, created_at, updated_at");
          paymentData?.forEach((booking) => {
            console.log(
              `Expired payment booking ${booking.id} | created: ${booking.created_at} | expired: ${booking.updated_at}`
            );
          });
        console.log(`Expired ${data?.length} bookings`);
        console.log(`Expired ${paymentData?.length} payment bookings`);
      } catch (error) {
        console.error("Cron error:", error);
      }
});

console.log("cron started");