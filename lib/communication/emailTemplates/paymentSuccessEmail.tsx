import { formatRupeeHtml } from "@/lib/utils";

export function paymentSuccessEmail({
  contactName,
  eventName,
  amount,
  razorpayPaymentId,
  razorpayOrderId,
}: {
  contactName?: string;
  eventName?: string;
  amount?: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px">
      <h2 style="color:#16a34a;margin-bottom:8px">Payment Successful</h2>

      <p>Hi ${contactName || "Customer"},</p>

      <p>Your payment has been captured successfully.</p>

      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0">
        <p><strong>Event:</strong> ${eventName || "-"}</p>
        <p><strong>Amount Paid:</strong> ${formatRupeeHtml(amount ? amount / 100 : 0)}</p>
        <p><strong>Razorpay Payment ID:</strong> ${razorpayPaymentId || "-"}</p>
        <p><strong>Razorpay Order ID:</strong> ${razorpayOrderId || "-"}</p>
      </div>

      <p>Your invoice is attached as a PDF. You can download it from this email.</p>

      <p style="margin-top:24px;">Thank you for booking with ShiftsDeal.</p>

      <p style="font-size:13px;color:#666;margin-top:24px">
        This is an automated email. Please do not reply.
      </p>
    </div>
  `;
}
