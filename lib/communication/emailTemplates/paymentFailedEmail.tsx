export function paymentFailedEmail({
    contactName,
    eventName,
    amount,
  }: {
    contactName?: string;
    eventName?: string;
    amount?: number;
  }) {
    return `
      <div style="background:#f6f7fb;font-family:Calibri, Arial, sans-serif;">
      <div style="max-width:650px;margin:0 auto;background:#ffffff;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.06);">

      <!-- Failed Header -->
      <div style="background:linear-gradient(135deg,#991b1b,#dc2626);padding:28px 20px;color:#ffffff;">
        <h1 style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.3px;">
          Payment Failed
        </h1>
        <p style="margin:8px 0 0;font-size:12px;opacity:0.95;">
          Your booking payment was not completed.
        </p>
      </div>

      <!-- Body -->
      <div style="padding:20px;">
                
        <!-- Logo Header -->
        <img 
          src="https://www.shiftsdeal.com/_next/image?url=%2Flogo-light.png&w=256&q=75" 
          alt="ShiftsDeal" 
          style="width:120px"
        />
        <p style="font-size:13px;color:#111827;">
          Hi <strong>${contactName || "Customer"}</strong>,
        </p>

        <p style="font-size:12px;line-height:1.6;color:#4b5563;margin:0 0 24px;">
          Your payment could not be completed. Please try again to confirm your booking.
        </p>

        <!-- Amount Box -->
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:22px 20px;margin-bottom:24px;text-align:center;">
          <div style="display:inline-block;background:#fee2e2;color:#991b1b;font-size:10px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:6px 12px;margin-bottom:12px;">
            Payment Amount
          </div>

          <div style="font-size:20px;line-height:1.2;color:#dc2626;font-weight:800;margin:0;">
            ₹${amount ? amount / 100 : 0}
          </div>

          <p style="font-size:11px;color:#4b5563;margin:10px 0 0;">
            Payment was not successful
          </p>
        </div>

        <!-- Details -->
        <div style="border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
          <div style="display:flex;padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <div style="width:42%;font-size:11px;color:#6b7280;">Event</div>
            <div style="width:58%;font-size:11px;color:#111827;font-weight:600;">
              ${eventName || "-"}
            </div>
          </div>

          <div style="display:flex;padding:14px 18px;border-bottom:1px solid #e5e7eb;">
            <div style="width:42%;font-size:11px;color:#6b7280;">Status</div>
            <div style="width:58%;font-size:11px;color:#dc2626;font-weight:700;">
              Failed
            </div>
          </div>

          <div style="display:flex;padding:14px 18px;background:#f9fafb;">
            <div style="width:42%;font-size:11px;color:#6b7280;">Reason</div>
            <div style="width:58%;font-size:11px;color:#111827;font-weight:600;">
              ${"Payment has been declined"}
            </div>
          </div>
        </div>

        <div style="background:#fff7ed;border:1px solid #fed7aa;padding:16px;margin-bottom:24px;">
          <p style="font-size:11px;line-height:1.6;color:#9a3412;margin:0;">
            Please try again using another payment method. Your booking will be confirmed only after successful payment.
          </p>
        </div>

        <p style="font-size:11px;color:#111827;margin:0;">
          Thank you for choosing <strong>ShiftsDeal</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:10px;color:#6b7280;margin:0 0 6px;">
          This is an automated email. Please do not reply.
        </p>
        <p style="font-size:10px;color:#9ca3af;margin:0;">
          © ShiftsDeal
        </p>
      </div>

    </div>
  </div>
    `;
  }