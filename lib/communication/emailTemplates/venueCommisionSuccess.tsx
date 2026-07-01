export function venueCommisionSuccessEmail({
    ownerName,
    eventName,
    amount,
    razorpayPaymentId,
    razorpayOrderId,
  }: {
    ownerName?: string;
    eventName?: string;
    amount?: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  }) {
    return `
       <div style="background:#f6f7fb;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:650px;margin:0 auto;background:#ffffff;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.06);">


          <!-- Header -->
          <div style="background:#14532d;padding:28px 32px;color:#ffffff;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" style="vertical-align:top;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">
                    Commission Credited
                  </h1>

                  <p style="margin:8px 0 0;font-size:14px;color:#dcfce7;line-height:1.5;">
                    Your commission has been credited successfully.
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <img 
              src="https://www.shiftsdeal.com/_next/image?url=%2Flogo-light.png&w=256&q=75" 
              alt="ShiftsDeal" 
              style="height:48px;width:auto;display:block;" 
            />
            <br>
            <br>
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hi <strong>${ownerName || "Owner"}</strong>,
            </p>

            <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px;">
              Your commission has been credited to your account successfully. Please check your account balance.
            </p>

            <!-- Amount Box -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:22px 20px;margin-bottom:24px;text-align:center;">
              <div style="display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:6px 12px;margin-bottom:12px;">
                Amount Credited
              </div>

              <div style="font-size:30px;line-height:1.2;color:#15803d;font-weight:800;margin:0;">
                ₹${amount ? amount / 100 : 0}
              </div>

              <p style="font-size:13px;color:#4b5563;margin:10px 0 0;">
                Commission credited successfully
              </p>
            </div>

            <!-- Details -->
            <div style="border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
              <div style="display:flex;padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Event</div>
                <div style="width:58%;font-size:14px;color:#111827;font-weight:600;">
                  ${eventName || "-"}
                </div>
              </div>

              <div style="display:flex;padding:14px 18px;border-bottom:1px solid #e5e7eb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Amount Credited</div>
                <div style="width:58%;font-size:14px;color:#15803d;font-weight:700;">
                  ₹${amount ? amount / 100 : 0}
                </div>
              </div>

              <div style="display:flex;padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Payment ID</div>
                <div style="width:58%;font-size:14px;color:#111827;font-weight:600;word-break:break-all;">
                  ${razorpayPaymentId || "-"}
                </div>
              </div>

              <div style="display:flex;padding:14px 18px;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Order ID</div>
                <div style="width:58%;font-size:14px;color:#111827;font-weight:600;word-break:break-all;">
                  ${razorpayOrderId || "-"}
                </div>
              </div>
            </div>

            <!-- Note -->
            <div style="background:#f9fafb;border:1px solid #bbf7d0;padding:16px;margin-bottom:24px;">
              <p style="font-size:14px;line-height:1.6;color:#166534;margin:0;">
                Note: In case of any issue, please contact the support team.
              </p>
            </div>

            <p style="font-size:15px;color:#111827;margin:0;">
              Thank you for using <strong>ShiftsDeal</strong>.
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