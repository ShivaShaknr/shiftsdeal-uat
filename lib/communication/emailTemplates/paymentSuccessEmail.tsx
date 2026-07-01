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
       <div style="background:#f6f7fb;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:650px;margin:0 auto;background:#ffffff;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0f7a2f,#16a34a);padding:28px 32px;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
          Payment Successful
        </h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">
          Your booking payment has been received successfully.
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
         <img src="https://www.shiftsdeal.com/_next/image?url=%2Flogo-light.png&w=256&q=75" />
         
         <br><br>
         
        <p style="font-size:16px;color:#111827;margin:0 0 16px;">
          Hi <strong>${contactName || "Customer"}</strong>,
        </p>

        <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px;">
          Thank you for your payment. Your booking has been confirmed.
        </p>

       <!-- Amount Box -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:22px 20px;margin-bottom:24px;text-align:center;">
          <div style="display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:6px 12px;margin-bottom:12px;">
            Amount Paid
          </div>
        
          <div style="font-size:30px;line-height:1.2;color:#15803d;font-weight:800;margin:0;">
                ₹${amount ? amount / 100 : 0}
          </div>
        
          <p style="font-size:13px;color:#4b5563;margin:10px 0 0;">
            Payment completed successfully
          </p>
        </div>
        <!-- Details -->
        <div style="border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
          <div style="display:flex;padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <div style="width:42%;font-size:14px;color:#6b7280;">Event</div>
            <div style="width:58%;font-size:14px;color:#111827;font-weight:600;">${eventName || "-"}</div>
          </div>

          <div style="display:flex;padding:14px 18px;border-bottom:1px solid #e5e7eb;">
            <div style="width:42%;font-size:14px;color:#6b7280;">Payment ID</div>
            <div style="width:58%;font-size:14px;color:#111827;font-weight:600;word-break:break-all;">${razorpayPaymentId || "-"}</div>
          </div>

          <div style="display:flex;padding:14px 18px;background:#f9fafb;">
            <div style="width:42%;font-size:14px;color:#6b7280;">Order ID</div>
            <div style="width:58%;font-size:14px;color:#111827;font-weight:600;word-break:break-all;">${razorpayOrderId || "-"}</div>
          </div>
        </div>

        <div style="background:#f9fafb;padding:16px;margin-bottom:24px;">
          <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0;">
            Your invoice is attached as a PDF. You can download it directly from this email.
          </p>
        </div>

        <p style="font-size:15px;color:#111827;margin:0;">
          Thank you for booking with <strong>ShiftsDeal</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;">
          This is an automated email. Please do not reply.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          © ShiftsDeal
        </p>
      </div>
    </div>
  </div>
  `;
}
