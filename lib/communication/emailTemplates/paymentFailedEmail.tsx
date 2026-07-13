export function paymentFailedEmail({
    contactName,
    eventName,
    amount,
    bookingId,
  }: {
    contactName?: string;
    eventName?: string;
    amount?: number;
    bookingId?: string;
  }) {
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
          <div style="width:72px;height:72px;line-height:72px;margin:0 auto 18px;border-radius:50%;color:#16803c;font-size:28px;font-weight:700;">
            <img src="https://cdn-icons-png.flaticon.com/128/12701/12701554.png" alt="Check" style="width:100%;height:100%;" />
          </div>
          <h1 style="margin:0;color:#111827;font-size:18px;line-height:1.3;font-weight:700;">
            Payment Failed
          </h1>
          <p style="margin:10px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
            Your payment failed. Please try again.
          </p>
        </div>

          <!-- Body -->

          <div style="padding:0 30px 32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:13px;line-height:1.7;">
              Hi <strong style="color:#111827;">${contactName || "Customer"}</strong>,
              <br />
              <br />
              Thank you for booking with ShiftsDeal. Your payment has been failed for <strong>${eventName || "-"} (${amount || 0} Rs) </strong>. Please try again.
            </p>

            <!-- Event -->

            <div style="margin-bottom:10px;border-radius:12px;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
                Booking ID
              </p>
              <p style="margin:0;color:#111827;font-size:13px;line-height:1.5;font-weight:600;">
                ${bookingId || "-"}
              </p>
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