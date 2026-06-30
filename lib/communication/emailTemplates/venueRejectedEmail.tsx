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
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#dc2626;margin-bottom:8px">Booking Rejected</h2>

        <p>Hi ${contactName || "Customer"},</p>

        <p>Your booking at <strong>${venueName}</strong> has been rejected.</p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0">
          <p><strong>Event:</strong> ${eventName || "-"}</p>
          <p>Your booking has been rejected. Please try again with the correct information.</p>
        </div>

        <p>Thank you for using ShiftsDeal.</p>

        <p style="font-size:13px;color:#666;margin-top:24px">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }