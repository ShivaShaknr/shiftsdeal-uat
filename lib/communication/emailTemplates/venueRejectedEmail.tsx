export function venueRejectedEmail({
    contactName,
    eventName,
    venueName,
  }: {
    contactName?: string;
    eventName?: string;
    venueName?: string;
  }) {
    return `
      <div style="background:#f5f5f5;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:650px;margin:0 auto;background:#ffffff;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <div style="background:#111827;padding:28px 32px;color:#ffffff;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <!-- Left content -->
                <td align="left" style="vertical-align:top;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">
                    Booking Rejected
                  </h1>
          
                  <p style="margin:8px 0 0;font-size:14px;color:#d1d5db;line-height:1.5;">
                    Your booking request could not be approved by the venue.
                  </p>
                </td>
          
                <!-- Right tag -->
                <td align="right" style="vertical-align:top;width:120px;">
                  <span style="display:inline-block;background:#fee2e2;color:#991b1b;font-size:12px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;padding:7px 12px;">
                    Rejected
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <!-- Logo Header -->
            <img 
              src="https://www.shiftsdeal.com/_next/image?url=%2Flogo-light.png&w=256&q=75" 
              alt="ShiftsDeal" 
            />
            <br><br>
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hi <strong>${contactName || "Customer"}</strong>,
            </p>

            <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px;">
              Your booking at <strong>${venueName || "the venue"}</strong> has been rejected. You can explore other venues and create a new booking.
            </p>

            <!-- Booking Info -->
            <div style="border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
              <div style="display:flex;padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Venue</div>
                <div style="width:58%;font-size:14px;color:#111827;font-weight:600;">
                  ${venueName || "-"}
                </div>
              </div>

              <div style="display:flex;padding:14px 18px;border-bottom:1px solid #e5e7eb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Event</div>
                <div style="width:58%;font-size:14px;color:#111827;font-weight:600;">
                  ${eventName || "-"}
                </div>
              </div>

              <div style="display:flex;padding:14px 18px;background:#f9fafb;">
                <div style="width:42%;font-size:14px;color:#6b7280;">Status</div>
                <div style="width:58%;font-size:14px;color:#dc2626;font-weight:700;">
                  Rejected
                </div>
              </div>
            </div>

            <!-- View Venues Box -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:22px 20px;text-align:center;margin-bottom:24px;">
              <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 18px;">
                Please try again with another suitable venue.
              </p>

              <a 
                href="http://localhost:3000/venues"
                style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 26px;border-radius:4px;"
              >
                View More Venues
              </a>
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