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
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#dc2626;margin-bottom:8px">Payment Failed</h2>
  
        <p>Hi ${contactName || "Customer"},</p>
  
        <p>Your payment has been failed.</p>
  
        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0">
          <p><strong>Event:</strong> ${eventName || "-"}</p>
          <p><strong>Amount Paid:</strong> ₹${amount ? amount / 100 : 0}</p>
        </div>
  
        <p>Please try again.</p>
  
        <p style="font-size:13px;color:#666;margin-top:24px">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }