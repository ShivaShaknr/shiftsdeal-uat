import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  console.log("RazorpayX ENV check:", {
    keyIdExists: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
    accountNumberExists: !!process.env.RAZORPAYX_ACCOUNT_NUMBER,
    keyIdPrefix: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.slice(0, 8),
  });

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

  console.log("RazorpayX contact created:", contact.id);

  return contact;
}

/* ----------------------------------
   4. CREATE FUND ACCOUNT USING UPI
---------------------------------- */

async function createFundAccount(contactId: string, ownerUpiId: string) {
  const fundAccount = await callRazorpayX("fund_accounts", {
    contact_id: contactId,
    account_type: "vpa",
    vpa: {
      address: ownerUpiId,
    },
  });

  console.log("RazorpayX fund account created:", fundAccount.id);

  return fundAccount;
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
  ownerUpiId: string;
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
      mode: "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: params.shortBookingRef,
      narration: "Venue owner payout",
      notes: {
        booking_id: params.bookingId,
        owner_name: params.ownerName,
        owner_upi_id: params.ownerUpiId,
      },
    },
    idempotencyKey
  );

  console.log("RazorpayX payout created:", payout.id);

  return payout;
}

/* ----------------------------------
   6. CREATE OWNER PAYOUT FLOW
---------------------------------- */

async function createOwnerPayout(params: {
  bookingId: string;
  amountInPaise: number;
  ownerName: string;
  ownerUpiId: string;
}) {
  const shortBookingRef = `bk_${params.bookingId
    .replaceAll("-", "")
    .slice(0, 30)}`;

  const contact = await createContact(
    params.bookingId,
    shortBookingRef,
    params.ownerName
  );

  const fundAccount = await createFundAccount(contact.id, params.ownerUpiId);

  const payout = await createPayout({
    bookingId: params.bookingId,
    fundAccountId: fundAccount.id,
    amountInPaise: params.amountInPaise,
    shortBookingRef,
    ownerName: params.ownerName,
    ownerUpiId: params.ownerUpiId,
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
    .select("contact_name, contact_email, contact_phone, event_name, upi_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  if (!booking.upi_id) {
    throw new Error("UPI ID missing on booking");
  }

  const ownerName = booking.contact_name;
  const ownerUpiId = booking.upi_id;

  const totalAmountInPaise = payment.amount;

  const adminAmountInPaise = Math.round(totalAmountInPaise * 0.1);
  const ownerAmountInPaise = totalAmountInPaise - adminAmountInPaise;

  console.log("Payment captured:", {
    bookingId,
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
    totalAmount: totalAmountInPaise / 100,
    adminCommission: adminAmountInPaise / 100,
    ownerPayout: ownerAmountInPaise / 100,
  });

  // 1. Update booking status and payment status
  await supabase.from('bookings').update({
    status: 'completed',
    payment_status:'fully_paid',
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
  }).eq('id', bookingId);

   // 2. Create invoice ONLY after payment.captured
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

    console.log("Invoice saved in Supabase:", {
      bookingId,
      invoice_id: invoice.id,
      invoice_status: invoice.status,
      invoice_url: invoice.short_url,
    });
  } catch (error: any) {
    console.error("Invoice creation failed:", error.message);
  }

  try {
    const payoutResult = await createOwnerPayout({
      bookingId,
      amountInPaise: ownerAmountInPaise,
      ownerName,
      ownerUpiId,
    });

    console.log("Payout initiated successfully:", {
      bookingId,
      contact_id: payoutResult.contact.id,
      fund_account_id: payoutResult.fundAccount.id,
      payout_id: payoutResult.payout.id,
      payout_status: payoutResult.payout.status,
    });
  } catch (error: any) {
    console.error("Payout creation failed:", error.message);
  }
}

/* ----------------------------------
   8. HANDLE PAYOUT STATUS WEBHOOK
---------------------------------- */

async function handlePayoutStatusUpdate(event: any) {
  const payout = event.payload.payout.entity;

  const bookingId = payout.notes?.booking_id || null;

  console.log("✅ RazorpayX payout status webhook:", {
    webhook_event: event.event,
    booking_id: bookingId,
    payout_id: payout.id,
    status: payout.status,
    amount: payout.amount / 100,
    utr: payout.utr || null,
    mode: payout.mode,
    fund_account_id: payout.fund_account_id,
    failure_reason:
      payout.failure_reason ||
      payout.status_details?.description ||
      payout.status_details?.reason ||
      null,
    created_at: payout.created_at,
  });
}

/* ----------------------------------
   9. MAIN WEBHOOK API
---------------------------------- */

export async function POST(req: Request) {
  try {
    console.log("🔥 Webhook endpoint hit");
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

  console.log("✅ Razorpay invoice created:", {
    invoice_id: data.id,
    status: data.status,
    short_url: data.short_url,
  });

  return data;
}