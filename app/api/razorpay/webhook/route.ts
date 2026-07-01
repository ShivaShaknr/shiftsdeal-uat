import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/communication/sendMail";
import { sendWhatsAppTemplate, uploadWhatsAppMedia } from "@/lib/communication/whatsapp/whatsapp";
import { paymentSuccessEmail } from "@/lib/communication/emailTemplates/paymentSuccessEmail";
import {
  paymentInvoicePdf,
  type PaymentInvoiceData,
} from "@/lib/communication/invoiceTemplates/paymentInvoice";
import { paymentFailedEmail } from "@/lib/communication/emailTemplates/paymentFailedEmail";
import { venueCommisionSuccessEmail } from "@/lib/communication/emailTemplates/venueCommisionSuccess";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getVenueOwner(venueId: string) {
  const { data: venue } = await supabase
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .single();

  if (venue?.owner_id) {
    const { data: owner } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", venue.owner_id)
      .single();

    if (owner?.email) {
      return { name: owner.name, email: owner.email };
    }
  }

  const { data: ownership } = await supabase
    .from("venue_ownerships")
    .select("owner_email, owner_full_name, owner_user_id")
    .eq("venue_id", venueId)
    .eq("is_active", true)
    .eq("is_primary", true)
    .maybeSingle();

  if (ownership?.owner_user_id) {
    const { data: owner } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", ownership.owner_user_id)
      .single();

    if (owner?.email) {
      return { name: owner.name, email: owner.email };
    }
  }

  if (ownership?.owner_email) {
    return {
      name: ownership.owner_full_name || "Owner",
      email: ownership.owner_email,
    };
  }

  return null;
}

/* ----------------------------------
   1. VERIFY RAZORPAY WEBHOOK
---------------------------------- */

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    throw new Error("Missing Razorpay signature");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature");
  }
}

/* ----------------------------------
   2. RAZORPAYX API CALL
---------------------------------- */

async function callRazorpayX(
  endpoint: string,
  body: any,
  idempotencyKey?: string
) {

  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["X-Payout-Idempotency"] = idempotencyKey;
  }

  const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("RazorpayX API error:", data);
    throw new Error(data.error?.description || "RazorpayX API failed");
  }

  return data;
}

/* ----------------------------------
   3. CREATE RAZORPAYX CONTACT
---------------------------------- */

async function createContact(
  bookingId: string,
  shortBookingRef: string,
  ownerName: string
) {
  const contact = await callRazorpayX("contacts", {
    name: ownerName,
    type: "vendor",
    reference_id: shortBookingRef,
    notes: {
      booking_id: bookingId,
    },
  });

  return contact;
}

/* ----------------------------------
   4. CREATE FUND ACCOUNT USING UPI
---------------------------------- */

async function createFundAccount(contactId: string, booking: any) {
  if (booking.payment_method === "bank") {
    return callRazorpayX("fund_accounts", {
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: booking.bank_account_name,
        ifsc: booking.bank_ifsc,
        account_number: booking.bank_account_number,
      },
    });
  }

  return callRazorpayX("fund_accounts", {
    contact_id: contactId,
    account_type: "vpa",
    vpa: {
      address: booking.upi_id,
    },
  });
}

/* ----------------------------------
   5. CREATE PAYOUT
---------------------------------- */

async function createPayout(params: {
  bookingId: string;
  fundAccountId: string;
  amountInPaise: number;
  shortBookingRef: string;
  ownerName: string;
  paymentMethod: string;
  payoutDetail: string;
}) {
  const idempotencyKey = `po_${params.bookingId
    .replaceAll("-", "")
    .slice(0, 30)}`;

  const payout = await callRazorpayX(
    "payouts",
    {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: params.fundAccountId,
      amount: params.amountInPaise,
      currency: "INR",
      mode: params.paymentMethod === "bank" ? "IMPS" : "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: params.shortBookingRef,
      narration: "Venue owner payout",
      notes: {
        booking_id: params.bookingId,
        owner_name: params.ownerName,
        payout_detail: params.payoutDetail,
      },
    },
    idempotencyKey
  );

  return payout;
}

/* ----------------------------------
   6. CREATE OWNER PAYOUT FLOW
---------------------------------- */

async function createOwnerPayout(params: {
  booking: any;
  amountInPaise: number;
  ownerName: string;
}) {
  const bookingId = params.booking.id;
  const shortBookingRef = `bk_${bookingId.replaceAll("-", "").slice(0, 30)}`;

  const contact = await createContact(bookingId, shortBookingRef, params.ownerName);
  const fundAccount = await createFundAccount(contact.id, params.booking);

  const payoutDetail =
    params.booking.payment_method === "bank"
      ? `${params.booking.bank_account_number} (${params.booking.bank_ifsc})`
      : params.booking.upi_id;

  const payout = await createPayout({
    bookingId,
    fundAccountId: fundAccount.id,
    amountInPaise: params.amountInPaise,
    shortBookingRef,
    ownerName: params.ownerName,
    paymentMethod: params.booking.payment_method || "upi",
    payoutDetail,
  });

  return {
    contact,
    fundAccount,
    payout,
  };
}

/* ----------------------------------
   7. HANDLE PAYMENT CAPTURED
---------------------------------- */

async function handlePaymentCaptured(event: any) {
  const payment = event.payload.payment.entity;

  const bookingId = payment.notes?.booking_id;

  if (!bookingId) {
    throw new Error("Booking ID missing in Razorpay notes");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `id, date, start_time, end_time, event_name, event_type, attendees, status,
      contact_name, contact_email, contact_phone, payment_method, upi_id,
      bank_account_name, bank_name, bank_account_number, bank_ifsc,
      payment_status, venue_id,
      base_price, platform_fee, subtotal, gst_amount, total_amount, deposit_amount, balance_amount,
      venues(name, address_street, address_city, address_state)`
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  if (booking.payment_method === 'bank') {
    if (!booking.bank_account_number || !booking.bank_ifsc) {
      throw new Error("Bank details missing on booking");
    }
  } else if (!booking.upi_id) {
    throw new Error("UPI ID missing on booking");
  }

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues;
  const venueAddress = venue
    ? [venue.address_street, venue.address_city, venue.address_state].filter(Boolean).join(", ")
    : "";


  const totalAmountInPaise = payment.amount;
  const ownerAmountInPaise = Math.round(Number(booking.base_price) * 100);
  const venueOwner = await getVenueOwner(booking.venue_id);

  /**
   * IMPORTANT:
   * Webhook can come multiple times.
   * This update only works if payment_status is NOT already fully_paid.
   * If already fully_paid, function returns and email/invoice/payout will not repeat.
   */
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      payment_status: "fully_paid",
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
    })
    .eq("id", bookingId)
    .neq("payment_status", "fully_paid")
    .select("id")
    .single();

  if (updateError || !updatedBooking) {
    return;
  }

  // Send email only one time
  try {
    if (booking.contact_email) {
      const invoiceData: PaymentInvoiceData = {
        bookingId,
        venueName: venue?.name,
        venueAddress,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        eventName: booking.event_name,
        eventType: booking.event_type,
        attendees: booking.attendees,
        contactName: booking.contact_name,
        contactEmail: booking.contact_email,
        contactPhone: booking.contact_phone,
        basePrice: booking.base_price,
        platformFee: booking.platform_fee,
        subtotal: booking.subtotal,
        gstAmount: booking.gst_amount,
        totalAmount: booking.total_amount,
        depositAmount: booking.deposit_amount,
        balanceAmount: booking.balance_amount,
        status: "completed",
        razorpayPaymentId: payment.id,
      };
      const invoicePdfBuffer = paymentInvoicePdf(invoiceData);
      const invoiceFileName = `Invoice-${bookingId.substring(0, 8)}.pdf`;
      // Email
      if (booking.contact_email) {
        await sendMail({
          to: booking.contact_email,
          subject: "Payment Successful - Booking Confirmed",
          html: paymentSuccessEmail({
            contactName: booking.contact_name,
            eventName: booking.event_name,
            amount: payment.amount,
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
          }),
          attachments: [
            {
              filename: invoiceFileName,
              content: invoicePdfBuffer,
            },
          ],
        });
      }

      // WhatsApp
      if (booking.contact_phone) {
        const invoiceMediaId = await uploadWhatsAppMedia({
          buffer: invoicePdfBuffer,
          filename: invoiceFileName,
          mimeType: "application/pdf",
        });

        await sendWhatsAppTemplate({
          to: booking.contact_phone,
          templateName: "payment_success",
          languageCode: "en",
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    id: invoiceMediaId,
                    filename: invoiceFileName,
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: booking.contact_name || "Customer" },
                { type: "text", text: String(booking.total_amount || payment.amount / 100) },
                { type: "text", text: bookingId },
                { type: "text", text: payment.id },
              ],
            },
          ],
        });
      }

    }
  } catch (error: any) {
    console.error("Payment success email failed:", error.message);
  }

  // Send commission email to venue owner
  try {
    if (venueOwner?.email) {
      await sendMail({
        to: venueOwner.email,
        subject: "Commission Credited - Shifts Deal",
        html: venueCommisionSuccessEmail({
          ownerName: venueOwner.name,
          eventName: booking.event_name,
          amount: ownerAmountInPaise,
          razorpayPaymentId: payment.id,
          razorpayOrderId: payment.order_id,
        }),
      });
    }
  } catch (error: any) {
    console.error("Owner commission email failed:", error.message);
  }

  // Create invoice only once
  try {
    const invoice = await createRazorpayInvoice({
      bookingId,
      customerName: booking.contact_name,
      customerEmail: booking.contact_email,
      customerPhone: booking.contact_phone,
      eventName: booking.event_name,
      amountInPaise: totalAmountInPaise,
    });

    await supabase
      .from("bookings")
      .update({
        razorpay_invoice_id: invoice.id,
        razorpay_invoice_status: invoice.status,
        razorpay_invoice_url: invoice.short_url || null,
      })
      .eq("id", bookingId);

  } catch (error: any) {
    console.error("Invoice creation failed:", error.message);
  }

  // Create payout only once
  try {
    await createOwnerPayout({
      booking,
      amountInPaise: ownerAmountInPaise,
      ownerName: venueOwner?.name || booking.contact_name,
    });
  } catch (error: any) {
    console.error("Payout creation failed:", error.message);
  }
}

/* ----------------------------------
   8. HANDLE PAYOUT STATUS WEBHOOK
---------------------------------- */

async function handlePayoutStatusUpdate(event: any) {
  const payout = event.payload?.payout?.entity;
  if (!payout) return;

  const bookingId = payout.notes?.booking_id;

  if (event.event !== "payout.failed" && event.event !== "payout.reversed") {
    return;
  }

  if (!bookingId) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select("contact_name, contact_email, event_name, contact_phone , total_amount")
    .eq("id", bookingId)
    .single();

  if (!booking?.contact_email) return;

  try {
    await sendMail({
      to: booking.contact_email,
      subject: "Payment Failed - Booking Confirmed",
      html: paymentFailedEmail({
        contactName: booking.contact_name,
        eventName: booking.event_name,
        amount: payout.amount,
      }),
    });
    await sendWhatsAppTemplate({
      to: `91${booking.contact_phone}`,
      templateName: "payment_failure",
      languageCode: "en",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.contact_name || "Customer" }, 
            { type: "text", text: String(booking.total_amount / 100 || 0) },   
            { type: "text", text: booking.event_name || "Event" },              
            { type: "text", text: bookingId },                           
            { type: "text", text: "Payment Declined" },                  
          ],
        },
      ],
    });
  } catch (error: any) {
    console.error("Payout failed email error:", error.message);
  }
}

/* ----------------------------------
   9. MAIN WEBHOOK API
---------------------------------- */

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const razorpaySignature = req.headers.get("x-razorpay-signature");

    verifyWebhookSignature(rawBody, razorpaySignature);

    const event = JSON.parse(rawBody);

    console.log("Razorpay webhook event:", event.event);

    if (event.event === "payment.captured") {
      await handlePaymentCaptured(event);
    }

    if (
      event.event === "payout.processing" ||
      event.event === "payout.processed" ||
      event.event === "payout.failed" ||
      event.event === "payout.reversed"
    ) {
      await handlePayoutStatusUpdate(event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Webhook failed",
      },
      { status: 400 }
    );
  }
}

/* ----------------------------------
   10. CREATE RAZORPAY INVOICE
---------------------------------- */

async function createRazorpayInvoice(params: {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventName: string;
  amountInPaise: number;
}) {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "invoice",
      description: `Invoice for ${params.eventName}`,
      customer: {
        name: params.customerName,
        email: params.customerEmail,
        contact: params.customerPhone,
      },
      line_items: [
        {
          name: params.eventName,
          description: `Venue booking payment`,
          amount: params.amountInPaise,
          currency: "INR",
          quantity: 1,
        },
      ],
      notes: {
        booking_id: params.bookingId,
      },
      sms_notify: 0,
      email_notify: 0,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Razorpay invoice creation failed:", data);
    throw new Error(data.error?.description || "Invoice creation failed");
  }

  return data;
}