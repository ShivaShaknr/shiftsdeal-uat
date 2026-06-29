import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ----------------------------------
   TEST OWNER DETAILS
---------------------------------- */

const OWNER_NAME = "Test Venue Owner";
const OWNER_UPI_ID = "success@razorpay";

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

async function createContact(bookingId: string, shortBookingRef: string) {
  const contact = await callRazorpayX("contacts", {
    name: OWNER_NAME,
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

async function createFundAccount(contactId: string) {
  const fundAccount = await callRazorpayX("fund_accounts", {
    contact_id: contactId,
    account_type: "vpa",
    vpa: {
      address: OWNER_UPI_ID,
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
        owner_name: OWNER_NAME,
        owner_upi_id: OWNER_UPI_ID,
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
}) {
  const shortBookingRef = `bk_${params.bookingId
    .replaceAll("-", "")
    .slice(0, 30)}`;

  const contact = await createContact(params.bookingId, shortBookingRef);

  const fundAccount = await createFundAccount(contact.id);

  const payout = await createPayout({
    bookingId: params.bookingId,
    fundAccountId: fundAccount.id,
    amountInPaise: params.amountInPaise,
    shortBookingRef,
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

  await supabase.from('bookings').update({
    status: 'completed',
    payment_status:'fully_paid'
  }).eq('id', bookingId);

  try {
    const payoutResult = await createOwnerPayout({
      bookingId,
      amountInPaise: ownerAmountInPaise,
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

    // Important:
    // Do not throw here now.
    // Otherwise Razorpay will retry payment.captured webhook again and again.
  }
}

/* ----------------------------------
   8. HANDLE PAYOUT STATUS WEBHOOK
---------------------------------- */

async function handlePayoutStatusUpdate(event: any) {
  const payout = event.payload.payout.entity;

  const bookingId = payout.notes?.booking_id;

  console.log("Payout webhook received:", {
    event: event.event,
    bookingId,
    payout_id: payout.id,
    payout_status: payout.status,
    failure_reason:
      payout.failure_reason || payout.status_details?.description || null,
  });
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