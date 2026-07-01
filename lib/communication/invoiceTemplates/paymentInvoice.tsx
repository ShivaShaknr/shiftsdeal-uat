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

export function paymentInvoicePdf(data: PaymentInvoiceData): Buffer {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const border = 12;
  const x = border + 8;
  const w = pageWidth - (border + 8) * 2;

  const basePrice = Number(data.basePrice || 0);
  const platformFee = Number(data.platformFee || 0);
  const gstAmount = Number(data.gstAmount || 0);
  const totalAmount = Number(data.totalAmount || 0);

  const invoiceNo = data.bookingId.substring(0, 8).toUpperCase();
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const setFont = (style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont("helvetica", style);
  };

  const drawRupee = (amount: number, cx: number, yPos: number, size = 9) => {
    const value = formatRupeeNumber(amount);
    const symbolSize = size - 2;

    setFont("normal");
    doc.setFontSize(symbolSize);
    const symW = doc.getTextWidth("Rs. ");

    setFont("bold");
    doc.setFontSize(size);
    const valW = doc.getTextWidth(value);

    const startX = cx - (symW + valW) / 2;

    setFont("normal");
    doc.setFontSize(symbolSize);
    doc.text("Rs.", startX, yPos);

    setFont("bold");
    doc.setFontSize(size);
    doc.text(value, startX + symW, yPos);
  };

  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.roundedRect(border, border, pageWidth - border * 2, pageHeight - border * 2, 3, 3);

  // Header left
  let y = border + 20;
  doc.setTextColor(0);
  doc.setFontSize(26);
  setFont("bold");
  doc.text("INVOICE", x, y);

  y += 12;
  doc.setFontSize(10);
  setFont("normal");
  doc.text(`Invoice no:   INV-${invoiceNo}`, x, y);
  y += 6;
  doc.text(`Issued to:    ${data.contactName || "-"}`, x, y);
  y += 6;
  doc.text(`Due date:     ${invoiceDate}`, x, y);

  // Header right - logo + brand
  const logo = getLogoBase64();
  const logoX = pageWidth - border - 42;
  const logoY = border + 16;

  if (logo) {
    doc.addImage(`data:image/png;base64,${logo}`, "PNG", logoX, logoY, 34, 12);
    doc.setFontSize(11);
    setFont("bold");
    doc.text("SHIFTS DEAL", logoX, logoY + 18);
  } else {
    doc.setFontSize(14);
    setFont("bold");
    doc.text("SHIFTS DEAL", logoX, logoY + 8);
  }

  // Table
  const tableTop = border + 58;
  const rowH = 9;
  const colQty = x + w * 0.52;
  const colPrice = x + w * 0.68;
  const colSub = x + w * 0.84;

  const drawRow = (top: number, height = rowH) => {
    doc.setDrawColor(0);
    doc.rect(x, top, w, height);
  };

  const drawCellLines = (top: number, height = rowH) => {
    doc.line(colQty, top, colQty, top + height);
    doc.line(colPrice, top, colPrice, top + height);
    doc.line(colSub, top, colSub, top + height);
  };

  // Table header
  drawRow(tableTop, rowH);
  drawCellLines(tableTop);

  doc.setFontSize(9);
  setFont("bold");
  doc.text("DESCRIPTION", x + 3, tableTop + 6);
  doc.text("QTY", colQty + (w * 0.16) / 2, tableTop + 6, { align: "center" });
  doc.text("PRICE", colPrice + (w * 0.16) / 2, tableTop + 6, { align: "center" });
  doc.text("SUBTOTAL", colSub + (w * 0.16) / 2, tableTop + 6, { align: "center" });

  const venueDesc = `VENUE BOOKING - ${(data.venueName || data.eventName || "Booking").toUpperCase()}`;
  const items: [string, number, number][] = [
    [venueDesc, basePrice, basePrice],
    ["PLATFORM FEE (5%)", platformFee, platformFee],
  ];

  let rowY = tableTop + rowH;

  items.forEach(([desc, price, subtotal]) => {
    drawRow(rowY);
    drawCellLines(rowY);

    setFont("normal");
    doc.setFontSize(9);
    doc.text(desc, x + 3, rowY + 6);

    doc.text("1", colQty + (w * 0.16) / 2, rowY + 6, { align: "center" });
    drawRupee(price, colPrice + (w * 0.16) / 2, rowY + 6);
    drawRupee(subtotal, colSub + (w * 0.16) / 2, rowY + 6);

    rowY += rowH;
  });

  // Empty rows
  for (let i = 0; i < 3; i++) {
    drawRow(rowY);
    drawCellLines(rowY);
    rowY += rowH;
  }

  // Tax row
  drawRow(rowY);
  drawCellLines(rowY);
  setFont("bold");
  doc.setFontSize(9);
  doc.text("TAX (GST 18%)", colPrice - 3, rowY + 6, { align: "right" });
  drawRupee(gstAmount, colSub + (w * 0.16) / 2, rowY + 6);
  rowY += rowH;

  // Grand total row
  drawRow(rowY);
  drawCellLines(rowY);
  doc.setFontSize(10);
  doc.text("GRAND TOTAL", colPrice - 3, rowY + 6, { align: "right" });
  drawRupee(totalAmount, colSub + (w * 0.16) / 2, rowY + 6, 10);
  rowY += rowH + 18;

  // Footer left - payment info
  const footerY = pageHeight - border - 38;
  doc.setFontSize(10);
  setFont("bold");
  doc.text("Payment info:", x, footerY);

  setFont("normal");
  doc.setFontSize(9);
  doc.text(`Payment ID: ${data.razorpayPaymentId || "-"}`, x, footerY + 7);
  doc.text(`Email: ${data.contactEmail || "-"}`, x, footerY + 13);
  doc.text(`Phone: ${data.contactPhone || "-"}`, x, footerY + 19);
  doc.text("Support: support@shiftsdeal.com", x, footerY + 25);

  // Footer right - signature
  const signX = pageWidth - border - 55;
  setFont("italic");
  doc.setFontSize(16);
  doc.text("Shifts Deal", signX, footerY + 10);
  setFont("normal");
  doc.setFontSize(9);
  doc.text("Finance Team", signX + 8, footerY + 18);

  return Buffer.from(doc.output("arraybuffer"));
}
