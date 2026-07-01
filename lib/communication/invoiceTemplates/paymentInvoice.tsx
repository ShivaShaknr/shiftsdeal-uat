import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import { formatRupeeNumber } from "@/lib/utils";

export type PaymentInvoiceData = {
  bookingId: string;
  venueName?: string;
  venueAddress?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  eventName?: string;
  eventType?: string;
  attendees?: number | string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  basePrice?: number;
  platformFee?: number;
  subtotal?: number;
  gstAmount?: number;
  totalAmount?: number;
  depositAmount?: number;
  balanceAmount?: number;
  status?: string;
  razorpayPaymentId?: string;
};

function getLogoBase64() {
  const logoPath = path.join(process.cwd(), "public", "logo-dark.png");

  if (fs.existsSync(logoPath)) {
    return fs.readFileSync(logoPath).toString("base64");
  }

  return null;
}

function safeText(value?: string | number | null) {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

export function paymentInvoicePdf(data: PaymentInvoiceData): Buffer {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 14;
  const contentX = 18;
  const contentW = pageWidth - contentX * 2;

  const black = "#111827";
  const muted = "#6b7280";
  const lightBorder = "#d1d5db";
  const lightBg = "#f9fafb";
  const success = "#166534";

  const basePrice = Number(data.basePrice || 0);
  const platformFee = Number(data.platformFee || 0);
  const gstAmount = Number(data.gstAmount || 0);
  const subtotal = Number(data.subtotal || basePrice + platformFee);
  const totalAmount = Number(data.totalAmount || subtotal + gstAmount);

  const invoiceNo = `INV-${data.bookingId.substring(0, 8).toUpperCase()}`;

  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const bookingDate = data.date
    ? new Date(data.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const setFont = (style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont("helvetica", style);
  };

  const rupee = (amount: number) => `Rs. ${formatRupeeNumber(amount)}`;

  const text = (
    value: string,
    x: number,
    y: number,
    options?: {
      size?: number;
      color?: string;
      style?: "normal" | "bold" | "italic";
      align?: "left" | "center" | "right";
      maxWidth?: number;
    }
  ) => {
    setFont(options?.style || "normal");
    doc.setFontSize(options?.size || 10);
    doc.setTextColor(options?.color || black);
    doc.text(value, x, y, {
      align: options?.align || "left",
      maxWidth: options?.maxWidth,
    });
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(lightBorder);
    doc.setLineWidth(0.2);
    doc.line(x1, y1, x2, y2);
  };

  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill?: string,
    stroke = lightBorder
  ) => {
    if (fill) {
      doc.setFillColor(fill);
      doc.setDrawColor(stroke);
      doc.rect(x, y, w, h, "FD");
    } else {
      doc.setDrawColor(stroke);
      doc.rect(x, y, w, h);
    }
  };

  // Page border
  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Header
  const logo = getLogoBase64();

  if (logo) {
    doc.addImage(`data:image/png;base64,${logo}`, "PNG", contentX, 20, 38, 14);
  } else {
    text("SHIFTSDEAL", contentX, 29, {
      size: 18,
      style: "bold",
      color: black,
    });
  }

  text("TAX INVOICE", pageWidth - contentX, 25, {
    size: 22,
    style: "bold",
    align: "right",
    color: black,
  });

  text("Original for Recipient", pageWidth - contentX, 33, {
    size: 9,
    align: "right",
    color: muted,
  });

  line(contentX, 42, pageWidth - contentX, 42);

  // Company / invoice metadata
  text("ShiftsDeal", contentX, 52, {
    size: 12,
    style: "bold",
  });

  text("Online Venue Booking Platform", contentX, 58, {
    size: 9,
    color: muted,
  });

  text("Support: support@shiftsdeal.com", contentX, 64, {
    size: 9,
    color: muted,
  });

  const metaX = pageWidth - contentX - 70;

  text("Invoice No", metaX, 52, { size: 9, color: muted });
  text(invoiceNo, pageWidth - contentX, 52, {
    size: 9,
    style: "bold",
    align: "right",
  });

  text("Invoice Date", metaX, 59, { size: 9, color: muted });
  text(invoiceDate, pageWidth - contentX, 59, {
    size: 9,
    style: "bold",
    align: "right",
  });

  text("Payment Status", metaX, 66, { size: 9, color: muted });
  text("Paid", pageWidth - contentX, 66, {
    size: 9,
    style: "bold",
    align: "right",
    color: success,
  });

  // Bill to / Booking details boxes
  const boxY = 78;
  const boxW = (contentW - 8) / 2;
  const boxH = 44;

  rect(contentX, boxY, boxW, boxH);
  rect(contentX + boxW + 8, boxY, boxW, boxH);

  rect(contentX, boxY, boxW, 9, lightBg);
  rect(contentX + boxW + 8, boxY, boxW, 9, lightBg);

  text("BILLED TO", contentX + 4, boxY + 6, {
    size: 8,
    style: "bold",
    color: muted,
  });

  text("BOOKING DETAILS", contentX + boxW + 12, boxY + 6, {
    size: 8,
    style: "bold",
    color: muted,
  });

  text(safeText(data.contactName), contentX + 4, boxY + 17, {
    size: 10,
    style: "bold",
  });

  text(safeText(data.contactEmail), contentX + 4, boxY + 24, {
    size: 9,
    color: muted,
  });

  text(safeText(data.contactPhone), contentX + 4, boxY + 31, {
    size: 9,
    color: muted,
  });

  const bx = contentX + boxW + 12;

  text(`Booking ID: ${safeText(data.bookingId)}`, bx, boxY + 17, {
    size: 9,
    maxWidth: boxW - 10,
  });

  text(`Venue: ${safeText(data.venueName)}`, bx, boxY + 24, {
    size: 9,
    maxWidth: boxW - 10,
  });

  text(`Event: ${safeText(data.eventName)}`, bx, boxY + 31, {
    size: 9,
    maxWidth: boxW - 10,
  });

  text(`Date: ${bookingDate}`, bx, boxY + 38, {
    size: 9,
  });

  // Items table
  const tableY = 136;
  const rowH = 10;
  const descW = 76;
  const qtyW = 18;
  const rateW = 34;
  const amountW = contentW - descW - qtyW - rateW;

  const descX = contentX;
  const qtyX = descX + descW;
  const rateX = qtyX + qtyW;
  const amountX = rateX + rateW;

  rect(contentX, tableY, contentW, rowH, black, black);

  text("DESCRIPTION", descX + 4, tableY + 6.7, {
    size: 8,
    style: "bold",
    color: "#ffffff",
  });

  text("QTY", qtyX + qtyW / 2, tableY + 6.7, {
    size: 8,
    style: "bold",
    color: "#ffffff",
    align: "center",
  });

  text("RATE", rateX + rateW - 4, tableY + 6.7, {
    size: 8,
    style: "bold",
    color: "#ffffff",
    align: "right",
  });

  text("AMOUNT", amountX + amountW - 4, tableY + 6.7, {
    size: 8,
    style: "bold",
    color: "#ffffff",
    align: "right",
  });

  const rows = [
    {
      desc: `Venue Booking - ${safeText(data.venueName || data.eventName)}`,
      qty: "1",
      rate: basePrice,
      amount: basePrice,
    },
    {
      desc: "Platform Fee",
      qty: "1",
      rate: platformFee,
      amount: platformFee,
    },
  ];

  let y = tableY + rowH;

  rows.forEach((item, index) => {
    rect(contentX, y, contentW, rowH, index % 2 === 0 ? "#ffffff" : lightBg);

    line(qtyX, y, qtyX, y + rowH);
    line(rateX, y, rateX, y + rowH);
    line(amountX, y, amountX, y + rowH);

    text(item.desc, descX + 4, y + 6.7, {
      size: 9,
      maxWidth: descW - 8,
    });

    text(item.qty, qtyX + qtyW / 2, y + 6.7, {
      size: 9,
      align: "center",
    });

    text(rupee(item.rate), rateX + rateW - 4, y + 6.7, {
      size: 9,
      align: "right",
    });

    text(rupee(item.amount), amountX + amountW - 4, y + 6.7, {
      size: 9,
      align: "right",
      style: "bold",
    });

    y += rowH;
  });

  // Table border
  rect(contentX, tableY, contentW, rowH * 3);
  line(qtyX, tableY, qtyX, y);
  line(rateX, tableY, rateX, y);
  line(amountX, tableY, amountX, y);

  // Totals
  const totalsX = pageWidth - contentX - 78;
  const totalsY = y + 14;
  const labelW = 38;
  const valueW = 40;
  const totalRowH = 9;

  const totalRow = (
    label: string,
    value: string,
    rowY: number,
    bold = false,
    bg?: string,
    color = black
  ) => {
    rect(totalsX, rowY, labelW + valueW, totalRowH, bg);
    line(totalsX + labelW, rowY, totalsX + labelW, rowY + totalRowH);

    text(label, totalsX + labelW - 3, rowY + 6, {
      size: 9,
      color,
      style: bold ? "bold" : "normal",
      align: "right",
    });

    text(value, totalsX + labelW + valueW - 3, rowY + 6, {
      size: 9,
      color,
      style: bold ? "bold" : "normal",
      align: "right",
    });
  };

  totalRow("Subtotal", rupee(subtotal), totalsY);
  totalRow("GST 18%", rupee(gstAmount), totalsY + totalRowH);
  totalRow(
    "Grand Total",
    rupee(totalAmount),
    totalsY + totalRowH * 2,
    true,
    "#ecfdf5",
    success
  );

  // Payment details
  const payY = totalsY + 42;

  rect(contentX, payY, contentW, 36);
  rect(contentX, payY, contentW, 9, lightBg);

  text("PAYMENT INFORMATION", contentX + 4, payY + 6, {
    size: 8,
    style: "bold",
    color: muted,
  });

  text(`Payment ID: ${safeText(data.razorpayPaymentId)}`, contentX + 4, payY + 18, {
    size: 9,
  });

  text("Payment Method: Razorpay", contentX + 4, payY + 25, {
    size: 9,
  });

  text(`Amount Paid: ${rupee(totalAmount)}`, contentX + 4, payY + 32, {
    size: 9,
    style: "bold",
    color: success,
  });
  
  const footerY = pageHeight - 20;

  line(contentX, footerY - 5, pageWidth - contentX, footerY - 5);
  
  text("In case of any queries, contact support@shiftsdeal.com", pageWidth / 2, footerY, {
    size: 8,
    color: muted,
    align: "center",
  });
  return Buffer.from(doc.output("arraybuffer"));
}