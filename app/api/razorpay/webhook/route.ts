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

const OWNER_PAYMENT_SELECT =
  "name, email, payment_method, upi_id, bank_account_name, bank_account_number, bank_ifsc, payment_contact_email";

type VenueOwner = {
  name: string;
  email: string;
  payment_contact_email: string | null;
  payment_method: "upi" | "bank" | null;
  upi_id: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
};

function getEffectivePaymentMethod(owner: VenueOwner): "upi" | "bank" {
  if (owner.payment_method === "bank") return "bank";
  if (owner.payment_method === "upi") return "upi";
  if (owner.bank_account_number && owner.bank_ifsc && owner.bank_account_name) {
    return "bank";
  }
  return "upi";
}

function normalizeOwner(owner: Record<string, any>): VenueOwner {
  return {
    name: owner.name,
    email: owner.email,
    payment_contact_email: owner.payment_contact_email || owner.email || null,
    payment_method: owner.payment_method || null,
    upi_id: owner.upi_id || null,
    bank_account_name: owner.bank_account_name || null,
    bank_account_number: owner.bank_account_number || null,
    bank_ifsc: owner.bank_ifsc || null,
  };
}

function validateOwnerPaymentDetails(owner: VenueOwner) {
  const method = getEffectivePaymentMethod(owner);

  if (method === "bank") {
    if (!owner.bank_account_number || !owner.bank_ifsc || !owner.bank_account_name) {
      throw new Error("Owner bank details missing. Owner must complete payment settings.");
    }
    return;
  }

  if (!owner.upi_id) {
    throw new Error("Owner UPI ID missing. Owner must complete payment settings.");
  }
}

async function getVenueOwner(venueId: string): Promise<VenueOwner | null> {
  const { data: venue } = await supabase
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .single();

  if (venue?.owner_id) {
    const { data: owner } = await supabase
      .from("users")
      .select(OWNER_PAYMENT_SELECT)
      .eq("id", venue.owner_id)
      .single();

    if (owner) {
      return normalizeOwner(owner);
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
      .select(OWNER_PAYMENT_SELECT)
      .eq("id", ownership.owner_user_id)
      .single();

    if (owner) {
      return normalizeOwner(owner);
    }
  }

  if (ownership?.owner_email) {
    return {
      name: ownership.owner_full_name || "Owner",
      email: ownership.owner_email,
      payment_contact_email: ownership.owner_email,
      payment_method: null,
      upi_id: null,
      bank_account_name: null,
      bank_account_number: null,
      bank_ifsc: null,
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

async function createFundAccount(contactId: string, owner: VenueOwner) {
  const paymentMethod = getEffectivePaymentMethod(owner);

  if (paymentMethod === "bank") {
    return callRazorpayX("fund_accounts", {
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: owner.bank_account_name,
        ifsc: owner.bank_ifsc,
        account_number: owner.bank_account_number,
      },
    });
  }

  return callRazorpayX("fund_accounts", {
    contact_id: contactId,
    account_type: "vpa",
    vpa: {
      address: owner.upi_id,
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
  bookingId: string;
  owner: VenueOwner;
  amountInPaise: number;
}) {
  const bookingId = params.bookingId;
  const shortBookingRef = `bk_${bookingId.replaceAll("-", "").slice(0, 30)}`;

  const contact = await createContact(bookingId, shortBookingRef, params.owner.name);
  const fundAccount = await createFundAccount(contact.id, params.owner);

  const paymentMethod = getEffectivePaymentMethod(params.owner);

  const payoutDetail =
    paymentMethod === "bank"
      ? `${params.owner.bank_account_number} (${params.owner.bank_ifsc})`
      : params.owner.upi_id;

  const payout = await createPayout({
    bookingId,
    fundAccountId: fundAccount.id,
    amountInPaise: params.amountInPaise,
    shortBookingRef,
    ownerName: params.owner.name,
    paymentMethod,
    payoutDetail: payoutDetail || "",
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
      contact_name, contact_email, contact_phone,
      payment_status, venue_id,
      base_price, platform_fee, subtotal, gst_amount, total_amount, deposit_amount, balance_amount,
      venues(name, address_street, address_city, address_state)`
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  const venueOwner = await getVenueOwner(booking.venue_id);

  if (!venueOwner) {
    throw new Error("Venue owner not found");
  }

  validateOwnerPaymentDetails(venueOwner);

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues;
  const venueAddress = venue
    ? [venue.address_street, venue.address_city, venue.address_state].filter(Boolean).join(", ")
    : "";


  const totalAmountInPaise = payment.amount;
  const ownerAmountInPaise = Math.round(Number(booking.base_price) * 100);

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
        if(event.event === "payment.captured") {
        await sendMail({
          to: booking.contact_email,
          subject: "Payment Successful - Booking Confirmed",
          html: paymentSuccessEmail({
            contactName: booking.contact_name,
            eventName: booking.event_name,
            amount: payment.amount,
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            address: venueAddress,
            venueName: venue?.name,
          }),
          attachments: [
            {
              filename: invoiceFileName,
              content: invoicePdfBuffer,
            },
          ],
        });
        }
        else if(event.event === "payment.failed") {
          await sendMail({
            to: booking.contact_email,
            subject: "Payment Failed - Booking Confirmed",
            html: paymentFailedEmail({
              contactName: booking.contact_name,
              eventName: booking.event_name,
              amount: payment.amount,
              bookingId: bookingId,
            }),
          });
        }
      }

      // WhatsApp
      if (booking.contact_phone) {
        if(event.event === "payment.captured") {
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
        else if(event.event === "payment.failed") {
          await sendWhatsAppTemplate({
            to: booking.contact_phone,
            templateName: "payment_failure",
            languageCode: "en",
            components: [
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
      // Remove session storage items after email/whatsapp is sent
      sessionStorage.removeItem("isOwnerReferred");
      sessionStorage.removeItem("venueId");
      sessionStorage.removeItem("ownerId");

    }
  } catch (error: any) {
    console.error("Payment success email failed:", error.message);
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
    const payout = await createOwnerPayout({
      bookingId,
      owner: venueOwner,
      amountInPaise: ownerAmountInPaise,
    });

    await supabase
      .from("bookings")
      .update({
        razorpay_payout_id: payout.payout.id,
        payout_status: payout.payout.status,
      })
      .eq("id", bookingId);

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
        bookingId: bookingId,
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

      const bookingId = event.payload?.payment?.entity?.notes?.booking_id;
      console.log("payment booking_id ==============", bookingId);

      const { data: bookingData }: any = await supabase
        .from("bookings")
        .select("id, event_name, date, venue_id, start_time, end_time, status, payment_status, total_amount, contact_name, contact_email")
        .eq("id", bookingId)
        .single();

      console.log("payment booking details ==============", bookingData);
      // 2. Expire/cancel all duplicate bookings for same venue/date/time except approved booking
      const { data: duplicateBookings, error: duplicateError } = await supabase
      .from("bookings")
      .update({
        status: "expired",
        payment_status: "expired",
        updated_at: new Date().toISOString(),
        payment_inprogress: false,
      })
      .eq("venue_id", bookingData?.venue_id)
      .eq("date", bookingData?.date)
      .lt("start_time", bookingData?.end_time)
      .gt("end_time", bookingData?.start_time)
      .neq("id", bookingId)
      .in("status", ["pending", "confirmed"])
      .select("id, event_name, date, venue_id, start_time, end_time, status, payment_status");

      if (duplicateError) {
      console.error("Duplicate booking update error:", duplicateError);
      } else {
      console.log("Cancelled duplicate bookings >>>>>>>>>>>>>>>>>>", duplicateBookings);
      }
    }

    if (
      event.event === "payout.processed" ||
      event.event === "payout.reversed" ||
      event.event === "payout.rejected" ||
      event.event === "payout.failed" ||
      event.event === "payout.queued" ||
      event.event === "payout.pending" ||
      event.event === "payout.initiated" ||
      event.event === "payout.updated"
    ) {
      await handlePayoutWebhook(event);
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

/* ----------------------------------
   11. HANDLE PAYOUT WEBHOOK
---------------------------------- */

async function handlePayoutWebhook(event: any) {
  const payout = event.payload?.payout?.entity;

  if (!payout) return;

  const payoutId = payout.id;
  const payoutStatus = payout.status;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      event_name,
      base_price,
      razorpay_payment_id,
      razorpay_order_id,
      owner_commission_email_sent,
      venue_id,
      razorpay_payout_id
    `)
    .eq("razorpay_payout_id", payoutId)
    .single();

  if (error || !booking) {
    console.log("Booking not found for payout:", payoutId);
    return;
  }

  await supabase
    .from("bookings")
    .update({
      payout_status: payoutStatus,
      payout_processed_at:
        event.event === "payout.processed" ? new Date().toISOString() : null,
    })
    .eq("id", booking.id);


  if (booking.owner_commission_email_sent) return;

  const venueOwner = await getVenueOwner(booking.venue_id);
  if (!venueOwner) return;

  const ownerEmail = venueOwner.payment_contact_email || venueOwner.email;
  if (!ownerEmail) return;
  if(event.event === "payout.processed") {
    await sendMail({
      to: ownerEmail,
      subject: `Commission ${event.event} - Shifts Deal`,
      html: venueCommisionSuccessEmail({
        ownerName: venueOwner.name,
        eventName: booking.event_name,
        amount: Math.round(Number(booking.base_price) * 100),
        razorpayPaymentId: booking.razorpay_payout_id,
        razorpayOrderId: booking.razorpay_order_id,
      }),
    });
    await supabase
      .from("bookings")
      .update({
        owner_commission_email_sent: true,
      })
      .eq("id", booking.id);
    }
  if(event.event === "payout.reversed") {
    await sendMail({
      to: ownerEmail,
      subject: `Commission Reversed - Shifts Deal`,
      html: venueCommisionSuccessEmail({
        ownerName: venueOwner.name,
        eventName: booking.event_name,
        amount: Math.round(Number(booking.base_price) * 100),
        razorpayPaymentId: booking.razorpay_payout_id,
        razorpayOrderId: booking.razorpay_order_id,
      }),
    });
    await supabase
      .from("bookings")
      .update({
        owner_commission_email_sent: true,
      })
      .eq("id", booking.id);
  }
}