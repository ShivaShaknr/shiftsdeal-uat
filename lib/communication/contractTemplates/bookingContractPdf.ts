import { jsPDF } from 'jspdf';

export type ContractSection = {
  heading: string;
  content: string;
};

export type BookingContractPdfData = {
  title: string;
  generatedAt: string;
  sections: ContractSection[];
  signature?: string;
  organizationName?: string;
  venueName?: string;
};

const sanitize = (value: string) =>
  value
    .replace(/₹/g, 'Rs. ')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, (char) => {
      // keep common punctuation variants readable in Helvetica
      const map: Record<string, string> = {
        '–': '-',
        '—': '-',
        '‘': "'",
        '’': "'",
        '“': '"',
        '”': '"',
        '•': '-',
      };
      return map[char] || '';
    });

export function bookingContractPdf(data: BookingContractPdfData): Blob {
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const marginTop = 22;
  const marginBottom = 24;
  const contentW = pageWidth - marginX * 2;

  const ink = '#111827';
  const muted = '#4b5563';
  const rule = '#9ca3af';

  let y = marginTop;

  const setFont = (style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFont('times', style);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      drawContinuedHeader();
    }
  };

  const drawTopRule = () => {
    doc.setDrawColor(ink);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 2;
    doc.setLineWidth(0.25);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;
  };

  const drawContinuedHeader = () => {
    setFont('bold');
    doc.setFontSize(10);
    doc.setTextColor(ink);
    doc.text(sanitize(data.title || 'Venue Booking Agreement'), marginX, y);

    setFont('italic');
    doc.setFontSize(9);
    doc.setTextColor(muted);
    doc.text('(Continued)', pageWidth - marginX, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(rule);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(rule);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 5, pageWidth - marginX, footerY - 5);

    setFont('normal');
    doc.setFontSize(8);
    doc.setTextColor(muted);
    doc.text('ShiftsDeal Venue Booking Contract', marginX, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, {
      align: 'right',
    });
  };

  const writeWrapped = (
    value: string,
    options: {
      size?: number;
      style?: 'normal' | 'bold' | 'italic';
      color?: string;
      lineHeight?: number;
      indent?: number;
    } = {}
  ) => {
    const size = options.size ?? 10;
    const style = options.style ?? 'normal';
    const color = options.color ?? ink;
    const lineHeight = options.lineHeight ?? 5;
    const indent = options.indent ?? 0;

    setFont(style);
    doc.setFontSize(size);
    doc.setTextColor(color);

    const lines = doc.splitTextToSize(sanitize(value), contentW - indent) as string[];
    lines.forEach((line) => {
      ensureSpace(lineHeight + 1);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    });
  };

  // ===== Cover / Title block =====
  drawTopRule();

  setFont('bold');
  doc.setFontSize(18);
  doc.setTextColor(ink);
  doc.text('VENUE BOOKING AGREEMENT', pageWidth / 2, y, { align: 'center' });
  y += 7;

  setFont('normal');
  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text('ShiftsDeal Online Venue Booking Platform', pageWidth / 2, y, {
    align: 'center',
  });
  y += 6;

  const generatedDate = new Date(data.generatedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  setFont('normal');
  doc.setFontSize(9);
  doc.setTextColor(ink);
  doc.text(`Agreement Date: ${generatedDate}`, marginX, y);
  doc.text(
    `Reference: ${sanitize(data.organizationName || 'Booking')}`,
    pageWidth - marginX,
    y,
    { align: 'right' }
  );
  y += 5;

  if (data.venueName || data.organizationName) {
    doc.setTextColor(muted);
    doc.text(
      [
        data.venueName ? `Venue: ${sanitize(data.venueName)}` : '',
        data.organizationName ? `Renter: ${sanitize(data.organizationName)}` : '',
      ]
        .filter(Boolean)
        .join('   |   '),
      marginX,
      y
    );
    y += 4;
  }

  doc.setDrawColor(ink);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  setFont('italic');
  doc.setFontSize(9.5);
  doc.setTextColor(muted);
  writeWrapped(
    'This Agreement sets out the terms and conditions governing the booking of the venue described herein between the Venue Owner and the Renter through ShiftsDeal.',
    { size: 9.5, style: 'italic', color: muted, lineHeight: 4.8 }
  );
  y += 6;

  // ===== Sections =====
  data.sections.forEach((section, index) => {
    ensureSpace(16);

    setFont('bold');
    doc.setFontSize(11);
    doc.setTextColor(ink);
    doc.text(sanitize(section.heading), marginX, y);
    y += 3;

    doc.setDrawColor(rule);
    doc.setLineWidth(0.25);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;

    // Render content paragraphs separately for cleaner contract look
    const paragraphs = sanitize(section.content).split(/\n{2,}/);
    paragraphs.forEach((paragraph, pIndex) => {
      const lines = paragraph.split('\n');
      lines.forEach((rawLine) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          y += 2;
          return;
        }

        const isBullet = /^[-•]/.test(line.trim());
        writeWrapped(line, {
          size: 10,
          style: 'normal',
          color: ink,
          lineHeight: 4.8,
          indent: isBullet ? 3 : 0,
        });
      });

      if (pIndex < paragraphs.length - 1) y += 3;
    });

    y += index < data.sections.length - 1 ? 7 : 4;
  });

  // ===== Signature block =====
  ensureSpace(55);
  y += 4;

  setFont('bold');
  doc.setFontSize(11);
  doc.setTextColor(ink);
  doc.text('IN WITNESS WHEREOF', marginX, y);
  y += 5;

  setFont('normal');
  doc.setFontSize(9.5);
  doc.setTextColor(muted);
  writeWrapped(
    'The parties have executed this Venue Booking Agreement as of the date first written above.',
    { size: 9.5, color: muted, lineHeight: 4.6 }
  );
  y += 8;

  const colW = (contentW - 10) / 2;
  const leftX = marginX;
  const rightX = marginX + colW + 10;
  const blockH = 36;

  ensureSpace(blockH + 8);

  // Left signature box - Renter
  doc.setDrawColor(rule);
  doc.setLineWidth(0.35);
  doc.rect(leftX, y, colW, blockH);
  doc.rect(rightX, y, colW, blockH);

  setFont('bold');
  doc.setFontSize(9);
  doc.setTextColor(ink);
  doc.text('RENTER', leftX + 4, y + 6);
  doc.text('FOR SHIFTSDEAL / VENUE OWNER', rightX + 4, y + 6);

  setFont('normal');
  doc.setFontSize(8.5);
  doc.setTextColor(muted);
  doc.text('Signature', leftX + 4, y + 14);
  doc.text('Signature', rightX + 4, y + 14);

  doc.setDrawColor(ink);
  doc.setLineWidth(0.3);
  doc.line(leftX + 4, y + 20, leftX + colW - 4, y + 20);
  doc.line(rightX + 4, y + 20, rightX + colW - 4, y + 20);

  setFont('bold');
  doc.setFontSize(10);
  doc.setTextColor(ink);
  doc.text(sanitize(data.signature?.trim() || '[Pending Signature]'), leftX + 4, y + 18);

  setFont('normal');
  doc.setFontSize(8.5);
  doc.setTextColor(muted);
  doc.text(`Name: ${sanitize(data.signature?.trim() || '-')}`, leftX + 4, y + 26);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    leftX + 4,
    y + 31
  );

  doc.text('Authorized Signatory', rightX + 4, y + 26);
  doc.text('Date: ____________________', rightX + 4, y + 31);

  y += blockH + 8;

  setFont('italic');
  doc.setFontSize(8);
  doc.setTextColor(muted);
  writeWrapped(
    'By signing this Agreement, the Renter acknowledges that they have read, understood, and agreed to all terms and conditions stated herein.',
    { size: 8, style: 'italic', color: muted, lineHeight: 4 }
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output('blob');
}
