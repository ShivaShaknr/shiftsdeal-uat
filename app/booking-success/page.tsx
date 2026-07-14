'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Download, Home, ArrowRight, Hash } from 'lucide-react';
import { Button, Card, toast } from '@/components/ui';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { formatCurrency, formatRupeeNumber } from '@/lib/utils';
import { bookingContractPdf } from '@/lib/communication/contractTemplates/bookingContractPdf';

interface ReceiptData {
  bookingId: string;
  venueName: string;
  venueAddress: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  attendees: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  signature?: string;
  pricing: {
    basePrice: number;
    platformFee: number;
    subtotal: number;
    gst: number;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    commissionLabel?: string;
  };
  contract?: {
    title: string;
    generatedAt: string;
    sections: { heading: string; content: string }[];
  };
  createdAt: string;
}

const rs = (amount: number) => `Rs. ${formatRupeeNumber(amount)}`;

function buildContractFromReceipt(data: ReceiptData) {
  const pricing = data.pricing;
  const commissionLabel =
    pricing.commissionLabel ||
    (pricing.basePrice > 0
      ? `${((pricing.platformFee / pricing.basePrice) * 100).toFixed(0)}%`
      : '10%');

  return {
    title: 'Venue Booking Agreement',
    generatedAt: data.createdAt || new Date().toISOString(),
    sections: [
      {
        heading: '1. Parties to the Agreement',
        content: `This Venue Booking Agreement ("Agreement") is entered into on ${new Date(data.createdAt || Date.now()).toLocaleDateString()} between:\n\nVenue Owner: ${data.venueName}\nAddress: ${data.venueAddress}\n\nand\n\nRenter: ${data.organizationName}\nContact Person: ${data.contactName}\nEmail: ${data.contactEmail}\nPhone: ${data.contactPhone}`,
      },
      {
        heading: '2. Event Details',
        content: `Event Name: ${data.eventName}\nEvent Type: ${data.eventType}\nDate: ${data.date}\nTime: ${data.time}\nExpected Attendees: ${data.attendees}`,
      },
      {
        heading: '3. Venue Description',
        content: `The venue "${data.venueName}" located at ${data.venueAddress} is hereby booked for the above-mentioned event.`,
      },
      {
        heading: '4. Payment Terms',
        content: `Venue Charges: ${rs(pricing.basePrice)}\nPlatform Fee (${commissionLabel}): ${rs(pricing.platformFee)}\nSubtotal: ${rs(pricing.subtotal)}\nGST (18%): ${rs(pricing.gst)}\n\nTotal Amount: ${rs(pricing.totalAmount)}\nDeposit (30%): ${rs(pricing.depositAmount)}\nBalance Amount: ${rs(pricing.balanceAmount)}\n\nThe deposit amount must be paid within 24 hours of signing this agreement to confirm the booking. The balance amount is due 7 days before the event date.`,
      },
      {
        heading: '5. Cancellation Policy',
        content: `- Cancellation 30+ days before event: Full refund minus 10% processing fee\n- Cancellation 15-29 days before event: 50% refund\n- Cancellation less than 15 days before event: No refund\n- No-show: No refund`,
      },
      {
        heading: '6. Renter Responsibilities',
        content: `The Renter agrees to:\n- Use the venue only for the stated purpose\n- Comply with all venue rules and regulations\n- Maintain proper conduct and ensure guests do the same\n- Be responsible for any damage to the venue or equipment\n- Vacate the premises by the agreed time\n- Not sublet or transfer this booking to any third party`,
      },
      {
        heading: '7. Venue Owner Responsibilities',
        content: `The Venue Owner agrees to:\n- Provide a clean and functional venue\n- Ensure all amenities listed are available\n- Provide access to the venue at the agreed time\n- Maintain safety standards and emergency protocols`,
      },
      {
        heading: '8. Liability and Insurance',
        content: `The Renter shall be liable for any damage caused to the venue during the booking period. The Venue Owner is not liable for any injury, loss, or damage to persons or property during the event. The Renter is advised to obtain appropriate event insurance.`,
      },
      {
        heading: '9. Governing Law',
        content: `This Agreement shall be governed by and construed in accordance with the laws of India.`,
      },
      {
        heading: '10. Tax Information',
        content: `This booking is subject to Goods and Services Tax (GST) at 18% as per Indian tax regulations. The GST amount of ${rs(pricing.gst)} is included in the total amount. GSTIN will be provided on the invoice.`,
      },
    ],
  };
}

export default function BookingSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState(() => ({ width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 }));
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('lastBookingReceipt');
      return stored ? JSON.parse(stored) as ReceiptData : null;
    } catch (e) {
      return null;
    }
  });

  const [bookingRef] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('lastBookingReceipt');
      if (stored) {
        const data = JSON.parse(stored);
        return data?.bookingId ? data.bookingId.substring(0, 12).toUpperCase() : `SD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    } catch (e) {
      // fallthrough
    }
    return `SD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const downloadReceipt = () => {
    if (!receiptData) {
      toast.error('Booking data not available. Please create a new booking.');
      return;
    }

    const contract =
      receiptData.contract?.sections?.length
        ? receiptData.contract
        : buildContractFromReceipt(receiptData);

    const blob = bookingContractPdf({
      title: contract.title || 'Venue Booking Agreement',
      generatedAt: contract.generatedAt || receiptData.createdAt,
      sections: contract.sections,
      signature: receiptData.signature || receiptData.contactName,
      organizationName: receiptData.organizationName,
      venueName: receiptData.venueName,
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Venue-Booking-Contract-${(receiptData.organizationName || 'booking').replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Contract downloaded');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#b8f054', '#a0d94a', '#88c940', '#ffffff']}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            Booking Submitted!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-foreground-muted mb-8"
          >
            Your booking request has been sent to the venue owner. You'll receive a confirmation email once approved.
          </motion.p>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background-light rounded-xl p-4 mb-6 text-left"
          >
            <div className="flex items-center gap-2 text-sm text-foreground-muted mb-3">
              <Hash className="w-4 h-4 text-primary" />
              <span>Booking Reference</span>
            </div>
            <p className="font-mono text-lg text-foreground font-semibold">
              {bookingRef}
            </p>
            {receiptData && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-sm text-foreground-muted">
                  <span className="font-medium text-foreground">{receiptData.venueName}</span>
                </p>
                <p className="text-sm text-foreground-muted">
                  {receiptData.date} • {receiptData.time}
                </p>
                <p className="text-sm font-semibold text-primary">
                  Total: {formatCurrency(receiptData.pricing.totalAmount)}
                </p>
              </div>
            )}
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-background-light rounded-xl p-4 mb-8 text-left"
          >
            <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  Venue owner reviews your booking request (usually within 24 hours)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  Once approved, you'll receive payment instructions
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  After payment, your booking is confirmed!
                </p>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              variant="outline"
              className="flex-1"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={downloadReceipt}
              disabled={!receiptData}
            >
              {receiptData ? 'Download Contract' : 'Contract Unavailable'}
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </Card>

        {/* Additional Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4 mt-6"
        >
          <Link
            href="/venues"
            className="text-sm text-foreground-muted hover:text-primary transition-colors"
          >
            Browse more venues
          </Link>
          <span className="text-foreground-muted">•</span>
          <Link
            href="/bookings"
            className="text-sm text-foreground-muted hover:text-primary transition-colors"
          >
            View my bookings
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
