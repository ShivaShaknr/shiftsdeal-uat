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
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#16a34a;margin-bottom:8px">Commision Success</h2>

        <p>Hi ${ownerName || "Owner"},</p>

        <p>Your commision has been credited to your account successfully.</p>

        <p>Your commision amount of <strong>₹${amount ? amount / 100 : 0}</strong> has been credited to your account . Please check your account balance.</p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0">
          <p><strong>Event:</strong> ${eventName || "-"}</p>
          <p><strong>Amount Credited:</strong> ₹${amount ? amount / 100 : 0}</p>
          <p><strong>Razorpay Payment ID:</strong> ${razorpayPaymentId || "-"}</p>
          <p><strong>Razorpay Order ID:</strong> ${razorpayOrderId || "-"}</p>
        </div>

        <p>Note : Incase of any issue, please contact the support team.</p>

        <p>Thank you for using ShiftsDeal.</p>

        <p style="font-size:13px;color:#666;margin-top:24px">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `;
  }