import { formatRupeeHtml } from "@/lib/utils";

export function paymentSuccessEmail({
  address,
  contactName,
  eventName,
  amount,
  razorpayPaymentId,
  razorpayOrderId,
  venueName,
}: {
  address?: string;
  contactName?: string;
  eventName?: string;
  amount?: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  venueName?: string;
}) {
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(address || "")}`;
  return `
   <div style="margin:0;padding:32px 12px;background:#f3f4f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.08);">

    <!-- Header -->

    <div style="padding:32px 30px 24px;text-align:center;background:#ffffff;">
      <img
        src="https://www.shiftsdeal.com/_next/image?url=%2Flogo-light.png&w=256&q=75"
        alt="ShiftsDeal"
        style="display:block;width:180px;height:auto;margin:0 auto 28px;"
      />
      <div style="width:72px;height:72px;line-height:72px;margin:0 auto 18px;background:#ecfdf3;border-radius:50%;color:#16803c;font-size:28px;font-weight:700;">
        <img src="https://cdn-icons-png.flaticon.com/512/7518/7518748.png" alt="Check" style="width:100%;height:100%;" />
      </div>
      <h1 style="margin:0;color:#111827;font-size:18px;line-height:1.3;font-weight:700;">
        Payment successful
      </h1>
      <p style="margin:10px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
        Your payment was received and your booking is now confirmed.
      </p>
    </div>

    <!-- Body -->

    <div style="padding:0 30px 32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:13px;line-height:1.7;">
        Hi <strong style="color:#111827;">${contactName || "Customer"}</strong>,
        <br />
        Thank you for booking with ShiftsDeal. Here is your payment confirmation.
      </p>

      <!-- Amount -->

      <div style="padding:26px 20px;margin-bottom:22px;background:#111827;border-radius:14px;text-align:center;">
        <p style="margin:0 0 8px;color:#d1d5db;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
          Total amount paid
        </p>
        <div style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:800;">
          ₹${((amount || 0) / 100).toLocaleString("en-IN")}
        </div>
        <p style="margin:10px 0 0;color:#86efac;font-size:11px;font-weight:600;">
          Payment completed successfully
        </p>
      </div>

      <!-- Event -->

      <div style="padding:17px 18px;margin-bottom:10px;border-radius:12px;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
          Event
        </p>
        <p style="margin:0;color:#111827;font-size:13px;line-height:1.5;font-weight:600;">
          ${eventName || "-"}
        </p>
      </div>

      <!-- Payment ID -->

      <div style="padding:17px 18px;margin-bottom:10px;border-radius:12px;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
          Payment ID
        </p>
        <p style="margin:0;color:#111827;font-size:12px;line-height:1.5;font-weight:600;word-break:break-all;">
          ${razorpayPaymentId || "-"}
        </p>
      </div>

      <!-- Order ID -->

      <div style="padding:17px 18px;margin-bottom:10px;border-radius:12px;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
          Order ID
        </p>
        <p style="margin:0;color:#111827;font-size:12px;line-height:1.5;font-weight:600;word-break:break-all;">
          ${razorpayOrderId || "-"}
        </p>
      </div>
      <!-- Address -->
      <div style="padding:17px 18px;margin-bottom:10px;border-radius:12px;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
          Address
        </p>
        <p style="margin:0;color:#111827;font-size:12px;line-height:1.5;font-weight:600;word-break:break-all;">
          ${venueName || "-"}, 
          <br/>
          ${address || "-"}
        </p>
      </div>

      <!------Get directions to the venue------->
      <div style="padding:17px 18px;margin-bottom:10px;border-radius:12px;">
      <a
          href="${mapUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block;color:#ffffff;font-size:12px;line-height:1.5;font-weight:600;text-decoration:none;background:#111827;padding:10px 20px;border-radius:5px;"
        >
          Get Directions
      </a>
      </div>
      <p style="margin:24px 0 0;color:#4b5563;font-size:12px;line-height:1.7;">
        Thank you,<br />
        <strong style="color:#111827;">The ShiftsDeal Team</strong>
      </p>
    </div>   
  </div>
</div>
  `;
}
