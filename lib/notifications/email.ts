type OwnerVenueAddedEmailPayload = {
  ownerEmail: string;
  ownerName?: string | null;
  venueName: string;
  dashboardUrl: string;
};

function buildVenueAddedEmailHtml(payload: OwnerVenueAddedEmailPayload): string {
  const ownerDisplayName = payload.ownerName?.trim() || 'Partner';

  return `
  <div style="font-family: Arial, sans-serif; background: #f7f7f8; padding: 24px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ececec; border-radius: 12px; overflow: hidden;">
      <div style="padding: 24px; border-bottom: 1px solid #f1f1f1;">
        <h1 style="margin: 0; font-size: 22px; color: #111111;">Your Venue Has Been Added to ShiftDeal</h1>
      </div>
      <div style="padding: 24px; color: #303030; line-height: 1.6;">
        <p style="margin-top: 0;">Hi ${ownerDisplayName},</p>
        <p>Your venue <strong>${payload.venueName}</strong> has been successfully added to ShiftDeal.</p>
        <p>You can access your owner dashboard using your registered Google email to manage bookings and venue activity.</p>
        <p style="margin: 28px 0;">
          <a href="${payload.dashboardUrl}" style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
            ACCESS YOUR DASHBOARD
          </a>
        </p>
        <p style="margin-bottom: 0; color: #666666; font-size: 14px;">Team ShiftDeal</p>
      </div>
    </div>
  </div>`;
}

export async function sendOwnerVenueAddedEmail(payload: OwnerVenueAddedEmailPayload): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'ShiftDeal <no-reply@shiftsdeal.com>';

  if (!host || !user || !pass) {
    console.warn('SMTP config missing. Skipping owner onboarding email.');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: payload.ownerEmail,
      subject: 'Your Venue Has Been Added to ShiftDeal',
      html: buildVenueAddedEmailHtml(payload),
    });
  } catch (error) {
    console.error('Failed to send owner onboarding email:', error);
  }
}
