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

function getFontBase64(fileName: string) {
  const fontPath = path.join(process.cwd(), "public", "fonts", fileName);
  if (fs.existsSync(fontPath)) {
    return fs.readFileSync(fontPath).toString("base64");
  }
  return null;
}

function registerCalibriFonts(doc: jsPDF) {
  const normal = getFontBase64("Calibri.ttf");
  const bold = getFontBase64("Calibri-Bold.ttf");
  const italic = getFontBase64("Calibri-Italic.ttf");

  if (!normal) return false;

  doc.addFileToVFS("Calibri.ttf", normal);
  doc.addFont("Calibri.ttf", "Calibri", "normal");

  if (bold) {
    doc.addFileToVFS("Calibri-Bold.ttf", bold);
    doc.addFont("Calibri-Bold.ttf", "Calibri", "bold");
  }

  if (italic) {
    doc.addFileToVFS("Calibri-Italic.ttf", italic);
    doc.addFont("Calibri-Italic.ttf", "Calibri", "italic");
  }

  doc.setFont("Calibri", "normal");
  return true;
}

function safeText(value?: string | number | null) {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

export function paymentInvoicePdf(data: PaymentInvoiceData): Buffer {
  const doc = new jsPDF("p", "mm", "a4");
  const hasCalibri = registerCalibriFonts(doc);
  const fontFamily = hasCalibri ? "Calibri" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentX = 20;
  const contentW = pageWidth - contentX * 2;

  const black = "#111827";
  const muted = "#6b7280";
  const border = "#e5e7eb";
  const softBg = "#f8fafc";
  const headerBg = "#111827";
  const success = "#166534";
  const successBg = "#ecfdf5";

  const basePrice = Number(data.basePrice || 0);
  const platformFee = Number(data.platformFee || 0);
  const gstAmount = Number(data.gstAmount || 0);
  const subtotal = Number(data.subtotal || basePrice + platformFee);
  const totalAmount = Number(data.totalAmount || subtotal + gstAmount);
  const commissionLabel =
    basePrice > 0
      ? `${((platformFee / basePrice) * 100).toFixed(0)}%`
      : `${(Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE || 0.1) * 100).toFixed(0)}%`;

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
    doc.setFont(fontFamily, style);
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

  const wrapText = (
    value: string,
    maxWidth: number,
    size = 9,
    style: "normal" | "bold" | "italic" = "normal",
    lineHeight = 4
  ) => {
    setFont(style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, maxWidth) as string[];
    return {
      lines,
      height: Math.max(lineHeight, lines.length * lineHeight),
    };
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(border);
    doc.setLineWidth(0.25);
    doc.line(x1, y1, x2, y2);
  };

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill?: string,
    stroke = border
  ) => {
    doc.setDrawColor(stroke);
    doc.setLineWidth(0.25);
    if (fill) {
      doc.setFillColor(fill);
      doc.rect(x, y, w, h, "FD");
    } else {
      doc.rect(x, y, w, h);
    }
  };

  // Outer frame
  doc.setDrawColor("#d1d5db");
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Header
  const logo = getLogoBase64();
  if (logo) {
    doc.addImage(`data:image/png;base64,${logo}`, "PNG", contentX, 22, 36, 13);
  } else {
    text("SHIFTSDEAL", contentX, 30, { size: 16, style: "bold" });
  }

  text("INVOICE", pageWidth - contentX, 26, {
    size: 18,
    style: "bold",
    align: "right",
  });
  text("Original for Recipient", pageWidth - contentX, 33, {
    size: 8,
    align: "right",
    color: muted,
  });

  drawLine(contentX, 42, pageWidth - contentX, 42);

  text("ShiftsDeal", contentX, 52, { size: 11, style: "bold" });
  text("Online Venue Booking Platform", contentX, 58, {
    size: 8.5,
    color: muted,
  });
  text("support@shiftsdeal.com", contentX, 64, { size: 8.5, color: muted });

  const metaLabelX = pageWidth - contentX - 62;
  const metaValueX = pageWidth - contentX;

  text("Invoice No", metaLabelX, 52, { size: 8.5, color: muted });
  text(invoiceNo, metaValueX, 52, { size: 8.5, style: "bold", align: "right" });

  text("Invoice Date", metaLabelX, 59, { size: 8.5, color: muted });
  text(invoiceDate, metaValueX, 59, { size: 8.5, style: "bold", align: "right" });

  text("Payment Status", metaLabelX, 66, { size: 8.5, color: muted });
  text("Paid", metaValueX, 66, {
    size: 8.5,
    style: "bold",
    align: "right",
    color: success,
  });

  const formatTiming = () => {
    if (!data.startTime || !data.endTime) return "-";
    return `${data.startTime} - ${data.endTime}`;
  };

  // Info boxes — narrower Billed To, wider Booking Details
  const boxY = 74;
  const gap = 6;
  const leftBoxW = contentW * 0.32;
  const rightBoxW = contentW - leftBoxW - gap;
  const leftPad = 5;
  const labelColW = 26;
  const leftValueW = leftBoxW - leftPad * 2;
  const rightValueW = rightBoxW - leftPad * 2 - labelColW;
  const lineH = 4;

  const leftItems = [
    {
      ...wrapText(safeText(data.contactName), leftValueW, 10, "bold", 4.2),
      size: 10,
      style: "bold" as const,
      color: black,
    },
    {
      ...wrapText(safeText(data.contactEmail), leftValueW, 8.5, "normal", 3.8),
      size: 8.5,
      style: "normal" as const,
      color: muted,
    },
    {
      ...wrapText(safeText(data.contactPhone), leftValueW, 8.5, "normal", 3.8),
      size: 8.5,
      style: "normal" as const,
      color: muted,
    },
  ];

  const rightItems = [
    { label: "Booking ID", ...wrapText(safeText(data.bookingId), rightValueW, 8.5, "bold", 3.8) },
    { label: "Venue", ...wrapText(safeText(data.venueName), rightValueW, 8.5, "bold", 3.8) },
    { label: "Address", ...wrapText(safeText(data.venueAddress), rightValueW, 8.5, "bold", 3.8) },
    { label: "Event", ...wrapText(safeText(data.eventName), rightValueW, 8.5, "bold", 3.8) },
    {
      label: "Date & Time",
      ...wrapText(`${bookingDate} | ${formatTiming()}`, rightValueW, 8.5, "bold", 3.8),
    },
  ];

  let leftContentH = 10;
  leftItems.forEach((item) => {
    leftContentH += item.height + 2.2;
  });

  let rightContentH = 10;
  rightItems.forEach((item) => {
    rightContentH += Math.max(6.5, item.height) + 2.2;
  });

  const boxH = Math.max(44, leftContentH, rightContentH) + 4;
  const rightBoxX = contentX + leftBoxW + gap;

  drawRect(contentX, boxY, leftBoxW, boxH);
  drawRect(rightBoxX, boxY, rightBoxW, boxH);
  drawRect(contentX, boxY, leftBoxW, 8, softBg);
  drawRect(rightBoxX, boxY, rightBoxW, 8, softBg);

  text("BILLED TO", contentX + leftPad, boxY + 5.5, {
    size: 7.5,
    style: "bold",
    color: muted,
  });
  text("BOOKING DETAILS", rightBoxX + leftPad, boxY + 5.5, {
    size: 7.5,
    style: "bold",
    color: muted,
  });

  let leftY = boxY + 14;
  leftItems.forEach((item) => {
    item.lines.forEach((lineItem, index) => {
      text(lineItem, contentX + leftPad, leftY + index * (item.size === 10 ? 4.2 : 3.8), {
        size: item.size,
        style: item.style,
        color: item.color,
      });
    });
    leftY += item.height + 2.2;
  });

  let rightY = boxY + 14;
  rightItems.forEach((item) => {
    text(`${item.label}:`, rightBoxX + leftPad, rightY, {
      size: 8,
      color: muted,
    });

    item.lines.forEach((lineItem, index) => {
      text(lineItem, rightBoxX + leftPad + labelColW, rightY + index * 3.8, {
        size: 8.5,
        style: "bold",
      });
    });

    rightY += Math.max(6.5, item.height) + 2.2;
  });

  // Items table
  const tableY = boxY + boxH + 12;
  const headerH = 9;
  const descW = 78;
  const timingW = 34;
  const rateW = 32;
  const amountW = contentW - descW - timingW - rateW;

  const descX = contentX;
  const timingX = descX + descW;
  const rateX = timingX + timingW;
  const amountX = rateX + rateW;

  drawRect(contentX, tableY, contentW, headerH, headerBg, headerBg);

  text("DESCRIPTION", descX + 4, tableY + 6, {
    size: 7.5,
    style: "bold",
    color: "#ffffff",
  });
  text("TIMING", timingX + timingW / 2, tableY + 6, {
    size: 7.5,
    style: "bold",
    color: "#ffffff",
    align: "center",
  });
  text("RATE", rateX + rateW - 4, tableY + 6, {
    size: 7.5,
    style: "bold",
    color: "#ffffff",
    align: "right",
  });
  text("AMOUNT", amountX + amountW - 4, tableY + 6, {
    size: 7.5,
    style: "bold",
    color: "#ffffff",
    align: "right",
  });

  const venueTitle = `Venue Booking - ${safeText(data.venueName)}`;
  const venueTitleWrap = wrapText(venueTitle, descW - 8, 9, "normal", 4);
  const venueAddressWrap = data.venueAddress
    ? wrapText(safeText(data.venueAddress), descW - 8, 8, "normal", 3.6)
    : { lines: [] as string[], height: 0 };

  const venueRowH = Math.max(
    12,
    6 + venueTitleWrap.height + (data.venueAddress ? venueAddressWrap.height + 1 : 0)
  );
  const feeRowH = 11;

  const rows = [
    {
      titleLines: venueTitleWrap.lines,
      addressLines: venueAddressWrap.lines,
      timing: formatTiming(),
      rate: basePrice,
      amount: basePrice,
      rowH: venueRowH,
    },
    // {
    //   titleLines: [`Platform Fee (${commissionLabel})`],
    //   addressLines: [] as string[],
    //   timing: "-",
    //   rate: platformFee,
    //   amount: platformFee,
    //   rowH: feeRowH,
    // },
  ];

  let y = tableY + headerH;

  rows.forEach((item, index) => {
    drawRect(contentX, y, contentW, item.rowH, index % 2 === 0 ? "#ffffff" : softBg);

    drawLine(timingX, y, timingX, y + item.rowH);
    drawLine(rateX, y, rateX, y + item.rowH);
    drawLine(amountX, y, amountX, y + item.rowH);

    let textY = y + 5;
    item.titleLines.forEach((lineItem) => {
      text(lineItem, descX + 4, textY, { size: 9 });
      textY += 4;
    });

    item.addressLines.forEach((lineItem) => {
      text(lineItem, descX + 4, textY, { size: 8, color: muted });
      textY += 3.6;
    });

    text(item.timing, timingX + timingW / 2, y + item.rowH / 2 + 1.2, {
      size: 8.5,
      align: "center",
    });
    text(rupee(item.rate), rateX + rateW - 4, y + item.rowH / 2 + 1.2, {
      size: 8.5,
      align: "right",
    });
    text(rupee(item.amount), amountX + amountW - 4, y + item.rowH / 2 + 1.2, {
      size: 8.5,
      style: "bold",
      align: "right",
    });

    y += item.rowH;
  });

  const tableH = headerH + venueRowH + feeRowH;
  drawRect(contentX, tableY, contentW, tableH);
  drawLine(timingX, tableY, timingX, y);
  drawLine(rateX, tableY, rateX, y);
  drawLine(amountX, tableY, amountX, y);

  // Totals
  const totalsW = 78;
  const totalsX = pageWidth - contentX - totalsW;
  const totalsY = y + 10;
  const labelW = 38;
  const totalRowH = 9;

  const totalRow = (
    label: string,
    value: string,
    rowY: number,
    bold = false,
    bg?: string,
    color = black
  ) => {
    drawRect(totalsX, rowY, totalsW, totalRowH, bg);
    drawLine(totalsX + labelW, rowY, totalsX + labelW, rowY + totalRowH);

    text(label, totalsX + labelW - 3, rowY + 6, {
      size: 8.5,
      color,
      style: bold ? "bold" : "normal",
      align: "right",
    });
    text(value, totalsX + totalsW - 3, rowY + 6, {
      size: 8.5,
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
    successBg,
    success
  );

  // Payment info
  const payY = totalsY + 40;
  const payH = 34;

  drawRect(contentX, payY, contentW, payH);
  drawRect(contentX, payY, contentW, 8, softBg);

  text("PAYMENT INFORMATION", contentX + 5, payY + 5.5, {
    size: 7.5,
    style: "bold",
    color: muted,
  });

  text("Payment ID", contentX + 5, payY + 15, { size: 8, color: muted });
  text(safeText(data.razorpayPaymentId), contentX + 32, payY + 15, {
    size: 8.5,
    style: "bold",
    maxWidth: contentW - 40,
  });

  text("Payment Method", contentX + 5, payY + 22, { size: 8, color: muted });
  text("Razorpay", contentX + 38, payY + 22, { size: 8.5, style: "bold" });

  text("Amount Paid", contentX + 5, payY + 29, { size: 8, color: muted });
  text(rupee(totalAmount), contentX + 32, payY + 29, {
    size: 9,
    style: "bold",
    color: success,
  });

  const footerY = pageHeight - 22;
  drawLine(contentX, footerY - 4, pageWidth - contentX, footerY - 4);
  text(
    "In case of any queries, contact support@shiftsdeal.com",
    pageWidth / 2,
    footerY,
    { size: 8, color: muted, align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
